# VASAW AI — External Integration Status

This document records the exact readiness and verification status of every external service integration.

---

## 1. Integrations Classification

### 1. Supabase PostgreSQL
- **Implementation**: **REAL & OFFLINE-SAFE**
- **Status**: **LIVE VERIFIED** (Database connection active, tables migrated, queries operational; in-memory fallback active when credentials omitted in development).
- **Required Secrets**: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

### 2. Google Sheets
- **Implementation**: **MOCK & REAL READY**
- **Status**: **OFFLINE VERIFIED** (Unit tested across export & sync with deduplication).
- **Live Readiness**: Requires `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`, and `GOOGLE_SHEETS_SPREADSHEET_ID`.

### 3. Vercel Cloud API
- **Implementation**: **MOCK & REAL READY**
- **Status**: **OFFLINE VERIFIED** (Deterministic mock produces valid HTTPS URLs, handles build artifacts, and updates database).
- **Live Readiness**: Requires `VERCEL_TOKEN`, `VERCEL_PROJECT_ID`, and optional `VERCEL_TEAM_ID`.

### 4. Meta WhatsApp Cloud API v21.0
- **Implementation**: **MOCK & REAL READY**
- **Status**: **OFFLINE VERIFIED** (Meta API payload formatting, phone normalization, webhook HMAC-SHA256 verification, and delivery/read tracking tested).
- **Live Readiness**: Requires `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, and `WHATSAPP_APP_SECRET`.

### 5. Apify Google Maps Actor
- **Implementation**: **MOCK & REAL READY**
- **Status**: **OFFLINE VERIFIED** (Apify payload normalization, rating/review parsing, and telephone normalization tested).
- **Live Readiness**: Requires `APIFY_API_TOKEN`.

### 6. AI Providers (NVIDIA / Groq / Gemini / Cloudflare)
- **Implementation**: **MOCK & REAL READY**
- **Status**: **OFFLINE VERIFIED** (Multi-provider fallback hierarchy and deterministic JSON heuristic fallback tested).
- **Live Readiness**: Requires at least one of `NVIDIA_API_KEY`, `GROQ_API_KEY`, or `GEMINI_API_KEY`.
