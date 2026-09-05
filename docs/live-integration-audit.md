# VASAW AI — Live Integration Audit

This audit document evaluates the current codebase state across all 6 agents, storage layers, integrations, and orchestration flows to prepare for live production external integrations while preserving the existing architecture.

---

## 1. System Inventory & Provider Status

| Component | Current Implementation | Mock / Live Status | Required Credentials | Risk Level |
| :--- | :--- | :--- | :--- | :--- |
| **Agent 1: Scraping** | `MockProvider` (125+ deterministic records) & `ApifyProvider` (Actor `nwua9Gu5YrADL7ZDj`) | **Dual (Mock + Live)** | `APIFY_API_TOKEN`, `APIFY_ACTOR_ID` | Low |
| **Agent 2: Qualification** | `MockProvider` (rule-based) & `AIProvider` (Multi-LLM via `lib/ai/router.ts`) | **Dual (Mock + Live)** | `NVIDIA_API_KEY` / `GROQ_API_KEY` / `GEMINI_API_KEY` | Low |
| **Agent 3: Storage** | `saveLeads`, `saveQualification`, `saveWebsite`, `saveDeployment`, `saveMessage` via Supabase RPC `upsert_lead` and tables | **Dual (Mock fallback + Postgres/Supabase)** | `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Medium |
| **Agent 4: Website Generation** | `MockWebsiteProvider` & `AIWebsiteProvider` generating real Next.js project code + validation | **Dual (Mock Content + AI Content)** | `NVIDIA_API_KEY` / `GROQ_API_KEY` / `GEMINI_API_KEY` | Low |
| **Agent 5: Deployment** | `MockDeploymentProvider` & `VercelDeploymentProvider` (Vercel `/v13/deployments` API) | **Dual (Mock + Live)** | `VERCEL_TOKEN`, `VERCEL_TEAM_ID`, `VERCEL_PROJECT_ID` | Medium |
| **Agent 6: WhatsApp Outreach** | `MockWhatsAppProvider` & `MetaWhatsAppProvider` (Meta Cloud API `/messages` + webhook verification) | **Dual (Mock + Live)** | `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_APP_SECRET`, `WHATSAPP_WEBHOOK_VERIFY_TOKEN` | **High** (Accidental outreach risk) |
| **Google Sheets Integration** | `MockGoogleSheetsProvider` (in-memory) & `GoogleSheetsApiProvider` (credential checking with stubbed API calls) | **Partial (Mock working, Live stubbed)** | `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `GOOGLE_SHEETS_SPREADSHEET_ID` | Medium |
| **Orchestrator** | `executeWorkflow()` coordinating Agents 1–6 with state-machine error handling and progress calculation | **Working** | None (coordinates sub-agents) | Low |
| **Authentication** | Mock UI / basic session handling on frontend | **Mock** | Supabase Auth (`gotrue` / `@supabase/ssr`) | Medium |
| **Multi-Tenancy** | Single-tenant database schema with service-role access | **Single Tenant** | PostgreSQL RLS + `organizations` / `organization_memberships` | High |

---

## 2. Detailed Audit Findings by Component

### A. Agent 1: Scraping (Apify Provider)
- **Current State:** `ApifyProvider` in `lib/agents/scraping/providers.ts` is implemented and triggers actor `nwua9Gu5YrADL7ZDj`. It supports `searchStringsArray`, `maxCrawledPlacesPerSearch`, and `maxItems`.
- **Missing Pieces:**
  - Need to enforce rating/review filters (`minimumRating`, `minimumReviews`) in live Apify response normalization.
  - Add explicit server-side credential validation returning descriptive errors when `APIFY_API_TOKEN` is missing in `LIVE` mode (never silent fallback).
  - Add exponential backoff / retry handling on Apify polling timeouts.

### B. Agent 2 & Agent 4: AI Qualification & Website Generation
- **Current State:** AI Router in `lib/ai/router.ts` routes across NVIDIA, Groq, Gemini, and Cloudflare with fallback support. `AIProvider` in qualification and `AIWebsiteProvider` in website building use structured JSON prompts.
- **Missing Pieces:**
  - Enforce real lead data validation so AI never generates hallucinated business claims.
  - Maintain strict separation between static project validation and deployment.

### C. Agent 3: Database & Campaign Counter Integrity
- **Current State:** Tables `campaigns`, `leads`, `websites`, `deployments`, `messages`, `agent_runs`, `activities` exist in `supabase/migrations/001_initial_schema.sql`. RPC `upsert_lead` handles deduplication by `(campaign_id, business_name, phone)`.
- **Missing Pieces:**
  - Campaign counters (`leadsCollected`, `leadsQualified`, `websitesBuilt`, `websitesDeployed`, `messagesSent`) must be dynamically calculated directly from database records via SQL aggregate counts rather than trusting client payloads or in-memory increments.
  - Foreign key cascading and constraints verification across all tables.

### D. Agent 5: Vercel Deployment
- **Current State:** `VercelDeploymentProvider` in `lib/agents/deployment/providers/vercel.ts` creates projects and deployments via Vercel REST API, poll-checks deployment status (`READY`, `BUILDING`, `ERROR`), and redacts tokens from logs.
- **Missing Pieces:**
  - Explicit mode enforcement (`APP_INTEGRATION_MODE=live` requires verified Vercel token; never mark `READY` before Vercel returns HTTP 200 with `readyState === "READY"`).

