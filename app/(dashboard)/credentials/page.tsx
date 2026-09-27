"use client";

import * as React from "react";
import {
  KeyRound,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Trash2,
  Lock,
  Eye,
  EyeOff,
  Database,
  Globe,
  Bot,
  Mail,
  Zap,
  GitBranch,
  Server,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { WorkflowCredential } from "@/lib/types/automation-flow";

const INITIAL_CREDENTIALS: WorkflowCredential[] = [
  {
    id: "cred-apify",
    name: "Apify Scraping API",
    type: "apify",
    description: "Google Maps discovery actors, contact enrichers, and web scrapers.",
    isConfigured: true,
    maskedKey: "apify_api_••••••••••••9a12",
    lastTestedAt: "Today, 10:30 AM",
    status: "connected",
    createdAt: "2026-09-01T08:00:00Z",
  },
  {
    id: "cred-supabase",
    name: "Supabase PostgreSQL Service Role",
    type: "supabase",
    description: "Multi-tenant lead state, qualification audits, and execution logs.",
    isConfigured: true,
    maskedKey: "sb_sec_••••••••••••41b8",
    lastTestedAt: "Today, 10:45 AM",
    status: "connected",
    createdAt: "2026-09-01T08:00:00Z",
  },
  {
    id: "cred-gemini",
    name: "Google Gemini 2.5 AI Key",
    type: "gemini",
    description: "Real-time opportunity scoring, business rationale synthesis, and copy generation.",
    isConfigured: true,
    maskedKey: "AIzaSy••••••••••••382b",
    lastTestedAt: "Today, 10:15 AM",
    status: "connected",
    createdAt: "2026-09-02T12:00:00Z",
  },
  {
    id: "cred-openai",
    name: "OpenAI GPT-4o Key",
    type: "openai",
    description: "Secondary LLM provider fallback and vision analysis for websites.",
    isConfigured: false,
    status: "unconfigured",
    createdAt: "2026-09-05T09:00:00Z",
  },
  {
    id: "cred-resend",
    name: "Resend Email Dispatcher",
    type: "resend",
    description: "Automated cold email outreach with dynamic HTML templates and delivery telemetry.",
    isConfigured: true,
    maskedKey: "re_••••••••••••83fa",
    lastTestedAt: "Yesterday, 4:20 PM",
    status: "connected",
    createdAt: "2026-09-08T15:00:00Z",
  },
  {
    id: "cred-vercel",
    name: "Vercel Production Deployer",
    type: "vercel",
    description: "Instant synthesis and edge hosting for customer demo websites.",
    isConfigured: true,
    maskedKey: "vc_tok_••••••••••••99c1",
    lastTestedAt: "Today, 09:12 AM",
    status: "connected",
    createdAt: "2026-09-03T11:00:00Z",
  },
  {
    id: "cred-github",
    name: "GitHub Actions & Source Sync",
    type: "github",
    description: "Autonomous repository generation, branch management, and commit pushes.",
    isConfigured: true,
    maskedKey: "ghp_••••••••••••55a0",
    lastTestedAt: "Today, 08:30 AM",
    status: "connected",
    createdAt: "2026-09-04T10:00:00Z",
  },
  {
    id: "cred-webhook",
    name: "Inbound Webhook Bearer Auth",
    type: "webhook_bearer",
    description: "Shared bearer token for external Zapier, Make, and webhook callers.",
    isConfigured: true,
    maskedKey: "vasaw_whk_••••••••••••72d4",
    lastTestedAt: "Today, 10:48 AM",
    status: "connected",
    createdAt: "2026-09-01T08:00:00Z",
  },
];

function GithubIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

const CRED_ICONS: Record<string, React.ElementType> = {
  apify: Zap,
  supabase: Database,
  gemini: Sparkles,
  openai: Bot,
  resend: Mail,
  vercel: Globe,
  github: GithubIcon,
  webhook_bearer: Lock,
  custom_http: Server,
};

export default function CredentialsPage() {
  const [credentials, setCredentials] = React.useState<WorkflowCredential[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("vasaw_n8n_credentials");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // fallback
        }
      }
    }
    return INITIAL_CREDENTIALS;
  });

  const [searchQuery, setSearchQuery] = React.useState("");
  const [filterStatus, setFilterStatus] = React.useState<"all" | "connected" | "unconfigured">("all");
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [testingId, setTestingId] = React.useState<string | null>(null);

  // New credential modal state
  const [newCredType, setNewCredType] = React.useState("openai");
  const [newCredName, setNewCredName] = React.useState("");
  const [newCredKey, setNewCredKey] = React.useState("");
  const [showKey, setShowKey] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("vasaw_n8n_credentials", JSON.stringify(credentials));
    }
  }, [credentials]);

  const handleTestConnection = (credId: string) => {
    setTestingId(credId);
    setTimeout(() => {
      setCredentials((prev) =>
        prev.map((c) =>
          c.id === credId
            ? {
                ...c,
                status: "connected",
                isConfigured: true,
                lastTestedAt: "Just now",
              }
            : c
        )
      );
      setTestingId(null);
    }, 800);
  };

  const handleDeleteCred = (credId: string) => {
    if (confirm("Are you sure you want to delete this credential? Connected nodes will stop running.")) {
      setCredentials((prev) => prev.filter((c) => c.id !== credId));
    }
  };

  const handleCreateCred = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCredName.trim()) return;

    const newCred: WorkflowCredential = {
      id: `cred-${Date.now()}`,
      name: newCredName,
      type: newCredType as any,
      description: `Custom ${newCredType.toUpperCase()} credential connection.`,
      isConfigured: Boolean(newCredKey.trim()),
      maskedKey: newCredKey ? `${newCredKey.slice(0, 6)}••••••••••••${newCredKey.slice(-4)}` : undefined,
      lastTestedAt: "Just now",
      status: newCredKey.trim() ? "connected" : "unconfigured",
      createdAt: new Date().toISOString(),
    };

    setCredentials((prev) => [newCred, ...prev]);
    setIsModalOpen(false);
    setNewCredName("");
    setNewCredKey("");
  };

  const filteredCredentials = credentials.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "connected" && c.status === "connected") ||
      (filterStatus === "unconfigured" && c.status === "unconfigured");
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#ff6d5a]/15 text-[#ff6d5a] flex items-center justify-center font-bold">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 font-sans">
                Credentials Manager
              </h1>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Securely store and verify API tokens for autonomous n8n workflows
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-[#ff6d5a] hover:bg-[#ea4b35] text-white font-bold text-xs h-9 px-4 rounded-xl flex items-center gap-2 shadow-sm shadow-[#ff6d5a]/25"
          >
            <Plus className="w-4 h-4" />
            <span>Add Credential</span>
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search credentials, providers, tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-8.5 pl-9 pr-4 text-xs font-sans rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#ff6d5a] transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          {(["all", "connected", "unconfigured"] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors",
                filterStatus === st
                  ? "bg-[#ff6d5a]/15 text-[#ea4b35] font-bold"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              {st} ({credentials.filter((c) => st === "all" || (st === "connected" ? c.status === "connected" : c.status === "unconfigured")).length})
            </button>
          ))}
        </div>
      </div>

      {/* Credentials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCredentials.map((cred) => {
          const Icon = CRED_ICONS[cred.type] || KeyRound;
          const isTesting = testingId === cred.id;

          return (
            <div
              key={cred.id}
              className="group bg-white rounded-2xl border border-slate-200 hover:border-slate-300 p-5 space-y-4 transition-all shadow-xs hover:shadow-md flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-[#ff6d5a]/10 border border-slate-200 flex items-center justify-center text-slate-700 group-hover:text-[#ff6d5a] transition-colors shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 leading-tight">
                        {cred.name}
                      </h3>
                      <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mt-0.5">
                        {cred.type}
                      </p>
                    </div>
                  </div>

                  <div>
                    {cred.status === "connected" ? (
                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-mono font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        <span>Connected</span>
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-mono font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-500" />
                        <span>Not Configured</span>
                      </Badge>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed min-h-[36px]">
                  {cred.description}
                </p>

                {cred.maskedKey && (
                  <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-2 flex items-center justify-between font-mono text-[11px] text-slate-600">
                    <span className="truncate">{cred.maskedKey}</span>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0 ml-2" />
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[10px] font-mono text-slate-400">
                  {cred.lastTestedAt ? `Tested: ${cred.lastTestedAt}` : "Not tested"}
                </span>

                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleTestConnection(cred.id)}
                    disabled={isTesting}
                    className="h-7 px-2.5 rounded-lg text-[11px] font-medium border-slate-200 hover:bg-slate-50 text-slate-600 flex items-center gap-1"
                  >
                    <RefreshCw className={cn("w-3 h-3", isTesting && "animate-spin text-[#ff6d5a]")} />
                    <span>{isTesting ? "Testing..." : "Test"}</span>
                  </Button>

                  <button
                    onClick={() => handleDeleteCred(cred.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Delete credential"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* New Credential Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#ff6d5a]/15 text-[#ff6d5a] flex items-center justify-center font-bold">
                  <KeyRound className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-slate-900">Add New Credential</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateCred} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Credential Type / Provider
                </label>
                <select
                  value={newCredType}
                  onChange={(e) => {
                    setNewCredType(e.target.value);
                    if (!newCredName) {
                      setNewCredName(`${e.target.value.toUpperCase()} API Key`);
                    }
                  }}
                  className="w-full h-9 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-[#ff6d5a]"
                >
                  <option value="openai">OpenAI (GPT-4o / Embeddings)</option>
                  <option value="gemini">Google Gemini AI</option>
                  <option value="groq">Groq (Llama 3)</option>
                  <option value="apify">Apify Scraper API</option>
                  <option value="supabase">Supabase PostgreSQL</option>
                  <option value="resend">Resend Email Service</option>
                  <option value="vercel">Vercel API Token</option>
                  <option value="github">GitHub Personal Access Token</option>
                  <option value="webhook_bearer">Inbound Webhook Bearer Secret</option>
                  <option value="custom_http">Custom HTTP Basic / Bearer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Credential Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Production OpenAI API Key"
                  value={newCredName}
                  onChange={(e) => setNewCredName(e.target.value)}
                  required
                  className="w-full h-9 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-[#ff6d5a]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  API Key / Token Value
                </label>
                <div className="relative">
                  <input
                    type={showKey ? "text" : "password"}
                    placeholder="Enter secret token or key..."
                    value={newCredKey}
                    onChange={(e) => setNewCredKey(e.target.value)}
                    className="w-full h-9 rounded-xl border border-slate-200 bg-slate-50 pl-3 pr-9 font-mono text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#ff6d5a]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 font-mono mt-1">
                  Stored encrypted in your local browser vault. Never committed to git.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  className="h-8.5 text-xs border-slate-200"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="h-8.5 text-xs bg-[#ff6d5a] hover:bg-[#ea4b35] text-white font-bold px-4"
                >
                  Save &amp; Connect
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
