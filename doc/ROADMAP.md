# ROADMAP.md
**Project:** AI Conversion Intelligence Platform

**Timeline:** 100 Days (MVP)

---

# Goal

Build an MVP capable of:

- Tracking website visitors
- Recording sessions
- Analysing forms
- Generating AI insights
- Displaying real-time analytics
- Providing actionable recommendations

At the end of 100 days, the product should be usable by real customers.

---

# Development Philosophy

Every phase should end with a deployable product.

Never build features that cannot be tested by real users.

Priority:

1. Working product
2. Good UX
3. AI insights
4. Advanced automation

---

# Phase 0 (Days 1–5)

## Project Setup

### Backend

- Setup Node.js
- Express
- PostgreSQL
- Redis
- Docker
- Authentication
- API structure

### Frontend

- Next.js
- Tailwind
- shadcn/ui
- Authentication
- Dashboard Layout

### Infrastructure

- GitHub
- CI/CD
- Docker Compose
- Environment variables

Deliverable

✅ Empty dashboard

---

# Phase 1 (Days 6–15)

## Website Tracking SDK

Build

tracker.js

Features

- Page View
- Session Start
- Session End
- Visitor ID
- Session ID
- Browser Info
- Device
- Referrer
- UTM
- Language
- Timezone

Dashboard

- Total Visitors
- Total Sessions
- Active Visitors

Deliverable

Website tracking works.

---

# Phase 2 (Days 16–25)

## Real-Time Analytics

Features

Live Visitors

Live Sessions

Current Page

Current Device

Country

Traffic Source

Top Pages

Average Session

Bounce Rate

Realtime updates

WebSockets

Deliverable

Google Analytics-style dashboard.

---

# Phase 3 (Days 26–35)

## Behaviour Tracking

Track

Clicks

Scroll

Mouse Movement

Outbound Links

Downloads

Video Events

Custom Events

Dashboard

Top Clicks

Scroll Depth

Most Clicked Elements

Dead Clicks

Deliverable

User interaction analytics.

---

# Phase 4 (Days 36–45)

## Form Intelligence

Track

Form Start

Form Focus

Field Changes

Validation Errors

Submit

Abandonment

Dashboard

Completion Rate

Abandonment Rate

Field Drop-off

Average Completion Time

Deliverable

Form analytics.

---

# Phase 5 (Days 46–55)

## Session Replay

Record

Mouse

Scroll

Navigation

Clicks

Timeline

Dashboard

Session List

Replay Player

Visitor Timeline

Deliverable

Basic session replay.

---

# Phase 6 (Days 56–65)

## Heatmaps

Generate

Click Heatmap

Scroll Heatmap

Dead Click Heatmap

Dashboard

Heatmap Viewer

Per Page

Date Filter

Deliverable

Heatmaps.

---

# Phase 7 (Days 66–75)

## AI Engine (Version 1)

Connect

OpenAI

Generate

Session Summary

Page Summary

Form Summary

Insights

Examples

Users ignore CTA.

Users abandon phone number field.

Visitors leave pricing page.

Deliverable

First AI recommendations.

---

# Phase 8 (Days 76–82)

## Funnel Analytics

Features

Visual Funnel

Drop-off %

Conversion %

AI Explanation

Dashboard

Landing

↓

Pricing

↓

Signup

↓

Checkout

↓

Purchase

Deliverable

Conversion funnel.

---

# Phase 9 (Days 83–90)

## AI Dashboard

Create

Insights page

Priority Score

Severity

Recommendations

Examples

High

Phone number validation blocks users.

Medium

CTA below fold.

Low

Long paragraphs.

Deliverable

AI Insight Centre.

---

# Phase 10 (Days 91–100)

## Production Release

Performance

Caching

Security

Optimisation

Monitoring

Bug fixing

Documentation

Landing Page

Pricing

Subscription

Deploy

Deliverable

MVP Launch 🚀

---

# MVP Features

Tracking SDK

✔

Dashboard

✔

Visitors

✔

Sessions

✔

Clicks

✔

Scroll

✔

Forms

✔

Session Replay

✔

Heatmaps

✔

Funnels

✔

AI Insights

✔

Authentication

✔

Billing

✔

---

# Not Included in MVP

AI Chat

Smart Offers

A/B Testing

Email Automation

CRM

WhatsApp

Salesforce

HubSpot

Prediction Models

These are Phase 2 features.

---

# Phase 2 (Post MVP)

## AI Chat Assistant

Context-aware website assistant

---

## Smart Offers

AI shows

Discount

Coupon

Popup

Based on behaviour

---

## AI Prediction

Predict

Purchase probability

Bounce probability

Lead quality

Exit probability

---

## A/B Testing

Automatically

Create variants

Measure results

Choose winner

---

## Automation Engine

Automatically

Send email

Notify sales

Trigger webhook

Launch popup

---

## Marketing Intelligence

Campaign analysis

SEO recommendations

Landing page optimisation

Ad performance

---

## Integrations

WordPress

WooCommerce

KoalaForms

HubSpot

Slack

Discord

Zapier

---

# Phase 3 (Enterprise)

AI Agents

Multi-site Dashboard

Role-based Permissions

White-label

API Marketplace

Predictive Analytics

Customer Journey Intelligence

Revenue Forecasting

CRM Integrations

Custom AI Models

Enterprise Security

Audit Logs

---

# Weekly Milestones

| Week | Goal |
|-------|------|
| 1 | Project setup |
| 2 | Tracker SDK |
| 3 | Live Analytics |
| 4 | Behaviour Tracking |
| 5 | Form Analytics |
| 6 | Session Replay |
| 7 | Heatmaps |
| 8 | AI Engine |
| 9 | Funnel Analytics |
| 10 | AI Dashboard |
| 11 | Performance |
| 12 | Testing |
| 13 | Launch |

---

# Success Metrics

Technical

- Page tracking latency <100ms
- Dashboard updates within 2 seconds
- AI response <5 seconds
- 99.9% API uptime
- Zero event loss

Business

- 10 beta customers
- 100 connected websites
- 1 million tracked events
- 100 AI-generated insights/day
- 5 paying customers

---

# Suggested GitHub Milestones

## Milestone 1

Project Foundation

---

## Milestone 2

Tracking SDK

---

## Milestone 3

Analytics Dashboard

---

## Milestone 4

Forms

---

## Milestone 5

Replay

---

## Milestone 6

Heatmaps

---

## Milestone 7

AI Engine

---

## Milestone 8

Funnels

---

## Milestone 9

Production

---

# Recommended Development Order

1. Authentication
2. Organizations
3. Websites
4. Tracker SDK
5. Event Collector API
6. Dashboard
7. Real-time Visitors
8. Click Tracking
9. Scroll Tracking
10. Forms
11. Session Replay
12. Heatmaps
13. AI Insights
14. Funnels
15. Billing
16. Landing Page
17. Beta Testing
18. Public Launch

---

# MVP Exit Criteria

The MVP is considered complete when a customer can:

- Create an account
- Add a website
- Install the tracking script
- See live visitors
- View visitor sessions
- Watch session replays
- Analyse form performance
- View heatmaps
- Receive AI-generated insights
- Understand why visitors are not converting
- Take action based on AI recommendations

At that point, the platform is ready for private beta and customer validation before investing in advanced AI automation.