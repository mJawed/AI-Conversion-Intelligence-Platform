# TASKS.md
**Project:** AI Conversion Intelligence Platform

> This document contains granular implementation tasks designed for AI coding assistants (Codex, Claude Code, Cursor, Windsurf). Each task should ideally take between **30 minutes and 3 hours** to complete.

---

# Development Rules

Before starting any task:

- One Pull Request per task
- One feature per branch
- Every task must include tests where applicable
- No task should exceed ~500 lines of new code without review
- Update documentation after completing each task
- Run lint + tests before marking complete

---

# Milestone 1 — Project Foundation

## Authentication

- [ ] T001 Create Next.js application
- [ ] T002 Configure TypeScript
- [ ] T003 Configure TailwindCSS
- [ ] T004 Install shadcn/ui
- [ ] T005 Setup ESLint + Prettier
- [ ] T006 Configure Husky
- [ ] T007 Configure Docker
- [ ] T008 Setup Express backend
- [ ] T009 Configure PostgreSQL
- [ ] T010 Configure Prisma ORM
- [ ] T011 Create database migrations
- [ ] T012 Configure Redis
- [ ] T013 Configure environment variables
- [ ] T014 Setup logging
- [ ] T015 Setup API error handling

---

## Authentication

- [ ] T016 Register API
- [ ] T017 Login API
- [ ] T018 JWT authentication
- [ ] T019 Refresh tokens
- [ ] T020 Forgot password
- [ ] T021 Reset password
- [ ] T022 Email verification
- [ ] T023 Google login
- [ ] T024 GitHub login
- [ ] T025 Protected routes

---

## Organization

- [ ] T026 Create Organization
- [ ] T027 Invite members
- [ ] T028 User roles
- [ ] T029 Team permissions
- [ ] T030 Organization settings

---

# Milestone 2 — Website Management

- [ ] T031 Add website
- [ ] T032 Generate Tracking ID
- [ ] T033 Verify domain ownership
- [ ] T034 Website settings
- [ ] T035 Delete website
- [ ] T036 Archive website
- [ ] T037 API Keys
- [ ] T038 Regenerate API key
- [ ] T039 Website timezone
- [ ] T040 Website preferences

---

# Milestone 3 — Tracker SDK

## Core

- [ ] T041 Create tracker SDK
- [ ] T042 Initialize SDK
- [ ] T043 Visitor ID generation
- [ ] T044 Session ID generation
- [ ] T045 Event batching
- [ ] T046 Retry failed events
- [ ] T047 Offline mode
- [ ] T048 Queue events
- [ ] T049 Compress payload
- [ ] T050 Send events

---

## Tracking

- [ ] T051 Page View
- [ ] T052 Session Start
- [ ] T053 Session End
- [ ] T054 Click Tracking
- [ ] T055 Scroll Tracking
- [ ] T056 Mouse Tracking
- [ ] T057 Resize Tracking
- [ ] T058 Tab Visibility
- [ ] T059 Copy Events
- [ ] T060 Download Events

---

## Browser Information

- [ ] T061 Device
- [ ] T062 Browser
- [ ] T063 Screen Size
- [ ] T064 Referrer
- [ ] T065 UTM Tracking
- [ ] T066 Language
- [ ] T067 Timezone
- [ ] T068 Performance Metrics
- [ ] T069 Network Speed
- [ ] T070 IP lookup API

---

# Milestone 4 — Backend Event Pipeline

- [ ] T071 Event API
- [ ] T072 Event Validation
- [ ] T073 Queue Events
- [ ] T074 RabbitMQ Integration
- [ ] T075 Event Consumer
- [ ] T076 ClickHouse Integration
- [ ] T077 Redis Cache
- [ ] T078 Duplicate Detection
- [ ] T079 Event Retry
- [ ] T080 Dead Letter Queue

---

# Milestone 5 — Dashboard

- [ ] T081 Dashboard Layout
- [ ] T082 Sidebar
- [ ] T083 Header
- [ ] T084 Theme Switcher
- [ ] T085 Website Selector
- [ ] T086 Date Filters
- [ ] T087 Cards
- [ ] T088 Charts
- [ ] T089 Loading States
- [ ] T090 Empty States

---

# Milestone 6 — Realtime Analytics

- [ ] T091 Live Visitors
- [ ] T092 Active Pages
- [ ] T093 Countries
- [ ] T094 Devices
- [ ] T095 Browsers
- [ ] T096 Sources
- [ ] T097 Bounce Rate
- [ ] T098 Session Duration
- [ ] T099 Realtime Graph
- [ ] T100 WebSocket Server

---

# Milestone 7 — Behaviour Tracking

- [ ] T101 Click Analytics
- [ ] T102 Scroll Analytics
- [ ] T103 Mouse Analytics
- [ ] T104 Rage Click Detection
- [ ] T105 Dead Click Detection
- [ ] T106 Exit Detection
- [ ] T107 Time on Page
- [ ] T108 Top Pages
- [ ] T109 Landing Pages
- [ ] T110 Exit Pages

