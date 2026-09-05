# VASAW AI — Frontend Architecture

## Core Principles

1. **One Canonical Data Model**: Database records in `snake_case` are normalized into `camelCase` domain objects in `lib/data/` before reaching API routes or React components.
2. **Centralized Typed API Client**: UI components communicate via `lib/api/` rather than invoking raw fetch requests directly.
3. **Resilience & Defensive Formatting**: Utilities in `lib/utils.ts` format dates, numbers, and strings safely with fallback placeholders.

## Route Map

```text
/
  ├── (dashboard)/
  │   ├── page.tsx               -> Main Overview Dashboard
  │   ├── onboarding/page.tsx     -> Interactive 30-second Guided Demo
  │   ├── campaigns/page.tsx      -> Campaign Management & Pipeline Progress
  │   ├── leads/page.tsx          -> Leads Table & Filters
  │   ├── leads/[id]/page.tsx     -> Comprehensive Lead Detail & Outreach Dispatch
  │   ├── websites/page.tsx       -> Websites Gallery & Build Controls
  │   ├── websites/[id]/page.tsx  -> Interactive Preview Sandbox & Deployment Detail
  │   ├── messages/page.tsx       -> WhatsApp Outreach Dashboard & Conversation Logs
  │   ├── agents/page.tsx         -> 6-Agent Visual Pipeline & Run Monitoring
  │   └── settings/page.tsx       -> Integrations & Google Sheets Control Center
  │
  ├── login/page.tsx              -> Authentication Shell
  └── api/                        -> Typed Next.js Route Handlers
```

## Component Architecture

- `components/layout/`: App Shell, Topbar, Sidebar, PageHeader
- `components/common/`: `EmptyState`, `LoadingState`, `ErrorState`, `ConfirmDialog`, `DataTable`
- `components/leads/`: `LeadStatusBadge`, `LeadScoreBadge`
- `components/dashboard/`: `ActivityFeed`, `ConnectionCard`, `PipelineVisual`, `StatCard`
