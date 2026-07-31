# System Architecture
**Project:** AI Conversion Intelligence Platform

---

# High-Level Architecture

```text
                       +----------------------+
                       |   Customer Website   |
                       | (React / WP / HTML)  |
                       +----------+-----------+
                                  |
                           tracker.js SDK
                                  |
                                  v
                     +--------------------------+
                     |     Event Collector API  |
                     |     (Node.js/Express)    |
                     +------------+-------------+
                                  |
                     Validate / Enrich Events
                                  |
                                  v
                         +------------------+
                         | Message Queue    |
                         | RabbitMQ/Kafka   |
                         +--------+---------+
                                  |
                 +----------------+----------------+
                 |                                 |
                 v                                 v
      +----------------------+        +------------------------+
      | Analytics Pipeline   |        | Session Recorder       |
      +----------+-----------+        +-----------+------------+
                 |                                |
                 v                                v
         +---------------+               +----------------+
         | ClickHouse    |               | S3 Storage     |
         | Event Storage |               | Session Files  |
         +-------+-------+               +-------+--------+
                 |                               |
                 +---------------+---------------+
                                 |
                                 v
                     +--------------------------+
                     | AI Intelligence Engine   |
                     +------------+-------------+
                                  |
             +--------------------+--------------------+
             |                    |                    |
             v                    v                    v
      Recommendation API   Behaviour Engine   Prediction Engine
             |                    |                    |
             +---------+----------+--------------------+
                       |
                       v
             +----------------------+
             | Dashboard Backend    |
             +----------+-----------+
                        |
                        v
              Next.js Dashboard UI

```

---

# Core Services

## 1. Tracking SDK

### Responsibilities

Collect browser events.

### Technology

- Vanilla JavaScript
- TypeScript
- Lightweight (<40KB)

### Responsibilities

- Page Views
- Clicks
- Scroll
- Forms
- Performance
- Mouse Movement
- Session Tracking
- Visitor Identification

SDK should work with

- HTML
- React
- Vue
- Angular
- WordPress
- Shopify (future)

---

# 2. Event Collector API

Receives every event.

Responsibilities

- Validate payload
- Generate Session ID
- Generate Visitor ID
- IP processing
- Geo lookup
- Device detection
- Queue events

Technology

Node.js

Express

REST API

Future

Fastify

---

# 3. Queue Layer

Purpose

Prevent data loss.

Technology

RabbitMQ

Future

Kafka

Queues

page_views

clicks

scrolls

forms

performance

sessions

heatmaps

ai_jobs

alerts

---

# 4. Analytics Pipeline

Consumes events.

Creates

Session summaries

Funnels

Aggregations

Heatmap coordinates

Conversion events

Stores data into ClickHouse.

---

# 5. Session Recorder

Stores compressed session data.

Includes

Mouse

Scroll

Clicks

Navigation

Replay timeline

Storage

S3

Backblaze

Cloudflare R2

---

# 6. ClickHouse Database

Purpose

Fast analytics.

Tables

events

page_views

clicks

scrolls

performance

funnels

conversions

heatmaps

sessions

---

# 7. PostgreSQL

Purpose

Business data.

Stores

Users

Teams

Projects

Websites

API Keys

Billing

AI Reports

Alert Rules

Integrations

Permissions

---

# 8. Redis

Purpose

Realtime.

Stores

Current Visitors

Dashboard Cache

Sessions

WebSocket State

Rate Limits

---

# 9. AI Intelligence Engine

The heart of the system.

Responsibilities

Analyse visitor behaviour.

Generate

Insights

Recommendations

Predictions

Summaries

Reports

Future Actions

LLMs

OpenAI

Claude

Gemini

Future

Llama

Qwen

---

# AI Modules

## Behaviour Analysis

Input

Visitor events

Output

Reasons users leave

Reasons forms fail

UX issues

Recommendations

---

## Funnel Analysis

Input

Page sequence

Output

Drop-off analysis

Bottlenecks

Suggestions

---

## Heatmap Analysis

Input

Click coordinates

Output

Ignored CTA

Dead Areas

Attention Map

---

## Content Analysis

Input

HTML

Output

Headline quality

CTA quality

Reading difficulty

Content suggestions

---

## Prediction Engine

Predict

Bounce probability

Purchase probability

Signup probability

Exit probability

Lead score

---

## Automation Engine

Future

Automatically

Show popup

Trigger email

Send WhatsApp

Assign CRM Lead

---

# Dashboard Backend

Provides APIs.

Routes

/auth

/projects

/websites

/events

/live

/forms

/funnels

/heatmaps

/replays

/reports

/ai

/settings

---

# Frontend

Framework

Next.js

Libraries

React Query

TailwindCSS

shadcn/ui

Recharts

Framer Motion

WebSocket Client

Pages

Dashboard

Visitors

Funnels

Forms

Heatmaps

Session Replay

AI Insights

Settings

Billing

Team

---

# Authentication

Options

Clerk

Auth.js

JWT

Features

Email Login

Google Login

GitHub Login

2FA

RBAC

---

# Billing

Stripe

Plans

Free

Starter

Growth

Enterprise

Usage

Monthly Events

AI Requests

Storage

Users

---

# Integrations

WordPress

WooCommerce

KoalaForms

Google Analytics Import

Slack

Discord

HubSpot

Zapier

Webhooks

---

# Notification System

Channels

Email

Slack

Discord

WhatsApp

Webhook

Examples

Traffic drop

Checkout errors

High bounce rate

Server issues

Conversion increase

---

# Security

HTTPS

JWT

Encrypted API Keys

Rate Limiting

PII Masking

Form Field Masking

Password Masking

Credit Card Masking

CSRF Protection

XSS Protection

SQL Injection Protection

Audit Logs

---

# Scalability

Stateless APIs

Horizontal Scaling

Docker

Kubernetes (future)

CDN

Redis Cache

Read Replicas

Event Partitioning

---

# Monitoring

Prometheus

Grafana

OpenTelemetry

Sentry

Logtail

---

# Deployment

Development

Docker Compose

Production

AWS

Vercel (Frontend)

Railway (Small Deployments)

Kubernetes (Enterprise)

---

# Future Microservices

analytics-service

tracking-service

replay-service

ai-service

notification-service

billing-service

authentication-service

integration-service

automation-service

report-service

---

# Suggested Repository Structure

```
apps/
    dashboard/
    api/
    tracker-sdk/

packages/
    ui/
    shared/
    database/
    ai/
    auth/

services/
    analytics/
    replay/
    notifications/
    automation/

docs/
    PLAN.md
    SYSTEM_ARCHITECTURE.md
    DATABASE_SCHEMA.md
    API_SPEC.md
    ROADMAP.md

infra/
    docker/
    kubernetes/

scripts/

tests/
```

---

# Design Principles

- Event-driven architecture
- AI-first decision making
- Privacy by design
- Real-time by default
- Modular services
- API-first development
- Multi-tenant architecture
- Cloud-native deployment
- Extensible plugin ecosystem
- Built to scale from startups to enterprise