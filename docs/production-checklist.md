# VASAW AI — Production Launch Checklist

## Pre-Launch Prerequisites

- [x] All 227 Unit & Integration tests passing (`npm test`)
- [x] TypeScript clean compilation (`npx tsc --noEmit`)
- [x] Production build passes (`npm run build`)
- [x] Clean ESLint (0 errors, 0 warnings)
- [x] Canonical data model normalized across Database, API, and Frontend
- [x] Offline mock mode functions with zero external credentials
- [ ] Multi-tenant session authentication middleware deployed on `/api/*`
- [ ] Production RLS policies with `organization_id` tenancy checks
- [ ] Live credentials configured in Vercel / Environment Secrets:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] `APIFY_API_TOKEN`
  - [ ] `VERCEL_TOKEN`
  - [ ] `WHATSAPP_ACCESS_TOKEN`
  - [ ] `WHATSAPP_PHONE_NUMBER_ID`
  - [ ] `GOOGLE_SERVICE_ACCOUNT_EMAIL`
  - [ ] `GOOGLE_PRIVATE_KEY`
  - [ ] `GOOGLE_SHEETS_SPREADSHEET_ID`
- [ ] Meta WhatsApp Webhook URL configured and verified in Meta App Dashboard
- [ ] Upstash Redis rate limiting configured on public API routes
