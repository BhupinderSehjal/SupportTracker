# FieldServicer Support Tracker

## Overview

A production-grade omnichannel field service support tracker. Handles Email + WhatsApp tickets linked to clients, sites, employees, vendors, jobs, and work orders.

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
- **Build**: esbuild (CJS bundle for API server)

## Architecture

```
artifacts/
  fieldservicer/     React + Vite frontend (previews at /)
  api-server/        Express 5 API server (routes at /api)
lib/
  db/                Drizzle schema + migrations (11 tables)
  api-spec/          OpenAPI 3.0 spec (source of truth)
  api-zod/           Generated Zod schemas from OpenAPI
  api-client-react/  Generated React Query hooks from OpenAPI
```

## Database Schema (11 tables)

- **clients** — companies/organizations
- **sites** — physical locations linked to clients
- **employees** — field technicians and staff
- **vendors** — third-party suppliers
- **contacts** — client-side contact persons
- **jobs** — jobs and work orders
- **users** — support agents (roles: admin, manager, agent, viewer)
- **tags** — categorization labels
- **tickets** — support tickets (channels: email, whatsapp, manual)
- **messages** — ticket conversation (inbound, outbound, internal_note)
- **activity** — ticket audit trail

## Frontend Pages

- `/` or `/dashboard` — KPI cards, ticket trend chart, channel breakdown, agent workload
- `/tickets` — filterable ticket inbox (status, priority, channel, search)
- `/tickets/new` — create new ticket with entity linking
- `/tickets/:id` — ticket detail with conversation, reply/internal note, sidebar actions
- `/clients` — client cards with site/ticket counts
- `/sites` — site table with open ticket counts
- `/jobs` — job/work order cards with status and scheduling
- `/employees` — employee directory
- `/vendors` — vendor directory
- `/contacts` — contact directory
- `/reports` — analytics: KPIs, trend chart, pie chart, SLA performance, agent stats
- `/settings` — agent roster with roles and role permission reference

## API Routes

- `GET/POST /api/tickets` — list (paginated, filterable) and create tickets
- `GET/PATCH /api/tickets/:id` — get enriched ticket detail, update status/priority/assignment
- `GET/POST /api/tickets/:id/messages` — conversation thread
- `GET/POST /api/clients` — client management with site/ticket counts
- `GET /api/clients/:id` — client detail
- `GET/POST /api/sites` — site management
- `GET/POST /api/employees` — employee management
- `GET/POST /api/vendors` — vendor management
- `GET/POST /api/contacts` — contact management
- `GET/POST /api/jobs` — job/work order management
- `GET /api/users` — support agent list
- `GET /api/tags` — tag list
- `GET /api/dashboard/summary` — KPI summary
- `GET /api/dashboard/ticket-trends` — 7-day created/resolved counts
- `GET /api/dashboard/channel-breakdown` — tickets by channel
- `GET /api/dashboard/sla-summary` — SLA compliance stats
- `GET /api/dashboard/recent-activity` — recent ticket activity feed
- `GET /api/dashboard/agent-stats` — per-agent workload stats

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
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

## Common Patterns

### Generated mutations require `{ data: ... }` wrapper
```ts
await createClient.mutateAsync({ data: { name, email } });
await updateTicket.mutateAsync({ id, data: { status } });
await createMessage.mutateAsync({ id, data: { body, type } });
```

### Count subquery aliases must be unique
When joining multiple count subqueries, each `.as()` alias must be distinct to avoid PostgreSQL ambiguity errors.
```ts
// Correct:
const siteCountSq = db.select({ clientId: ..., siteCount: sql`...`.as("site_count") })
const openTicketCountSq = db.select({ clientId: ..., openTicketCount: sql`...`.as("open_ticket_count") })
```

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
