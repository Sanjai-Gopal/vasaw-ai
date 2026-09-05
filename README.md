# VASAW AI — Autonomous Local-Business Website & WhatsApp Outreach Platform

VASAW AI is an AI-powered local-business automation platform that discovers businesses, qualifies website opportunities, stores and manages leads, builds Next.js websites, deploys them live, and conducts automated WhatsApp outreach.

---

## 🚀 Architecture

```text
Campaign Request (UI / API / Scheduler)
    │
    ▼
┌────────────────────────────────────────────────────────┐
│                      ORCHESTRATOR                      │
│           (lib/agents/orchestrator/runner.ts)          │
└────────────────────────────────────────────────────────┘
    │
    ├─► Stage 1: Agent 1 — Scraping (Apify / Mock)
    ├─► Stage 2: Agent 2 — Qualification (AI Router / Heuristics)
    ├─► Stage 3: Agent 3 — Storage (Supabase Postgres / In-memory)
    ├─► Stage 4: Agent 4 — Website Builder (Next.js Renderer / Fallback)
    ├─► Stage 5: Agent 5 — Deployment (Vercel Cloud API / Mock)
    └─► Stage 6: Agent 6 — WhatsApp (Meta Cloud API / Mock)
```

---

## 🛠️ Technology Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Lucide Icons, Framer Motion
- **Backend / APIs**: Next.js Route Handlers, TypeScript, Vitest
- **Database**: Supabase PostgreSQL (Primary Source of Truth)
- **Spreadsheet Sync**: Google Sheets API (Operational Secondary Sync)
- **External Integrations**: Apify Google Maps Actor, Meta WhatsApp Cloud API v21.0, Vercel Cloud API

---

## 📦 Project Structure

```text
├── app/
│   ├── (dashboard)/
│   │   ├── page.tsx               # Main Overview Dashboard
│   │   ├── onboarding/page.tsx     # 30-Second Guided Demo
│   │   ├── campaigns/page.tsx      # Campaign Management
│   │   ├── leads/page.tsx          # Leads Table & Filters
│   │   ├── leads/[id]/page.tsx     # Lead Details & Outreach
│   │   ├── websites/page.tsx       # Generated Websites
│   │   ├── websites/[id]/page.tsx  # Website Preview Sandbox
│   │   ├── messages/page.tsx       # WhatsApp Outreach Dashboard
│   │   ├── agents/page.tsx         # 6-Agent Pipeline Monitoring
│   │   └── settings/page.tsx       # Settings & Google Sheets Sync
│   ├── login/page.tsx              # Authentication Page
│   └── api/                        # Route Handlers
│
├── components/
│   ├── common/                     # EmptyState, LoadingState, ErrorState
│   ├── dashboard/                  # StatCard, PipelineVisual, ConnectionCard
│   ├── leads/                      # LeadStatusBadge, LeadScoreBadge
│   └── ui/                         # Reusable UI primitives
│
├── lib/
│   ├── agents/                     # Modular Agents 1–6 & Orchestrator
│   ├── api/                        # Typed API Clients
│   ├── data/                       # Canonical Data Mappers & Access Layer
│   ├── integrations/google-sheets/ # Google Sheets Provider Architecture
│   └── types.ts                    # Canonical Domain Interfaces
│
└── tests/                          # 220+ Unit & Integration Tests
```

---

## ⚡ Quick Start (Local Development)

```bash
# 1. Clone repository & install dependencies
git clone https://github.com/Sanjai-Gopal/vasaw-ai.git
cd vasaw-ai
npm install

# 2. Configure environment (Mock mode works with zero credentials out of the box)
cp .env.example .env.local

# 3. Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🧪 Testing & Verification

```bash
# Run complete test suite (260 unit & integration tests)
npm test

# Run TypeScript compilation check
npx tsc --noEmit

# Run Next.js production build
npm run build

# Run linter
npm run lint
```

---

## 🔒 Safety & Operational Modes

VASAW AI guarantees zero accidental real network actions during development and automated testing:

| Mode Variable | Supported Values | Behavior |
| :--- | :--- | :--- |
| `APP_INTEGRATION_MODE` | `mock` *(default)*, `live` | Controls whether agents use mock fixtures or live external APIs. |
| `OUTREACH_MODE` | `disabled` *(default)*, `mock`, `live` | Safety guardrail preventing accidental live WhatsApp dispatches. `disabled` stores messages as `PENDING` without network calls. |

---

## 🤖 AI Reasoning & Multi-Provider Fallback

* **Primary High-Speed Reasoning**: Google Gemini 2.0 Flash (`gemini-2.0-flash`)
* **Secondary High-Speed Inference**: Groq (`llama-3.3-70b-versatile`)
* **Specialized Reasoning**: NVIDIA Nemotron / OpenAI
* **Deterministic Heuristic Fallback**: High-reliability offline rule engine when external AI APIs are unreachable.

---

## 📄 Documentation

* [System Architecture & Reference](file:///c:/Users/Gogul%20raj%20A/vasaw-ai/ARCHITECTURE.md)
* [Production Hardening Progress Log](file:///c:/Users/Gogul%20raj%20A/vasaw-ai/progress_log.md)
* [Final Verification Status](file:///c:/Users/Gogul%20raj%20A/vasaw-ai/FINAL_STATUS.md)

---

## 📊 Google Sheets Setup

To enable live Google Sheets synchronization:
1. Create a Google Cloud Service Account and enable the Google Sheets API.
2. Share your target Google Sheet with your service account email.
3. Configure the following in `.env.local`:
   ```env
   GOOGLE_SERVICE_ACCOUNT_EMAIL=your-sa@project.iam.gserviceaccount.com
   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   GOOGLE_SHEETS_SPREADSHEET_ID=your-sheet-id
   ```
4. Navigate to **Settings > Google Sheets Export & Sync** to trigger 1-click exports.
