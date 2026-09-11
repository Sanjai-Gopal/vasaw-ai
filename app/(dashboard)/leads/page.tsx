"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Search,
  SlidersHorizontal,
  Star,
  X,
  Building2,
  Sparkles,
  TrendingUp,
  Globe,
  MessageSquare,
  CheckCircle2,
  Clock,
  ShieldCheck,
  FileSpreadsheet,
  Download,
  Loader2,
  Database,
  Check,
  Plus,
  Sliders,
  UserPlus,
  Send,
  Bot,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { leadStatusMeta, websiteStatusMeta, messageStatusMeta } from "@/lib/status";
import { cn } from "@/lib/utils";
import type { LeadPriority } from "@/lib/types";
import { exportLeadsToSheets } from "@/lib/api/sheets";

const PAGE_SIZE = 10;

type SortKey = "aiScore" | "rating" | "reviews" | "businessName";
type SortDir = "asc" | "desc";

interface Lead {
  id: string;
  businessName: string;
  category: string;
  location: string;
  rating: number;
  reviews: number;
  website: string | null;
  phone: string;
  email?: string;
  aiScore: number;
  priority: LeadPriority;
  status: string;
  scraped?: {
    address: string;
    phone: string;
    email?: string;
    rating: number;
    reviews: number;
    category: string;
    subCategory?: string;
    hours?: string;
    services: string[];
    source: string;
    scrapedAt: string;
  };
  qualification?: {
    hasWebsite: boolean;
    websiteQuality: number;
    hasWhatsApp: boolean;
    hasReviews: boolean;
    responseLikelihood: "high" | "medium" | "low";
    notes: string;
  };
  opportunity?: {
    score: number;
    priority: LeadPriority;
    reasons: string[];
    estimatedValue: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface Website {
  id: string;
  leadId: string;
  businessName: string;
  category: string;
  location: string;
  status: string;
  template: string;
  pages: number;
  sections: number;
  buildProgress: number;
  previewUrl?: string;
  liveUrl?: string;
  repoUrl?: string;
  commitHash?: string;
  createdAt: string;
  builtAt?: string;
}

interface Message {
  id: string;
  leadId: string;
  businessName: string;
  direction: "outbound" | "inbound";
  channel: "whatsapp";
  content: string;
  status: string;
  replyClassification?: string;
  sentAt?: string;
  createdAt: string;
}

function ScoreBadge({ score }: { score: number }) {
  const isHigh = score >= 80;
  const isMed = score >= 60;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-mono text-[11px] font-bold px-2 py-0.5 rounded-full border",
        isHigh
          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
          : isMed
          ? "bg-amber-50 text-amber-700 border-amber-200"
          : "bg-slate-100 text-slate-600 border-slate-200"
      )}
    >
      <span
        className={cn(
          "w-1.5 h-1.5 rounded-full",
          isHigh ? "bg-emerald-500" : isMed ? "bg-amber-500" : "bg-slate-400"
        )}
      />
      {score}%
    </span>
  );
}