---

# Milestone 8 — Form Intelligence

- [ ] T111 Detect Forms
- [ ] T112 Detect Fields
- [ ] T113 Track Focus
- [ ] T114 Track Blur
- [ ] T115 Track Validation Errors
- [ ] T116 Track Submit
- [ ] T117 Detect Abandonment
- [ ] T118 Form Dashboard
- [ ] T119 Field Drop-off Report
- [ ] T120 AI Form Summary

---

# Milestone 9 — Session Replay

- [ ] T121 Record Mouse
- [ ] T122 Record Scroll
- [ ] T123 Record Clicks
- [ ] T124 Store Replay
- [ ] T125 Replay Compression
- [ ] T126 Replay Player
- [ ] T127 Timeline
- [ ] T128 Visitor Summary
- [ ] T129 Search Replay
- [ ] T130 Replay Filters

---

# Milestone 10 — Heatmaps

- [ ] T131 Click Heatmap
- [ ] T132 Scroll Heatmap
- [ ] T133 Hover Heatmap
- [ ] T134 Dead Click Heatmap
- [ ] T135 Heatmap Rendering
- [ ] T136 Heatmap Filters
- [ ] T137 Date Filters
- [ ] T138 Export Heatmap
- [ ] T139 AI Heatmap Summary
- [ ] T140 Heatmap Performance

---

# Milestone 11 — Funnel Analytics

- [ ] T141 Funnel Builder
- [ ] T142 Funnel Events
- [ ] T143 Drop-off Calculation
- [ ] T144 Conversion Rate
- [ ] T145 Funnel Charts
- [ ] T146 Funnel Comparison
- [ ] T147 AI Funnel Analysis
- [ ] T148 Suggested Improvements
- [ ] T149 Funnel Export
- [ ] T150 Funnel API

---

# Milestone 12 — AI Engine

- [ ] T151 OpenAI Integration
- [ ] T152 Prompt Templates
- [ ] T153 AI Behaviour Analysis
- [ ] T154 AI Page Analysis
- [ ] T155 AI Form Analysis
- [ ] T156 AI Funnel Analysis
- [ ] T157 AI UX Analysis
- [ ] T158 AI Recommendations
- [ ] T159 AI Reports
- [ ] T160 AI Confidence Score

---

# Milestone 13 — Smart Automation

- [ ] T161 Automation Rules
- [ ] T162 Rule Engine
- [ ] T163 Trigger Popup
- [ ] T164 Trigger Webhook
- [ ] T165 Trigger Email
- [ ] T166 Trigger Slack
- [ ] T167 Trigger WhatsApp
- [ ] T168 Trigger CRM
- [ ] T169 Rule History
- [ ] T170 Automation Logs

---

# Milestone 14 — Billing

- [ ] T171 Stripe Setup
- [ ] T172 Subscription Plans
- [ ] T173 Usage Limits
- [ ] T174 Upgrade Flow
- [ ] T175 Cancel Subscription
- [ ] T176 Billing History
- [ ] T177 Invoice Download
- [ ] T178 Trial Plans
- [ ] T179 Coupons
- [ ] T180 Webhooks

---

# Milestone 15 — Notifications

- [ ] T181 Email Alerts
- [ ] T182 Slack Alerts
- [ ] T183 Discord Alerts
- [ ] T184 Webhooks
- [ ] T185 Notification Centre
- [ ] T186 Alert Rules
- [ ] T187 AI Alert Summary
- [ ] T188 Daily Digest
- [ ] T189 Weekly Report
- [ ] T190 Monthly Report

---

# Milestone 16 — WordPress Plugin

- [ ] T191 Create WordPress Plugin
- [ ] T192 Website Connection
- [ ] T193 Auto Tracking
- [ ] T194 WooCommerce Support
- [ ] T195 Elementor Support
- [ ] T196 Gutenberg Support
- [ ] T197 KoalaForms Support
- [ ] T198 Plugin Settings
- [ ] T199 Plugin Updates
- [ ] T200 WordPress.org Release

---

# Nice-to-Have (Future)

- [ ] AI Chat Assistant
- [ ] AI Sales Agent
- [ ] AI Voice Assistant
- [ ] AI A/B Testing
- [ ] Predictive Analytics
- [ ] Revenue Forecasting
- [ ] Customer Journey Mapping
- [ ] Shopify App
- [ ] HubSpot Integration
- [ ] Salesforce Integration

---

# Definition of Done

A task is complete only when:

- ✅ Code implemented
- ✅ Unit tests pass
- ✅ No lint errors
- ✅ Documentation updated
- ✅ Feature manually verified
- ✅ PR reviewed and merged

---

# MVP Completion Checklist

- [ ] User can create an account
- [ ] User can add a website
- [ ] Tracking script works
- [ ] Dashboard shows live visitors
- [ ] Session replay works
- [ ] Heatmaps work
- [ ] Form analytics work
- [ ] Funnel analytics work
- [ ] AI generates useful insights
- [ ] Billing is functional
- [ ] WordPress plugin installs and connects successfully