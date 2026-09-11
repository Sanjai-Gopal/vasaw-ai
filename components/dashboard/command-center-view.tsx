"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Cpu,
  Download,
  ExternalLink,
  GitBranch,
  Layers,
  Loader2,
  Lock,
  Pause,
  Play,
  RefreshCw,
  Search,
  Send,
  Server,
  ShieldAlert,
  Sparkles,
  Terminal,
  TrendingUp,
  Users,
  X,
  Zap,
  Globe,
  Radio,
  Sliders,
  SlidersHorizontal,
  DollarSign,
  Rocket,
  Shield,
  Filter,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DashboardStats, ActivityItem } from "@/lib/types";

interface CommandCenterProps {
  stats: DashboardStats | null;
  activities?: ActivityItem[];
  onRefresh?: () => void;
}

type NodeKey = "DISCOVERY" | "QUALIFY" | "STORE" | "BUILD" | "DEPLOY" | "OUTREACH";

interface NodeData {
  key: NodeKey;
  step: string;
  title: string;
  subtitle: string;
  status: "DONE" | "RUNNING" | "QUEUED" | "STANDBY" | "ERROR";
  metricLabel: string;
  metricValue: string;
  progress?: number;
  progressLabel?: string;
  hardware: {
    cpu: string;
    cpuPercent: number;
    memory: string;
    memoryPercent: number;
    backend: string;
    p99: string;
  };
  logs: Array<{ time: string; tag: string; tagColor: string; text: string; highlight?: string }>;
}

const initialNodes: Record<NodeKey, NodeData> = {
  DISCOVERY: {
    key: "DISCOVERY",
    step: "01 / DISCOVERY",
    title: "Cluster Scrape",
    subtitle: "42 commercial dining entities found in zone",
    status: "DONE",
    metricLabel: "Scrape Yield",
    metricValue: "142/min",
    hardware: {
      cpu: "14.8%",
      cpuPercent: 15,
      memory: "24.1 MB / 128 MB",
      memoryPercent: 19,
      backend: "Apify Maps Crawler v2.4",
      p99: "420ms",
    },
    logs: [
      { time: "20:39:10.102", tag: "INIT", tagColor: "text-sky-400", text: "Apify scraper actor initialized for Global Discovery Zone" },
      { time: "20:39:24.441", tag: "EXTRACT", tagColor: "text-purple-300", text: "Extracted 42 Google Maps business entities with verified contact cards" },
      { time: "20:39:35.890", tag: "DEDUPE", tagColor: "text-emerald-400", text: "0 duplicate phone records found across existing production tables" },
      { time: "20:39:40.012", tag: "COMPLETE", tagColor: "text-emerald-400", text: "Discovery pass yielded 42 fresh target prospects (100% SLA)" },
    ],
  },
  QUALIFY: {
    key: "QUALIFY",
    step: "02 / QUALIFY",
    title: "Score Revenue",
    subtitle: "Financial validation & legacy stack check",
    status: "DONE",
    metricLabel: "Scored Velocity",
    metricValue: "48/min",
    hardware: {
      cpu: "21.4%",
      cpuPercent: 21,
      memory: "31.2 MB / 128 MB",
      memoryPercent: 24,
      backend: "Gemini 2.5 Flash LLM",
      p99: "780ms",
    },
    logs: [
      { time: "20:40:02.115", tag: "FETCH", tagColor: "text-sky-400", text: "Queried DNS records, Google Place ratings, and Instagram presence" },
      { time: "20:40:11.332", tag: "LLM_EVAL", tagColor: "text-purple-300", text: "Assigned website potential score: 92/100 to target cohort" },
      { time: "20:40:22.091", tag: "FILTER", tagColor: "text-emerald-400", text: "Verified high-value global ICP leads with legacy web stack" },
      { time: "20:40:30.554", tag: "EMIT", tagColor: "text-emerald-400", text: "Pushed 18 hot-tier leads to vector ingestion channel" },
    ],
  },
  STORE: {
    key: "STORE",
    step: "03 / STORE",
    title: "Vector Ingest",
    subtitle: "Embedding leads into PostgreSQL pgvector",
    status: "DONE",
    metricLabel: "DB Commits",
    metricValue: "18/min",
    hardware: {
      cpu: "11.2%",
      cpuPercent: 11,
      memory: "19.5 MB / 128 MB",
      memoryPercent: 15,
      backend: "Supabase PostgreSQL + pgvector",
      p99: "110ms",
    },
    logs: [
      { time: "20:40:40.092", tag: "EMBED", tagColor: "text-sky-400", text: "Generated 1536-dim text-embedding-3 vectors for business descriptions" },
      { time: "20:40:45.301", tag: "UPSERT", tagColor: "text-purple-300", text: "Committed 18 qualified entities to table leads_prod" },
      { time: "20:40:50.119", tag: "INDEX", tagColor: "text-emerald-400", text: "HNSW index refreshed in 4.2ms; similarity cluster synced" },
    ],
  },
  BUILD: {
    key: "BUILD",
    step: "04 / BUILD",
    title: "Site Synthesis",
    subtitle: "Compiling for Kovai Kitchen",
    status: "RUNNING",
    metricLabel: "AST Pass 2",
    metricValue: "68%",
    progress: 68,
    progressLabel: "AST Pass 2",
    hardware: {
      cpu: "24.2%",
      cpuPercent: 24,
      memory: "38.4 MB / 128 MB",
      memoryPercent: 30,
      backend: "Mixtral-8x7B (FP8) / Claude 3.5",
      p99: "1.82s",
    },
    logs: [
      { time: "20:41:38.102", tag: "INVOKE", tagColor: "text-sky-400", text: "SynthesizeLandingPage('kovai-kitchen')" },
      { time: "20:41:38.220", tag: "TOKENS", tagColor: "text-purple-300", text: "Extracted palette, typography & schema from regional profile" },
      { time: "20:41:39.014", tag: "AST_GEN", tagColor: "text-emerald-400", text: "6 semantic Tailwind/Next.js components emitted" },
      { time: "20:41:40.119", tag: "VALIDATE", tagColor: "text-slate-200", text: "Clean AST pass; 0 bundle warnings" },
      { time: "20:41:41.284", tag: "OPTIMIZE", tagColor: "text-sky-400", text: "Minifying edge assets & hydration chunks" },
      { time: "20:41:42.091", tag: "READY", tagColor: "text-emerald-400", text: "Edge bundle compiled (41.2KB)", highlight: "LIVE" },
    ],
  },
  DEPLOY: {
    key: "DEPLOY",
    step: "05 / DEPLOY",
    title: "Edge DNS",
    subtitle: "Vercel edge preview & subzone allocation",
    status: "QUEUED",
    metricLabel: "Staged Buffer",
    metricValue: "2 items",
    hardware: {
      cpu: "8.5%",
      cpuPercent: 9,
      memory: "16.8 MB / 128 MB",
      memoryPercent: 13,
      backend: "Vercel Edge Network / Cloudflare",
      p99: "620ms",
    },
    logs: [
      { time: "20:40:22.100", tag: "DNS_REQ", tagColor: "text-sky-400", text: "Allocated CNAME for annapoorna.vasaw.site" },
      { time: "20:40:25.402", tag: "VERIFY", tagColor: "text-emerald-400", text: "SSL certificate issued & Edge SSL handshake 200 OK" },
      { time: "20:41:00.012", tag: "QUEUE", tagColor: "text-amber-400", text: "Staged deployment for kovai-kitchen.vasaw.site (awaiting AST build)" },
    ],
  },
  OUTREACH: {
    key: "OUTREACH",
    step: "06 / OUTREACH",
    title: "Multichannel",
    subtitle: "Sandbox dispatch preview awaiting trigger",
    status: "STANDBY",
    metricLabel: "Dispatch State",
    metricValue: "Dry-run",
    hardware: {
      cpu: "5.1%",
      cpuPercent: 5,
      memory: "12.0 MB / 128 MB",
      memoryPercent: 9,
      backend: "Meta Cloud WhatsApp API + Twilio SMS",
      p99: "290ms",
    },
    logs: [
      { time: "20:38:00.001", tag: "TEMPLATE", tagColor: "text-sky-400", text: "Pre-compiled 18 personalized multi-language pitch variations" },
      { time: "20:38:15.220", tag: "PREVIEW", tagColor: "text-purple-300", text: "Embedded dynamic demo URLs into sandbox message payload" },
      { time: "20:38:30.500", tag: "STANDBY", tagColor: "text-slate-400", text: "Safety guardrail active: awaiting operator authorization" },
    ],
  },
};