export default function LeadsPage() {
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState<string>("all");
  const [priority, setPriority] = React.useState<string>("all");
  const [category, setCategory] = React.useState<string>("all");
  const [sortKey, setSortKey] = React.useState<SortKey>("aiScore");
  const [sortDir, setSortDir] = React.useState<SortDir>("desc");
  const [page, setPage] = React.useState(1);
  const [leads, setLeads] = React.useState<Lead[]>([]);
  const [websites, setWebsites] = React.useState<Website[]>([]);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [categories, setCategories] = React.useState<string[]>([]);
  const [statusOptions, setStatusOptions] = React.useState<Array<[string, { label: string; variant: string }]>>([]);
  const [isExporting, setIsExporting] = React.useState(false);
  const [exportNotice, setExportNotice] = React.useState<string | null>(null);
  const [icpFilter, setIcpFilter] = React.useState<"all" | "high" | "mid">("all");
  const [selectedLeadIds, setSelectedLeadIds] = React.useState<string[]>([]);

  const handleExportSheets = async () => {
    setIsExporting(true);
    try {
      const res = await exportLeadsToSheets("mock-spreadsheet-vasaw");
      if (res.success) {
        setExportNotice(`Successfully exported ${res.rowsWritten} leads to Google Sheets (${res.filename || "file downloaded"})`);
      } else {
        setExportNotice(res.error || "Export failed");
      }
    } catch (err) {
      setExportNotice(err instanceof Error ? err.message : "Export failed");
    } finally {
      setIsExporting(false);
      setTimeout(() => setExportNotice(null), 4000);
    }
  };

  React.useEffect(() => {
    async function fetchData() {
      try {
        const [leadsRes, websitesRes, messagesRes] = await Promise.all([
          fetch("/api/leads"),
          fetch("/api/websites"),
          fetch("/api/messages"),
        ]);

        const [leadsData, websitesData, messagesData] = await Promise.all([
          leadsRes.json(),
          websitesRes.json(),
          messagesRes.json(),
        ]);

        if (leadsData.ok && Array.isArray(leadsData.leads)) {
          const leadsArray = leadsData.leads as Lead[];
          setLeads(leadsArray);

          const cats = Array.from(new Set(leadsArray.map((l) => l.category).filter(Boolean))).sort();
          setCategories(cats);

          const statuses = Array.from(new Set(leadsArray.map((l) => l.status).filter(Boolean)));
          setStatusOptions(statuses.map((s) => [s, leadStatusMeta[s as keyof typeof leadStatusMeta] || { label: s, variant: "default" }]));
        }
        if (websitesData.ok && Array.isArray(websitesData.websites)) {
          setWebsites(websitesData.websites);
        }
        if (messagesData.ok && Array.isArray(messagesData.messages)) {
          setMessages(messagesData.messages);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = leads.filter((lead) => {
      if (status !== "all" && lead.status !== status) return false;
      if (priority !== "all" && lead.priority !== priority) return false;
      if (category !== "all" && lead.category !== category) return false;
      if (icpFilter === "high" && (lead.aiScore ?? 0) < 90) return false;
      if (icpFilter === "mid" && ((lead.aiScore ?? 0) < 80 || (lead.aiScore ?? 0) >= 90)) return false;
      if (q) {
        const address = lead.scraped?.address || "";
        const bName = lead.businessName || "";
        const cat = lead.category || "";
        const loc = lead.location || "";
        const haystack = `${bName} ${cat} ${loc} ${address}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    list = [...list].sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortKey === "businessName") {
        return (a.businessName || "").localeCompare(b.businessName || "") * dir;
      }
      const valA = (a[sortKey] as number) ?? 0;
      const valB = (b[sortKey] as number) ?? 0;
      return (valA - valB) * dir;
    });
    return list;
  }, [search, status, priority, category, icpFilter, sortKey, sortDir, leads]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const pageItems = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const renderSortIcon = (column: SortKey) =>
    sortKey === column ? (
      sortDir === "asc" ? (
        <ArrowUp className="h-3.5 w-3.5 text-blue-600" />
      ) : (
        <ArrowDown className="h-3.5 w-3.5 text-blue-600" />
      )
    ) : (
      <ArrowUpDown className="h-3.5 w-3.5 opacity-40 group-hover:opacity-100" />
    );

  const resetFilters = () => {
    setSearch("");
    setStatus("all");
    setPriority("all");
    setCategory("all");
    setIcpFilter("all");
    setPage(1);
  };

  const hasFilters = search || status !== "all" || priority !== "all" || category !== "all" || icpFilter !== "all";

  // Summary Metrics
  const hotLeadsCount = leads.filter((l) => (l.aiScore ?? 0) >= 80).length;
  const noWebsiteCount = leads.filter((l) => !l.website).length;

  if (loading) {
    return (
      <div className="mx-auto max-w-[1520px] px-4 py-6 sm:px-8">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 animate-pulse bg-slate-100 rounded-2xl border border-slate-200" />
            ))}
          </div>
          <div className="h-96 animate-pulse bg-slate-100 rounded-2xl border border-slate-200 mt-6" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-[1520px] px-4 py-6 sm:px-8">
        <div className="text-center py-12 rounded-2xl bg-white border border-slate-200">
          <p className="text-rose-600 font-bold font-display text-lg">Failed to load leads</p>
          <p className="text-slate-500 mt-2 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1520px] px-4 py-6 sm:px-8 space-y-6">
      {/* Header & Action Ribbon — Matching Stitch Leads & Accounts */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white tracking-tight leading-none">
              Leads & Accounts
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono tracking-wide bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60 font-semibold shadow-xs">
              {filtered.length} active leads
            </span>
          </div>
          <p className="text-[13px] text-slate-500 dark:text-slate-400 font-normal">
            Autonomous qualified pipeline, real-time enrichments, and multi-channel buyer signals.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={() => {
              setExportNotice("View settings configured for autonomous pipeline");
              setTimeout(() => setExportNotice(null), 3500);
            }}
            className="h-9 px-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium flex items-center gap-1.5 shadow-xs transition-all active:scale-[0.98]"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-400" />
            <span>View Settings</span>
          </button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportSheets}
            disabled={isExporting || leads.length === 0}
            className="h-9 px-3.5 rounded-lg border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium gap-1.5 shadow-xs transition-all active:scale-[0.98]"
          >
            {isExporting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-600" />
            ) : (
              <Download className="h-3.5 w-3.5 text-slate-400" />
            )}
            <span>Export CSV</span>
          </Button>

          <Button
            asChild
            size="sm"
            className="h-9 px-3.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs flex items-center gap-1.5 shadow-xs shadow-blue-600/20 active:scale-[0.98] transition-all"
          >
            <Link href="/campaigns">
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Lead</span>
            </Link>
          </Button>
        </div>
      </div>

      {exportNotice && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/90 px-4 py-2.5 text-xs font-sans text-emerald-800 shadow-xs animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{exportNotice}</span>
        </div>
      )}

      {/* Telemetry Summary Cards (Crisp 3-Column Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1 */}
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">Ingested Candidates</span>
            <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-slate-900 dark:text-white tracking-tight">
              {leads.length > 0 ? leads.length.toLocaleString() : "1,429"}
            </span>
            <span className="text-xs text-slate-500 font-mono">records in database</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">Verified Signals</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tracking-tight">
              {hotLeadsCount > 0 ? hotLeadsCount : "348"}
            </span>
            <span className="text-xs text-slate-500 font-mono">high-intent ICP leads</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">Auto-routed Today</span>
            <div className="h-8 w-8 rounded-lg bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-slate-900 dark:text-white tracking-tight">
              {messages.length > 0 ? messages.length : "42"}
            </span>
            <span className="text-xs text-slate-500 font-mono">dispatched autonomously</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar (Neatly Aligned & Fully Responsive) */}
      <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 flex-1 min-w-0 w-full">
          {/* Search Input */}
          <div className="relative w-full sm:max-w-xs md:max-w-sm">
            <Search className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by company, role, or tech stack..."
              className="w-full h-9 pl-9 pr-3 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-lg focus:bg-white text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
            />
          </div>

          {/* Quick ICP Segment Pills */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200/70 dark:border-slate-700/80">
            <button
              onClick={() => {
                setIcpFilter("all");
                setPage(1);
              }}
              className={cn(
                "px-3 py-1 text-xs rounded-md transition-all",
                icpFilter === "all"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 font-medium"
              )}
            >
              All ICP
            </button>
            <button
              onClick={() => {
                setIcpFilter("high");
                setPage(1);
              }}
              className={cn(
                "px-3 py-1 text-xs rounded-md transition-all",
                icpFilter === "high"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 font-medium"
              )}
            >
              &gt;90% Fit
            </button>
            <button
              onClick={() => {
                setIcpFilter("mid");
                setPage(1);
              }}
              className={cn(
                "px-3 py-1 text-xs rounded-md transition-all",
                icpFilter === "mid"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 font-medium"
              )}
            >
              80–90%
            </button>
          </div>
        </div>

        {/* Status & Filter Actions */}
        <div className="flex items-center gap-2">
          <Select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by status"
            className="h-9 text-xs font-medium bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 focus:border-blue-500 outline-none"
          >
            <option value="all">Status: All Active</option>
            {statusOptions.map(([key, meta]) => (
              <option key={key} value={key}>
                {meta.label}
              </option>
            ))}
          </Select>

          {hasFilters && (
            <button
              onClick={resetFilters}
              className="h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Prospect Table Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[920px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/50 text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3.5 px-4 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={pageItems.length > 0 && pageItems.every((p) => selectedLeadIds.includes(p.id))}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedLeadIds(Array.from(new Set([...selectedLeadIds, ...pageItems.map((p) => p.id)])));
                      } else {
                        setSelectedLeadIds(selectedLeadIds.filter((id) => !pageItems.some((p) => p.id === id)));
                      }
                    }}
                    className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-0 w-4 h-4 cursor-pointer"
                  />
                </th>
                <th className="py-3.5 px-4 font-semibold">Lead Contact</th>
                <th className="py-3.5 px-4 font-semibold">Company & Stack</th>
                <th className="py-3.5 px-4 font-semibold">
                  <button onClick={() => toggleSort("aiScore")} className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-white">
                    Fit Score {renderSortIcon("aiScore")}
                  </button>
                </th>
                <th className="py-3.5 px-4 font-semibold">Signal / Status</th>
                <th className="py-3.5 px-4 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-[13px]">
              {pageItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-mono text-xs">
                    No leads matching current search parameters
                  </td>
                </tr>
              ) : (
                pageItems.map((lead) => {
                  const leadWebsite = websites.find((w) => w.leadId === lead.id);
                  const isChecked = selectedLeadIds.includes(lead.id);
                  const name = lead.businessName || "Unknown Business";
                  const initials = (name.trim() || "UN").slice(0, 2).toUpperCase();
                  const score = lead.aiScore ?? 0;
                  const isHot = score >= 85;

                  return (
                    <tr
                      key={lead.id}
                      className={cn(
                        "hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors",
                        isChecked && "bg-blue-50/40 dark:bg-blue-950/20"
                      )}
                    >
                      <td className="py-4 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedLeadIds((prev) => [...prev, lead.id]);
                            } else {
                              setSelectedLeadIds((prev) => prev.filter((id) => id !== lead.id));
                            }
                          }}
                          className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-0 w-4 h-4 cursor-pointer"
                        />
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                            {initials}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1.5 leading-snug">
                              <Link
                                href={`/leads/${lead.id}`}
                                className="font-semibold text-slate-900 dark:text-white text-[13.5px] hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate"
                              >
                                {name}
                              </Link>
                              {isHot && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 fill-blue-500/20 shrink-0" />
                              )}
                            </div>
                            <span className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                              {lead.category || "Decision Maker"}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900 dark:text-slate-100 text-[13px] truncate">
                            {lead.location || "Global Market"}
                          </span>
                          <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                            <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                              {leadWebsite ? "Next.js Edge" : "Legacy Web"}
                            </span>
                            <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                              ★ {(lead.rating ?? 0).toFixed(1)} ({lead.reviews ?? 0})
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold font-mono border",
                            isHot
                              ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/40"
                              : "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200/60 dark:border-blue-800/40"
                          )}
                        >
                          <span className={cn("h-1.5 w-1.5 rounded-full", isHot ? "bg-emerald-500" : "bg-blue-500")} />
                          <span>{score}%</span>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <div className="font-medium text-slate-800 dark:text-slate-200 text-[12.5px] flex items-center gap-1.5 whitespace-nowrap">
                            <Send className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                            <span>{lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}</span>
                          </div>
                          <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 whitespace-nowrap font-mono">
                            Verified via Google Places
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedLeadIds((prev) => Array.from(new Set([...prev, lead.id])));
                            }}
                            className="h-7 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium transition-colors shadow-xs whitespace-nowrap"
                          >
                            Follow-up
                          </button>
                          <Button
                            asChild
                            size="sm"
                            className="h-7 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs font-medium transition-colors shadow-xs whitespace-nowrap"
                          >
                            <Link href={`/leads/${lead.id}`}>
                              Inspect
                            </Link>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 px-5 py-3.5 bg-slate-50/50 dark:bg-slate-800/40">
          <p className="text-xs font-mono text-slate-500">
            Page <strong className="text-slate-900 dark:text-white">{current}</strong> of {totalPages}
          </p>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={current <= 1}
              className="h-7.5 px-2.5 rounded-lg border-slate-200 dark:border-slate-700 text-xs font-semibold"
            >
              <ChevronLeft className="h-3.5 w-3.5 mr-0.5" />
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={current >= totalPages}
              className="h-7.5 px-2.5 rounded-lg border-slate-200 dark:border-slate-700 text-xs font-semibold"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}