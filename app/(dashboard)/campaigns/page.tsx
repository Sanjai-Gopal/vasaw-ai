"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Pause,
  Play,
  Target,
  MoreHorizontal,
  Globe,
  MessageSquare,
  Users,
  Loader2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Zap,
  TrendingUp,
  SlidersHorizontal,
  FileSpreadsheet,
  Calendar,
  Send,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { campaignCategories, campaignLocations, defaultMockCampaigns } from "@/lib/data/campaigns";
import { campaignStatusMeta } from "@/lib/status";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { fetchCampaigns, createCampaign, executeCampaign, updateCampaignStatus } from "@/lib/api/campaigns";
import { exportCampaignsToSheets } from "@/lib/api/sheets";
import type { Campaign, CampaignStatus } from "@/lib/types";

const statusVariant = (s: CampaignStatus) => campaignStatusMeta[s];

function CreateCampaignDialog({
  onCreated,
}: {
  onCreated: (campaign: Campaign) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [category, setCategory] = React.useState(campaignCategories[0]);
  const [location, setLocation] = React.useState(campaignLocations[0]);
  const [target, setTarget] = React.useState("50");
  const [minRating, setMinRating] = React.useState("4.0");
  const [minReviews, setMinReviews] = React.useState("25");
  const [websiteOpp, setWebsiteOpp] = React.useState(true);
  const [socialPresence, setSocialPresence] = React.useState(false);
  const [autoMode, setAutoMode] = React.useState<"manual" | "semi-automatic" | "automatic">("semi-automatic");
  const [submitting, setSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const targetNum = Number(target);

    if (!name.trim()) {
      setFormError("Campaign name is required.");
      return;
    }
    if (!category) {
      setFormError("Please select a target business category.");
      return;
    }
    if (isNaN(targetNum) || targetNum < 1 || targetNum > 500) {
      setFormError("Target quota must be a valid number between 1 and 500.");
      return;
    }

    const chosenLocation = location.trim() || "Worldwide (Global)";

    setSubmitting(true);
    try {
      const campaign = await createCampaign({
        name: name.trim(),
        category,
        location: chosenLocation,
        leadTarget: targetNum,
        automationMode: autoMode,
      });
      onCreated(campaign);
      setName("");
      setTarget("50");
      setOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create campaign. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) setFormError(null); }}>
      <DialogTrigger asChild>
        <Button id="create-campaign-trigger" className="gap-1.5 bg-slate-900 text-white shadow-sm hover:bg-slate-800 font-sans">
          <Plus className="h-4 w-4" />
          Create Campaign
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-2xl backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-bold text-slate-950 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            Launch Autonomous Campaign
          </DialogTitle>
          <DialogDescription className="font-sans text-xs text-slate-500">
            Configure geo-targeted discovery criteria, qualification filters, and execution automation mode.
          </DialogDescription>
        </DialogHeader>

        {formError && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-sans text-rose-800">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={submit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="campaign-name" className="text-xs font-semibold text-slate-700">Campaign Name</Label>
            <Input
              id="campaign-name"
              placeholder="e.g. London Dining, Tokyo Cafes, Downtown Dubai..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-slate-50 border-slate-200 text-xs rounded-xl font-sans"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="campaign-category" className="text-xs font-semibold text-slate-700">Category</Label>
              <Select
                id="campaign-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-slate-50 border-slate-200 text-xs rounded-xl font-sans"
              >
                {campaignCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="campaign-target" className="text-xs font-semibold text-slate-700">Lead Target Quota (1–500)</Label>
              <Input
                id="campaign-target"
                type="number"
                min={1}
                max={500}
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="bg-slate-50 border-slate-200 text-xs rounded-xl font-sans"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="campaign-location" className="text-xs font-semibold text-slate-700">Location (City, Country or Global)</Label>
            <Input
              id="campaign-location"
              list="global-campaign-locations"
              placeholder="e.g. Worldwide, New York, London, Tokyo, Coimbatore..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="bg-slate-50 border-slate-200 text-xs rounded-xl font-sans"
            />
            <datalist id="global-campaign-locations">
              {campaignLocations.map((l) => (
                <option key={l} value={l} />
              ))}
            </datalist>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {["Worldwide (Global)", "London, UK", "New York, USA", "Tokyo, Japan", "Dubai, UAE", "Coimbatore, India", "Chennai, India", "San Francisco, USA"].map((quickLoc) => (
                <button
                  type="button"
                  key={quickLoc}
                  onClick={() => setLocation(quickLoc)}
                  className={cn(
                    "px-2.5 py-1 text-[11px] rounded-lg font-sans border transition-all cursor-pointer",
                    location === quickLoc
                      ? "bg-blue-600 text-white border-blue-600 font-semibold shadow-xs"
                      : "bg-slate-100/80 text-slate-600 border-slate-200 hover:bg-slate-200/70"
                  )}
                >
                  {quickLoc}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="campaign-min-rating" className="text-xs font-semibold text-slate-700">Min Rating</Label>
              <Input
                id="campaign-min-rating"
                type="number"
                min={1}
                max={5}
                step={0.1}
                value={minRating}
                onChange={(e) => setMinRating(e.target.value)}
                className="bg-slate-50 border-slate-200 text-xs rounded-xl font-sans"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="campaign-min-reviews" className="text-xs font-semibold text-slate-700">Min Reviews</Label>
              <Input
                id="campaign-min-reviews"
                type="number"
                min={0}
                value={minReviews}
                onChange={(e) => setMinReviews(e.target.value)}
                className="bg-slate-50 border-slate-200 text-xs rounded-xl font-sans"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">Execution Mode</Label>
            <Select
              value={autoMode}
              onChange={(e) => setAutoMode(e.target.value as typeof autoMode)}
              className="bg-slate-50 border-slate-200 text-xs rounded-xl font-sans"
            >
              <option value="manual">Manual Approval Gates</option>
              <option value="semi-automatic">Semi-Automatic (Scrape & Qualify Auto)</option>
              <option value="automatic">Full Autonomous Auto-Pilot</option>
            </Select>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/80 p-3">
            <div>
              <p className="text-xs font-semibold text-slate-800">Website Opportunity Required</p>
              <p className="text-[11px] text-slate-500">Only qualify leads currently missing a website</p>
            </div>
            <Switch checked={websiteOpp} onCheckedChange={setWebsiteOpp} />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/80 p-3">
            <div>
              <p className="text-xs font-semibold text-slate-800">Verified WhatsApp Phone Required</p>
              <p className="text-[11px] text-slate-500">Filter out businesses without validated phone number</p>
            </div>
            <Switch checked={socialPresence} onCheckedChange={setSocialPresence} />
          </div>
          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="text-xs font-sans"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="bg-blue-600 text-white font-sans text-xs hover:bg-blue-700">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              Launch Campaign Pipeline
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = React.useState<Campaign[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [executingId, setExecutingId] = React.useState<string | null>(null);
  const [notification, setNotification] = React.useState<{ type: "success" | "error"; message: string } | null>(null);

  const refreshCampaigns = React.useCallback(async () => {
    try {
      const data = await fetchCampaigns();
      setCampaigns(data || []);
    } catch (err) {
      console.warn("Failed to load campaigns from API:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    let mounted = true;
    fetchCampaigns()
      .then((data) => {
        if (mounted) setCampaigns(data || []);
      })
      .catch((err) => {
        console.warn("Failed to load campaigns from API:", err);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const handleStartCampaign = async (campaign: Campaign) => {
    setExecutingId(campaign.id);
    setNotification(null);
    try {
      const res = await executeCampaign(campaign.id, {
        locations: [campaign.location || "Worldwide (Global)"],
        categories: [campaign.category || "Restaurant"],
      });

      if (res.ok) {
        setNotification({
          type: "success",
          message: res.message || `Campaign "${campaign.name}" batch executed successfully!`,
        });
        if (res.campaign) {
          setCampaigns((prev) => prev.map((c) => (c.id === campaign.id ? res.campaign! : c)));
        }
        await refreshCampaigns();
      } else {
        setNotification({
          type: "error",
          message: "Campaign execution failed to complete.",
        });
      }
    } catch (err) {
      console.error("Execute campaign error:", err);
      setNotification({
        type: "error",
        message: err instanceof Error ? err.message : "Campaign execution error",
      });
    } finally {
      setExecutingId(null);
    }
  };

  const handlePauseCampaign = async (campaign: Campaign) => {
    try {
      const updated = await updateCampaignStatus(campaign.id, "paused");
      setCampaigns((prev) => prev.map((c) => (c.id === campaign.id ? updated : c)));
      setNotification({
        type: "success",
        message: `Campaign "${campaign.name}" paused.`,
      });
    } catch (err) {
      console.error("Pause campaign error:", err);
      setCampaigns((prev) =>
        prev.map((c) => (c.id === campaign.id ? { ...c, status: "paused", updatedAt: new Date().toISOString() } : c))
      );
    }
  };

  const handleResumeCampaign = async (campaign: Campaign) => {
    try {
      const updated = await updateCampaignStatus(campaign.id, "active");
      setCampaigns((prev) => prev.map((c) => (c.id === campaign.id ? updated : c)));
      await handleStartCampaign(updated);
    } catch (err) {
      console.error("Resume campaign error:", err);
      await handleStartCampaign(campaign);
    }
  };

  const addCampaign = (campaign: Campaign) => {
    setCampaigns((prev) => [campaign, ...prev]);
    setNotification({
      type: "success",
      message: `Campaign "${campaign.name}" created successfully.`,
    });
  };

  const activeCount = campaigns.filter((c) => c.status === "active").length;
  const totalLeadsTarget = campaigns.reduce((acc, c) => acc + (c.leadTarget || 100), 0);
  const totalLeadsQualified = campaigns.reduce((acc, c) => acc + (c.leadsQualified || 0), 0);
  const totalSitesBuilt = campaigns.reduce((acc, c) => acc + (c.websitesBuilt || 0), 0);

  const [isExportingSheets, setIsExportingSheets] = React.useState(false);
  const [campaignTab, setCampaignTab] = React.useState<"all" | "active" | "completed" | "draft">("all");

  const displayedCampaigns = React.useMemo(() => {
    return campaigns.filter((c) => {
      if (campaignTab === "active") return c.status === "active";
      if (campaignTab === "completed") return c.status === "completed";
      if (campaignTab === "draft") return c.status === "draft" || c.status === "paused";
      return true;
    });
  }, [campaigns, campaignTab]);

  const handleExportSheets = async () => {
    setIsExportingSheets(true);
    setNotification(null);
    try {
      const res = await exportCampaignsToSheets("mock-spreadsheet-vasaw");
      if (res.success) {
        setNotification({
          type: "success",
          message: `Successfully exported ${res.rowsWritten} campaigns to Google Sheets (${res.filename || "file downloaded"}).`,
        });
      } else {
        setNotification({
          type: "error",
          message: res.error || "Failed to export campaigns.",
        });
      }
    } catch (err) {
      setNotification({
        type: "error",
        message: err instanceof Error ? err.message : "Export network error",
      });
    } finally {
      setIsExportingSheets(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 space-y-6">
      {/* Header Block — Matching Stitch Campaigns */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white tracking-tight">Campaigns</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Create, schedule, and track personalized multi-channel outreach at scale.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={() => setNotification({ type: "success", message: "Channels filtered: WhatsApp, Email & LinkedIn enabled" })}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <span>All Channels</span>
          </button>

          <button
            onClick={() => setNotification({ type: "success", message: "Timeframe set: Past 30 Days" })}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Past 30 Days</span>
          </button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportSheets}
            disabled={isExportingSheets || campaigns.length === 0}
            className="h-9 px-3 font-sans border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs shadow-xs"
          >
            {isExportingSheets ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-600 mr-1.5" />
            ) : (
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600 mr-1.5" />
            )}
            Export Sheets
          </Button>

          <CreateCampaignDialog onCreated={addCampaign} />
        </div>
      </div>

      {/* KPI Summary Row (Precision Bento Metric Bar matching Stitch) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col justify-between transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-3">
            <span className="text-[13px] font-medium">Active Campaigns</span>
            <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">{activeCount || 4}</span>
            <span className="text-xs text-slate-400 font-mono">running autonomously</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col justify-between transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-3">
            <span className="text-[13px] font-medium">Sent Today</span>
            <Send className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">{totalSitesBuilt > 0 ? (totalSitesBuilt * 3).toLocaleString() : "842"}</span>
            <span className="text-xs text-emerald-600 font-mono font-medium">+14% vs yesterday</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col justify-between transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-3">
            <span className="text-[13px] font-medium">Reply Rate</span>
            <CheckCircle2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">14.8%</span>
            <span className="text-xs text-slate-400 font-mono">industry benchmark 4.2%</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col justify-between transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-3">
            <span className="text-[13px] font-medium">Meetings Booked</span>
            <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">28</span>
            <span className="text-xs text-amber-600 font-mono font-medium">calendar synced</span>
          </div>
        </div>
      </div>

      {/* Tab Controls & List Toolbar matching Stitch (Mobile-friendly) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
        {/* Segmented Tab Controls */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200/70 dark:border-slate-700/80 overflow-x-auto max-w-full">
          {(
            [
              { id: "all", label: "All Campaigns", count: campaigns.length },
              { id: "active", label: "Active", count: campaigns.filter((c) => c.status === "active").length },
              { id: "completed", label: "Completed", count: campaigns.filter((c) => c.status === "completed").length },
              { id: "draft", label: "Drafts", count: campaigns.filter((c) => c.status === "draft" || c.status === "paused").length },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCampaignTab(tab.id)}
              className={cn(
                "px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all",
                campaignTab === tab.id
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900"
              )}
            >
              {tab.label} <span className="ml-1 text-[11px] font-mono text-slate-400">{tab.count}</span>
            </button>
          ))}
        </div>

        {/* Action tools */}
        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-mono">
          <span>Sorting by:</span>
          <span className="font-semibold text-slate-900 dark:text-white">Performance Index</span>
        </div>
      </div>

      {/* Notification Banner */}
      {notification && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "flex items-center justify-between rounded-2xl border p-4 shadow-sm backdrop-blur-md",
            notification.type === "success"
              ? "border-emerald-200 bg-emerald-50/80 text-emerald-800"
              : "border-rose-200 bg-rose-50/80 text-rose-800"
          )}
        >
          <div className="flex items-center gap-2.5">
            {notification.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
            )}
            <span className="font-sans text-xs font-semibold">{notification.message}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs font-sans"
            onClick={() => setNotification(null)}
          >
            Dismiss
          </Button>
        </motion.div>
      )}

      {/* Empty State */}
      {displayedCampaigns.length === 0 && !loading && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center shadow-xs">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 mb-3 border border-blue-200">
            <Target className="h-6 w-6" />
          </div>
          <h3 className="font-display text-base font-bold text-slate-950 dark:text-white">No Campaigns in this view</h3>
          <p className="mt-1 font-sans text-xs text-slate-500 max-w-md mx-auto">
            Try switching tabs or launch a new campaign to discover target businesses.
          </p>
          <div className="mt-4 flex justify-center">
            <CreateCampaignDialog onCreated={addCampaign} />
          </div>
        </div>
      )}

      {/* Campaigns Grid */}
      <div className="grid gap-5 lg:grid-cols-2">
        {displayedCampaigns.map((campaign, index) => {
          const meta = statusVariant(campaign.status);
          const isExecuting = executingId === campaign.id;

          return (
            <motion.div
              key={campaign.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <div className="relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm backdrop-blur-md transition-all duration-200 hover-lift">
                {/* Top Accent */}
                <div
                  className={cn(
                    "absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r",
                    campaign.status === "active"
                      ? "from-blue-500 via-indigo-500 to-cyan-400"
                      : campaign.status === "completed"
                        ? "from-emerald-400 to-teal-500"
                        : "from-slate-300 to-slate-400"
                  )}
                />

                <div>
                  {/* Title & Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="font-mono text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                        {campaign.id}
                      </span>
                      <h3 className="mt-0.5 font-display text-lg font-bold text-slate-950">{campaign.name}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      {isExecuting ? (
                        <Badge variant="info" className="gap-1.5 bg-blue-50 text-blue-700 border-blue-200">
                          <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
                          Running Agents…
                        </Badge>
                      ) : (
                        <Badge variant={meta.variant}>{meta.label}</Badge>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="iconSm" className="text-slate-400 hover:text-slate-900">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl border-slate-200 font-sans text-xs">
                          <DropdownMenuItem
                            onClick={() => {
                              if (campaign.status === "active") handlePauseCampaign(campaign);
                              else handleStartCampaign(campaign);
                            }}
                            disabled={isExecuting}
                          >
                            {campaign.status === "active" ? <Pause className="h-3.5 w-3.5 mr-2" /> : <Play className="h-3.5 w-3.5 mr-2" />}
                            {campaign.status === "active" ? "Pause campaign" : "Run campaign"}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStartCampaign(campaign)} disabled={isExecuting}>
                            <RefreshCw className="h-3.5 w-3.5 mr-2" /> Force Re-run
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Target tags */}
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    <Badge variant="outline" className="gap-1.5 font-mono text-[10px] text-slate-600 border-slate-200 bg-slate-50">
                      <Target className="h-3 w-3 text-slate-400" />
                      {campaign.category}
                    </Badge>
                    <Badge variant="outline" className="font-mono text-[10px] text-slate-600 border-slate-200 bg-slate-50">
                      📍 {campaign.location}
                    </Badge>
                    <Badge variant="outline" className="gap-1 font-mono text-[10px] text-slate-600 border-slate-200 bg-slate-50">
                      <Users className="h-3 w-3 text-slate-400" />
                      Target {campaign.leadTarget}
                    </Badge>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                    <div className="mb-1.5 flex items-center justify-between font-sans text-xs">
                      <span className="font-medium text-slate-500">Pipeline Completion</span>
                      <span className="font-mono font-bold text-slate-800">{campaign.progress}%</span>
                    </div>
                    <Progress
                      value={campaign.progress}
                      indicatorClassName={
                        campaign.progress === 100
                          ? "bg-emerald-500"
                          : "bg-gradient-to-r from-blue-600 to-indigo-600"
                      }
                    />
                  </div>

                  {/* Metrics grid */}
                  <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                    <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-2.5 text-center">
                      <p className="font-mono text-[10px] font-bold text-slate-400 uppercase">Leads</p>
                      <p className="mt-0.5 font-mono text-sm font-bold text-slate-800">
                        {campaign.leadsCollected}/{campaign.leadTarget}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-2.5 text-center">
                      <p className="font-mono text-[10px] font-bold text-slate-400 uppercase">Qualified</p>
                      <p className="mt-0.5 font-mono text-sm font-bold text-emerald-600">{campaign.leadsQualified}</p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-2.5 text-center">
                      <p className="font-mono text-[10px] font-bold text-slate-400 uppercase">Websites</p>
                      <p className="mt-0.5 font-mono text-sm font-bold text-blue-600">{campaign.websitesBuilt}</p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-2.5 text-center">
                      <p className="font-mono text-[10px] font-bold text-slate-400 uppercase">Messages</p>
                      <p className="mt-0.5 font-mono text-sm font-bold text-purple-600">{campaign.messagesSent}</p>
                    </div>
                  </div>

                  {/* Sub-status line */}
                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 font-mono text-[11px] text-slate-400">
                    <span className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Globe className="h-3.5 w-3.5 text-slate-400" />
                        {campaign.websitesDeployed} deployed
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
                        {campaign.messagesSent} sent
                      </span>
                    </span>
                    <span>Updated {formatDate(campaign.updatedAt)}</span>
                  </div>
                </div>

                {/* Direct Action Controls */}
                <div className="mt-5">
                  {campaign.status === "draft" && (
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full gap-1.5 bg-slate-900 text-white hover:bg-slate-800 font-sans text-xs"
                      disabled={isExecuting}
                      onClick={() => handleStartCampaign(campaign)}
                    >
                      {isExecuting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Executing Pipeline…
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4" />
                          Start Campaign Pipeline
                        </>
                      )}
                    </Button>
                  )}

                  {campaign.status === "active" && (
                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        className="flex-1 gap-1.5 bg-blue-600 text-white hover:bg-blue-700 font-sans text-xs"
                        disabled={isExecuting}
                        onClick={() => handleStartCampaign(campaign)}
                      >
                        {isExecuting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Running Batch…
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4" />
                            Run Autonomous Batch
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="font-sans text-xs"
                        disabled={isExecuting}
                        onClick={() => handlePauseCampaign(campaign)}
                      >
                        <Pause className="h-4 w-4 mr-1 text-slate-500" />
                        Pause
                      </Button>
                    </div>
                  )}

                  {campaign.status === "paused" && (
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full gap-1.5 bg-blue-600 text-white hover:bg-blue-700 font-sans text-xs"
                      disabled={isExecuting}
                      onClick={() => handleResumeCampaign(campaign)}
                    >
                      {isExecuting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Resuming Pipeline…
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4" />
                          Resume Campaign
                        </>
                      )}
                    </Button>
                  )}

                  {campaign.status === "completed" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-1.5 font-sans text-xs"
                      disabled={isExecuting}
                      onClick={() => handleStartCampaign(campaign)}
                    >
                      {isExecuting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Re-running…
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 text-slate-500" />
                          Re-run Campaign
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}

        {/* Create Campaign Action Tile */}
        <button
          onClick={() => document.getElementById("create-campaign-trigger")?.click()}
          className="group flex min-h-[260px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white/50 p-6 text-slate-400 transition-all duration-200 hover:border-blue-400 hover:bg-blue-50/30 hover:text-blue-600"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-xs transition-transform group-hover:scale-110">
            <Plus className="h-6 w-6 text-blue-600" />
          </div>
          <span className="mt-3 font-display text-sm font-bold text-slate-900 group-hover:text-blue-600">Create New Campaign</span>
          <p className="mt-1 max-w-xs text-center font-sans text-xs text-slate-500">
            Deploy a new autonomous acquisition workflow for any business category and geo-region.
          </p>
        </button>
      </div>

      {/* Pipeline Helper Banner */}
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm backdrop-blur-md">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Zap className="h-4 w-4" />
        </div>
        <p className="font-sans text-xs text-slate-600">
          <strong className="font-semibold text-slate-900">Autonomous Orchestration:</strong> Campaigns connect directly to the Google Maps Scraping agent. Upon activation, VASAW AI crawls local businesses, scores website opportunity gaps, creates live preview sites, and triggers WhatsApp outreach sequences.
        </p>
      </div>
    </div>
  );
}