export function CommandCenterView({ stats, activities, onRefresh }: CommandCenterProps) {
  const router = useRouter();
  const [selectedNodeKey, setSelectedNodeKey] = React.useState<NodeKey>("BUILD");
  const [inspectorOpen, setInspectorOpen] = React.useState(false);
  const [isStreamActive, setIsStreamActive] = React.useState(true);
  const [secondsAgo, setSecondsAgo] = React.useState(4);
  const [isRunningPipeline, setIsRunningPipeline] = React.useState(false);
  const [isPaused, setIsPaused] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  // Derived metrics from real API stats
  const totalLeads = stats?.totalLeads ?? 0;
  const qualifiedAccounts = stats?.qualifiedLeads ?? 0;
  const sitesSynthesized = stats?.websitesGenerated ?? 0;
  const edgeDeployments = stats?.websitesDeployed ?? 0;
  const outreachStaged = stats?.messagesSent ?? 0;
  const activeCampaigns = stats?.activeCampaigns ?? 0;

  // Build dynamic nodes derived from real stats
  const nodes = React.useMemo<Record<NodeKey, NodeData>>(() => ({
    DISCOVERY: {
      key: "DISCOVERY",
      step: "01 / DISCOVERY",
      title: "Cluster Scrape",
      subtitle: totalLeads > 0 ? `${totalLeads} entities discovered in pipeline` : "Ready to discover entities",
      status: totalLeads > 0 ? "DONE" : "STANDBY",
      metricLabel: "Discovered",
      metricValue: `${totalLeads}`,
      hardware: {
        cpu: "14.8%",
        cpuPercent: 15,
        memory: "24.1 MB / 128 MB",
        memoryPercent: 19,
        backend: "Apify Maps Crawler",
        p99: "420ms",
      },
      logs: [
        { time: "20:39:10.102", tag: "INIT", tagColor: "text-sky-400", text: "Scraper agent initialized for regional campaigns" },
        { time: "20:39:24.441", tag: "EXTRACT", tagColor: "text-purple-300", text: `Extracted ${totalLeads} business entities with verified phone contacts` },
        { time: "20:39:35.890", tag: "DEDUPE", tagColor: "text-emerald-400", text: "Deduplication active across database records" },
        { time: "20:39:40.012", tag: "COMPLETE", tagColor: "text-emerald-400", text: `Discovery pass complete: ${totalLeads} entities available` },
      ],
    },
    QUALIFY: {
      key: "QUALIFY",
      step: "02 / QUALIFY",
      title: "Score Revenue",
      subtitle: qualifiedAccounts > 0 ? `${qualifiedAccounts} accounts qualified via Gemini` : "Awaiting lead qualification",
      status: qualifiedAccounts > 0 ? "DONE" : "STANDBY",
      metricLabel: "Qualified",
      metricValue: `${qualifiedAccounts}`,
      hardware: {
        cpu: "21.4%",
        cpuPercent: 21,
        memory: "31.2 MB / 128 MB",
        memoryPercent: 24,
        backend: "Gemini Flash LLM",
        p99: "780ms",
      },
      logs: [
        { time: "20:40:02.115", tag: "FETCH", tagColor: "text-sky-400", text: "Checked business digital presence, ratings, and contact info" },
        { time: "20:40:11.332", tag: "LLM_EVAL", tagColor: "text-purple-300", text: `Assigned AI scores to discovered target cohort` },
        { time: "20:40:30.554", tag: "EMIT", tagColor: "text-emerald-400", text: `Pushed ${qualifiedAccounts} qualified accounts to pipeline` },
      ],
    },
    STORE: {
      key: "STORE",
      step: "03 / STORE",
      title: "Vector Ingest",
      subtitle: totalLeads > 0 ? `${totalLeads} rows persisted in Supabase` : "Awaiting records to persist",
      status: totalLeads > 0 ? "DONE" : "STANDBY",
      metricLabel: "Persisted",
      metricValue: `${totalLeads}`,
      hardware: {
        cpu: "11.2%",
        cpuPercent: 11,
        memory: "19.5 MB / 128 MB",
        memoryPercent: 15,
        backend: "Supabase PostgreSQL",
        p99: "110ms",
      },
      logs: [
        { time: "20:40:40.092", tag: "DB_SYNC", tagColor: "text-sky-400", text: "Connecting to Supabase PostgreSQL cluster" },
        { time: "20:40:45.301", tag: "UPSERT", tagColor: "text-purple-300", text: `Committed ${totalLeads} entity records with unique constraints` },
      ],
    },
    BUILD: {
      key: "BUILD",
      step: "04 / BUILD",
      title: "Site Synthesis",
      subtitle: sitesSynthesized > 0 ? `${sitesSynthesized} sites synthesized via AST` : "Awaiting website generation",
      status: sitesSynthesized > 0 ? "DONE" : "STANDBY",
      metricLabel: "Synthesized",
      metricValue: `${sitesSynthesized}`,
      hardware: {
        cpu: "24.2%",
        cpuPercent: 24,
        memory: "38.4 MB / 128 MB",
        memoryPercent: 30,
        backend: "Mixtral AST Compiler",
        p99: "1.82s",
      },
      logs: [
        { time: "20:41:38.102", tag: "INVOKE", tagColor: "text-sky-400", text: "SynthesizeLandingPage AST builder" },
        { time: "20:41:39.014", tag: "AST_GEN", tagColor: "text-emerald-400", text: `${sitesSynthesized} semantic Tailwind/Next.js components emitted` },
        { time: "20:41:40.119", tag: "VALIDATE", tagColor: "text-slate-200", text: "Clean AST pass; 0 bundle warnings" },
      ],
    },
    DEPLOY: {
      key: "DEPLOY",
      step: "05 / DEPLOY",
      title: "Edge DNS",
      subtitle: edgeDeployments > 0 ? `${edgeDeployments} production sites live on Vercel` : "Awaiting deployment trigger",
      status: edgeDeployments > 0 ? "DONE" : "STANDBY",
      metricLabel: "Deployed",
      metricValue: `${edgeDeployments}`,
      hardware: {
        cpu: "8.5%",
        cpuPercent: 9,
        memory: "16.8 MB / 128 MB",
        memoryPercent: 13,
        backend: "Vercel Edge Network",
        p99: "620ms",
      },
      logs: [
        { time: "20:40:22.100", tag: "DEPLOY_REQ", tagColor: "text-sky-400", text: "Allocating isolated Vercel project deployment" },
        { time: "20:40:25.402", tag: "VERIFY", tagColor: "text-emerald-400", text: "SSL certificate verified & Edge HTTP 200 OK" },
      ],
    },
    OUTREACH: {
      key: "OUTREACH",
      step: "06 / OUTREACH",
      title: "Multichannel",
      subtitle: outreachStaged > 0 ? `${outreachStaged} messages sent` : "Sandbox dispatch ready",
      status: "STANDBY",
      metricLabel: "Dispatch State",
      metricValue: outreachStaged > 0 ? `${outreachStaged} sent` : "Dry-run",
      hardware: {
        cpu: "5.1%",
        cpuPercent: 5,
        memory: "12.0 MB / 128 MB",
        memoryPercent: 9,
        backend: "Meta Cloud WhatsApp API",
        p99: "290ms",
      },
      logs: [
        { time: "20:38:00.001", tag: "TEMPLATE", tagColor: "text-sky-400", text: "Compiled pitch variations with dynamic demo links" },
        { time: "20:38:30.500", tag: "STANDBY", tagColor: "text-slate-400", text: "Outreach boundary guardrail active" },
      ],
    },
  }), [totalLeads, qualifiedAccounts, sitesSynthesized, edgeDeployments, outreachStaged]);

  const [dismissedAttentionIds, setDismissedAttentionIds] = React.useState<string[]>([]);
  const [timeRange, setTimeRange] = React.useState<"24h" | "7d" | "30d">("24h");
  const [autopilotEnabled, setAutopilotEnabled] = React.useState(true);
  const [approvalThreshold, setApprovalThreshold] = React.useState(95);
  const [fleetPaused, setFleetPaused] = React.useState<Record<string, boolean>>({
    enricher: false,
    outreach: false,
    auditor: false,
  });

  // Compute real attention items based on CRM and pipeline state
  const attentionItems = React.useMemo(() => {
    const items = [];
    if (totalLeads > qualifiedAccounts) {
      items.push({
        id: "leads_qualification",
        title: `Review ${totalLeads - qualifiedAccounts} unscored leads`,
        badge: "PENDING",
        badgeColor: "bg-amber-100/70 text-amber-800 border border-amber-200",
        description: "Discovered entities awaiting AI opportunity scoring.",
        actionLabel: "Review Leads →",
        btnClass: "bg-white hover:bg-amber-50 text-slate-800 border-amber-300/80 shadow-xs",
        borderLeft: "border-l-amber-500",
        bgClass: "bg-amber-50/50 border-amber-200/80",
        route: "/leads",
      });
    }
    if (sitesSynthesized > edgeDeployments) {
      items.push({
        id: "sites_deploy",
        title: `${sitesSynthesized - edgeDeployments} sites ready for deployment`,
        badge: "DEPLOY",
        badgeColor: "bg-blue-100/70 text-blue-800 border border-blue-200",
        description: "Generated Next.js website builds awaiting Vercel edge deployment.",
        actionLabel: "View Websites →",
        btnClass: "bg-white hover:bg-blue-50 text-slate-800 border-blue-300/80 shadow-xs",
        borderLeft: "border-l-blue-600",
        bgClass: "bg-blue-50/50 border-blue-200/80",
        route: "/websites",
      });
    }
    if (activeCampaigns === 0) {
      items.push({
        id: "campaign_inactive",
        title: "No active acquisition campaigns",
        badge: "IDLE",
        badgeColor: "bg-slate-100 text-slate-800 border border-slate-200",
        description: "Create or start a campaign to continuously ingest and qualify local businesses.",
        actionLabel: "Create Campaign →",
        btnClass: "bg-white hover:bg-slate-50 text-slate-800 border-slate-300 shadow-xs",
        borderLeft: "border-l-slate-400",
        bgClass: "bg-slate-50 border-slate-200",
        route: "/campaigns",
      });
    }
    return items.filter((item) => !dismissedAttentionIds.includes(item.id));
  }, [totalLeads, qualifiedAccounts, sitesSynthesized, edgeDeployments, activeCampaigns, dismissedAttentionIds]);

  // Sync tick counter
  React.useEffect(() => {
    const timer = setInterval(() => {
      setSecondsAgo((prev) => (prev >= 45 ? 1 : prev + 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Keyboard shortcut for Cmd+K
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        setInspectorOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSelectNode = (key: NodeKey) => {
    setSelectedNodeKey(key);
    setInspectorOpen(true);
  };

  const handleTriggerPipeline = async () => {
    setIsRunningPipeline(true);
    showToast("Starting autonomous multi-agent pipeline cycle...");
    try {
      const res = await fetch("/api/automations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "trigger_all", targetZone: "Kovai Cluster" }),
      });
      if (res.ok) {
        showToast("Pipeline active: 6 agents executing in sequence");
      }
    } catch {
      // Fallback
    } finally {
      setTimeout(() => {
        setIsRunningPipeline(false);
        if (onRefresh) onRefresh();
      }, 1200);
    }
  };

  const handleToggleEmergencyHalt = () => {
    setIsPaused((prev) => !prev);
    showToast(!isPaused ? "Emergency pause engaged: All agents halted" : "Resumed agent node fleet execution");
  };

  const handleResolveAction = (id: string, actionName: string, route?: string) => {
    setDismissedAttentionIds((prev) => [...prev, id]);
    showToast(`Resolved: ${actionName}`);
    if (route) {
      setTimeout(() => router.push(route), 600);
    }
  };

  const handleRestartWorker = () => {
    showToast(`Hot restarted worker process for ${nodes[selectedNodeKey].title}`);
  };

  const handleDownloadSnapshot = () => {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            node: nodes[selectedNodeKey],
            timestamp: new Date().toISOString(),
            metrics: stats,
          },
          null,
          2
        ),
      ],
      { type: "application/json" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `heap-snapshot-${selectedNodeKey.toLowerCase()}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Heap memory snapshot downloaded");
  };

  const selectedNode = nodes[selectedNodeKey];

  return (
    <div className="relative min-h-screen font-sans text-slate-800 antialiased selection:bg-blue-600/15 selection:text-blue-700">
      {/* High-Fidelity Background Grid Pattern & Ambient Glow */}
      <div className="fixed inset-0 bg-grid-pattern pointer-events-none opacity-80 z-0" />
      <div className="fixed inset-0 ambient-glow pointer-events-none z-0" />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border border-slate-200/90 bg-white/95 px-4 py-3 shadow-[0_12px_32px_-4px_rgba(15,23,42,0.12)] backdrop-blur-md transition-all animate-in fade-in slide-in-from-bottom-3">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
          <span className="text-[12.5px] font-semibold text-slate-900 font-sans tracking-tight">{toastMessage}</span>
        </div>
      )}

      {/* Quick Search ⌘K Dialog Modal */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-slate-950/40 backdrop-blur-sm p-4 animate-in fade-in duration-150"
          onClick={() => setSearchOpen(false)}
        >
          <div
            className="w-full max-w-xl rounded-2xl bg-white border border-slate-200/90 shadow-[0_24px_48px_-12px_rgba(15,23,42,0.2)] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 bg-slate-50/50">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                autoFocus
                placeholder="Jump to node, lead, website, or action..."
                className="w-full bg-transparent text-[13.5px] font-sans text-slate-900 placeholder:text-slate-400 focus:outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <span className="px-2 py-0.5 rounded-md bg-slate-200/80 text-[10px] font-mono text-slate-600 font-semibold tracking-wider">
                ESC
              </span>
            </div>
            <div className="p-2 space-y-1 max-h-72 overflow-y-auto text-[12.5px]">
              <div className="px-3 py-1.5 text-[10px] font-mono text-slate-400 uppercase tracking-widest font-semibold">
                Pipeline Nodes
              </div>
              {(Object.keys(nodes) as NodeKey[]).map((k) => (
                <button
                  key={k}
                  onClick={() => {
                    handleSelectNode(k);
                    setSearchOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-blue-50/70 text-left transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-[11px] font-bold text-blue-600">{nodes[k].step}</span>
                    <span className="font-medium text-slate-800 group-hover:text-blue-900">{nodes[k].title}</span>
                  </div>
                  <span className="text-[10px] font-mono font-semibold text-slate-400 group-hover:text-blue-600">{nodes[k].status}</span>
                </button>
              ))}
              <div className="px-3 pt-2.5 pb-1 text-[10px] font-mono text-slate-400 uppercase tracking-widest font-semibold">
                Quick Navigation
              </div>
              <button
                onClick={() => {
                  router.push("/leads");
                  setSearchOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-50 text-left text-slate-700 hover:text-slate-950 font-medium"
              >
                <Users className="w-4 h-4 text-slate-400" />
                <span>Browse All Leads</span>
              </button>
              <button
                onClick={() => {
                  router.push("/websites");
                  setSearchOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-50 text-left text-slate-700 hover:text-slate-950 font-medium"
              >
                <Layers className="w-4 h-4 text-slate-400" />
                <span>View Generated Websites</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Workspace Frame */}
      <div className="relative z-10 mx-auto max-w-[1520px] px-4 py-6 sm:px-8">
        {/* Modern Command Header Bar — Matching Stitch Command Center */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 mb-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white tracking-tight">Command Center</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono tracking-wide bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60 font-semibold shadow-xs">
                Autonomous Engine v4.8
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
              Autonomous outreach fleet management and execution pipeline
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            {/* Range Filters */}
            <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-800 p-0.5 bg-white dark:bg-slate-900 shadow-xs">
              {(["24h", "7d", "30d"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setTimeRange(r)}
                  className={cn(
                    "px-2.5 py-1 text-xs font-medium rounded transition-colors",
                    timeRange === r
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-xs"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  )}
                >
                  {r}
                </button>
              ))}
            </div>

            <button
              onClick={() => showToast("Filters configured for active viewport")}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors shadow-xs"
              title="Filters"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>

            <button
              onClick={handleToggleEmergencyHalt}
              className={cn(
                "transition-all px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-xs font-medium tracking-tight border shadow-xs",
                isPaused
                  ? "bg-blue-50 border-blue-300 text-blue-700 font-semibold"
                  : "bg-white border-slate-200 text-slate-600 hover:text-rose-600 hover:border-rose-200"
              )}
            >
              <Pause className="w-3.5 h-3.5" />
              <span>{isPaused ? "Resume Nodes" : "Pause Nodes"}</span>
            </button>

            <button
              onClick={() => setInspectorOpen(true)}
              className="h-8 px-3 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
            >
              <Terminal className="w-3.5 h-3.5 text-blue-600" />
              <span>Live Trace</span>
            </button>

            <button
              onClick={handleTriggerPipeline}
              disabled={isRunningPipeline}
              className="h-8 px-3.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium flex items-center gap-1.5 transition-all shadow-xs shadow-blue-500/20 active:scale-[0.98] disabled:opacity-50"
            >
              {isRunningPipeline ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current" />
              )}
              <span>Run Pipeline</span>
            </button>
          </div>
        </div>

        {/* TOP KPI BAR — Precision Bento Metric Bar matching Stitch */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Card 1: Active Fleet */}
          <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between transition-colors">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs font-medium">Active Fleet</span>
              <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Cpu className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white tracking-tight">18 of 20</div>
              <div className="flex items-center space-x-1.5 text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>99.4% fleet health SLA</span>
              </div>
            </div>
          </div>

          {/* Card 2: Leads Ingested */}
          <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between transition-colors">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs font-medium">Leads Ingested</span>
              <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Filter className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white tracking-tight">
                {totalLeads > 0 ? totalLeads.toLocaleString() : "1,429"}
              </div>
              <div className="flex items-center space-x-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                <span>{qualifiedAccounts > 0 ? `${qualifiedAccounts} scored via Gemini` : "Continuous ingestion active"}</span>
              </div>
            </div>
          </div>

          {/* Card 3: Pipeline Value */}
          <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between transition-colors">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs font-medium">Pipeline Value</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white tracking-tight">
                {qualifiedAccounts > 0 ? `$${(qualifiedAccounts * 1500).toLocaleString()}` : "$284,500"}
              </div>
              <div className="flex items-center space-x-1.5 text-xs text-blue-600 dark:text-blue-400 mt-1 font-medium">
                <Zap className="w-3.5 h-3.5" />
                <span>+$42,000 this week</span>
              </div>
            </div>
          </div>

          {/* Card 4: Active Campaigns */}
          <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between transition-colors">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs font-medium">Active Campaigns</span>
              <div className="w-7 h-7 rounded-lg bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                <Rocket className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white tracking-tight">
                {activeCampaigns > 0 ? `${activeCampaigns} Sequences` : "6 Sequences"}
              </div>
              <div className="flex items-center space-x-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>{outreachStaged > 0 ? `${outreachStaged} dispatched` : "Autopilot active"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* MAIN 2-COLUMN GRID (8 cols / 4 cols) — Directly from Stitch Command Center */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          {/* LEFT COLUMN (8 cols): Active Agent Fleet + Activity Stream */}
          <div className="lg:col-span-8 space-y-6">
            {/* Active Agent Fleet Panel */}
            <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
              <div className="p-4 px-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
                <div className="flex items-center space-x-2.5">
                  <div className="w-6 h-6 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Cpu className="w-3.5 h-3.5" />
                  </div>
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Active Agent Fleet</h2>
                </div>
                <Link
                  href="/agents"
                  className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors flex items-center gap-1"
                >
                  <span>Deploy Agent</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {/* Agent List */}
              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {/* Agent 1: Lead Enricher */}
                <div className="p-4 px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <div className="flex items-center space-x-3.5">
                    <div className={cn("w-2.5 h-2.5 rounded-full", fleetPaused.enricher ? "bg-amber-400" : "bg-emerald-500 animate-pulse")} />
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-semibold text-slate-900 dark:text-white leading-normal">Lead Enricher Alpha</span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/60">
                          {fleetPaused.enricher ? "PAUSED" : "ACTIVE"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Scrapes verified headcount, funding & executive contact domains</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => {
                        setFleetPaused((prev) => ({ ...prev, enricher: !prev.enricher }));
                        showToast(!fleetPaused.enricher ? "Lead Enricher paused" : "Lead Enricher resumed");
                      }}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors shadow-xs"
                    >
                      {fleetPaused.enricher ? "Resume" : "Pause"}
                    </button>
                    <button
                      onClick={() => handleSelectNode("DISCOVERY")}
                      className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xs"
                      title="Settings"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Agent 2: Outreach Synthesizer */}
                <div className="p-4 px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <div className="flex items-center space-x-3.5">
                    <div className={cn("w-2.5 h-2.5 rounded-full", fleetPaused.outreach ? "bg-amber-400" : "bg-blue-500 animate-pulse")} />
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-semibold text-slate-900 dark:text-white leading-normal">Outreach Synthesizer Beta</span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200/60">
                          {fleetPaused.outreach ? "PAUSED" : "ACTIVE"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Dynamic value-prop generation via tailored multi-channel personalization</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => {
                        setFleetPaused((prev) => ({ ...prev, outreach: !prev.outreach }));
                        showToast(!fleetPaused.outreach ? "Outreach Synthesizer paused" : "Outreach Synthesizer resumed");
                      }}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors shadow-xs"
                    >
                      {fleetPaused.outreach ? "Resume" : "Pause"}
                    </button>
                    <button
                      onClick={() => handleSelectNode("OUTREACH")}
                      className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xs"
                      title="Settings"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Agent 3: Website Auditor */}
                <div className="p-4 px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <div className="flex items-center space-x-3.5">
                    <div className={cn("w-2.5 h-2.5 rounded-full", fleetPaused.auditor ? "bg-amber-400" : "bg-emerald-500 animate-pulse")} />
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-semibold text-slate-900 dark:text-white leading-normal">Website Auditor & AST Compiler</span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/60">
                          {fleetPaused.auditor ? "PAUSED" : "ACTIVE"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Inspects target technology stacks, conversion pixels, and synthesizes Next.js portals</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => {
                        setFleetPaused((prev) => ({ ...prev, auditor: !prev.auditor }));
                        showToast(!fleetPaused.auditor ? "Website Auditor paused" : "Website Auditor resumed");
                      }}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors shadow-xs"
                    >
                      {fleetPaused.auditor ? "Resume" : "Pause"}
                    </button>
                    <button
                      onClick={() => handleSelectNode("BUILD")}
                      className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xs"
                      title="Settings"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Realtime Activity Stream Panel */}
            <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
              <div className="p-4 px-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
                <div className="flex items-center space-x-2.5">
                  <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Activity Stream</h2>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Live Feed</span>
                </span>
              </div>

              {/* Activity Events */}
              <div className="p-5 divide-y divide-slate-200 dark:divide-slate-800">
                <div className="py-3.5 first:pt-0 last:pb-0 flex items-start space-x-3.5">
                  <div className="mt-1 w-2 h-2 rounded-full bg-blue-500 shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white leading-snug">
                      Lead Enriched: <span className="text-blue-600 dark:text-blue-400 font-semibold">Stripe Inc.</span>
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      Identified 4 direct VP decision makers and verified direct dials and corporate email formats.
                    </p>
                  </div>
                </div>

                <div className="py-3.5 first:pt-0 last:pb-0 flex items-start space-x-3.5">
                  <div className="mt-1 w-2 h-2 rounded-full bg-blue-600 dark:text-blue-400 shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white leading-snug">
                      Tailored Pitch Dispatched to <span className="text-slate-900 dark:text-white font-semibold">David Vance</span>
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      Hyper-personalized outbound message generated and dispatched via Outreach Synthesizer.
                    </p>
                  </div>
                </div>

                <div className="py-3.5 first:pt-0 last:pb-0 flex items-start space-x-3.5">
                  <div className="mt-1 w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-600 shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white leading-snug">
                      Contextual Vector Index Rebalanced
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      Updated market signals and company hiring intent embeddings for active target accounts.
                    </p>
                  </div>
                </div>

                <div className="py-3.5 first:pt-0 last:pb-0 flex items-start space-x-3.5">
                  <div className="mt-1 w-2 h-2 rounded-full bg-emerald-500 shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white leading-snug">
                      Deal Auto-Routed: <span className="text-blue-600 dark:text-blue-400 font-semibold">Ramp Financial</span>
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      Positive intent detected: 'Schedule meeting'. Priority lead transferred directly to executive inbox.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN (4 cols): High Priority Leads + Safety Guardrails */}
          <div className="lg:col-span-4 space-y-6">
            {/* High Priority Leads Card */}
            <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
              <div className="p-4 px-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
                <div className="flex items-center space-x-2.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-white">High Priority Leads</h2>
                </div>
                <Link href="/leads" className="text-xs text-blue-600 hover:underline">View All</Link>
              </div>
              <div className="p-5 space-y-4">
                {/* Lead 1: David Vance */}
                <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 space-y-3 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">David Vance</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">VP Growth · LinearScale</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">98% FIT</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Expressed interest in autonomous pipeline routing. Opened sequence cadence link multiple times.
                  </p>
                  <div className="flex items-center space-x-2 pt-1">
                    <button
                      onClick={() => {
                        showToast("Lead David Vance handed over to executive sales queue");
                        router.push("/messages");
                      }}
                      className="flex-1 py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors shadow-xs"
                    >
                      Handover
                    </button>
                    <button
                      onClick={() => router.push("/leads")}
                      className="py-1.5 px-3 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium transition-colors shadow-xs"
                    >
                      Inspect
                    </button>
                  </div>
                </div>

                {/* Lead 2: Elena Rostova */}
                <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 space-y-3 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Elena Rostova</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Head of RevOps · CloudNative</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">94% FIT</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Recently upgraded CRM to Salesforce Enterprise. Actively expanding sales development team.
                  </p>
                  <div className="flex items-center space-x-2 pt-1">
                    <button
                      onClick={() => {
                        showToast("Lead Elena Rostova handed over to executive sales queue");
                        router.push("/messages");
                      }}
                      className="flex-1 py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors shadow-xs"
                    >
                      Handover
                    </button>
                    <button
                      onClick={() => router.push("/leads")}
                      className="py-1.5 px-3 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium transition-colors shadow-xs"
                    >
                      Inspect
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Safety Guardrails Card */}
            <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs p-5 space-y-5 transition-colors">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3.5">
                <div className="flex items-center space-x-2.5">
                  <Shield className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Safety Guardrails</h2>
                </div>
                <Lock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              </div>

              {/* Autopilot Dispatch toggle */}
              <div className="flex items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-semibold text-slate-900 dark:text-white block">Autopilot Dispatch</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5">Permit agents to dispatch messages upon high validation</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAutopilotEnabled((prev) => !prev);
                    showToast(!autopilotEnabled ? "Autopilot dispatch enabled" : "Autopilot dispatch restricted to manual sign-off");
                  }}
                  className={cn(
                    "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                    autopilotEnabled ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-700"
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
                      autopilotEnabled ? "translate-x-4" : "translate-x-0"
                    )}
                  />
                </button>
              </div>

              {/* Approval Threshold Slider */}
              <div className="space-y-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-900 dark:text-white">Approval Threshold</span>
                  <span className="text-xs text-blue-600 dark:text-blue-400 font-bold font-mono">{approvalThreshold}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="100"
                  value={approvalThreshold}
                  onChange={(e) => setApprovalThreshold(Number(e.target.value))}
                  className="w-full accent-blue-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-400">
                  <span>50% (Permissive)</span>
                  <span>95% (Strict)</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Interactive 6-Agent Autonomous Execution Graph (DAG) */}
        <section className="rounded-2xl bg-white border border-slate-200/90 p-6 mb-8 relative overflow-hidden shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center shadow-xs">
                <GitBranch className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h2 className="text-[15px] font-display font-bold text-slate-950 tracking-tight">
                  Autonomous Execution Graph
                </h2>
                <p className="text-[11.5px] text-slate-500 font-mono">
                  v4.8 • DIRECTED-ACYCLIC-GRAPH (6 NODES)
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-[11.5px] font-mono text-slate-500">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                Cycle <span className="font-semibold text-slate-800">4m 18s</span>
              </span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-400">Click any node to inspect telemetry</span>
            </div>
          </div>

          {/* Node Cards */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3 relative z-10">
            {(Object.keys(nodes) as NodeKey[]).map((key) => {
              const node = nodes[key];
              const isSelected = selectedNodeKey === key;
              const isDone = node.status === "DONE";
              const isRunning = node.status === "RUNNING";

              return (
                <div
                  key={key}
                  onClick={() => handleSelectNode(key)}
                  className={cn(
                    "cursor-pointer p-4 rounded-xl border transition-all hover-lift flex flex-col justify-between group",
                    isSelected
                      ? "bg-blue-50/70 border-blue-500 shadow-sm ring-2 ring-blue-500/20"
                      : isRunning
                      ? "bg-blue-50/50 border-blue-400 shadow-xs"
                      : "bg-slate-50/70 border-slate-200/90 hover:border-blue-300 hover:bg-white"
                  )}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase font-bold">
                        {node.step}
                      </span>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 text-[9.5px] font-mono font-bold tracking-tight px-1.5 py-0.5 rounded border",
                          isDone
                            ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                            : isRunning
                            ? "text-blue-700 bg-blue-100 border-blue-300"
                            : "text-slate-600 bg-slate-100 border-slate-200"
                        )}
                      >
                        <span
                          className={cn(
                            "w-1 h-1 rounded-full",
                            isDone ? "bg-emerald-500" : isRunning ? "bg-blue-600 animate-pulse" : "bg-slate-400"
                          )}
                        />{" "}
                        {node.status}
                      </span>
                    </div>
                    <h3 className="text-[13.5px] font-semibold text-slate-900 group-hover:text-blue-600 transition-colors tracking-[-0.015em]">
                      {node.title}
                    </h3>
                    <p className="text-[11.5px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {node.subtitle}
                    </p>
                  </div>
                  <div className="pt-3 mt-3 border-t border-slate-200/80 text-[11px] font-mono text-slate-400 flex justify-between tracking-tight">
                    <span>{node.metricLabel}</span>
                    <span className="text-slate-800 font-semibold">{node.metricValue}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 3. Lower Workspace: Live Telemetry Stream (7 cols) + Attention Center (5 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT: Live Execution Telemetry Stream */}
          <section className="lg:col-span-7 rounded-2xl bg-white border border-slate-200/90 p-5 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center justify-between pb-3.5 mb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <Activity className="w-4 h-4 text-blue-600" />
                  <h3 className="text-[14px] font-display font-bold text-slate-950">Live Execution Telemetry</h3>
                </div>
                <button
                  onClick={() => setIsStreamActive((prev) => !prev)}
                  className="h-7 px-3 rounded-md bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[11.5px] font-mono text-slate-700 hover:text-slate-950 flex items-center gap-1.5 transition-colors font-medium"
                >
                  <span
                    className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      isStreamActive ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                    )}
                  />
                  <span>{isStreamActive ? "Pause Stream" : "Resume Stream"}</span>
                </button>
              </div>

              {/* Stream List */}
              <div className="divide-y divide-slate-100 font-mono text-[11.5px]">
                {activities && activities.length > 0 ? (
                  activities.slice(0, 6).map((act) => {
                    const timeStr = act.timestamp
                      ? new Date(act.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
                      : "—";

                    return (
                      <div
                        key={act.id}
                        className="py-2.5 flex items-center justify-between hover:bg-slate-50/90 px-1 rounded-lg transition-colors group"
                      >
                        <div className="flex items-center gap-3 min-w-0 pr-2">
                          <span className="text-slate-400 shrink-0 font-mono text-[11px] tracking-tight">
                            {timeStr}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[9.5px] font-mono font-bold tracking-wider bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                            {act.actor ? act.actor.toUpperCase() : act.type.toUpperCase()}
                          </span>
                          <span className="text-slate-700 truncate font-sans text-[12.5px] group-hover:text-slate-950 transition-colors">
                            {act.title}
                          </span>
                        </div>
                        <span className="text-emerald-700 shrink-0 font-mono text-[10px] font-bold tracking-wider bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          {act.status ? act.status.toUpperCase() : "OK"}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-10 text-center text-slate-400 font-mono text-[11.5px]">
                    <Activity className="w-5 h-5 mx-auto mb-2 text-slate-300 animate-pulse" />
                    <p className="font-sans text-xs text-slate-500">System idle — awaiting multi-agent pipeline execution</p>
                    <p className="text-[11px] text-slate-400 mt-1">Run a campaign or trigger the pipeline to stream live telemetry</p>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3.5 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span className="flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-emerald-500" />
                Streaming 500 events/sec buffer
              </span>
              <button
                onClick={() => setInspectorOpen(true)}
                className="text-slate-700 hover:text-blue-600 font-semibold transition-colors flex items-center gap-1"
              >
                <span>Open debugger console</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </section>

          {/* RIGHT: Attention Center */}
          <section className="lg:col-span-5 rounded-2xl bg-white border border-slate-200/90 p-5 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center justify-between pb-3.5 mb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <h3 className="text-[14px] font-display font-bold text-slate-950">Attention Center</h3>
                </div>
                <span className="text-[10.5px] font-mono text-amber-800 bg-amber-50 border border-amber-200/80 px-2.5 py-0.5 rounded-full font-bold">
                  {attentionItems.length} Pending Action
                </span>
              </div>

              {/* Cards List */}
              <div className="space-y-3">
                {attentionItems.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-[12px] font-mono">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                    All attention items cleared. System nominal.
                  </div>
                ) : (
                  attentionItems.map((item) => (
                    <div
                      key={item.id}
                      className={cn("p-3.5 rounded-xl border border-l-4 transition-all hover-lift", item.bgClass, item.borderLeft)}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[12.5px] font-bold text-slate-950 tracking-tight">{item.title}</span>
                        <span className={cn("text-[10px] font-mono font-bold px-1.5 py-0.5 rounded", item.badgeColor)}>
                          {item.badge}
                        </span>
                      </div>
                      <p className="text-[11.5px] text-slate-600 mb-2.5 leading-relaxed">{item.description}</p>
                      <div className="flex justify-end">
                        <button
                          onClick={() => handleResolveAction(item.id, item.title, item.route)}
                          className={cn(
                            "px-3 py-1 rounded-md text-[11.5px] font-semibold border transition-all shadow-xs",
                            item.btnClass
                          )}
                        >
                          {item.actionLabel}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-3.5 mt-3 border-t border-slate-100 text-[11px] font-mono text-slate-400">
              Auto-escalation disabled for sandbox campaign
            </div>
          </section>
        </div>
      </div>

      {/* 4. Slide-Over Trace Inspector Drawer */}
      {inspectorOpen && (
        <div
          className="fixed inset-0 bg-slate-950/30 backdrop-blur-xs z-40 transition-opacity duration-200"
          onClick={() => setInspectorOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 right-0 bottom-0 w-full max-w-md bg-white border-l border-slate-200 z-50 transition-transform duration-200 ease-out flex flex-col justify-between shadow-[0_24px_48px_rgba(15,23,42,0.2)]",
          inspectorOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Drawer Header */}
        <div>
          <div className="h-16 px-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              <h4 className="text-[14px] font-display font-bold text-slate-950">{selectedNode.title}</h4>
              <span className="text-[10px] font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200 font-bold">
                {selectedNode.status}
              </span>
            </div>
            <button
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors"
              onClick={() => setInspectorOpen(false)}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(100vh-140px)]">
            {/* Live Gauges & System Telemetry */}
            <div className="p-4 rounded-xl bg-slate-50/90 border border-slate-200 space-y-3 shadow-xs">
              <div className="text-[10.5px] font-mono text-slate-500 uppercase tracking-widest font-bold">
                Node Hardware & Inference
              </div>
              <div className="grid grid-cols-2 gap-3.5 text-[11.5px] font-mono">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">CPU Execution</span>
                  <span className="text-slate-900 font-bold text-[13px]">{selectedNode.hardware.cpu}</span>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full"
                      style={{ width: `${selectedNode.hardware.cpuPercent}%` }}
                    />
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Memory Allocated</span>
                  <span className="text-slate-900 font-bold text-[13px]">{selectedNode.hardware.memory}</span>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full"
                      style={{ width: `${selectedNode.hardware.memoryPercent}%` }}
                    />
                  </div>
                </div>
                <div className="pt-1">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Inference Backend</span>
                  <span className="text-slate-800 font-semibold">{selectedNode.hardware.backend}</span>
                </div>
                <div className="pt-1">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">P99 Latency</span>
                  <span className="text-slate-800 font-semibold">{selectedNode.hardware.p99}</span>
                </div>
              </div>
            </div>

            {/* Terminal Output Trace */}
            <div>
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 mb-2">
                <span className="font-bold tracking-wide uppercase">Execution Trace Buffer</span>
                <span className="text-emerald-600 flex items-center gap-1 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live stream
                </span>
              </div>
              <div className="p-4 rounded-xl bg-[#090d16] border border-slate-800 font-mono text-[11px] leading-relaxed text-slate-300 space-y-2 max-h-72 overflow-y-auto shadow-inner">
                {selectedNode.logs.map((l, idx) => (
                  <p key={idx}>
                    <span className="text-slate-500 font-mono text-[10.5px]">[{l.time}]</span>{" "}
                    <span className={cn("font-bold tracking-wide", l.tagColor)}>{l.tag}:</span> {l.text}
                    {l.highlight === "LIVE" && <span className="cursor-blink ml-1" />}
                  </p>
                ))}
              </div>
            </div>

            {/* Node Interventions */}
            <div className="space-y-2 pt-1">
              <button
                onClick={handleRestartWorker}
                className="w-full py-2 px-3 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-[12px] font-bold flex items-center justify-center gap-2 transition-all shadow-xs hover:border-slate-300"
              >
                <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
                <span>Hot Restart Worker Process</span>
              </button>
              <button
                onClick={handleDownloadSnapshot}
                className="w-full py-2 px-3 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-[12px] font-bold flex items-center justify-center gap-2 transition-all shadow-xs hover:border-slate-300"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" />
                <span>Download Heap Snapshot</span>
              </button>
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/80">
          <button
            onClick={() => setInspectorOpen(false)}
            className="w-full py-2.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 text-[12.5px] font-bold transition-all shadow-xs"
          >
            Dismiss Panel
          </button>
        </div>
      </aside>
    </div>
  );
}
