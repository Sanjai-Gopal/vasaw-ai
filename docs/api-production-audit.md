# VASAW AI — API Production Audit

| Method | Path | Auth Required | Input | Output | Database Access | External Services | Idempotency |
|---|---|---|---|---|---|---|---|
| POST | `/api/agents/orchestrator` | Service / Internal | `{ campaignId, locations, categories, maxItems, mode }` | `{ ok, workflowId, status, stages, stats }` | `leads`, `campaigns`, `agent_runs` | Apify, AI Router, Vercel, Meta WhatsApp | Yes (by workflowId & leadId) |
| POST | `/api/agents/scraping` | Service / Internal | `{ campaignId, category, location, limit, mode }` | `{ ok, leads, count }` | `leads`, `agent_runs` | Apify Google Maps | Yes |
| POST | `/api/agents/qualification` | Service / Internal | `{ leads, mode }` | `{ ok, results }` | `leads`, `agent_runs` | AI Router (NVIDIA/Groq/Gemini) | Yes |
| POST | `/api/agents/website` | Service / Internal | `{ lead, qualification, mode }` | `{ ok, websiteId, status, projectPath }` | `websites`, `agent_runs` | Local Filesystem / Node Build | Yes |
| POST | `/api/agents/deployment` | Service / Internal | `{ websiteId, buildResult, businessName, leadId, mode }` | `{ ok, url, status, deploymentId }` | `deployments`, `leads` | Vercel API | Yes |
| POST | `/api/agents/whatsapp` | Service / Internal | `{ leadId, phone, businessName, message, mode }` | `{ ok, messageId, status }` | `messages`, `leads` | Meta WhatsApp Cloud API | Yes (by messageId / phone) |
| GET | `/api/agents/status` | Public / Dashboard | None | `{ ok, agents }` | `agent_runs` | None | Read-only |
| GET | `/api/leads` | Dashboard | Query params (`status`, `category`, `search`) | `{ ok, leads, count }` | `leads` | None | Read-only |
| GET | `/api/leads/:id` | Dashboard | Path `id` | `{ ok, lead }` | `leads` | None | Read-only |
| PATCH | `/api/leads/:id/status` | Dashboard | `{ status }` | `{ ok, lead }` | `leads` | None | Yes |
| GET | `/api/websites` | Dashboard | None | `{ ok, websites }` | `websites` | None | Read-only |
| POST | `/api/websites/:id/deploy` | Dashboard | `{ mode }` | `{ ok, url }` | `websites`, `deployments` | Vercel API | Yes |
| POST | `/api/websites/:id/rebuild` | Dashboard | `{ mode }` | `{ ok, website }` | `websites` | Next.js Renderer | Yes |
| GET | `/api/messages` | Dashboard | None | `{ ok, messages }` | `messages` | None | Read-only |
| GET | `/api/campaigns` | Dashboard | None | `{ ok, campaigns }` | `campaigns` | None | Read-only |
| POST | `/api/campaigns` | Dashboard | `{ name, category, location, leadTarget }` | `{ ok, campaign }` | `campaigns` | None | Creates unique ID |
| GET | `/api/dashboard/stats` | Dashboard | None | `{ ok, stats }` | `leads`, `websites`, `messages`, `campaigns` | None | Read-only |
| POST | `/api/sheets/export/leads` | Dashboard | `{ spreadsheetId, mode }` | `{ ok, rowsWritten, sheetName }` | `leads` | Google Sheets API | Yes (by leadId) |
| POST | `/api/sheets/export/websites` | Dashboard | `{ spreadsheetId, mode }` | `{ ok, rowsWritten, sheetName }` | `websites` | Google Sheets API | Yes (by websiteId) |
| POST | `/api/sheets/export/messages` | Dashboard | `{ spreadsheetId, mode }` | `{ ok, rowsWritten, sheetName }` | `messages` | Google Sheets API | Yes (by messageId) |
| POST | `/api/sheets/export/campaigns` | Dashboard | `{ spreadsheetId, mode }` | `{ ok, rowsWritten, sheetName }` | `campaigns` | Google Sheets API | Yes (by campaignId) |
| POST | `/api/sheets/sync` | Dashboard | `{ spreadsheetId, includeLeads, ... }` | `{ ok, summary }` | All tables | Google Sheets API | Yes |
| POST | `/api/webhooks/whatsapp` | Webhook (Meta) | Meta Cloud API Webhook Event | `{ ok, processed, results }` | `messages`, `conversations`, `activities` | None | Yes (by wamid) |
| GET | `/api/webhooks/whatsapp` | Webhook (Meta) | Challenge parameters | Challenge string / Status 200 | None | None | Read-only |
