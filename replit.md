# FieldServicer Support Tracker

## Overview

A production-grade omnichannel field service support tracker. Handles Email + WhatsApp tickets linked to clients, sites, employees, vendors, jobs, and work orders. Full automation engine, in-app notifications, file attachments, CSV export, RBAC enforcement, auto-SLA, merge tickets, AI smart replies, channel simulation, and outbound webhooks.

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifact: `fieldservicer`, path: `/`)
- **API framework**: Express 5 (artifact: `api-server`, path: `/api`)
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec at `lib/api-spec/openapi.yaml`)
- **Charts**: Recharts
- **Date formatting**: date-fns
- **AI**: OpenAI client via Replit AI Integrations proxy (env: `AI_INTEGRATIONS_OPENAI_BASE_URL`, `AI_INTEGRATIONS_OPENAI_API_KEY`)
- **File uploads**: multer (disk storage in `artifacts/api-server/uploads/`, served at `/api/attachments/file/:filename`)
- **Build**: esbuild (ESM bundle for API server)

## Architecture

```
artifacts/
  fieldservicer/     React + Vite frontend (previews at /)
  api-server/        Express 5 API server (routes at /api)
lib/
  db/                Drizzle schema + migrations (15 tables)
  api-spec/          OpenAPI 3.0 spec (source of truth, ~1800 lines)
  api-zod/           Generated Zod schemas from OpenAPI
  api-client-react/  Generated React Query hooks from OpenAPI
```

## Database Schema (15 tables)

- **clients** — companies/organizations
- **sites** — physical locations linked to clients
- **employees** — field technicians and staff
- **vendors** — third-party suppliers
- **contacts** — client-side contact persons
- **jobs** — jobs and work orders
- **users** — support agents (roles: admin, manager, agent, viewer)
- **tags** — categorization labels
- **tickets** — support tickets (channels: email, whatsapp, manual) + `slaDeadlineAt`, `slaBreached`, `mergedIntoId`, `firstResponseAt`, `resolvedAt`
- **messages** — ticket conversation (inbound, outbound, internal_note)
- **activity** — ticket audit trail
- **notifications** — in-app notifications with read/unread state
- **automation_rules** — automation rule engine (trigger, conditions, actions, runCount)
- **attachments** — file attachments linked to tickets
- **webhooks** — outbound webhook endpoints with event filters

## Frontend Pages

- `/` or `/dashboard` — KPI cards, ticket trend chart, channel breakdown, agent workload
- `/tickets` — filterable ticket inbox (status, priority, channel, search, pagination)
- `/tickets/new` — create new ticket with entity linking
- `/tickets/:id` — ticket detail: conversation thread, reply/internal note, file attachments, AI smart reply (✨), merge ticket dialog, SLA countdown, all sidebar actions
- `/clients` — client cards with site/ticket counts
- `/sites` — site table with open ticket counts
- `/jobs` — job/work order cards with status and scheduling
- `/employees` — employee directory
- `/vendors` — vendor directory
- `/contacts` — contact directory
- `/channels` — Email + WhatsApp channel simulator; creates real tickets with auto-linking and SLA
- `/automation` — automation rule builder (trigger → conditions → actions)
- `/reports` — analytics: KPIs, trend chart, pie chart, SLA performance, agent stats + Export CSV button
- `/settings` — tabbed: Agents (roster + RBAC reference), SLA Rules (policy table), Webhooks (CRUD)

## API Routes

### Tickets
- `GET /api/tickets` — list (paginated, filterable by status/priority/channel/assignee/client/site/job/search)
- `POST /api/tickets` — create ticket (auto-sets SLA deadline, fires automations + webhooks + notifications)
- `GET /api/tickets/:id` — enriched ticket detail with messages
- `PATCH /api/tickets/:id` — update status/priority/assignment (fires automations, notifications, webhooks)
- `GET /api/tickets/:id/messages` — conversation thread
- `POST /api/tickets/:id/messages` — send reply or internal note (tracks firstResponseAt)
- `GET /api/tickets/:id/activity` — audit trail
- `POST /api/tickets/:id/merge` — merge into another ticket (moves messages, closes source)
- `GET /api/tickets/:id/ai-suggest` — AI smart reply suggestions (3 options via OpenAI)
- `GET /api/tickets/export` — CSV export of all tickets

