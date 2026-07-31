# DATABASE_SCHEMA.md
**Project:** AI Conversion Intelligence Platform

---

# Database Strategy

The platform uses multiple databases because one database cannot efficiently handle every workload.

| Database | Purpose |
|----------|---------|
| PostgreSQL | Business data |
| ClickHouse | Analytics events |
| Redis | Cache & Realtime |
| S3/R2 | Session replay & assets |

---

# PostgreSQL Schema

## users

```sql
id (UUID)
name
email
password_hash
avatar
provider
email_verified
created_at
updated_at
```

---

## organizations

```sql
id
owner_id
name
slug
plan
status
created_at
updated_at
```

---

## organization_members

```sql
id
organization_id
user_id
role

Owner
Admin
Developer
Marketing
Viewer

created_at
```

---

## websites

```sql
id
organization_id
name
domain

tracking_id

timezone

currency

industry

status

created_at

updated_at
```

Example

```
mycompany.com

tracking_id

trk_x4k39sj92
```

---

## api_keys

```sql
id

website_id

key

secret

last_used_at

created_at
```

---

## goals

Examples

Purchase

Signup

Newsletter

Lead

Book Demo

```sql
id

website_id

name

event_name

value

created_at
```

---

## funnels

```sql
id

website_id

name

created_at
```

---

## funnel_steps

```sql
id

funnel_id

step_order

page

event

created_at
```

---

## forms

```sql
id

website_id

name

selector

url

created_at
```

---

## form_fields

```sql
id

form_id

field_name

field_type

required

position
```

---

## ai_reports

```sql
id

website_id

report_type

daily

weekly

monthly

summary

recommendations

score

created_at
```

---

## ai_insights

```sql
id

website_id

category

severity

title

description

confidence

impact_score

status

open

dismissed

resolved

created_at
```

Example

```
Category

Forms

Severity

High

Title

Phone number validation causing drop-offs

Confidence

93%
```

---

## automation_rules

```sql
id

website_id

name

trigger

condition

action

enabled

created_at
```

Example

```
Trigger

Exit Intent

Condition

Visited Pricing

Action

Show 10% Coupon
```

---

## notifications

```sql
id

organization_id

channel

email

slack

discord

whatsapp

title

body

status

sent_at
```

---

## subscriptions

```sql
id

organization_id

plan

status

events_limit

ai_limit

storage_limit

renewal_date
```

---

# ClickHouse Schema

ClickHouse stores billions of events.

---

## events

```sql
event_id

website_id

visitor_id

session_id

event_name

page_url

referrer

timestamp

properties (JSON)
```

Example

```
page_view

click

scroll

purchase

signup

video_play

form_submit
```

---

## page_views

```sql
id

website_id

visitor_id

session_id

url

title

time_on_page

exit_page

timestamp
```

---

## clicks

```sql
id

website_id

visitor_id

session_id

x

y

selector

text

page

timestamp
```

---

## scroll_events

```sql
id

website_id

visitor_id

session_id

percentage

page

timestamp
```

---

## mouse_movements

```sql
id

website_id

visitor_id

session_id

x

y

timestamp
```

---

## performance_metrics

```sql
id

website_id

visitor_id

session_id

lcp

cls

inp

ttfb

fcp

timestamp
```

---

## session_summary

```sql
session_id

website_id

visitor_id

pages

duration

clicks

scroll_depth

forms_started

forms_completed

purchases

country

device

browser

entry_page

exit_page
```

---

## heatmap_events

```sql
id

website_id

page

x

y

event

timestamp
```

---

## conversion_events

```sql
id

website_id

visitor_id

session_id

goal

value

timestamp
```

---

## errors

```sql
id

website_id

visitor_id

session_id

error_type

message

page

stack

timestamp
```

---

# Redis Keys

```
live_users

website:{id}:active

website:{id}:live

session:{id}

dashboard_cache

rate_limit

alerts

notifications
```

---

# Object Storage

Store

Session replay

Screenshots

Heatmap images

Reports

CSV exports

PDF reports

Example

```
sessions/

2026/

07/

abc123.json.gz
```

---

# Relationships

```
Organization

↓

Websites

↓

Funnels

↓

Forms

↓

Goals

↓

Events

↓

AI Insights

↓

Reports
```

---

# Visitor Lifecycle

```
Anonymous Visitor

↓

Visitor ID Created

↓

Session Started

↓

Page Views

↓

Clicks

↓

Scroll

↓

Form Start

↓

Form Submit

↓

Conversion

↓

Session End

↓

AI Analysis

↓

Insight Generated

↓

Automation Triggered
```

---

# Event Flow

```
Browser

↓

Tracker SDK

↓

API

↓

Queue

↓

ClickHouse

↓

AI Analysis

↓

Dashboard
```

---

# Indexing Strategy

### PostgreSQL

Index

```
email

tracking_id

organization_id

website_id

created_at

status
```

---

### ClickHouse

Partition

```
Month
```

Primary Order

```
website_id

timestamp

event_name
```

---

# Retention Policy

| Data | Retention |
|--------|-----------|
| Raw Events | 12 months |
| Session Replay | 30 days (configurable) |
| AI Reports | Unlimited |
| Alerts | 12 months |
| Logs | 90 days |

---

# Privacy & Compliance

Never store

- Passwords
- Credit card numbers
- OTPs
- Authentication tokens
- Sensitive personal information

Automatically mask

- Password fields
- Payment fields
- CVV
- Aadhaar
- PAN
- API Keys
- Secret Tokens

Support

- GDPR
- CCPA
- India's DPDP Act
- Cookie consent
- User data deletion requests
- Data export requests

---

# Future Tables

```
ab_tests

feature_flags

crm_integrations

email_campaigns

ai_agents

prediction_models

visitor_segments

customer_journey

revenue_forecast

lead_scores

knowledge_base

prompt_templates

webhooks

audit_logs

custom_events

mobile_apps
```

---

# Estimated Scale

### MVP

- 100 websites
- 1 million events/day
- 10 GB/day

### Growth

- 10,000 websites
- 500 million events/day

### Enterprise

- 100,000+ websites
- 10+ billion events/day
- Multi-region deployment
- Distributed ClickHouse clusters