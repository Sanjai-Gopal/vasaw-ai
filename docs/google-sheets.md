# VASAW AI — Google Sheets Integration

Google Sheets functions as an operational export and synchronization layer. Supabase remains the primary database.

## Architecture

```text
React Dashboard / API Endpoint
          │
          ▼
GoogleSheetsProvider (Interface)
   ├── MockGoogleSheetsProvider (Default / Offline / Safe)
   └── GoogleSheetsApiProvider (Real Service Account)
```

## Environment Variables

For live synchronization, set the following in `.env.local`:

```env
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEETS_SPREADSHEET_ID=your-google-sheets-spreadsheet-id
```

## Supported Spreadsheets & Worksheets

- **Leads**: ID, Business Name, Category, Location, Rating, Reviews, Phone, AI Score, Priority, Status.
- **Websites**: Website ID, Lead ID, Template, Build Progress, Preview URL, Live URL.
- **Outreach**: Message ID, Lead ID, Phone, Message Body, Status, Timestamp.
- **Campaigns**: Campaign ID, Name, Target, Progress, Total Scraped, Total Deployed.
