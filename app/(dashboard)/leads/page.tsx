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
  }, [search, status, priority, category, sortKey, sortDir, leads]);

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
    setPage(1);
  };

  const hasFilters = search || status !== "all" || priority !== "all" || category !== "all";

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
    <div className="mx-auto max-w-[1520px] px-4 py-6 sm:px-8">
      <PageHeader
        title="Leads Intelligence Engine"
        description={`${leads.length} entities discovered • ${filtered.length} matching operational filters`}
      >
        <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-8 shadow-xs">
          <Link href="/campaigns">Scrape New Zone</Link>
        </Button>
      </PageHeader>

      {/* Top 3 Metric Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 hover-lift shadow-[0_2px_8px_rgba(15,23,42,0.03)] flex items-center justify-between">
          <div>
            <p className="text-[12px] font-semibold text-slate-500">Discovered Cohort</p>
            <p className="mt-1 text-[26px] font-bold font-mono text-slate-950 leading-none">
              {leads.length}
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 hover-lift shadow-[0_2px_8px_rgba(15,23,42,0.03)] flex items-center justify-between">
          <div>
            <p className="text-[12px] font-semibold text-slate-500">High-Value ICP (Hot Tier)</p>
            <p className="mt-1 text-[26px] font-bold font-mono text-emerald-700 leading-none">
              {hotLeadsCount}
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 hover-lift shadow-[0_2px_8px_rgba(15,23,42,0.03)] flex items-center justify-between">
          <div>
            <p className="text-[12px] font-semibold text-slate-500">Missing Digital Presence</p>
            <p className="mt-1 text-[26px] font-bold font-mono text-amber-700 leading-none">
              {noWebsiteCount}
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
            <Globe className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Controls Card */}
      <div className="mb-6 p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
        <div className="grid gap-3 md:grid-cols-[1fr_repeat(3,minmax(160px,auto))]">
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by business, category, address..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-10 h-9.5 rounded-xl bg-slate-50/70 border-slate-200 focus:bg-white text-[13px] font-sans"
            />
          </div>

          <Select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by status"
            className="h-9.5 rounded-xl bg-slate-50/70 border-slate-200 text-[12.5px] font-sans"
          >
            <option value="all">All Lifecycle Statuses</option>
            {statusOptions.map(([key, meta]) => (
              <option key={key} value={key}>
                {meta.label}
              </option>
            ))}
          </Select>

          <Select
            value={priority}
            onChange={(e) => {
              setPriority(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by priority"
            className="h-9.5 rounded-xl bg-slate-50/70 border-slate-200 text-[12.5px] font-sans"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </Select>

          <Select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by category"
            className="h-9.5 rounded-xl bg-slate-50/70 border-slate-200 text-[12.5px] font-sans"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>

        {hasFilters && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-mono">
              Filtered: <strong className="text-slate-900">{filtered.length}</strong> of {leads.length}
            </span>
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-800 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              Reset All Filters
            </button>
          </div>
        )}
      </div>

      {/* Leads Table Container */}
      <div className="rounded-2xl bg-white border border-slate-200/90 overflow-hidden shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 bg-slate-50/50">
          <p className="flex items-center gap-2 text-[12px] font-mono font-bold uppercase tracking-wider text-slate-500">
            <SlidersHorizontal className="h-3.5 w-3.5 text-blue-600" />
            Active Records Stream
          </p>
          <p className="text-[11.5px] font-mono text-slate-500 font-medium">
            Showing {(current - 1) * PAGE_SIZE + 1}–{Math.min(current * PAGE_SIZE, filtered.length)} of{" "}
            <span className="text-slate-900 font-bold">{filtered.length}</span>
          </p>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/80 border-b border-slate-200/80">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-mono text-[11px] font-bold text-slate-500 uppercase tracking-wider">Business Entity</TableHead>
                <TableHead className="font-mono text-[11px] font-bold text-slate-500 uppercase tracking-wider">Category</TableHead>
                <TableHead className="font-mono text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <button
                    onClick={() => toggleSort("rating")}
                    className="flex items-center gap-1 group hover:text-slate-900"
                  >
                    Rating {renderSortIcon("rating")}
                  </button>
                </TableHead>
                <TableHead className="font-mono text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <button
                    onClick={() => toggleSort("reviews")}
                    className="flex items-center gap-1 group hover:text-slate-900"
                  >
                    Reviews {renderSortIcon("reviews")}
                  </button>
                </TableHead>
                <TableHead className="font-mono text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <button
                    onClick={() => toggleSort("aiScore")}
                    className="flex items-center gap-1 group hover:text-slate-900"
                  >
                    AI Score {renderSortIcon("aiScore")}
                  </button>
                </TableHead>
                <TableHead className="font-mono text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</TableHead>
                <TableHead className="font-mono text-[11px] font-bold text-slate-500 uppercase tracking-wider">Synthesized Site</TableHead>
                <TableHead className="font-mono text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100 font-sans">
              {pageItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-slate-400 font-mono text-xs">
                    No leads matching current search parameters
                  </TableCell>
                </TableRow>
              ) : (
                pageItems.map((lead) => {
                  const leadWebsite = websites.find((w) => w.leadId === lead.id);
                  const name = lead.businessName || "Unknown Business";
                  const initials = (name.trim() || "UN").slice(0, 2).toUpperCase();

                  return (
                    <TableRow
                      key={lead.id}
                      className="hover:bg-blue-50/30 transition-colors group cursor-pointer"
                    >
                      <TableCell className="py-3">
                        <Link href={`/leads/${lead.id}`} className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/70 text-[11px] font-mono font-bold text-blue-700 shadow-xs">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-[13.5px] text-slate-900 group-hover:text-blue-600 transition-colors">
                              {name}
                            </p>
                            <p className="truncate text-[11.5px] text-slate-500 font-mono">
                              {lead.location || lead.scraped?.address || "Worldwide (Global)"}
                            </p>
                          </div>
                        </Link>
                      </TableCell>

                      <TableCell className="text-[12.5px] text-slate-600 font-medium">
                        {lead.category || "General"}
                      </TableCell>

                      <TableCell>
                        <span className="inline-flex items-center gap-1 font-mono text-[12px] font-bold text-slate-800">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          {(lead.rating ?? 0).toFixed(1)}
                        </span>
                      </TableCell>

                      <TableCell className="font-mono text-[12px] text-slate-600">
                        {lead.reviews ?? 0}
                      </TableCell>

                      <TableCell>
                        <ScoreBadge score={lead.aiScore ?? 0} />
                      </TableCell>

                      <TableCell>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {lead.status}
                        </span>
                      </TableCell>

                      <TableCell>
                        {leadWebsite ? (
                          <Link
                            href={`/websites/${leadWebsite.id}`}
                            className="inline-flex items-center gap-1 text-[11.5px] font-mono font-bold text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            <Globe className="w-3.5 h-3.5" />
                            <span>Preview Demo</span>
                          </Link>
                        ) : (
                          <span className="text-[11px] font-mono text-slate-400">—</span>
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2.5 text-[11.5px] font-bold text-blue-600 hover:bg-blue-50"
                        >
                          <Link href={`/leads/${lead.id}`}>
                            Inspect →
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3.5 bg-slate-50/50">
          <p className="text-[11.5px] font-mono text-slate-500">
            Page <strong className="text-slate-900">{current}</strong> of {totalPages}
          </p>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={current <= 1}
              className="h-7.5 px-2.5 rounded-lg border-slate-200 text-xs font-semibold"
            >
              <ChevronLeft className="h-3.5 w-3.5 mr-0.5" />
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={current >= totalPages}
              className="h-7.5 px-2.5 rounded-lg border-slate-200 text-xs font-semibold"
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