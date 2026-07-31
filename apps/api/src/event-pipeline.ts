import amqp, { type Channel, type ChannelModel, type ConsumeMessage } from "amqplib";
import Redis from "ioredis";

export type PipelineEvent = {
  eventId: string;
  trackingId: string;
  websiteId: string;
  eventType: string;
  occurredAt: string;
  visitorId: string;
  sessionId: string;
  url: string;
  referrer: string | null;
  title?: string;
  properties: Record<string, unknown>;
  context: Record<string, unknown>;
};

type PipelineMetrics = {
  accepted: number;
  published: number;
  skipped: number;
  processed: number;
  retried: number;
  deadLettered: number;
  failed: number;
};

const exchangeName = "ai_growth.events";
const processQueue = "ai_growth.events.process";
const retryQueue = "ai_growth.events.retry";
const deadLetterQueue = "ai_growth.events.dead";
const processRoutingKey = "events.process";
const retryRoutingKey = "events.retry";
const maxAttempts = 3;

const metrics: PipelineMetrics = { accepted: 0, published: 0, skipped: 0, processed: 0, retried: 0, deadLettered: 0, failed: 0 };
let pipelineState: "disabled" | "starting" | "ready" | "error" = "disabled";
let rabbitConnection: ChannelModel | null = null;
let rabbitChannel: Channel | null = null;
let redisClient: Redis | null = null;

export function isEventPipelineEnabled() {
  return process.env.EVENT_PIPELINE_ENABLED === "true";
}

export function getPipelineMetrics() {
  return { enabled: isEventPipelineEnabled(), state: pipelineState, ...metrics };
}

export function recordAcceptedEvent() {
  metrics.accepted += 1;
}

async function getRabbitChannel() {
  if (rabbitChannel) return rabbitChannel;
  const connection = await amqp.connect(process.env.RABBITMQ_URL ?? "amqp://localhost:5672");
  const channel = await connection.createChannel();
  rabbitConnection = connection;
  rabbitChannel = channel;
  await channel.assertExchange(exchangeName, "topic", { durable: true });
  await channel.assertQueue(processQueue, { durable: true });
  await channel.assertQueue(retryQueue, {
    durable: true,
    arguments: { "x-message-ttl": 5000, "x-dead-letter-exchange": exchangeName, "x-dead-letter-routing-key": processRoutingKey },
  });
  await channel.assertQueue(deadLetterQueue, { durable: true });
  await channel.bindQueue(processQueue, exchangeName, processRoutingKey);
  await channel.bindQueue(retryQueue, exchangeName, retryRoutingKey);
  await channel.bindQueue(deadLetterQueue, exchangeName, "events.dead");
  return channel;
}

export async function publishEvent(event: PipelineEvent) {
  if (!isEventPipelineEnabled()) {
    metrics.skipped += 1;
    return;
  }
  try {
    const channel = await getRabbitChannel();
    const published = channel.publish(exchangeName, processRoutingKey, Buffer.from(JSON.stringify(event)), { contentType: "application/json", deliveryMode: 2 });
    if (!published) throw new Error("RABBITMQ_BACKPRESSURE");
    metrics.published += 1;
  } catch (error) {
    metrics.failed += 1;
    throw error;
  }
}

async function getRedisClient() {
  if (redisClient) return redisClient;
  redisClient = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", { lazyConnect: true, maxRetriesPerRequest: 1, enableOfflineQueue: false });
  await redisClient.connect();
  return redisClient;
}

async function touchActiveSession(event: PipelineEvent) {
  if (process.env.REDIS_ENABLED !== "true") return;
  const redis = await getRedisClient();
  await redis.set(`ai-growth:session:${event.sessionId}`, JSON.stringify({ websiteId: event.websiteId, visitorId: event.visitorId, lastEventAt: event.occurredAt }), "EX", 30 * 60);
}

async function persistToClickHouse(event: PipelineEvent) {
  if (process.env.CLICKHOUSE_ENABLED !== "true") return;
  const baseUrl = process.env.CLICKHOUSE_URL ?? "http://localhost:8123";
  const query = "INSERT INTO ai_growth_events FORMAT JSONEachRow";
  const row = {
    event_id: event.eventId,
    tracking_id: event.trackingId,
    website_id: event.websiteId,
    event_type: event.eventType,
    occurred_at: event.occurredAt,
    visitor_id: event.visitorId,
    session_id: event.sessionId,
    url: event.url,
    referrer: event.referrer,
    title: event.title ?? null,
    properties_json: JSON.stringify(event.properties),
    context_json: JSON.stringify(event.context),
    ingested_at: new Date().toISOString(),
  };
  const response = await fetch(`${baseUrl}/?query=${encodeURIComponent(query)}`, { method: "POST", body: `${JSON.stringify(row)}\n`, headers: { "Content-Type": "application/json" }, signal: AbortSignal.timeout(5000) });
  if (!response.ok) throw new Error(`CLICKHOUSE_WRITE_FAILED_${response.status}`);
}

async function processEvent(event: PipelineEvent) {
  await Promise.all([touchActiveSession(event), persistToClickHouse(event)]);
}

async function publishRetry(channel: Channel, event: PipelineEvent, attempt: number) {
  channel.publish(exchangeName, retryRoutingKey, Buffer.from(JSON.stringify(event)), { contentType: "application/json", deliveryMode: 2, headers: { "x-attempt": attempt } });
}

async function publishDeadLetter(channel: Channel, event: PipelineEvent, error: unknown) {
  channel.publish(exchangeName, "events.dead", Buffer.from(JSON.stringify({ event, error: error instanceof Error ? error.message : "PROCESSING_FAILED" })), { contentType: "application/json", deliveryMode: 2 });
}

async function handleMessage(channel: Channel, message: ConsumeMessage) {
  const event = JSON.parse(message.content.toString()) as PipelineEvent;
  const attempt = Number(message.properties.headers?.["x-attempt"] ?? 0);
  try {
    await processEvent(event);
    metrics.processed += 1;
    channel.ack(message);
  } catch (error) {
    metrics.failed += 1;
    channel.ack(message);
    if (attempt < maxAttempts) {
      metrics.retried += 1;
      await publishRetry(channel, event, attempt + 1);
    } else {
      metrics.deadLettered += 1;
      await publishDeadLetter(channel, event, error);
    }
  }
}

export async function startEventConsumer() {
  if (!isEventPipelineEnabled()) { pipelineState = "disabled"; return false; }
  pipelineState = "starting";
  try {
    const channel = await getRabbitChannel();
    await channel.prefetch(50);
    await channel.consume(processQueue, (message) => { if (message) void handleMessage(channel, message); });
    pipelineState = "ready";
    return true;
  } catch (error) {
    pipelineState = "error";
    throw error;
  }
}

export async function stopEventPipeline() {
  await redisClient?.quit().catch(() => undefined);
  await rabbitChannel?.close().catch(() => undefined);
  await rabbitConnection?.close().catch(() => undefined);
  redisClient = null;
  rabbitChannel = null;
  rabbitConnection = null;
}