### Notifications
- `GET /api/notifications` — list notifications (optionally filtered by userId)
- `GET /api/notifications/count` — unread notification count (polled every 15s by frontend)
- `PATCH /api/notifications/:id/read` — mark one as read
- `POST /api/notifications/read-all` — mark all as read

### Automation Rules
- `GET /api/automation-rules` — list all rules
- `POST /api/automation-rules` — create rule (triggerType, conditions[], actions[])
- `PATCH /api/automation-rules/:id` — update (enable/disable, change logic)
- `DELETE /api/automation-rules/:id` — delete

### Attachments
- `GET /api/tickets/:id/attachments` — list attachments for a ticket
- `POST /api/tickets/:id/attachments` — upload file (multipart/form-data, max 25MB)
- `DELETE /api/attachments/:id` — delete attachment + file from disk
- `GET /api/attachments/file/:filename` — serve uploaded file

### Webhooks
- `GET /api/webhooks` — list configured webhooks
- `POST /api/webhooks` — create webhook (url, events[], optional secret)
- `PATCH /api/webhooks/:id` — update (enable/disable, change URL/events)
- `DELETE /api/webhooks/:id` — delete

### Channel Simulation
- `POST /api/simulate/email` — simulate inbound email → creates ticket with auto-linking + SLA
- `POST /api/simulate/whatsapp` — simulate inbound WhatsApp → creates ticket with auto-linking + SLA

### Entities
- `GET/POST /api/clients`, `GET /api/clients/:id`
- `GET/POST /api/sites`
- `GET/POST /api/employees`
- `GET/POST /api/vendors`
- `GET/POST /api/contacts`
- `GET/POST /api/jobs`
- `GET /api/users`
- `GET/POST /api/tags`

### Dashboard
- `GET /api/dashboard/summary` — KPI summary
- `GET /api/dashboard/ticket-trends` — 7-day created/resolved counts
- `GET /api/dashboard/channel-breakdown` — tickets by channel
- `GET /api/dashboard/sla-summary` — SLA compliance stats
- `GET /api/dashboard/recent-activity` — recent ticket activity feed
- `GET /api/dashboard/agent-stats` — per-agent workload stats

## Auto-SLA Logic

SLA deadlines are set on ticket creation based on priority:
- Urgent: 2 hours
- High: 4 hours
- Medium: 8 hours
- Low: 24 hours

Displayed as countdown badge on ticket detail ("Due in about X hours").

## Automation Engine

Rules have: `triggerType` (ticket_created, status_changed, priority_changed, message_received), optional `conditions` (field/operator/value triples), and `actions` (set_priority, set_status, assign_agent, add_tags). Each rule tracks `runCount`.

## Webhook Events

Fired automatically: `ticket.created`, `ticket.resolved`, `reply.sent`. Use `*` to subscribe to all. Payloads include ticketId, ticketNumber, channel, etc. Optional `X-Webhook-Secret` header.

## Seed Data

- 5 users (Sarah Mitchell/admin, James Okonkwo/manager, Priya Nair/agent, Tom Bradley/agent, Fatima Al-Hassan/agent)
- 4 clients (Meridian Construction Group, Pacific Facilities Management, Apex HVAC Solutions, Sterling Property Group)
- 5 sites across those clients
- 4 jobs/work orders
- 4 employees, 3 vendors, 4 contacts
- 8 tickets (TKT-001 through TKT-008) with realistic scenarios
- 17 messages seeded across TKT-001, TKT-002, TKT-004, TKT-005

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

## Common Patterns

### Generated mutations require `{ data: ... }` wrapper
```ts
await createClient.mutateAsync({ data: { name, email } });
await updateTicket.mutateAsync({ id, data: { status } });
await createMessage.mutateAsync({ id, data: { body, type } });
```

### Direct fetch for new endpoints not yet in generated hooks
Use `fetch("/api/...")` directly for notifications, simulation, AI suggest, attachments, etc.

### Count subquery aliases must be unique
When joining multiple count subqueries, each `.as()` alias must be distinct to avoid PostgreSQL ambiguity errors.

### Route ordering in Express
Place specific routes before parameterized ones: `/tickets/export` must be registered before `/tickets/:id`.

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