### E. Agent 6: WhatsApp Outreach (Safety & Meta Cloud API)
- **Current State:** `MetaWhatsAppProvider` in `lib/agents/whatsapp/providers/meta.ts` implements Meta Graph API `/messages` with E.164 phone normalization, retry logic, and webhook handling.
- **Missing Pieces (CRITICAL SAFETY):**
  - Implement `OUTREACH_MODE=disabled|mock|live` (Default: `disabled`).
  - In `disabled` mode: messages are generated and saved to the database with `status: "prepared"` or `"pending"`, but never dispatched to Meta API.
  - In `live` mode: require explicit campaign-level opt-in (`automationMode === "automatic"` or explicit confirmation) AND validate that recipient numbers are real verified leads.

### F. Google Sheets Live Synchronization
- **Current State:** `GoogleSheetsApiProvider` in `lib/integrations/google-sheets/api-provider.ts` checks credentials but returns static response objects without making live Google Sheets REST API calls.
- **Missing Pieces:**
  - Implement authentic Google Sheets v4 API communication (JWT / OAuth2 service account authentication) to append/update tabs: `Leads`, `Campaigns`, `Websites`, `Messages`, `Activities`.

### G. Authentication & Multi-Tenancy (Phases 9 & 10)
- **Current State:** Basic login UI; database queries execute primarily via service role without tenant isolation.
- **Missing Pieces:**
  - Supabase Auth integration for session validation on `/api/*` routes and protected dashboard pages.
  - Schema extension for `organizations`, `organization_memberships`, and `organization_id` column on tenant-owned entities.
  - Row Level Security (RLS) policies ensuring User A cannot read/mutate User B's resources.

### H. Observability & Structured Logging
- **Current State:** Basic `console.log` / `console.warn` outputs.
- **Missing Pieces:**
  - Structured logger emitting JSON logs with `workflowId`, `campaignId`, `leadId`, `agent`, `stage`, `durationMs`, `status`, `error`, with automatic redaction of secrets, tokens, and private keys.

---

## 3. Required Environment Variables

```env
# ============================================================
# VASAW AI — Production Environment Variables
# ============================================================

# Application Integration & Safety Modes
APP_INTEGRATION_MODE=mock          # "mock" | "live"
OUTREACH_MODE=disabled            # "disabled" | "mock" | "live"
CAMPAIGN_BATCH_SIZE=10

# Database & Supabase (PostgreSQL)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Scraping (Apify)
APIFY_API_TOKEN=your-apify-token
APIFY_ACTOR_ID=nwua9Gu5YrADL7ZDj

# AI Providers
NVIDIA_API_KEY=your-nvidia-key
GROQ_API_KEY=your-groq-key
GEMINI_API_KEY=your-gemini-key

# Deployment (Vercel)
VERCEL_TOKEN=your-vercel-token
VERCEL_TEAM_ID=your-team-id
VERCEL_PROJECT_ID=your-project-id

# Google Sheets
GOOGLE_SERVICE_ACCOUNT_EMAIL=vasaw-sync@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEETS_SPREADSHEET_ID=your-spreadsheet-id

# WhatsApp (Meta Cloud API)
WHATSAPP_ACCESS_TOKEN=your-meta-access-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
WHATSAPP_API_VERSION=v21.0
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your-verify-token
WHATSAPP_APP_SECRET=your-meta-app-secret
```

---

## 4. Exact Files Requiring Changes by Phase

| Phase | Files to Modify / Create |
| :--- | :--- |
| **Config & Modes** | `lib/config/env.ts` *(NEW)*, `lib/config/modes.ts` *(NEW)*, `.env.example` |
| **Scraping** | `lib/agents/scraping/providers.ts`, `lib/agents/scraping/normalize.ts` |
| **Database & Counters** | `lib/data/campaigns.ts`, `lib/agents/storage/index.ts`, `app/api/campaigns/[id]/execute/route.ts` |
| **Website & Deployment** | `lib/agents/deployment/providers/vercel.ts`, `lib/agents/deployment/index.ts` |
| **Google Sheets** | `lib/integrations/google-sheets/api-provider.ts`, `lib/integrations/google-sheets/client.ts` *(NEW)* |
| **WhatsApp Outreach** | `lib/agents/whatsapp/providers/meta.ts`, `lib/agents/whatsapp/index.ts`, `lib/agents/orchestrator/runner.ts` |
| **Auth & Multi-Tenancy** | `lib/supabase/auth.ts` *(NEW)*, `middleware.ts`, `supabase/migrations/004_multi_tenancy.sql` *(NEW)* |
| **Observability** | `lib/utils/logger.ts` *(NEW)*, `lib/agents/orchestrator/runner.ts` |
| **UI Enhancements** | `app/(dashboard)/campaigns/page.tsx`, `app/(dashboard)/settings/page.tsx`, `app/api/connections/route.ts` |
| **Testing** | `tests/live-providers.test.ts` *(NEW)*, `tests/multi-tenancy.test.ts` *(NEW)*, `tests/safety-modes.test.ts` *(NEW)* |

---

## 5. Implementation Roadmap

1. **Step 2:** Configuration Architecture (`APP_INTEGRATION_MODE`, `OUTREACH_MODE`, strict env validation).
2. **Step 3:** Production-ready Scraping (Apify live validation, error handling, normalization).
3. **Step 4:** Real Database Persistence & Accurate Campaign Counters.
4. **Step 5:** Website Validation & Real Vercel Deployment Polling.
5. **Step 6:** Live Google Sheets Service Account Synchronization.
6. **Step 7:** WhatsApp Safety System (`disabled` / `mock` / `live`) & Meta Cloud API.
7. **Step 8:** Production Campaign Execution Route.
8. **Step 9:** Authentication (Supabase Auth & Session Verification).
9. **Step 10:** Multi-Tenancy & Row-Level Security (RLS).
10. **Step 11:** Observability & Structured Redacted Logging.
11. **Step 12:** Full Test Suite, Lint, Build & Documentation.
