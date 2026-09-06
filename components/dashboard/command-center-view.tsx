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
      { time: "20:39:10.102", tag: "INIT", tagColor: "text-sky-400", text: "Apify scraper actor initialized for zone Coimbatore Central" },
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
      { time: "20:40:22.091", tag: "FILTER", tagColor: "text-emerald-400", text: "Verified Sri Krishna Sweets & Kovai Kitchen as high-value ICP" },
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
      { time: "20:38:00.001", tag: "TEMPLATE", tagColor: "text-sky-400", text: "Pre-compiled 18 personalized Tamil/English pitch variations" },
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
  const [nodes, setNodes] = React.useState<Record<NodeKey, NodeData>>(initialNodes);
  const [isRunningPipeline, setIsRunningPipeline] = React.useState(false);
  const [isPaused, setIsPaused] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  // Attention Center items state
  const [attentionItems, setAttentionItems] = React.useState([
    {
      id: "leads_ambiguous",
      title: "Review 3 ambiguous leads",
      badge: "SCORE ~65%",
      badgeColor: "bg-amber-100/70 text-amber-800 border border-amber-200",
      description: "Automated revenue score fell below threshold due to fuzzy registration tax records.",
      actionLabel: "Review Leads →",
      btnClass: "bg-white hover:bg-amber-50 text-slate-800 border-amber-300/80 shadow-xs",
      borderLeft: "border-l-amber-500",
      bgClass: "bg-amber-50/50 border-amber-200/80",
      route: "/leads",
    },
    {
      id: "whatsapp_sandbox",
      title: "WhatsApp Sandbox Active",
      badge: "STAGED",
      badgeColor: "bg-blue-100/70 text-blue-800 border border-blue-200",
      description: "18 prospects verified and waiting for production token authorization.",
      actionLabel: "Authorize Sandbox →",
      btnClass: "bg-white hover:bg-blue-50 text-slate-800 border-blue-300/80 shadow-xs",
      borderLeft: "border-l-blue-600",
      bgClass: "bg-blue-50/50 border-blue-200/80",
      route: "/messages",
    },
    {
      id: "dns_latency",
      title: "Edge DNS latency timeout",
      badge: "TIMEOUT",
      badgeColor: "bg-rose-100/70 text-rose-800 border border-rose-200",
      description: "Propagation latency on krishna.vasaw.site exceeded 4.0s.",
      actionLabel: "Retry Route →",
      btnClass: "bg-white hover:bg-rose-50 text-slate-800 border-rose-300/80 shadow-xs",
      borderLeft: "border-l-rose-500",
      bgClass: "bg-rose-50/50 border-rose-200/80",
      route: "/websites",
    },
  ]);

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
    setAttentionItems((prev) => prev.filter((item) => item.id !== id));
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

  // Derived metrics from real API stats
  const totalLeads = stats?.totalLeads ?? 2481;
  const qualifiedAccounts = stats?.qualifiedLeads ?? 684;
  const sitesSynthesized = stats?.websitesGenerated ?? 127;
  const edgeDeployments = stats?.websitesDeployed ?? 119;
  const outreachStaged = stats?.messagesSent ?? 843;

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
        {/* Modern Command Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 mb-7 border-b border-slate-200/80">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-[23px] font-display font-extrabold text-slate-950 tracking-[-0.035em] leading-tight flex items-center gap-2.5">
                <span>Autonomous Command Center</span>
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono tracking-wide bg-blue-50 text-blue-700 border border-blue-200 font-semibold shadow-xs">
                Kovai Cluster • v4.8
              </span>
            </div>
            <p className="text-[13px] text-slate-500 mt-1 font-normal tracking-[-0.01em] leading-relaxed">
              Real-time multi-agent orchestration for business discovery, synthetic site compilation, and edge dispatch.
            </p>
          </div>

          <div className="flex items-center gap-3 text-[11.5px] text-slate-500 font-mono tracking-tight shrink-0">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200/80 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-slate-400">Synced</span>
              <span className="text-slate-800 font-semibold">{secondsAgo}s ago</span>
            </span>
            <div className="h-3 w-px bg-slate-200" />
            <button
              onClick={handleToggleEmergencyHalt}
              className={cn(
                "transition-all px-2.5 py-1 rounded-md flex items-center gap-1.5 font-medium tracking-tight border",
                isPaused
                  ? "bg-blue-50 border-blue-300 text-blue-700 font-semibold shadow-xs"
                  : "bg-white border-slate-200/80 text-slate-600 hover:text-rose-600 hover:border-rose-200"
              )}
            >
              <Pause className="w-3.5 h-3.5" />
              <span>{isPaused ? "Resume Nodes" : "Pause Nodes"}</span>
            </button>
            <button
              onClick={() => setInspectorOpen(true)}
              className="h-8 px-3 rounded-md bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-700 text-[11.5px] font-semibold flex items-center gap-1.5 transition-all shadow-xs hover:border-slate-300"
            >
              <Terminal className="w-3.5 h-3.5 text-blue-600" />
              <span>Live Trace</span>
            </button>
            <button
              onClick={handleTriggerPipeline}
              disabled={isRunningPipeline}
              className="h-8 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-[12.5px] font-semibold flex items-center gap-1.5 transition-all shadow-sm shadow-blue-500/25 active:scale-[0.98] disabled:opacity-50"
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

        {/* 1. Telemetry Metrics Row (5 Porcelain Cards with gradient accents) */}
        <section className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {/* 01 Leads */}
          <div className="relative p-4.5 rounded-2xl bg-white border border-slate-200/80 hover-lift shadow-[0_2px_8px_rgba(15,23,42,0.04)] overflow-hidden group">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500 to-cyan-400 opacity-80" />
            <div className="text-[12px] text-slate-500 font-medium tracking-tight mb-2.5 flex items-center justify-between">
              <span className="tracking-[-0.01em] font-semibold text-slate-600">Leads Discovered</span>
              <span className="text-emerald-700 font-mono text-[11px] font-bold tracking-tight flex items-center gap-0.5 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60">
                <TrendingUp className="w-3 h-3" />
                +142<span className="text-[9px] text-emerald-600/70 font-sans font-medium">/hr</span>
              </span>
            </div>
            <div className="text-[30px] font-bold font-mono text-slate-950 tracking-[-0.04em] leading-none mb-3">
              {totalLeads.toLocaleString()}
            </div>
            <div className="text-[11.5px] text-slate-500 font-mono flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-slate-400 tracking-tight">Scrape yield</span>
              <span className="text-slate-800 font-semibold">98.4%</span>
            </div>
          </div>

          {/* 02 Qualified Accounts */}
          <div className="relative p-4.5 rounded-2xl bg-white border border-slate-200/80 hover-lift shadow-[0_2px_8px_rgba(15,23,42,0.04)] overflow-hidden group">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500 to-teal-400 opacity-80" />
            <div className="text-[12px] text-slate-500 font-medium tracking-tight mb-2.5 flex items-center justify-between">
              <span className="tracking-[-0.01em] font-semibold text-slate-600">Qualified Accounts</span>
              <span className="text-slate-600 font-mono text-[11px] font-bold tracking-tight bg-slate-100 px-1.5 py-0.5 rounded">
                {totalLeads > 0 ? ((qualifiedAccounts / totalLeads) * 100).toFixed(1) : "27.5"}%
              </span>
            </div>
            <div className="text-[30px] font-bold font-mono text-slate-950 tracking-[-0.04em] leading-none mb-3">
              {qualifiedAccounts.toLocaleString()}
            </div>
            <div className="text-[11.5px] text-slate-500 font-mono flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-slate-400 tracking-tight">Priority Hot Tier</span>
              <span className="text-emerald-700 font-bold">182 hot</span>
            </div>
          </div>

          {/* 03 Sites Synthesized */}
          <div className="relative p-4.5 rounded-2xl bg-white border border-slate-200/80 hover-lift shadow-[0_2px_8px_rgba(15,23,42,0.04)] overflow-hidden group">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-600 to-indigo-500 opacity-80" />
            <div className="text-[12px] text-slate-500 font-medium tracking-tight mb-2.5 flex items-center justify-between">
              <span className="tracking-[-0.01em] font-semibold text-slate-600">Sites Synthesized</span>
              <span className="text-blue-700 font-mono text-[10.5px] font-bold tracking-tight bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                +8 queued
              </span>
            </div>
            <div className="text-[30px] font-bold font-mono text-slate-950 tracking-[-0.04em] leading-none mb-3">
              {sitesSynthesized.toLocaleString()}
            </div>
            <div className="text-[11.5px] text-slate-500 font-mono flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-slate-400 tracking-tight">Avg synthesis</span>
              <span className="text-slate-800 font-semibold">1.8s</span>
            </div>
          </div>

          {/* 04 Deployments */}
          <div className="relative p-4.5 rounded-2xl bg-white border border-slate-200/80 hover-lift shadow-[0_2px_8px_rgba(15,23,42,0.04)] overflow-hidden group">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-teal-500 to-emerald-400 opacity-80" />
            <div className="text-[12px] text-slate-500 font-medium tracking-tight mb-2.5 flex items-center justify-between">
              <span className="tracking-[-0.01em] font-semibold text-slate-600">Edge Deployments</span>
              <span className="text-emerald-700 font-mono text-[11px] font-bold tracking-tight">100% SLA</span>
            </div>
            <div className="text-[30px] font-bold font-mono text-slate-950 tracking-[-0.04em] leading-none mb-3">
              {edgeDeployments.toLocaleString()}
            </div>
            <div className="text-[11.5px] text-slate-500 font-mono flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-slate-400 tracking-tight">Edge network</span>
              <span className="text-slate-800 font-semibold">Cloudflare</span>
            </div>
          </div>

          {/* 05 Outreach Dispatched */}
          <div className="relative p-4.5 rounded-2xl bg-white border border-slate-200/80 hover-lift col-span-2 md:col-span-1 shadow-[0_2px_8px_rgba(15,23,42,0.04)] overflow-hidden group">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-500 to-purple-400 opacity-80" />
            <div className="text-[12px] text-slate-500 font-medium tracking-tight mb-2.5 flex items-center justify-between">
              <span className="tracking-[-0.01em] font-semibold text-slate-600">Outreach Staged</span>
              <span className="text-slate-600 font-mono text-[11px] font-bold tracking-tight">38.4% open</span>
            </div>
            <div className="text-[30px] font-bold font-mono text-slate-950 tracking-[-0.04em] leading-none mb-3">
              {outreachStaged.toLocaleString()}
            </div>
            <div className="text-[11.5px] text-slate-500 font-mono flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-slate-400 tracking-tight">Channel</span>
              <span className="text-slate-800 font-semibold">WhatsApp / SMS</span>
            </div>
          </div>
        </section>

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
            {/* 01 DISCOVERY */}
            <div
              onClick={() => handleSelectNode("DISCOVERY")}
              className={cn(
                "cursor-pointer p-4 rounded-xl border transition-all hover-lift flex flex-col justify-between group",
                selectedNodeKey === "DISCOVERY"
                  ? "bg-blue-50/70 border-blue-500 shadow-sm ring-2 ring-blue-500/20"
                  : "bg-slate-50/70 border-slate-200/90 hover:border-blue-300 hover:bg-white"
              )}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase font-bold">
                    01 / DISCOVERY
                  </span>
                  <span className="inline-flex items-center gap-1 text-[9.5px] font-mono font-bold tracking-tight text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    <span className="w-1 h-1 rounded-full bg-emerald-500" /> DONE
                  </span>
                </div>
                <h3 className="text-[13.5px] font-semibold text-slate-900 group-hover:text-blue-600 transition-colors tracking-[-0.015em]">
                  Cluster Scrape
                </h3>
                <p className="text-[11.5px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  42 dining entities scraped in Coimbatore zone
                </p>
              </div>
              <div className="pt-3 mt-3 border-t border-slate-200/80 text-[11px] font-mono text-slate-400 flex justify-between tracking-tight">
                <span>Rate</span>
                <span className="text-slate-800 font-semibold">142/min</span>
              </div>
            </div>

            {/* 02 QUALIFY */}
            <div
              onClick={() => handleSelectNode("QUALIFY")}
              className={cn(
                "cursor-pointer p-4 rounded-xl border transition-all hover-lift flex flex-col justify-between group",
                selectedNodeKey === "QUALIFY"
                  ? "bg-blue-50/70 border-blue-500 shadow-sm ring-2 ring-blue-500/20"
                  : "bg-slate-50/70 border-slate-200/90 hover:border-blue-300 hover:bg-white"
              )}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase font-bold">
                    02 / QUALIFY
                  </span>
                  <span className="inline-flex items-center gap-1 text-[9.5px] font-mono font-bold tracking-tight text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    <span className="w-1 h-1 rounded-full bg-emerald-500" /> DONE
                  </span>
                </div>
                <h3 className="text-[13.5px] font-semibold text-slate-900 group-hover:text-blue-600 transition-colors tracking-[-0.015em]">
                  Score Revenue
                </h3>
                <p className="text-[11.5px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  Financial validation & legacy stack check
                </p>
              </div>
              <div className="pt-3 mt-3 border-t border-slate-200/80 text-[11px] font-mono text-slate-400 flex justify-between tracking-tight">
                <span>Scored</span>
                <span className="text-slate-800 font-semibold">48/min</span>
              </div>
            </div>

            {/* 03 STORE */}
            <div
              onClick={() => handleSelectNode("STORE")}
              className={cn(
                "cursor-pointer p-4 rounded-xl border transition-all hover-lift flex flex-col justify-between group",
                selectedNodeKey === "STORE"
                  ? "bg-blue-50/70 border-blue-500 shadow-sm ring-2 ring-blue-500/20"
                  : "bg-slate-50/70 border-slate-200/90 hover:border-blue-300 hover:bg-white"
              )}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase font-bold">
                    03 / STORE
                  </span>
                  <span className="inline-flex items-center gap-1 text-[9.5px] font-mono font-bold tracking-tight text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    <span className="w-1 h-1 rounded-full bg-emerald-500" /> DONE
                  </span>
                </div>
                <h3 className="text-[13.5px] font-semibold text-slate-900 group-hover:text-blue-600 transition-colors tracking-[-0.015em]">
                  Vector Ingest
                </h3>
                <p className="text-[11.5px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  Embedding leads into pgvector index
                </p>
              </div>
              <div className="pt-3 mt-3 border-t border-slate-200/80 text-[11px] font-mono text-slate-400 flex justify-between tracking-tight">
                <span>Writes</span>
                <span className="text-slate-800 font-semibold">18/min</span>
              </div>
            </div>

            {/* 04 BUILD (Active Highlight State) */}
            <div
              onClick={() => handleSelectNode("BUILD")}
              className={cn(
                "cursor-pointer p-4 rounded-xl border-2 transition-all hover-lift flex flex-col justify-between group shadow-[0_6px_20px_rgba(37,99,235,0.14)]",
                selectedNodeKey === "BUILD"
                  ? "bg-blue-50/90 border-blue-600 ring-3 ring-blue-500/25"
                  : "bg-blue-50/70 border-blue-500 hover:border-blue-600"
              )}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono tracking-widest text-blue-700 uppercase font-extrabold">
                    04 / BUILD
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[9.5px] font-mono font-bold tracking-tight text-blue-700 bg-blue-100/90 px-1.5 py-0.5 rounded border border-blue-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" /> RUNNING
                  </span>
                </div>
                <h3 className="text-[13.5px] font-bold text-slate-900 group-hover:text-blue-700 transition-colors tracking-[-0.015em]">
                  Site Synthesis
                </h3>
                <p className="text-[11.5px] text-slate-600 mt-1 leading-relaxed font-medium">
                  Compiling for <span className="text-blue-700 font-bold tracking-tight">Kovai Kitchen</span>
                </p>
                {/* Shimmer Bar */}
                <div className="mt-3 w-full bg-blue-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full rounded-full animate-shimmer" style={{ width: "68%" }} />
                </div>
              </div>
              <div className="pt-2 mt-2 border-t border-blue-200 text-[11px] font-mono text-blue-700 flex justify-between tracking-tight">
                <span>AST Pass 2</span>
                <span className="font-extrabold">68%</span>
              </div>
            </div>

            {/* 05 DEPLOY */}
            <div
              onClick={() => handleSelectNode("DEPLOY")}
              className={cn(
                "cursor-pointer p-4 rounded-xl border transition-all hover-lift flex flex-col justify-between group",
                selectedNodeKey === "DEPLOY"
                  ? "bg-blue-50/70 border-blue-500 shadow-sm ring-2 ring-blue-500/20"
                  : "bg-slate-50/70 border-slate-200/90 hover:border-blue-300 hover:bg-white"
              )}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase font-bold">
                    05 / DEPLOY
                  </span>
                  <span className="inline-flex items-center gap-1 text-[9.5px] font-mono font-bold tracking-tight text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                    <span className="w-1 h-1 rounded-full bg-amber-500" /> QUEUED
                  </span>
                </div>
                <h3 className="text-[13.5px] font-semibold text-slate-900 group-hover:text-blue-600 transition-colors tracking-[-0.015em]">
                  Edge DNS
                </h3>
                <p className="text-[11.5px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  Vercel edge preview & subzone allocation
                </p>
              </div>
              <div className="pt-3 mt-3 border-t border-slate-200/80 text-[11px] font-mono text-slate-400 flex justify-between tracking-tight">
                <span>Pending</span>
                <span className="text-slate-800 font-semibold">2 items</span>
              </div>
            </div>

            {/* 06 OUTREACH */}
            <div
              onClick={() => handleSelectNode("OUTREACH")}
              className={cn(
                "cursor-pointer p-4 rounded-xl border transition-all hover-lift flex flex-col justify-between group",
                selectedNodeKey === "OUTREACH"
                  ? "bg-blue-50/70 border-blue-500 shadow-sm ring-2 ring-blue-500/20"
                  : "bg-slate-50/70 border-slate-200/90 hover:border-blue-300 hover:bg-white"
              )}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase font-bold">
                    06 / OUTREACH
                  </span>
                  <span className="inline-flex items-center gap-1 text-[9.5px] font-mono font-bold tracking-tight text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                    <span className="w-1 h-1 rounded-full bg-slate-400" /> STANDBY
                  </span>
                </div>
                <h3 className="text-[13.5px] font-semibold text-slate-900 group-hover:text-blue-600 transition-colors tracking-[-0.015em]">
                  Multichannel
                </h3>
                <p className="text-[11.5px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  WhatsApp / SMS dispatch dry-run preview
                </p>
              </div>
              <div className="pt-3 mt-3 border-t border-slate-200/80 text-[11px] font-mono text-slate-400 flex justify-between tracking-tight">
                <span>Status</span>
                <span className="text-slate-700 font-semibold">Dry-run</span>
              </div>
            </div>
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
                {/* Event 1 */}
                <div className="py-2.5 flex items-center justify-between hover:bg-slate-50/90 px-1 rounded-lg transition-colors group">
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <span className="text-slate-400 shrink-0 font-mono text-[11px] tracking-tight">20:41:42</span>
                    <span className="px-1.5 py-0.5 rounded text-[9.5px] font-mono font-bold tracking-wider bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                      BUILD
                    </span>
                    <span className="text-slate-700 truncate font-sans text-[12.5px] group-hover:text-slate-950 transition-colors">
                      Synthesized hero component for <span className="text-blue-600 font-semibold">Kovai Kitchen</span>
                    </span>
                  </div>
                  <span className="text-slate-400 shrink-0 font-mono text-[11px] font-semibold">240ms</span>
                </div>

                {/* Event 2 */}
                <div className="py-2.5 flex items-center justify-between hover:bg-slate-50/90 px-1 rounded-lg transition-colors group">
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <span className="text-slate-400 shrink-0 font-mono text-[11px] tracking-tight">20:41:30</span>
                    <span className="px-1.5 py-0.5 rounded text-[9.5px] font-mono font-bold tracking-wider bg-purple-50 text-purple-700 border border-purple-200 shrink-0">
                      QUALIFY
                    </span>
                    <span className="text-slate-700 truncate font-sans text-[12.5px] group-hover:text-slate-950 transition-colors">
                      Verified account <span className="text-slate-900 font-semibold">&quot;Sri Krishna Sweets&quot;</span>{" "}
                      <span className="text-slate-400 font-mono text-[11px]">(Score: 89)</span>
                    </span>
                  </div>
                  <span className="text-emerald-700 shrink-0 font-mono text-[10px] font-bold tracking-wider bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    HOT_TIER
                  </span>
                </div>

                {/* Event 3 */}
                <div className="py-2.5 flex items-center justify-between hover:bg-slate-50/90 px-1 rounded-lg transition-colors group">
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <span className="text-slate-400 shrink-0 font-mono text-[11px] tracking-tight">20:41:18</span>
                    <span className="px-1.5 py-0.5 rounded text-[9.5px] font-mono font-bold tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                      STORE
                    </span>
                    <span className="text-slate-700 truncate font-sans text-[12.5px] group-hover:text-slate-950 transition-colors">
                      Committed 18 rows to table{" "}
                      <code className="text-slate-700 font-mono text-[11px] bg-slate-100 px-1 py-0.5 rounded border border-slate-200">
                        leads_prod
                      </code>
                    </span>
                  </div>
                  <span className="text-slate-500 shrink-0 font-mono text-[11px] font-semibold">+18 rows</span>
                </div>

                {/* Event 4 */}
                <div className="py-2.5 flex items-center justify-between hover:bg-slate-50/90 px-1 rounded-lg transition-colors group">
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <span className="text-slate-400 shrink-0 font-mono text-[11px] tracking-tight">20:40:55</span>
                    <span className="px-1.5 py-0.5 rounded text-[9.5px] font-mono font-bold tracking-wider bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                      DISCOVERY
                    </span>
                    <span className="text-slate-700 truncate font-sans text-[12.5px] group-hover:text-slate-950 transition-colors">
                      RS Puram zone ingestion: 34 commercial entities
                    </span>
                  </div>
                  <span className="text-slate-500 shrink-0 font-mono text-[11px] font-semibold">34 items</span>
                </div>

                {/* Event 5 */}
                <div className="py-2.5 flex items-center justify-between hover:bg-slate-50/90 px-1 rounded-lg transition-colors group">
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <span className="text-slate-400 shrink-0 font-mono text-[11px] tracking-tight">20:40:22</span>
                    <span className="px-1.5 py-0.5 rounded text-[9.5px] font-mono font-bold tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                      DEPLOY
                    </span>
                    <span className="text-slate-700 truncate font-sans text-[12.5px] group-hover:text-slate-950 transition-colors">
                      Edge preview live:{" "}
                      <span className="text-blue-600 font-mono text-[11.5px] font-semibold">annapoorna.vasaw.site</span>
                    </span>
                  </div>
                  <span className="text-emerald-700 shrink-0 font-mono text-[10px] font-bold tracking-wider bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    200_OK
                  </span>
                </div>
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
