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
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
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
import { leads as initialLeads } from "@/lib/data/leads";
import { websites } from "@/lib/data/websites";
import { messages } from "@/lib/data/messages";
import { leadStatusMeta, websiteStatusMeta, messageStatusMeta } from "@/lib/status";
import type { LeadPriority } from "@/lib/types";

const PAGE_SIZE = 8;

type SortKey = "aiScore" | "rating" | "reviews" | "businessName";
type SortDir = "asc" | "desc";

const priorityVariant: Record<LeadPriority, "destructive" | "warning" | "muted"> = {
  high: "destructive",
  medium: "warning",
  low: "muted",
};

const statusOptions = Object.entries(leadStatusMeta);
const categories = Array.from(new Set(initialLeads.map((l) => l.category))).sort();

function ScoreRing({ score }: { score: number }) {
  const color = score >= 80 ? "text-emerald-400" : score >= 60 ? "text-amber-400" : "text-rose-400";
  return (
    <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-current text-xs font-bold ${color}`}>
      {score}
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

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = initialLeads.filter((lead) => {
      if (status !== "all" && lead.status !== status) return false;
      if (priority !== "all" && lead.priority !== priority) return false;
      if (category !== "all" && lead.category !== category) return false;
      if (q) {
        const haystack = `${lead.businessName} ${lead.category} ${lead.location} ${lead.scraped.address}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    list = [...list].sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortKey === "businessName") return a.businessName.localeCompare(b.businessName) * dir;
      return (a[sortKey] - b[sortKey]) * dir;
    });
    return list;
  }, [search, status, priority, category, sortKey, sortDir]);

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
        <ArrowUp className="h-3.5 w-3.5" />
      ) : (
        <ArrowDown className="h-3.5 w-3.5" />
      )
    ) : (
      <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
    );

  const resetFilters = () => {
    setSearch("");
    setStatus("all");
    setPriority("all");
    setCategory("all");
    setPage(1);
  };

  const hasFilters = search || status !== "all" || priority !== "all" || category !== "all";

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        title="Leads"
        description={`${initialLeads.length} businesses discovered · ${filtered.length} matching current filters`}
      />

      <Card className="mb-4 p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_repeat(3,minmax(150px,auto))]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by business, category, location…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9"
            />
          </div>
          <Select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by status"
          >
            <option value="all">All statuses</option>
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
          >
            <option value="all">All priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </Select>
          <Select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by category"
          >
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>
        {hasFilters && (
          <button
            onClick={resetFilters}
            className="mt-3 flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            <X className="h-3.5 w-3.5" />
            Clear all filters
          </button>
        )}
      </Card>

      <Card>
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Lead table
          </p>
          <p className="text-xs text-muted-foreground">
            Showing {(current - 1) * PAGE_SIZE + 1}–{Math.min(current * PAGE_SIZE, filtered.length)} of{" "}
            {filtered.length}
          </p>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Business</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>
                <button
                  onClick={() => toggleSort("rating")}
                  className="flex items-center gap-1 uppercase tracking-wider hover:text-foreground"
                >
                  Rating {renderSortIcon("rating")}
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => toggleSort("reviews")}
                  className="flex items-center gap-1 uppercase tracking-wider hover:text-foreground"
                >
                  Reviews {renderSortIcon("reviews")}
                </button>
              </TableHead>
              <TableHead>Website</TableHead>
              <TableHead>
                <button
                  onClick={() => toggleSort("aiScore")}
                  className="flex items-center gap-1 uppercase tracking-wider hover:text-foreground"
                >
                  AI Score {renderSortIcon("aiScore")}
                </button>
              </TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Website</TableHead>
              <TableHead>Outreach</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageItems.map((lead) => {
              const meta = leadStatusMeta[lead.status];
              const leadWebsite = websites.find((w) => w.leadId === lead.id);
              const leadMessages = messages.filter((m) => m.leadId === lead.id);
              const latestMessage = leadMessages.length > 0
                ? [...leadMessages].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
                : null;
              return (
                <TableRow key={lead.id} className="cursor-pointer">
                  <TableCell>
                    <Link href={`/leads/${lead.id}`} className="group flex items-center gap-2">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-muted text-[10px] font-bold uppercase text-muted-foreground">
                        {lead.businessName.slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium group-hover:text-primary">
                          {lead.businessName}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {lead.location}
                        </p>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{lead.category}</TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1 font-medium">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      {lead.rating.toFixed(1)}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{lead.reviews}</TableCell>
                  <TableCell>
                    {lead.website ? (
                      <a
                        href="#"
                        onClick={(e) => e.preventDefault()}
                        className="flex max-w-[150px] items-center gap-1 text-xs text-info hover:underline"
                      >
                        <ExternalLink className="h-3 w-3 shrink-0" />
                        <span className="truncate">{lead.website}</span>
                      </a>
                    ) : (
                      <Badge variant="outline">None</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <ScoreRing score={lead.aiScore} />
                  </TableCell>
                  <TableCell>
                    <Badge variant={priorityVariant[lead.priority]}>
                      {lead.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={meta.variant}>{meta.label}</Badge>
                  </TableCell>
                  <TableCell>
                    {leadWebsite ? (
                      <Badge variant={websiteStatusMeta[leadWebsite.status].variant}>
                        {websiteStatusMeta[leadWebsite.status].label}
                      </Badge>
                    ) : (
                      <Badge variant="muted">None</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {latestMessage ? (
                      <Badge variant={messageStatusMeta[latestMessage.status].variant}>
                        {messageStatusMeta[latestMessage.status].label}
                      </Badge>
                    ) : (
                      <Badge variant="muted">Not contacted</Badge>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
            {pageItems.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} className="h-32 text-center text-muted-foreground">
                  No leads match the current filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <div className="flex items-center justify-between border-t border-border px-4 py-3">
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            disabled={current <= 1}
            onClick={() => setPage(current - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`h-8 w-8 rounded-md text-xs font-medium transition-colors ${
                  p === current
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            disabled={current >= totalPages}
            onClick={() => setPage(current + 1)}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mt-4 text-center text-xs text-muted-foreground"
      >
        Click any business row to open the full lead profile.
      </motion.div>
    </div>
  );
}