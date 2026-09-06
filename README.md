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

## 🚀 Vercel Automatic Deployment (CI/CD)

VASAW AI is configured for zero-friction continuous deployment via GitHub & Vercel:

```text
Developer changes code
        ↓
git commit
        ↓
git push origin main
        ↓
GitHub (Sanjai-Gopal/vasaw-ai)
        ↓
Vercel Webhook / Native Git Integration
        ↓
Install dependencies (npm install)
        ↓
Next.js Production Build (npm run build)
        ↓
Deploy & Promote to Production
        ↓
Live URL: https://vasaw-nagerkovil-arya-bhavan.vercel.app (or custom domain)
```

### 1. Vercel Project Settings

| Setting | Recommended Value |
| :--- | :--- |
| **Framework Preset** | `Next.js` |
| **Root Directory** | `./` |
| **Build Command** | `npm run build` *(or default Next.js build)* |
| **Output Directory** | `.next` *(default)* |
| **Install Command** | `npm install` |
| **Node.js Version** | `20.x` or `22.x` |

### 2. Environment Variables Configuration

Set these variables in the **Vercel Dashboard > Project Settings > Environment Variables**:

#### 🌐 Client-Side Variables (Browser Accessible)
| Variable Name | Required | Description |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes (Live mode) | Your Supabase project URL (`https://<project-ref>.supabase.co`). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes (Live mode) | Supabase anonymous public client key. |

#### 🔒 Server-Side Variables (Protected & Never Exposed to Browser)
| Variable Name | Required | Description |
| :--- | :--- | :--- |
| `APP_INTEGRATION_MODE` | Optional (`mock` default) | Set to `live` for real Apify, Vercel, Supabase, and WhatsApp operations. |
| `OUTREACH_MODE` | Optional (`disabled` default) | Safety gate: `disabled`, `mock`, or `live`. Must be `live` to send real WhatsApp messages. |
| `CAMPAIGN_BATCH_SIZE` | Optional (`10` default) | Number of leads processed per pipeline batch. |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes (Live mode) | Supabase admin service role key for backend DB operations. |
| `APIFY_API_TOKEN` | Yes (Live mode) | Apify API token for Google Maps lead scraping actor. |
| `APIFY_ACTOR_ID` | Optional | Apify Actor ID (defaults to `nwua9Gu5YrADL7ZDj`). |
| `NVIDIA_API_KEY` | Optional | NVIDIA NIM API key for Nemotron AI models. |
| `GROQ_API_KEY` | Optional | Groq API key for LLaMA 3.3 high-speed inference. |
| `GEMINI_API_KEY` | Optional | Google Gemini API key for Flash 2.0 reasoning. |
| `CLOUDFLARE_API_TOKEN` | Optional | Cloudflare AI Workers token. |
| `CLOUDFLARE_ACCOUNT_ID` | Optional | Cloudflare account ID. |
| `VERCEL_TOKEN` | Yes (Live deployments) | Vercel API token used by Agent 5 for deploying customer preview websites. |
| `VERCEL_TEAM_ID` | Optional | Vercel Team ID if deploying customer sites under a team account. |
| `VERCEL_PROJECT_ID` | Optional | Target Vercel Project ID if reusing a single project slot. |
| `GITHUB_TOKEN` | Optional | GitHub personal access token for repository creation by Agent 5. |
| `WHATSAPP_ACCESS_TOKEN` | Yes (Live outreach) | Meta WhatsApp Cloud API access token. |
| `WHATSAPP_PHONE_NUMBER_ID` | Yes (Live outreach) | Meta WhatsApp Cloud API Sender Phone Number ID. |
| `WHATSAPP_API_VERSION` | Optional | WhatsApp Graph API version (default: `v21.0`). |
| `WHATSAPP_WEBHOOK_VERIFY_TOKEN` | Optional | Secret string for WhatsApp webhook verification challenge. |
| `WHATSAPP_APP_SECRET` | Optional | Meta App Secret for validating webhook HMAC SHA-256 signatures. |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Optional | Google Cloud service account email for Google Sheets sync. |
| `GOOGLE_PRIVATE_KEY` | Optional | Google Cloud service account RSA private key string. |
| `GOOGLE_SHEETS_SPREADSHEET_ID` | Optional | Google Sheets document ID for live two-way sync. |

### 3. Production Health Check

Verify production deployment health by querying:
```bash
curl -i https://<your-vercel-domain>.vercel.app/api/health
```

Expected response status `200 OK` with JSON payload confirming agent states, service connectivity, and uptime.

---

## 📊 Google Sheets Setup

To enable live Google Sheets synchronization:
1. Create a Google Cloud Service Account and enable the Google Sheets API.
2. Share your target Google Sheet with your service account email.
3. Configure the following in `.env.local` / Vercel Environment Variables:
   ```env
   GOOGLE_SERVICE_ACCOUNT_EMAIL=your-sa@project.iam.gserviceaccount.com
   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   GOOGLE_SHEETS_SPREADSHEET_ID=your-sheet-id
   ```
4. Navigate to **Settings > Google Sheets Export & Sync** to trigger 1-click exports.

