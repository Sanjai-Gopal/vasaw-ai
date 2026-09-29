import type {
  NodeTypeDefinition,
  FlowWorkflow,
  FlowNode,
  ExecutionLog,
} from "@/lib/types/automation-flow";

export const NODE_CATEGORIES = [
  { id: "all", label: "All Nodes", count: 18 },
  { id: "trigger", label: "Triggers", count: 6 },
  { id: "ai", label: "AI & Agents", count: 4 },
  { id: "integration", label: "Integrations & Actions", count: 8 },
  { id: "logic", label: "Logic & Flow", count: 4 },
] as const;

export const NODE_TYPE_REGISTRY: Record<string, NodeTypeDefinition> = {
  // --- TRIGGERS ---
  trigger_webhook: {
    type: "trigger_webhook",
    name: "Webhook Trigger",
    category: "trigger",
    description: "Listens for incoming HTTP POST requests with JSON payloads from external systems.",
    iconName: "Zap",
    badgeText: "Inbound Hook",
    colorScheme: {
      bg: "bg-amber-500/10",
      border: "border-amber-500/30",
      text: "text-amber-500",
      accent: "#f59e0b",
      glow: "rgba(245, 158, 11, 0.25)",
      headerBg: "bg-amber-500/15",
    },
    inputs: [],
    outputs: [{ id: "out", name: "Output", type: "main", label: "Trigger Payload" }],
    parameters: [
      {
        id: "path",
        name: "path",
        label: "Webhook Path",
        type: "text",
        defaultValue: "/api/v1/webhook/leads",
        description: "Relative path where the webhook endpoint is mounted",
      },
      {
        id: "method",
        name: "method",
        label: "HTTP Method",
        type: "select",
        options: [
          { label: "POST", value: "POST" },
          { label: "GET", value: "GET" },
          { label: "PUT", value: "PUT" },
        ],
        defaultValue: "POST",
      },
      {
        id: "authRequired",
        name: "authRequired",
        label: "Require Bearer Token",
        type: "boolean",
        defaultValue: true,
      },
    ],
    defaultData: {
      parameters: {
        path: "/api/v1/webhook/leads",
        method: "POST",
        authRequired: true,
      },
      defaultOutput: {
        event: "lead.created",
        source: "google_maps_form",
        timestamp: "2026-09-17T11:00:00.000Z",
        body: {
          businessName: "Kovai Artisanal Bakery",
          phone: "+91 98421 88402",
          category: "Bakery & Cafe",
          city: "Coimbatore",
          website: null,
          rating: 4.8,
          reviews: 142,
        },
      },
    },
  },

  trigger_cron: {
    type: "trigger_cron",
    name: "Schedule / Cron",
    category: "trigger",
    description: "Triggers automatically at recurring time intervals or standard cron expressions.",
    iconName: "Clock",
    badgeText: "Time Interval",
    colorScheme: {
      bg: "bg-amber-500/10",
      border: "border-amber-500/30",
      text: "text-amber-500",
      accent: "#f59e0b",
      glow: "rgba(245, 158, 11, 0.25)",
      headerBg: "bg-amber-500/15",
    },
    inputs: [],
    outputs: [{ id: "out", name: "Output", type: "main", label: "Cron Signal" }],
    parameters: [
      {
        id: "cronExpression",
        name: "cronExpression",
        label: "Cron Expression",
        type: "text",
        defaultValue: "0 9 * * 1-5",
        placeholder: "0 9 * * 1-5 (Weekdays at 9:00 AM)",
      },
      {
        id: "timezone",
        name: "timezone",
        label: "Timezone",
        type: "select",
        options: [
          { label: "Asia/Kolkata (IST)", value: "Asia/Kolkata" },
          { label: "UTC", value: "UTC" },
          { label: "America/New_York (EST)", value: "America/New_York" },
        ],
        defaultValue: "Asia/Kolkata",
      },
    ],
    defaultData: {
      parameters: { cronExpression: "0 9 * * 1-5", timezone: "Asia/Kolkata" },
      defaultOutput: {
        triggerTime: "2026-09-17T09:00:00.000+05:30",
        scheduledInterval: "Weekdays at 9:00 AM",
        cycleId: "cycle-74921",
      },
    },
  },

  trigger_apify: {
    type: "trigger_apify",
    name: "Apify Lead Discovery",
    category: "trigger",
    description: "Fires whenever new business locations are discovered via Apify Google Maps actor runs.",
    iconName: "Compass",
    badgeText: "Actor Event",
    colorScheme: {
      bg: "bg-amber-500/10",
      border: "border-amber-500/30",
      text: "text-amber-500",
      accent: "#f59e0b",
      glow: "rgba(245, 158, 11, 0.25)",
      headerBg: "bg-amber-500/15",
    },
    inputs: [],
    outputs: [{ id: "out", name: "Output", type: "main", label: "Discovered Leads" }],
    parameters: [
      {
        id: "searchLocation",
        name: "searchLocation",
        label: "Target City / Region",
        type: "text",
        defaultValue: "Coimbatore, Tamil Nadu",
      },
      {
        id: "businessQuery",
        name: "businessQuery",
        label: "Search Terms",
        type: "text",
        defaultValue: "Restaurants, Cafes, Bakeries",
      },
      {
        id: "batchSize",
        name: "batchSize",
        label: "Batch Discovery Limit",
        type: "number",
        defaultValue: 25,
      },
    ],
    defaultData: {
      parameters: {
        searchLocation: "Coimbatore, Tamil Nadu",
        businessQuery: "Restaurants, Cafes, Bakeries",
        batchSize: 25,
      },
      defaultOutput: {
        actorRunId: "run_apify_maps_9882",
        datasetId: "dataset_leads_coimbatore",
        itemCount: 25,
        sampleLead: {
          businessName: "Anand Bhavan Sweets & Snacks",
          address: "102 Cross Cut Road, Gandhipuram, Coimbatore 641012",
          phone: "+91 94432 10984",
          rating: 4.6,
          reviews: 312,
          hasWebsite: false,
          placeId: "ChIJ_38fa099238sf",
        },
      },
    },
  },

  trigger_supabase: {
    type: "trigger_supabase",
    name: "Supabase DB Trigger",
    category: "trigger",
    description: "Triggers on real-time PostgreSQL INSERT, UPDATE, or DELETE events in your database tables.",
    iconName: "Database",
    badgeText: "PostgreSQL Event",
    colorScheme: {
      bg: "bg-amber-500/10",
      border: "border-amber-500/30",
      text: "text-amber-500",
      accent: "#f59e0b",
      glow: "rgba(245, 158, 11, 0.25)",
      headerBg: "bg-amber-500/15",
    },
    inputs: [],
    outputs: [{ id: "out", name: "Output", type: "main", label: "Record Delta" }],
    parameters: [
      {
        id: "table",
        name: "table",
        label: "Watched Table",
        type: "select",
        options: [
          { label: "leads", value: "leads" },
          { label: "websites", value: "websites" },
          { label: "deployments", value: "deployments" },
          { label: "messages", value: "messages" },
        ],
        defaultValue: "leads",
      },
      {
        id: "event",
        name: "event",
        label: "Change Event",
        type: "select",
        options: [
          { label: "INSERT (New Row)", value: "INSERT" },
          { label: "UPDATE (Status Change)", value: "UPDATE" },
          { label: "ALL", value: "*" },
        ],
        defaultValue: "INSERT",
      },
    ],
    defaultData: {
      parameters: { table: "leads", event: "INSERT" },
      defaultOutput: {
        table: "leads",
        event: "INSERT",
        newRecord: {
          id: "lead-99382",
          businessName: "Kovai Timber & Mill Works",
          status: "new",
          phone: "+91 98433 90123",
          category: "Manufacturing",
          rating: 4.4,
          created_at: "2026-09-17T11:02:14.000Z",
        },
      },
    },
  },

  trigger_form: {
    type: "trigger_form",
    name: "Inbound Form Submit",
    category: "trigger",
    description: "Captures self-service onboarding submissions from demo websites or landing page lead forms.",
    iconName: "FileText",
    badgeText: "Form Submission",
    colorScheme: {
      bg: "bg-amber-500/10",
      border: "border-amber-500/30",
      text: "text-amber-500",
      accent: "#f59e0b",
      glow: "rgba(245, 158, 11, 0.25)",
      headerBg: "bg-amber-500/15",
    },
    inputs: [],
    outputs: [{ id: "out", name: "Output", type: "main", label: "Submitted Form Data" }],
    parameters: [
      {
        id: "formId",
        name: "formId",
        label: "Form Identifier",
        type: "text",
        defaultValue: "vasaw-landing-pitch-form",
      },
    ],
    defaultData: {
      parameters: { formId: "vasaw-landing-pitch-form" },
      defaultOutput: {
        formId: "vasaw-landing-pitch-form",
        submissionId: "sub-5582",
        contactName: "Ramesh Kannan",
        businessName: "Kannan Textiles",
        phone: "+91 98940 12345",
        needWebsite: true,
      },
    },
  },

  trigger_manual: {
    type: "trigger_manual",
    name: "Manual / Test Trigger",
    category: "trigger",
    description: "Instantly triggers this workflow with one click for testing and ad-hoc operations.",
    iconName: "PlayCircle",
    badgeText: "Instant Trigger",
    colorScheme: {
      bg: "bg-amber-500/10",
      border: "border-amber-500/30",
      text: "text-amber-500",
      accent: "#f59e0b",
      glow: "rgba(245, 158, 11, 0.25)",
      headerBg: "bg-amber-500/15",
    },
    inputs: [],
    outputs: [{ id: "out", name: "Output", type: "main", label: "Trigger Signal" }],
    parameters: [
      {
        id: "testPayload",
        name: "testPayload",
        label: "Custom JSON Payload",
        type: "json",
        defaultValue: '{\n  "mode": "test_dry_run",\n  "leadCount": 1\n}',
      },
    ],
    defaultData: {
      parameters: { testPayload: '{\n  "mode": "test_dry_run"\n}' },
      defaultOutput: {
        triggeredBy: "Sanjai (Staff Engineer)",
        mode: "test_dry_run",
        timestamp: "2026-09-17T11:05:00.000Z",
      },
    },
  },

  // --- AI & AGENTS ---
  ai_qualifier: {
    type: "ai_qualifier",
    name: "Gemini AI Lead Qualifier",
    category: "ai",
    description: "Evaluates business data using Gemini 2.5 Pro to determine opportunity score, ROI value, and acquisition viability.",
    iconName: "Sparkles",
    badgeText: "Gemini 2.5 Flash / Pro",
    colorScheme: {
      bg: "bg-purple-500/10",
      border: "border-purple-500/30",
      text: "text-purple-500",
      accent: "#a855f7",
      glow: "rgba(168, 85, 247, 0.25)",
      headerBg: "bg-purple-500/15",
    },
    inputs: [{ id: "in", name: "Input", type: "main", label: "Raw Business Data" }],
    outputs: [{ id: "out", name: "Output", type: "main", label: "Qualified Lead Assessment" }],
    parameters: [
      {
        id: "model",
        name: "model",
        label: "AI Model Provider",
        type: "select",
        options: [
          { label: "Google Gemini 2.5 Flash (Fastest)", value: "gemini-2.5-flash" },
          { label: "Google Gemini 2.5 Pro (Deep Reasoning)", value: "gemini-2.5-pro" },
          { label: "Groq Llama 3.3 70B (Ultra Low Latency)", value: "groq-llama-3.3-70b" },
        ],
        defaultValue: "gemini-2.5-flash",
      },
      {
        id: "minScoreThreshold",
        name: "minScoreThreshold",
        label: "Qualification Score Threshold (%)",
        type: "number",
        defaultValue: 80,
      },
      {
        id: "qualificationPrompt",
        name: "qualificationPrompt",
        label: "Reasoning Instructions",
        type: "textarea",
        defaultValue:
          "Analyze the business profile. If they lack a functional mobile-optimized website but hold a rating >= 4.0 and 50+ reviews, score above 85% and synthesize 3 high-impact value propositions.",
      },
    ],
    defaultData: {
      parameters: {
        model: "gemini-2.5-flash",
        minScoreThreshold: 80,
        qualificationPrompt:
          "Analyze the business profile. If they lack a functional mobile-optimized website but hold a rating >= 4.0 and 50+ reviews, score above 85%.",
      },
      defaultOutput: {
        aiScore: 94,
        priority: "high",
        status: "qualified",
        estimatedValue: 45000,
        reasons: [
          "Zero mobile website presence despite 142 stellar reviews (4.8 rating)",
          "High foot-traffic commercial zone (Coimbatore center)",
          "Immediate 3.4x ROI potential via direct online ordering and menu showcase",
        ],
        recommendedAngle: "Premium artisan bakery menu showcase with instant WhatsApp catering inquiry",
        confidence: 0.96,
      },
    },
  },

  ai_copywriter: {
    type: "ai_copywriter",
    name: "Synthetic Copy Synthesizer",
    category: "ai",
    description: "Generates tailored brand slogans, hero headlines, service tiers, and personalized outreach pitches.",
    iconName: "Edit3",
    badgeText: "Content Synthesizer",
    colorScheme: {
      bg: "bg-purple-500/10",
      border: "border-purple-500/30",
      text: "text-purple-500",
      accent: "#a855f7",
      glow: "rgba(168, 85, 247, 0.25)",
      headerBg: "bg-purple-500/15",
    },
    inputs: [{ id: "in", name: "Input", type: "main", label: "Business & Score Data" }],
    outputs: [{ id: "out", name: "Output", type: "main", label: "Synthesized Copy Pack" }],
    parameters: [
      {
        id: "tone",
        name: "tone",
        label: "Tone of Voice",
        type: "select",
        options: [
          { label: "Premium & Prestigious", value: "premium" },
          { label: "Warm & Artisanal", value: "artisanal" },
          { label: "Direct & High-Converting", value: "direct" },
        ],
        defaultValue: "premium",
      },
      {
        id: "language",
        name: "language",
        label: "Primary Language",
        type: "select",
        options: [
          { label: "English", value: "en" },
          { label: "Tamil (Transliterated / Bilingual)", value: "ta-en" },
        ],
        defaultValue: "en",
      },
    ],
    defaultData: {
      parameters: { tone: "premium", language: "en" },
      defaultOutput: {
        headline: "Handcrafted Flavors of Coimbatore, Baked Fresh Everyday",
        subheadline:
          "Experience sourdough bread, melt-in-mouth croissants, and artisan celebration cakes made from authentic heritage recipes.",
        callToAction: "Order Fresh Bakery Basket on WhatsApp",
        outreachMessage:
          "Vanakkam Kovai Bakery team! We noticed customers rave about your almond croissants (4.8★ on Google). We built a private, ultra-fast website preview for your bakery to showcase your menu and accept orders: https://kovai-bakery.vasaw.ai",
      },
    },
  },

  ai_website_agent: {
    type: "ai_website_agent",
    name: "Synthetic Website Builder",
    category: "ai",
    description: "Compiles a complete single-page Next.js & Tailwind website with modern UI, mobile responsiveness, and SEO tags.",
    iconName: "Layout",
    badgeText: "Next.js Builder Agent",
    colorScheme: {
      bg: "bg-purple-500/10",
      border: "border-purple-500/30",
      text: "text-purple-500",
      accent: "#a855f7",
      glow: "rgba(168, 85, 247, 0.25)",
      headerBg: "bg-purple-500/15",
    },
    inputs: [{ id: "in", name: "Input", type: "main", label: "Business Copy & Info" }],
    outputs: [{ id: "out", name: "Output", type: "main", label: "Built Website Bundle" }],
    parameters: [
      {
        id: "templateTheme",
        name: "templateTheme",
        label: "Design Template Theme",
        type: "select",
        options: [
          { label: "Culinary & Dining (Artisanal)", value: "culinary" },
          { label: "Modern B2B Corporate", value: "corporate" },
          { label: "Health, Spa & Wellness", value: "wellness" },
          { label: "Industrial & Manufacturing", value: "industrial" },
        ],
        defaultValue: "culinary",
      },
      {
        id: "includeWhatsappWidget",
        name: "includeWhatsappWidget",
        label: "Embed WhatsApp Click-to-Chat",
        type: "boolean",
        defaultValue: true,
      },
    ],
    defaultData: {
      parameters: { templateTheme: "culinary", includeWhatsappWidget: true },
      defaultOutput: {
        siteId: "site_kovai_bakery_881",
        businessSlug: "kovai-artisanal-bakery",
        bundleStatus: "compiled",
        filesGenerated: [
          "app/page.tsx",
          "app/layout.tsx",
          "components/hero.tsx",
          "components/menu-grid.tsx",
          "components/reviews.tsx",
          "components/location-map.tsx",
        ],
        previewTheme: {
          primaryColor: "#d97706",
          accentColor: "#fef3c7",
          font: "Plus Jakarta Sans",
        },
      },
    },
  },

  ai_website_qa: {
    type: "ai_website_qa",
    name: "Website QA Agent",
    category: "ai",
    description: "Checks a business website for SEO, accessibility, performance, and custom criteria, returning a detailed quality report.",
    iconName: "Search",
    badgeText: "QA Agent",
    colorScheme: {
      bg: "bg-indigo-500/10",
      border: "border-indigo-500/30",
      text: "text-indigo-500",
      accent: "#6366f1",
      glow: "rgba(99, 102, 241, 0.25)",
      headerBg: "bg-indigo-500/15",
    },
    inputs: [{ id: "in", name: "Input", type: "main", label: "URL and Config" }],
    outputs: [{ id: "out", name: "Output", type: "main", label: "QA Report" }],
    parameters: [
      {
        id: "url",
        name: "url",
        label: "Website URL",
        type: "text",
        defaultValue: "https://example.com",
      },
      {
        id: "config",
        name: "config",
        label: "QA Configuration",
        type: "json",
        defaultValue: JSON.stringify({
          viewport: "desktop",
          checkAccessibility: true,
          checkSEO: true,
          checkPerformance: true,
        }),
      },
    ],
    defaultData: {
      parameters: { url: "https://example.com", config: JSON.stringify({ viewport: "desktop", checkAccessibility: true, checkSEO: true, checkPerformance: true }) },
      defaultOutput: {
        report: {
          url: "https://example.com",
          timestamp: "2026-01-01T00:00:00.000Z",
          viewport: "desktop",
          passed: true,
          summary: { critical: 0, warning: 0, info: 0, total: 0 },
          issues: [],
        },
      },
    },
  },

  ai_website_analysis: {
    type: "ai_website_analysis",
    name: "QA Report Analyzer",
    category: "ai",
    description: "Analyzes a website QA report and determines pass/fail/warning status with recommendations.",
    iconName: "CheckCircle",
    badgeText: "Analyzer",
    colorScheme: {
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/30",
      text: "text-emerald-500",
      accent: "#10b981",
      glow: "rgba(16, 185, 129, 0.25)",
      headerBg: "bg-emerald-500/15",
    },
    inputs: [{ id: "in", name: "Input", type: "main", label: "QA Report" }],
    outputs: [{ id: "out", name: "Output", type: "main", label: "Analysis Result" }],
    parameters: [
      {
        id: "report",
        name: "report",
        label: "QA Report to Analyze",
        type: "json",
        defaultValue: JSON.stringify({
          url: "",
          timestamp: "",
          viewport: "desktop",
          passed: true,
          summary: { critical: 0, warning: 0, info: 0, total: 0 },
          issues: [],
        }),
      },
    ],
    defaultData: {
      parameters: { report: JSON.stringify({ url: "", timestamp: "", viewport: "desktop", passed: true, summary: { critical: 0, warning: 0, info: 0, total: 0 }, issues: [] }) },
      defaultOutput: {
        analysis: {
          result: "pass" as const,
          score: 100,
          summary: "Report passed all checks",
          recommendations: [],
        },
      },
    },
  },

  ai_classifier: {
    type: "ai_classifier",
    name: "AI Intent & Objection Classifier",
    category: "ai",
    description: "Analyzes incoming prospect messages to classify reply sentiment into Interested, Price Check, Call Request, or Not Interested.",
    iconName: "GitMerge",
    badgeText: "Intent Classifier",
    colorScheme: {
      bg: "bg-purple-500/10",
      border: "border-purple-500/30",
      text: "text-purple-500",
      accent: "#a855f7",
      glow: "rgba(168, 85, 247, 0.25)",
      headerBg: "bg-purple-500/15",
    },
    inputs: [{ id: "in", name: "Input", type: "main", label: "Inbound Message" }],
    outputs: [{ id: "out", name: "Output", type: "main", label: "Classified Intent" }],
    parameters: [
      {
        id: "confidenceCutoff",
        name: "confidenceCutoff",
        label: "Confidence Cutoff",
        type: "number",
        defaultValue: 0.85,
      },
    ],
    defaultData: {
      parameters: { confidenceCutoff: 0.85 },
      defaultOutput: {
        classification: "interested",
        confidence: 0.94,
        detectedNeeds: ["Online ordering integration", "Domain connection inquiry"],
        suggestedResponse: "Offer a 10-minute live demo or share pricing tiers.",
      },
    },
  },

  // --- INTEGRATIONS & ACTIONS ---
  action_apify_scraper: {
    type: "action_apify_scraper",
    name: "Apify Google Maps Scraper",
    category: "integration",
    description: "Runs the official Apify Google Maps actor to scrape verified addresses, phones, ratings, and opening hours.",
    iconName: "Search",
    badgeText: "Apify Actor API",
    colorScheme: {
      bg: "bg-blue-500/10",
      border: "border-blue-500/30",
      text: "text-blue-500",
      accent: "#3b82f6",
      glow: "rgba(59, 130, 246, 0.25)",
      headerBg: "bg-blue-500/15",
    },
    inputs: [{ id: "in", name: "Input", type: "main", label: "Trigger" }],
    outputs: [{ id: "out", name: "Output", type: "main", label: "Scraped Dataset" }],
    parameters: [
      {
        id: "actorId",
        name: "actorId",
        label: "Apify Actor Identifier",
        type: "text",
        defaultValue: "compass/crawler-google-places",
      },
      {
        id: "maxItems",
        name: "maxItems",
        label: "Max Locations per Run",
        type: "number",
        defaultValue: 20,
      },
      {
        id: "extractReviews",
        name: "extractReviews",
        label: "Extract Customer Reviews",
        type: "boolean",
        defaultValue: true,
      },
    ],
    defaultData: {
      parameters: {
        actorId: "compass/crawler-google-places",
        maxItems: 20,
        extractReviews: true,
      },
      defaultOutput: {
        runId: "apify_run_49184",
        status: "SUCCEEDED",
        itemsFetched: 20,
        datasetUrl: "https://api.apify.com/v2/datasets/dataset_8829/items",
        executionTimeSec: 8.4,
      },
    },
  },

  action_supabase_db: {
    type: "action_supabase_db",
    name: "Supabase DB Operations",
    category: "integration",
    description: "Performs idempotent upserts, status updates, and queries directly against your PostgreSQL database.",
    iconName: "Database",
    badgeText: "Supabase PostgreSQL",
    colorScheme: {
      bg: "bg-blue-500/10",
      border: "border-blue-500/30",
      text: "text-blue-500",
      accent: "#3b82f6",
      glow: "rgba(59, 130, 246, 0.25)",
      headerBg: "bg-blue-500/15",
    },
    inputs: [{ id: "in", name: "Input", type: "main", label: "Record Data" }],
    outputs: [{ id: "out", name: "Output", type: "main", label: "Saved Record" }],
    parameters: [
      {
        id: "table",
        name: "table",
        label: "Target Table",
        type: "select",
        options: [
          { label: "leads", value: "leads" },
          { label: "websites", value: "websites" },
          { label: "deployments", value: "deployments" },
          { label: "messages", value: "messages" },
          { label: "activities", value: "activities" },
        ],
        defaultValue: "leads",
      },
      {
        id: "operation",
        name: "operation",
        label: "Database Operation",
        type: "select",
        options: [
          { label: "Upsert (Merge by phone/placeId)", value: "upsert" },
          { label: "Update Status", value: "update" },
          { label: "Insert New", value: "insert" },
          { label: "Select Uncontacted", value: "select" },
        ],
        defaultValue: "upsert",
      },
    ],
    defaultData: {
      parameters: { table: "leads", operation: "upsert" },
      defaultOutput: {
        success: true,
        recordId: "lead-kovai-bakery-01",
        status: "qualified",
        action: "upserted",
        updatedAt: "2026-09-17T11:06:30.000Z",
      },
    },
  },

  action_github: {
    type: "action_github",
    name: "GitHub Repository Agent",
    category: "integration",
    description: "Initializes private or public GitHub repositories, commits generated Next.js code, and pushes branches.",
    iconName: "GitBranch",
    badgeText: "GitHub Octokit API",
    colorScheme: {
      bg: "bg-blue-500/10",
      border: "border-blue-500/30",
      text: "text-blue-500",
      accent: "#3b82f6",
      glow: "rgba(59, 130, 246, 0.25)",
      headerBg: "bg-blue-500/15",
    },
    inputs: [{ id: "in", name: "Input", type: "main", label: "Website Bundle" }],
    outputs: [{ id: "out", name: "Output", type: "main", label: "Repo Reference" }],
    parameters: [
      {
        id: "orgName",
        name: "orgName",
        label: "Owner / Organization",
        type: "text",
        defaultValue: "Sanjai-Gopal",
      },
      {
        id: "isPrivate",
        name: "isPrivate",
        label: "Private Repository",
        type: "boolean",
        defaultValue: true,
      },
      {
        id: "commitMessage",
        name: "commitMessage",
        label: "Commit Message",
        type: "text",
        defaultValue: "feat: synthesize bespoke Next.js website for {{businessName}}",
      },
    ],
    defaultData: {
      parameters: {
        orgName: "Sanjai-Gopal",
        isPrivate: true,
        commitMessage: "feat: synthesize bespoke Next.js website",
      },
      defaultOutput: {
        repoName: "kovai-artisanal-bakery-fac214d9",
        repoUrl: "https://github.com/Sanjai-Gopal/kovai-artisanal-bakery-fac214d9",
        commitSha: "a9f8c12e73bd4892c90",
        branch: "main",
        filesCommitted: 14,
      },
    },
  },

  action_vercel: {
    type: "action_vercel",
    name: "Vercel Production Deployer",
    category: "integration",
    description: "Triggers production builds on Vercel, monitors deployment status, and verifies the rendered live HTTPS URL.",
    iconName: "Globe",
    badgeText: "Vercel REST API",
    colorScheme: {
      bg: "bg-blue-500/10",
      border: "border-blue-500/30",
      text: "text-blue-500",
      accent: "#3b82f6",
      glow: "rgba(59, 130, 246, 0.25)",
      headerBg: "bg-blue-500/15",
    },
    inputs: [{ id: "in", name: "Input", type: "main", label: "GitHub Repo Ref" }],
    outputs: [{ id: "out", name: "Output", type: "main", label: "Live Verified URL" }],
    parameters: [
      {
        id: "teamId",
        name: "teamId",
        label: "Vercel Scope / Team ID",
        type: "text",
        defaultValue: "vasaw-ai",
      },
      {
        id: "framework",
        name: "framework",
        label: "Framework Preset",
        type: "select",
        options: [
          { label: "Next.js", value: "nextjs" },
          { label: "Vite / React", value: "vite" },
        ],
        defaultValue: "nextjs",
      },
      {
        id: "verifyLiveCheck",
        name: "verifyLiveCheck",
        label: "Verify HTTP 200 & Rendered HTML",
        type: "boolean",
        defaultValue: true,
      },
    ],
    defaultData: {
      parameters: { teamId: "vasaw-ai", framework: "nextjs", verifyLiveCheck: true },
      defaultOutput: {
        deploymentId: "dpl_883a90fka8912",
        status: "READY",
        liveUrl: "https://kovai-bakery-preview.vasaw.ai",
        buildTimeSec: 28,
        httpStatusCode: 200,
        domVerified: true,
      },
    },
  },

  action_whatsapp: {
    type: "action_whatsapp",
    name: "WhatsApp Outreach Agent",
    category: "integration",
    description: "Dispatches personalized WhatsApp template messages with interactive website preview buttons.",
    iconName: "MessageSquare",
    badgeText: "WhatsApp Cloud API",
    colorScheme: {
      bg: "bg-blue-500/10",
      border: "border-blue-500/30",
      text: "text-blue-500",
      accent: "#3b82f6",
      glow: "rgba(59, 130, 246, 0.25)",
      headerBg: "bg-blue-500/15",
    },
    inputs: [{ id: "in", name: "Input", type: "main", label: "Live Website & Pitch" }],
    outputs: [{ id: "out", name: "Output", type: "main", label: "Outreach Dispatch Result" }],
    parameters: [
      {
        id: "templateName",
        name: "templateName",
        label: "Message Template",
        type: "select",
        options: [
          { label: "Artisan Website Preview + Demo Link", value: "artisan_demo_pitch" },
          { label: "High-Rating Revenue Upgrade", value: "revenue_upgrade_v2" },
          { label: "Inactivity Follow-up Angle", value: "re_engagement_touch" },
        ],
        defaultValue: "artisan_demo_pitch",
      },
      {
        id: "rateLimitDelaySec",
        name: "rateLimitDelaySec",
        label: "Anti-Spam Delay Between Dispatches (sec)",
        type: "number",
        defaultValue: 15,
      },
    ],
    defaultData: {
      parameters: { templateName: "artisan_demo_pitch", rateLimitDelaySec: 15 },
      defaultOutput: {
        messageId: "wamid.HBgMOTE5ODQyMTg4NDAyFQIAERgSMz",
        recipientPhone: "+91 98421 88402",
        status: "delivered",
        deliveredAt: "2026-09-17T11:08:12.000Z",
        previewUrlIncluded: "https://kovai-bakery-preview.vasaw.ai",
      },
    },
  },

  action_resend_email: {
    type: "action_resend_email",
    name: "Automatic Email Dispatcher",
    category: "integration",
    description: "Dispatches personalized cold outreach emails automatically via Resend API with delivery tracking and Supabase logging.",
    iconName: "Mail",
    badgeText: "Resend / SMTP",
    colorScheme: {
      bg: "bg-blue-500/10",
      border: "border-blue-500/30",
      text: "text-blue-500",
      accent: "#3b82f6",
      glow: "rgba(59, 130, 246, 0.25)",
      headerBg: "bg-blue-500/15",
    },
    inputs: [{ id: "in", name: "Input", type: "main", label: "Lead & Copy Data" }],
    outputs: [{ id: "out", name: "Output", type: "main", label: "Email Dispatch Status" }],
    parameters: [
      {
        id: "to",
        name: "to",
        label: "Recipient Email",
        type: "text",
        defaultValue: "founder@kovaibakery.com",
        description: "Recipient email or dynamic tag like {{lead.email}}",
        required: true,
      },
      {
        id: "from",
        name: "from",
        label: "Sender Address",
        type: "text",
        defaultValue: "VASAW AI Growth <onboarding@resend.dev>",
        description: "Verified sender domain or Resend testing address",
        required: true,
      },
      {
        id: "subject",
        name: "subject",
        label: "Email Subject Line",
        type: "text",
        defaultValue: "Private Website Preview for {{businessName}} (4.8★ Google Rating)",
        required: true,
      },
      {
        id: "bodyHtml",
        name: "bodyHtml",
        label: "HTML Email Template",
        type: "textarea",
        defaultValue: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0;">
  <h2 style="color: #0f172a; margin-top: 0;">Elevating {{businessName}}'s Online Presence</h2>
  <p style="font-size: 15px; line-height: 1.6; color: #334155;">
    Hello team! We noticed your stellar 4.8★ rating on Google Maps with over 140+ glowing reviews in Coimbatore.
  </p>
  <p style="font-size: 15px; line-height: 1.6; color: #334155;">
    To help you capture direct orders and showcase your menu, our autonomous agent built a private, ultra-fast website preview for your brand:
  </p>
  <div style="margin: 28px 0; text-align: center;">
    <a href="{{liveUrl}}" style="background: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block;">
      View Your Live Website Preview &rarr;
    </a>
  </div>
  <p style="font-size: 13px; color: #64748b; line-height: 1.5;">
    Synthesized autonomously by VASAW AI Multi-Agent Pipeline. Reply to this email to claim your custom domain.
  </p>
</div>`,
      },
      {
        id: "apiKey",
        name: "apiKey",
        label: "Resend API Key Override (Optional)",
        type: "text",
        placeholder: "re_... (leave empty to use .env.local)",
      },
      {
        id: "autoDispatch",
        name: "autoDispatch",
        label: "Automatic Immediate Dispatch",
        type: "boolean",
        defaultValue: true,
      },
    ],
    defaultData: {
      parameters: {
        to: "founder@kovaibakery.com",
        from: "VASAW AI Growth <onboarding@resend.dev>",
        subject: "Private Website Preview for {{businessName}}",
        autoDispatch: true,
      },
      defaultOutput: {
        ok: true,
        messageId: "msg_resend_99214a",
        provider: "resend",
        to: "founder@kovaibakery.com",
        from: "VASAW AI Growth <onboarding@resend.dev>",
        status: "delivered",
        subject: "Private Website Preview for Kovai Artisanal Bakery",
        deliveredAt: "2026-09-17T12:00:00.000Z",
        deliveryLatencyMs: 240,
      },
    },
  },

  action_slack: {
    type: "action_slack",
    name: "Slack / Discord Telemetry Alert",
    category: "integration",
    description: "Dispatches rich message embeds and notification cards into team channels when milestones occur.",
    iconName: "Send",
    badgeText: "Slack Webhook",
    colorScheme: {
      bg: "bg-blue-500/10",
      border: "border-blue-500/30",
      text: "text-blue-500",
      accent: "#3b82f6",
      glow: "rgba(59, 130, 246, 0.25)",
      headerBg: "bg-blue-500/15",
    },
    inputs: [{ id: "in", name: "Input", type: "main", label: "Alert Context" }],
    outputs: [{ id: "out", name: "Output", type: "main", label: "Slack Response" }],
    parameters: [
      {
        id: "channel",
        name: "channel",
        label: "Target Channel",
        type: "text",
        defaultValue: "#vasaw-pipeline-wins",
      },
    ],
    defaultData: {
      parameters: { channel: "#vasaw-pipeline-wins" },
      defaultOutput: {
        ok: true,
        channel: "#vasaw-pipeline-wins",
        ts: "1726561800.002100",
      },
    },
  },

  action_http_request: {
    type: "action_http_request",
    name: "HTTP Request",
    category: "integration",
    description: "Performs any custom REST API call with configurable HTTP methods, authorization headers, and JSON body payload.",
    iconName: "Terminal",
    badgeText: "Custom REST",
    colorScheme: {
      bg: "bg-blue-500/10",
      border: "border-blue-500/30",
      text: "text-blue-500",
      accent: "#3b82f6",
      glow: "rgba(59, 130, 246, 0.25)",
      headerBg: "bg-blue-500/15",
    },
    inputs: [{ id: "in", name: "Input", type: "main", label: "Input" }],
    outputs: [{ id: "out", name: "Output", type: "main", label: "API Response" }],
    parameters: [
      {
        id: "url",
        name: "url",
        label: "Request URL",
        type: "text",
        defaultValue: "https://api.example.com/v1/sync",
      },
      {
        id: "method",
        name: "method",
        label: "Method",
        type: "select",
        options: [
          { label: "GET", value: "GET" },
          { label: "POST", value: "POST" },
          { label: "PUT", value: "PUT" },
          { label: "PATCH", value: "PATCH" },
        ],
        defaultValue: "POST",
      },
    ],
    defaultData: {
      parameters: { url: "https://api.example.com/v1/sync", method: "POST" },
      defaultOutput: {
        statusCode: 200,
        headers: { "content-type": "application/json" },
        data: { success: true, timestamp: "2026-09-17T11:09:00Z" },
      },
    },
  },

  // --- LOGIC & FLOW ---
  logic_if_condition: {
    type: "logic_if_condition",
    name: "IF Condition / Switch",
    category: "logic",
    description: "Evaluates rules and branches execution along True or False output pathways.",
    iconName: "GitFork",
    badgeText: "Branching Rule",
    colorScheme: {
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/30",
      text: "text-emerald-500",
      accent: "#10b981",
      glow: "rgba(16, 185, 129, 0.25)",
      headerBg: "bg-emerald-500/15",
    },
    inputs: [{ id: "in", name: "Input", type: "main", label: "Incoming Data" }],
    outputs: [
      { id: "true", name: "True", type: "branch", label: "Condition Met (True)" },
      { id: "false", name: "False", type: "branch", label: "Condition Not Met (False)" },
    ],
    parameters: [
      {
        id: "fieldPath",
        name: "fieldPath",
        label: "Evaluation Field Path",
        type: "text",
        defaultValue: "aiScore",
      },
      {
        id: "operator",
        name: "operator",
        label: "Operator",
        type: "select",
        options: [
          { label: ">= (Greater than or equal)", value: ">=" },
          { label: "== (Equals)", value: "==" },
          { label: "<= (Less than or equal)", value: "<=" },
          { label: "!= (Not equal)", value: "!=" },
          { label: "is null / empty", value: "isEmpty" },
        ],
        defaultValue: ">=",
      },
      {
        id: "compareValue",
        name: "compareValue",
        label: "Comparison Target Value",
        type: "text",
        defaultValue: "85",
      },
    ],
    defaultData: {
      parameters: { fieldPath: "aiScore", operator: ">=", compareValue: "85" },
      defaultOutput: {
        evaluatedCondition: "aiScore (94) >= 85",
        result: true,
        branchSelected: "true",
      },
    },
  },

  logic_code_js: {
    type: "logic_code_js",
    name: "Code / Function (JS)",
    category: "logic",
    description: "Executes custom JavaScript code to transform, clean, calculate, or enrich payloads.",
    iconName: "Code",
    badgeText: "JavaScript Node",
    colorScheme: {
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/30",
      text: "text-emerald-500",
      accent: "#10b981",
      glow: "rgba(16, 185, 129, 0.25)",
      headerBg: "bg-emerald-500/15",
    },
    inputs: [{ id: "in", name: "Input", type: "main", label: "Input Payload" }],
    outputs: [{ id: "out", name: "Output", type: "main", label: "Transformed Result" }],
    parameters: [
      {
        id: "codeScript",
        name: "codeScript",
        label: "JavaScript Script",
        type: "code",
        defaultValue: `// Transform input item
return {
  ...input,
  phoneNormalized: input.phone?.replace(/\\s+/g, ""),
  qualifiedDate: new Date().toISOString(),
  tier: input.aiScore >= 90 ? "TIER_1_VIP" : "TIER_2"
};`,
      },
    ],
    defaultData: {
      parameters: {
        codeScript:
          'return { ...input, phoneNormalized: input.phone?.replace(/\\s+/g, ""), tier: "TIER_1_VIP" };',
      },
      defaultOutput: {
        phoneNormalized: "+919842188402",
        tier: "TIER_1_VIP",
        processedTimestamp: "2026-09-17T11:09:40.000Z",
      },
    },
  },

  logic_deduplicate: {
    type: "logic_deduplicate",
    name: "Data Deduplicator & Clean",
    category: "logic",
    description: "Filters incoming leads using normalized phone numbers, Google Place IDs, or business addresses.",
    iconName: "Filter",
    badgeText: "Deduplication",
    colorScheme: {
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/30",
      text: "text-emerald-500",
      accent: "#10b981",
      glow: "rgba(16, 185, 129, 0.25)",
      headerBg: "bg-emerald-500/15",
    },
    inputs: [{ id: "in", name: "Input", type: "main", label: "Raw Leads" }],
    outputs: [{ id: "out", name: "Output", type: "main", label: "Unique Leads" }],
    parameters: [
      {
        id: "uniqueKey",
        name: "uniqueKey",
        label: "Deduplication Key",
        type: "select",
        options: [
          { label: "Normalized Phone Number", value: "phone" },
          { label: "Google Place ID", value: "placeId" },
          { label: "Business Name + City", value: "name_city" },
        ],
        defaultValue: "phone",
      },
    ],
    defaultData: {
      parameters: { uniqueKey: "phone" },
      defaultOutput: {
        inputCount: 20,
        duplicatesRemoved: 3,
        uniqueCount: 17,
        status: "deduped",
      },
    },
  },

  logic_delay: {
    type: "logic_delay",
    name: "Sleep / Rate Limit Delay",
    category: "logic",
    description: "Pauses workflow execution for a specified duration to comply with third-party rate limits.",
    iconName: "Timer",
    badgeText: "Delay Timer",
    colorScheme: {
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/30",
      text: "text-emerald-500",
      accent: "#10b981",
      glow: "rgba(16, 185, 129, 0.25)",
      headerBg: "bg-emerald-500/15",
    },
    inputs: [{ id: "in", name: "Input", type: "main", label: "Input" }],
    outputs: [{ id: "out", name: "Output", type: "main", label: "Resumed Signal" }],
    parameters: [
      {
        id: "delaySeconds",
        name: "delaySeconds",
        label: "Wait Duration (Seconds)",
        type: "number",
        defaultValue: 5,
      },
    ],
    defaultData: {
      parameters: { delaySeconds: 5 },
      defaultOutput: {
        waitedMs: 5000,
        resumedAt: "2026-09-17T11:10:05.000Z",
      },
    },
  },
};

// --- PRE-CONFIGURED DEFAULT WORKFLOWS ---
export const DEFAULT_FLOW_WORKFLOWS: FlowWorkflow[] = [
  {
    id: "wf-autonomous-email",
    name: "Autonomous Cold Email Outreach Pipeline",
    description:
      "Automated multi-agent execution: Google Maps Lead Discovery → Supabase Storage → Gemini 2.5 Opportunity Scorer → Synthetic Website Builder → Vercel Deploy Engine → Cold Email Dispatcher (Resend API) → Slack Alert.",
    category: "acquisition",
    active: true,
    runsCount: 3920,
    createdAt: "2026-09-02T08:00:00Z",
    updatedAt: "2026-09-17T12:00:00Z",
    lastExecution: {
      id: "exec-em-9912",
      status: "success",
      startedAt: "2026-09-17T12:10:00Z",
      durationMs: 1380,
      stepsCompleted: 7,
    },
    nodes: [
      {
        id: "em-node-1",
        type: "trigger_apify",
        name: "Google Maps Discovery Ingest",
        position: { x: 60, y: 220 },
        parameters: {
          searchLocation: "Coimbatore, Tamil Nadu",
          businessQuery: "Artisan Bakeries, Fine Dining",
          batchSize: 10,
        },
        status: "idle",
      },
      {
        id: "em-node-2",
        type: "action_supabase_db",
        name: "Supabase Lead Storage",
        position: { x: 380, y: 220 },
        parameters: { table: "leads", operation: "upsert" },
        status: "idle",
      },
      {
        id: "em-node-3",
        type: "ai_qualifier",
        name: "Gemini 2.5 Opportunity Scorer",
        position: { x: 700, y: 220 },
        parameters: { model: "gemini-2.5-flash", minScoreThreshold: 80 },
        status: "idle",
      },
      {
        id: "em-node-4",
        type: "ai_website_agent",
        name: "Synthetic Next.js Builder",
        position: { x: 1020, y: 220 },
        parameters: { templateTheme: "culinary", includeWhatsappWidget: true },
        status: "idle",
      },
      {
        id: "em-node-5",
        type: "action_vercel",
        name: "Vercel Production Deploy",
        position: { x: 1340, y: 220 },
        parameters: { framework: "nextjs", verifyLiveCheck: true },
        status: "idle",
      },
      {
        id: "em-node-6",
        type: "action_resend_email",
        name: "Automatic Email Dispatcher",
        position: { x: 1660, y: 220 },
        parameters: {
          to: "founder@kovaibakery.com",
          from: "VASAW AI Growth <onboarding@resend.dev>",
          subject: "Private Website Preview for {{businessName}}",
          autoDispatch: true,
        },
        status: "idle",
      },
      {
        id: "em-node-7",
        type: "action_slack",
        name: "Slack Telemetry Alert",
        position: { x: 1980, y: 220 },
        parameters: { channel: "#vasaw-email-outreach" },
        status: "idle",
      },
    ],
    connections: [
      { id: "em-c-1-2", fromNodeId: "em-node-1", fromPortId: "out", toNodeId: "em-node-2", toPortId: "in" },
      { id: "em-c-2-3", fromNodeId: "em-node-2", fromPortId: "out", toNodeId: "em-node-3", toPortId: "in" },
      { id: "em-c-3-4", fromNodeId: "em-node-3", fromPortId: "out", toNodeId: "em-node-4", toPortId: "in" },
      { id: "em-c-4-5", fromNodeId: "em-node-4", fromPortId: "out", toNodeId: "em-node-5", toPortId: "in" },
      { id: "em-c-5-6", fromNodeId: "em-node-5", fromPortId: "out", toNodeId: "em-node-6", toPortId: "in" },
      { id: "em-c-6-7", fromNodeId: "em-node-6", fromPortId: "out", toNodeId: "em-node-7", toPortId: "in" },
    ],
  },
  {
    id: "wf-vasaw-core",
    name: "VASAW Autonomous Acquisition Pipeline",
    description:
      "End-to-end multi-agent execution: Apify Google Maps Discovery → Supabase Upsert → Gemini AI Qualification → Synthetic Website Generation → GitHub Commit → Vercel Deployment → WhatsApp Outreach.",
    category: "acquisition",
    active: true,
    runsCount: 4820,
    createdAt: "2026-09-01T08:00:00Z",
    updatedAt: "2026-09-17T10:30:00Z",
    lastExecution: {
      id: "exec-9941",
      status: "success",
      startedAt: "2026-09-17T11:00:00Z",
      durationMs: 1420,
      stepsCompleted: 7,
    },
    nodes: [
      {
        id: "node-1",
        type: "trigger_apify",
        name: "Apify Maps Lead Ingest",
        position: { x: 60, y: 220 },
        parameters: {
          searchLocation: "Coimbatore, Tamil Nadu",
          businessQuery: "Artisan Bakeries, Cafes",
          batchSize: 10,
        },
        status: "success",
        executionTimeMs: 310,
        itemsCount: 10,
        outputData: {
          lead: {
            businessName: "Kovai Artisanal Bakery",
            phone: "+91 98421 88402",
            city: "Coimbatore",
            rating: 4.8,
            reviews: 142,
            hasWebsite: false,
          },
        },
      },
      {
        id: "node-2",
        type: "action_supabase_db",
        name: "Supabase Lead Storage",
        position: { x: 380, y: 220 },
        parameters: { table: "leads", operation: "upsert" },
        status: "success",
        executionTimeMs: 145,
        itemsCount: 10,
        outputData: {
          leadId: "lead_kovai_bakery_01",
          upserted: true,
          status: "scraped",
        },
      },
      {
        id: "node-3",
        type: "ai_qualifier",
        name: "Gemini 2.5 Opportunity Scorer",
        position: { x: 700, y: 220 },
        parameters: {
          model: "gemini-2.5-flash",
          minScoreThreshold: 80,
        },
        status: "success",
        executionTimeMs: 420,
        itemsCount: 1,
        outputData: {
          aiScore: 94,
          priority: "high",
          status: "qualified",
          estimatedValue: 45000,
          reasons: [
            "4.8 rating with 142 reviews, zero existing website",
            "High footfall commercial area",
            "Immediate WhatsApp ordering ROI",
          ],
        },
      },
      {
        id: "node-4",
        type: "ai_website_agent",
        name: "Synthetic Next.js Builder",
        position: { x: 1020, y: 220 },
        parameters: { templateTheme: "culinary", includeWhatsappWidget: true },
        status: "success",
        executionTimeMs: 510,
        itemsCount: 1,
        outputData: {
          siteId: "site_kovai_bakery",
          filesCount: 12,
          repoReady: true,
        },
      },
      {
        id: "node-5",
        type: "action_github",
        name: "GitHub Push Engine",
        position: { x: 1340, y: 220 },
        parameters: { orgName: "Sanjai-Gopal", isPrivate: true },
        status: "success",
        executionTimeMs: 230,
        itemsCount: 1,
        outputData: {
          repoUrl: "https://github.com/Sanjai-Gopal/kovai-artisanal-bakery-fac214d9",
          branch: "main",
          commitSha: "f8c92a10",
        },
      },
      {
        id: "node-6",
        type: "action_vercel",
        name: "Vercel Production Deploy",
        position: { x: 1660, y: 220 },
        parameters: { framework: "nextjs", verifyLiveCheck: true },
        status: "success",
        executionTimeMs: 640,
        itemsCount: 1,
        outputData: {
          liveUrl: "https://kovai-kitchen-fac214d9.vercel.app",
          httpStatus: 200,
          sslActive: true,
        },
      },
      {
        id: "node-7",
        type: "action_whatsapp",
        name: "WhatsApp Pitch Dispatch",
        position: { x: 1980, y: 220 },
        parameters: { templateName: "artisan_demo_pitch" },
        status: "success",
        executionTimeMs: 180,
        itemsCount: 1,
        outputData: {
          messageStatus: "delivered",
          to: "+91 98421 88402",
          liveUrlSent: "https://kovai-kitchen-fac214d9.vercel.app",
        },
      },
    ],
    connections: [
      { id: "c-1-2", fromNodeId: "node-1", fromPortId: "out", toNodeId: "node-2", toPortId: "in" },
      { id: "c-2-3", fromNodeId: "node-2", fromPortId: "out", toNodeId: "node-3", toPortId: "in" },
      { id: "c-3-4", fromNodeId: "node-3", fromPortId: "out", toNodeId: "node-4", toPortId: "in" },
      { id: "c-4-5", fromNodeId: "node-4", fromPortId: "out", toNodeId: "node-5", toPortId: "in" },
      { id: "c-5-6", fromNodeId: "node-5", fromPortId: "out", toNodeId: "node-6", toPortId: "in" },
      { id: "c-6-7", fromNodeId: "node-6", fromPortId: "out", toNodeId: "node-7", toPortId: "in" },
    ],
  },
  {
    id: "wf-high-fit",
    name: "High-Fit Prospect Fast-Track",
    description:
      "Webhook Ingestion → Gemini Lead Qualification → IF Score >= 90 → Instant Vercel Prototype Deploy → Slack SDR Notification.",
    category: "enrichment",
    active: true,
    runsCount: 3120,
    createdAt: "2026-09-05T10:00:00Z",
    updatedAt: "2026-09-17T09:15:00Z",
    lastExecution: {
      id: "exec-8821",
      status: "success",
      startedAt: "2026-09-17T10:15:00Z",
      durationMs: 820,
      stepsCompleted: 5,
    },
    nodes: [
      {
        id: "hf-node-1",
        type: "trigger_webhook",
        name: "Inbound Lead Webhook",
        position: { x: 100, y: 220 },
        parameters: { path: "/api/v1/webhook/leads", method: "POST" },
        status: "idle",
      },
      {
        id: "hf-node-2",
        type: "ai_qualifier",
        name: "Gemini Fit Scorer",
        position: { x: 420, y: 220 },
        parameters: { model: "gemini-2.5-flash", minScoreThreshold: 85 },
        status: "idle",
      },
      {
        id: "hf-node-3",
        type: "logic_if_condition",
        name: "Fit >= 90 Branch",
        position: { x: 740, y: 220 },
        parameters: { fieldPath: "aiScore", operator: ">=", compareValue: "90" },
        status: "idle",
      },
      {
        id: "hf-node-4",
        type: "action_vercel",
        name: "Instant Vercel Deploy",
        position: { x: 1080, y: 120 },
        parameters: { framework: "nextjs", verifyLiveCheck: true },
        status: "idle",
      },
      {
        id: "hf-node-5",
        type: "action_slack",
        name: "Slack SDR Channel Alert",
        position: { x: 1400, y: 120 },
        parameters: { channel: "#vasaw-vip-leads" },
        status: "idle",
      },
      {
        id: "hf-node-6",
        type: "action_supabase_db",
        name: "Standard Database Save",
        position: { x: 1080, y: 340 },
        parameters: { table: "leads", operation: "upsert" },
        status: "idle",
      },
    ],
    connections: [
      { id: "hf-c-1-2", fromNodeId: "hf-node-1", fromPortId: "out", toNodeId: "hf-node-2", toPortId: "in" },
      { id: "hf-c-2-3", fromNodeId: "hf-node-2", fromPortId: "out", toNodeId: "hf-node-3", toPortId: "in" },
      { id: "hf-c-3-4", fromNodeId: "hf-node-3", fromPortId: "true", toNodeId: "hf-node-4", toPortId: "in" },
      { id: "hf-c-4-5", fromNodeId: "hf-node-4", fromPortId: "out", toNodeId: "hf-node-5", toPortId: "in" },
      { id: "hf-c-3-6", fromNodeId: "hf-node-3", fromPortId: "false", toNodeId: "hf-node-6", toPortId: "in" },
    ],
  },
  {
    id: "wf-nightly-inactive",
    name: "Nightly Inactivity Re-engagement",
    description:
      "Scheduled Cron (Weekdays 9:00 AM) → Supabase Query Unreplied Leads → AI Re-angle Copy Synthesizer → WhatsApp Touchpoint.",
    category: "outreach",
    active: true,
    runsCount: 1490,
    createdAt: "2026-09-10T14:00:00Z",
    updatedAt: "2026-09-17T08:00:00Z",
    nodes: [
      {
        id: "ni-node-1",
        type: "trigger_cron",
        name: "Weekdays 9:00 AM Cron",
        position: { x: 120, y: 220 },
        parameters: { cronExpression: "0 9 * * 1-5" },
        status: "idle",
      },
      {
        id: "ni-node-2",
        type: "action_supabase_db",
        name: "Query 4-Day Inactive Leads",
        position: { x: 440, y: 220 },
        parameters: { table: "leads", operation: "select" },
        status: "idle",
      },
      {
        id: "ni-node-3",
        type: "ai_copywriter",
        name: "Contextual Re-angle Synthesizer",
        position: { x: 760, y: 220 },
        parameters: { tone: "direct" },
        status: "idle",
      },
      {
        id: "ni-node-4",
        type: "action_whatsapp",
        name: "WhatsApp Follow-up Dispatch",
        position: { x: 1080, y: 220 },
        parameters: { templateName: "re_engagement_touch" },
        status: "idle",
      },
    ],
    connections: [
      { id: "ni-c-1-2", fromNodeId: "ni-node-1", fromPortId: "out", toNodeId: "ni-node-2", toPortId: "in" },
      { id: "ni-c-2-3", fromNodeId: "ni-node-2", fromPortId: "out", toNodeId: "ni-node-3", toPortId: "in" },
      { id: "ni-c-3-4", fromNodeId: "ni-node-3", fromPortId: "out", toNodeId: "ni-node-4", toPortId: "in" },
    ],
  },
];

// Helper to simulate single node execution or test runs
type SimulatedNodeOutput = Record<string, unknown> & {
  _meta: {
    executedAt: string;
    durationMs: number;
    nodeId: string;
    nodeType: string;
    mode: "local_mock";
  };
};

export function simulateNodeExecution(
  node: FlowNode,
  inputData?: Record<string, unknown>
): { outputData: SimulatedNodeOutput; executionTimeMs: number; logs: ExecutionLog[] } {
  const def = NODE_TYPE_REGISTRY[node.type];
  const executionTimeMs = Math.floor(Math.random() * 220) + 120;
  const timestamp = new Date().toISOString();
  const sampleOutput = def?.defaultData.defaultOutput || {};

  const mockOutput: Record<string, unknown> =
    def?.category === "integration" || def?.category === "trigger"
      ? {
          previewOnly: true,
          previewMessage: "Sample result only. No external service was contacted.",
          sampleData: sampleOutput,
        }
      : { ...sampleOutput };

  if (node.type === "logic_if_condition") {
    const fieldPath = String(node.parameters.fieldPath || "");
    const actualValue = fieldPath
      .split(".")
      .filter(Boolean)
      .reduce<unknown>((value, key) => {
        if (!value || typeof value !== "object") return undefined;
        return (value as Record<string, unknown>)[key];
      }, inputData);
    const operator = String(node.parameters.operator || ">=");
    const expectedValue = node.parameters.compareValue;
    const leftNumber = Number(actualValue);
    const rightNumber = Number(expectedValue);
    const canCompareNumbers =
      actualValue !== undefined &&
      actualValue !== null &&
      String(actualValue).trim() !== "" &&
      Number.isFinite(leftNumber) &&
      Number.isFinite(rightNumber);
    const result =
      operator === "isEmpty"
        ? actualValue === undefined || actualValue === null || actualValue === ""
        : operator === ">="
        ? canCompareNumbers && leftNumber >= rightNumber
        : operator === "<="
        ? canCompareNumbers && leftNumber <= rightNumber
        : operator === "=="
        ? canCompareNumbers
          ? leftNumber === rightNumber
          : String(actualValue) === String(expectedValue)
        : operator === "!="
        ? String(actualValue) !== String(expectedValue)
        : false;

    mockOutput.evaluatedCondition = `${fieldPath || "(empty field)"} ${operator} ${String(expectedValue)}`;
    mockOutput.result = result;
    mockOutput.branchSelected = result ? "true" : "false";
  }

  mockOutput._meta = {
    executedAt: timestamp,
    durationMs: executionTimeMs,
    nodeId: node.id,
    nodeType: node.type,
    mode: "local_mock",
  };

  const logs: ExecutionLog[] = [
    {
      id: `log-${Date.now()}-1`,
      nodeId: node.id,
      nodeName: node.name,
      timestamp,
      level: "info",
      message: `Previewing ${def?.name || node.name} with local sample data...`,
      durationMs: 40,
    },
    {
      id: `log-${Date.now()}-2`,
      nodeId: node.id,
      nodeName: node.name,
      timestamp,
      level: "success",
      message: `Local sample preview generated in ${executionTimeMs}ms. No integration request was sent.`,
      durationMs: executionTimeMs,
      dataSnippet: JSON.stringify(mockOutput).slice(0, 120) + "...",
    },
  ];

  return { outputData: mockOutput as SimulatedNodeOutput, executionTimeMs, logs };
}
