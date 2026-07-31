CREATE TABLE IF NOT EXISTS ai_growth_events (
  event_id String,
  tracking_id String,
  website_id String,
  event_type LowCardinality(String),
  occurred_at DateTime64(3, 'UTC'),
  visitor_id String,
  session_id String,
  url String,
  referrer Nullable(String),
  title Nullable(String),
  properties_json String,
  context_json String,
  ingested_at DateTime64(3, 'UTC')
)
ENGINE = MergeTree
ORDER BY (website_id, occurred_at, event_id);
