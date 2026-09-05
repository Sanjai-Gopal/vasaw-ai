# VASAW AI — Database Architecture

VASAW AI uses Supabase PostgreSQL as its single source of truth.

## PostgreSQL Tables

1. **`campaigns`**: Campaign configurations, targets, categories, and progress.
2. **`leads`**: Raw and normalized business listings, AI scores, phone numbers, and canonical lifecycle status.
3. **`websites`**: Next.js website generation records, template types, and build status.
4. **`deployments`**: Vercel deployment records, preview/live URLs, and commit hashes.
5. **`messages`**: Inbound/outbound WhatsApp messages, delivery statuses, and reply classifications.
6. **`agent_runs`**: Execution history, duration, and error logs for all 6 agents and orchestrator.
7. **`activities`**: Real-time event log displayed on the dashboard activity feed.

## Lifecycle Status Flow

```text
new ──► scraped ──► qualified ──► website_building ──► website_deployed ──► contacted ──► replied ──► interested ──► won
```
