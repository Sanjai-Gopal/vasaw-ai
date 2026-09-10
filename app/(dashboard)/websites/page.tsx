"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Eye,
  ExternalLink,
  GitBranch,
  Globe,
  Layers,
  LayoutTemplate,
  Rocket,
  X,
  RefreshCw,
  Loader2,
  Search,
  Filter,
  CheckCircle2,
  Smartphone,
  Tablet,
  Laptop,
  ArrowUpRight,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { websiteStatusMeta } from "@/lib/status";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Website, WebsiteStatus } from "@/lib/types";

function MockPreview({ website, device }: { website: WebsiteApi; device: "desktop" | "tablet" | "mobile" }) {
  const gradient =
    website.category === "Restaurant" || website.category === "Cafe"
      ? "from-orange-500 via-amber-500 to-rose-600"
      : website.category === "Salon" || website.category === "Fitness"
        ? "from-fuchsia-600 via-purple-600 to-pink-600"
        : website.category === "Healthcare" || website.category === "Wellness"
          ? "from-emerald-500 via-teal-600 to-cyan-600"
          : website.category === "Education"
            ? "from-sky-500 via-blue-600 to-indigo-600"
            : "from-blue-600 via-indigo-600 to-violet-700";

  const deviceWidthClass =
    device === "mobile"
      ? "max-w-[320px] mx-auto"
      : device === "tablet"
        ? "max-w-[480px] mx-auto"
        : "w-full";

  const displayUrl = website.liveUrl || website.previewUrl || "https://preview.vasaw.app/";

  return (
    <div className={cn("overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl transition-all duration-300", deviceWidthClass)}>
      {/* Browser address bar */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-100/80 px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-rose-400" />
          <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        </div>
        <div className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1 font-mono text-[11px] text-slate-500 max-w-sm truncate">
          <ShieldCheck className="h-3 w-3 text-emerald-500 shrink-0" />
          <span className="truncate">{displayUrl}</span>
        </div>
        <div className="w-10" />
      </div>

      {/* Hero preview */}
      <div className={`flex min-h-[160px] flex-col items-center justify-center bg-gradient-to-br ${gradient} p-8 text-white`}>
        <span className="rounded-full bg-white/20 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider backdrop-blur-md">
          {website.category} · {website.location}
        </span>
        <h3 className="mt-3 text-center font-display text-2xl font-extrabold tracking-tight text-white drop-shadow-sm">
          {website.businessName}
        </h3>
        <p className="mt-1 text-center font-sans text-xs text-white/80 max-w-sm">
          Experience premium hospitality, craftsmanship, and verified local expertise.
        </p>
        <button className="mt-4 rounded-xl bg-white px-4 py-1.5 font-sans text-xs font-bold text-slate-900 shadow-md">
          Book Appointment / Order Now
        </button>
      </div>

      {/* Synthetic Section Previews */}
      <div className="space-y-4 p-5">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="h-3 w-32 rounded-full bg-slate-200" />
            <div className="h-2 w-20 rounded-full bg-slate-100" />
          </div>
          <span className="font-mono text-[10px] font-bold text-slate-400 uppercase">AST SYNTHESIZED</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col items-center justify-center rounded-xl border border-slate-100 bg-slate-50 p-3 text-center">
              <div className="h-6 w-6 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold font-mono">
                0{i}
              </div>
              <div className="mt-2 h-2 w-12 rounded-full bg-slate-200" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface WebsiteApi {
  id: string;
  leadId: string;
  businessName: string;
  category: string;
  location: string;
  status: WebsiteStatus;
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

export default function WebsitesPage() {
  const [websiteList, setWebsiteList] = React.useState<WebsiteApi[]>([]);
  const [preview, setPreview] = React.useState<WebsiteApi | null>(null);
  const [previewDevice, setPreviewDevice] = React.useState<"desktop" | "tablet" | "mobile">("desktop");
  const [actionId, setActionId] = React.useState<string | null>(null);
  const [actionType, setActionType] = React.useState<"deploy" | "rebuild" | null>(null);
  const [notification, setNotification] = React.useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [filterStatus, setFilterStatus] = React.useState<"all" | "deployed" | "building" | "failed">("all");

  const fetchData = React.useCallback(async () => {
    try {
      const res = await fetch("/api/websites");
      const data = await res.json();
      if (data.ok && Array.isArray(data.websites)) {
        setWebsiteList(data.websites);
        setError(null);
      } else {
        setError(data.error || "Failed to fetch websites");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const res = await fetch("/api/websites");
        const data = await res.json();
        if (!ignore) {
          if (data.ok && Array.isArray(data.websites)) {
            setWebsiteList(data.websites);
            setError(null);
          } else {
            setError(data.error || "Failed to fetch websites");
          }
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Unknown error");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }
    init();
    return () => {
      ignore = true;
    };
  }, []);

  const handleDeployWebsite = async (id: string) => {
    if (actionId) return;
    setActionId(id);
    setActionType("deploy");
    setNotification(null);
    try {
      const res = await fetch(`/api/websites/${id}/deploy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.ok && data.result) {
        const liveUrl = data.result.url || "";
        setWebsiteList((prev) =>
          prev.map((w) =>
            w.id === id
              ? {
                  ...w,
                  status: "deployed" as WebsiteStatus,
                  liveUrl: liveUrl || w.liveUrl,
                  buildProgress: 100,
                }
              : w
          )
        );
        setNotification({
          type: "success",
          text: `Website deployed successfully! Live URL: ${liveUrl || "Edge Production"}`,
        });
      } else {
        setNotification({
          type: "error",
          text: data.error || "Deployment failed to complete.",
        });
      }
    } catch (err) {
      setNotification({
        type: "error",
        text: err instanceof Error ? err.message : "Deployment network error",
      });
    } finally {
      setActionId(null);
      setActionType(null);
    }
  };

  const handleRebuildWebsite = async (id: string) => {
    if (actionId) return;
    setActionId(id);
    setActionType("rebuild");
    setNotification(null);
    try {
      const res = await fetch(`/api/websites/${id}/rebuild`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.ok) {
        setNotification({
          type: "success",
          text: "Website AST rebuilt successfully from updated lead data.",
        });
        await fetchData();
      } else {
        setNotification({
          type: "error",
          text: data.error || "Rebuild failed to complete.",
        });
      }
    } catch (err) {
      setNotification({
        type: "error",
        text: err instanceof Error ? err.message : "Rebuild network error",
      });
    } finally {
      setActionId(null);
      setActionType(null);
    }
  };


  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-white/70 border border-slate-200" />
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 pt-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-2xl bg-white/70 border border-slate-200" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !websiteList) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-12 text-center">
          <p className="font-display text-lg font-bold text-rose-600">Failed to load website fleet</p>
          <p className="mt-2 font-sans text-sm text-slate-500">{error || "Unknown error"}</p>
        </div>
      </div>
    );
  }

  const counts = {
    total: websiteList.length,
    building: websiteList.filter((w) => w.status === "building").length,
    deployed: websiteList.filter((w) => w.status === "deployed").length,
    failed: websiteList.filter((w) => w.status === "failed").length,
  };

  const filteredWebsites = websiteList.filter((w) => {
    const matchesSearch =
      (w.businessName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (w.category || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (w.location || "").toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (filterStatus === "deployed") return w.status === "deployed";
    if (filterStatus === "building") return w.status === "building";
    if (filterStatus === "failed") return w.status === "failed";
    return true;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 space-y-6">
      <PageHeader
        title="Websites Fleet"
        description="Autonomous Next.js 16 Edge synthesis, AST generation, and Vercel production deployment."
      >
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 font-sans"
            onClick={fetchData}
            disabled={loading}
          >
            <RefreshCw className={cn("h-3.5 w-3.5 text-slate-500", loading && "animate-spin")} />
            Sync Fleet
          </Button>
        </div>
      </PageHeader>

      {/* Notification Banner */}
      {notification && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "flex items-center justify-between rounded-2xl border p-4 shadow-sm backdrop-blur-md",
            notification.type === "success"
              ? "border-emerald-200 bg-emerald-50/80 text-emerald-800"
              : "border-rose-200 bg-rose-50/80 text-rose-800"
          )}
        >
          <div className="flex items-center gap-2.5 text-xs font-sans font-medium">
            {notification.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <X className="h-4 w-4 text-rose-600 shrink-0" />
            )}
            <span>{notification.text}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs font-sans"
            onClick={() => setNotification(null)}
          >
            Dismiss
          </Button>
        </motion.div>
      )}

      {/* Porcelain Telemetry Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Synthesized Sites", value: counts.total, sub: "Total autonomous builds", color: "text-slate-950", accent: "from-blue-500 to-indigo-500" },
          { label: "Active Pipelines", value: counts.building, sub: "Compiling AST & assets", color: "text-blue-600", accent: "from-blue-400 to-cyan-400" },
          { label: "Live on Edge SLA", value: counts.deployed, sub: "Production Vercel URLs", color: "text-emerald-600", accent: "from-emerald-400 to-teal-500" },
          { label: "AST Exceptions", value: counts.failed, sub: "Requires auto-rebuild", color: "text-rose-600", accent: "from-rose-400 to-pink-500" },
        ].map((s) => (
          <div
            key={s.label}
            className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-md transition-all duration-200 hover-lift"
          >
            <div className={cn("absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r opacity-70", s.accent)} />
            <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-400">{s.label}</p>
            <p className={cn("mt-1.5 font-display text-3xl font-extrabold tracking-tight", s.color)}>{s.value}</p>
            <p className="mt-1 font-sans text-xs text-slate-500">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Porcelain Filter & Search Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200/80 bg-white/90 p-3 shadow-sm backdrop-blur-md">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search business name, category, or location…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-slate-50/70 border-slate-200 text-xs font-sans placeholder:text-slate-400 rounded-xl"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(["all", "deployed", "building", "failed"] as const).map((status) => (
            <Button
              key={status}
              variant={filterStatus === status ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilterStatus(status)}
              className={cn(
                "capitalize text-xs font-sans rounded-xl h-8 px-3",
                filterStatus === status
                  ? "bg-slate-900 text-white font-semibold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              )}
            >
              {status}
              <span className="ml-1.5 font-mono text-[10px] opacity-75">
                ({status === "all" ? websiteList.length : websiteList.filter((w) => w.status === status).length})
              </span>
            </Button>
          ))}
        </div>
      </div>

      {/* Empty State */}
      {filteredWebsites.length === 0 && (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-xs">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-3 border border-blue-200">
            <Globe className="h-6 w-6" />
          </div>
          <h3 className="font-display text-base font-bold text-slate-950">No Websites Found</h3>
          <p className="mt-1 font-sans text-xs text-slate-500 max-w-md mx-auto">
            {searchQuery || filterStatus !== "all"
              ? "No synthesized websites match your search or filter criteria. Try resetting filters."
              : "No websites have been synthesized yet. Launch a campaign to scrape and qualify local business prospects."}
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            {searchQuery || filterStatus !== "all" ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setFilterStatus("all");
                }}
                className="font-sans text-xs"
              >
                Reset Filters
              </Button>
            ) : (
              <Button asChild size="sm" className="bg-blue-600 text-white font-sans text-xs hover:bg-blue-700">
                <a href="/campaigns">Launch Campaign</a>
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Website Cards Grid */}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filteredWebsites.map((website, index) => {
          const meta = websiteStatusMeta[website.status] || { label: website.status || "Queued", variant: "default" as const };
          const isBusy = actionId === website.id;

          return (
            <motion.div
              key={website.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.04 }}
            >
              <div className="relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 p-5 shadow-sm backdrop-blur-md transition-all duration-200 hover-lift">
                {/* Top Accent Line */}
                <div
                  className={cn(
                    "absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r",
                    website.status === "deployed"
                      ? "from-emerald-400 to-teal-500"
                      : website.status === "building"
                        ? "from-blue-500 to-cyan-400"
                        : "from-slate-400 to-slate-500"
                  )}
                />

                <div>
                  {/* Card Header & Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-slate-50 text-blue-600 shadow-xs">
                        <Globe className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <a href={`/websites/${website.id}`} className="truncate font-display text-base font-bold text-slate-950 hover:text-blue-600 transition-colors block">
                          {website.businessName || "Untitled Project"}
                        </a>
                        <p className="font-sans text-xs text-slate-500">
                          {website.category || "General"} · {website.location || "Coimbatore"}
                        </p>
                      </div>
                    </div>
                    <Badge variant={meta.variant}>{meta.label}</Badge>
                  </div>

                  {/* Badges / Tech Specs */}
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    <Badge variant="outline" className="gap-1 font-mono text-[10px] text-slate-600 border-slate-200">
                      <LayoutTemplate className="h-3 w-3 text-slate-400" />
                      {website.template || "corporate-v2"}
                    </Badge>
                    <Badge variant="outline" className="gap-1 font-mono text-[10px] text-slate-600 border-slate-200">
                      <Layers className="h-3 w-3 text-slate-400" />
                      {website.pages ?? 1}p · {website.sections ?? 4}s
                    </Badge>
                    <Badge variant="outline" className="font-mono text-[10px] text-slate-600 border-slate-200">
                      Next.js 16 Edge
                    </Badge>
                  </div>

                  {/* Build Progress Bar */}
                  <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                    <div className="mb-1.5 flex items-center justify-between font-sans text-xs">
                      <span className="font-medium text-slate-500">AST Compilation</span>
                      <span className="font-mono font-bold text-slate-800">{website.buildProgress ?? 0}%</span>
                    </div>
                    <Progress
                      value={website.buildProgress ?? 0}
                      indicatorClassName={
                        website.status === "failed"
                          ? "bg-rose-500"
                          : website.status === "deployed"
                            ? "bg-emerald-500"
                            : "bg-blue-600"
                      }
                    />
                  </div>

                  {/* Telemetry URL Links */}
                  <div className="mt-4 space-y-1.5 font-mono text-[11px]">
                    {website.liveUrl ? (
                      <a
                        href={website.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-1.5 text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{website.liveUrl.replace("https://", "")}</span>
                        <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                    ) : (
                      <p className="flex items-center gap-1.5 text-slate-400">
                        <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                        Awaiting Edge Provisioning
                      </p>
                    )}
                    {website.repoUrl ? (
                      <a
                        href={website.repoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900"
                      >
                        <GitBranch className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        <span className="truncate">{website.repoUrl.replace("https://github.com/", "")}</span>
                      </a>
                    ) : (
                      <p className="flex items-center gap-1.5 text-slate-400">
                        <GitBranch className="h-3.5 w-3.5 shrink-0" />
                        Private Git Shadow AST
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-t border-slate-100 pt-3">
                  <span className="font-mono text-[10px] text-slate-400 truncate">
                    Created {formatDate(website.createdAt)}
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1 text-xs font-sans h-7 px-2.5"
                      onClick={() => setPreview(website)}
                    >
                      <Eye className="h-3.5 w-3.5 text-slate-500" />
                      Preview
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1 text-xs font-sans h-7 px-2.5"
                      disabled={isBusy}
                      onClick={() => handleRebuildWebsite(website.id)}
                    >
                      {isBusy && actionType === "rebuild" ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
                      ) : (
                        <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
                      )}
                      Rebuild
                    </Button>
                    {website.status !== "deployed" && (
                      <Button
                        size="sm"
                        className="gap-1 text-xs font-sans h-7 px-2.5 bg-slate-900 text-white hover:bg-slate-800"
                        disabled={isBusy}
                        onClick={() => handleDeployWebsite(website.id)}
                      >
                        {isBusy && actionType === "deploy" ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Rocket className="h-3.5 w-3.5" />
                        )}
                        Deploy
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>


      {/* Interactive Live Preview Dialog */}
      <Dialog open={preview !== null} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent className="max-w-3xl rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-2xl backdrop-blur-xl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="flex items-center gap-2 font-display text-xl font-bold text-slate-950">
                  <Eye className="h-5 w-5 text-blue-600" />
                  Live Preview — {preview?.businessName}
                </DialogTitle>
                <DialogDescription className="font-sans text-xs text-slate-500">
                  {preview?.template} template · {preview?.pages} pages · Autonomous kinetic synthesis preview
                </DialogDescription>
              </div>

              {/* Viewport switcher */}
              <div className="flex items-center rounded-xl border border-slate-200 bg-slate-100/80 p-1">
                <button
                  onClick={() => setPreviewDevice("desktop")}
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-lg transition-colors",
                    previewDevice === "desktop" ? "bg-white shadow-xs text-blue-600" : "text-slate-500 hover:text-slate-900"
                  )}
                  title="Desktop View"
                >
                  <Laptop className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPreviewDevice("tablet")}
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-lg transition-colors",
                    previewDevice === "tablet" ? "bg-white shadow-xs text-blue-600" : "text-slate-500 hover:text-slate-900"
                  )}
                  title="Tablet View"
                >
                  <Tablet className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPreviewDevice("mobile")}
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-lg transition-colors",
                    previewDevice === "mobile" ? "bg-white shadow-xs text-blue-600" : "text-slate-500 hover:text-slate-900"
                  )}
                  title="Mobile View"
                >
                  <Smartphone className="h-4 w-4" />
                </button>
              </div>
            </div>
          </DialogHeader>

          <div className="py-2">
            {preview && <MockPreview website={preview} device={previewDevice} />}
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 pt-4">
            <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500">
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              <span>Next.js 16 App Router · Tailwind CSS · React 19</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setPreview(null)} className="font-sans text-xs">
                <X className="h-4 w-4 mr-1" />
                Close
              </Button>
              {preview?.liveUrl && (
                <Button asChild className="bg-blue-600 text-white font-sans text-xs hover:bg-blue-700">
                  <a href={preview.liveUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-1.5" />
                    Open Live Production
                  </a>
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}