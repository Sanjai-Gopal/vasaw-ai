"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Plus, Pause, Play, Target, MoreHorizontal, Globe, MessageSquare, Users, Loader2, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
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
import { fetchCampaigns, createCampaign, executeCampaign, updateCampaignStatus } from "@/lib/api/campaigns";
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
  const [target, setTarget] = React.useState("100");
  const [minRating, setMinRating] = React.useState("4.0");
  const [minReviews, setMinReviews] = React.useState("25");
  const [websiteOpp, setWebsiteOpp] = React.useState(true);
  const [socialPresence, setSocialPresence] = React.useState(false);
  const [autoMode, setAutoMode] = React.useState<"manual" | "semi-automatic" | "automatic">("semi-automatic");
  const [submitting, setSubmitting] = React.useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const campaign = await createCampaign({
        name: name || `${category} — ${location}`,
        category,
        location,
        leadTarget: Number(target) || 100,
        automationMode: autoMode,
      });
      onCreated(campaign);
      setName("");
      setTarget("100");
      setOpen(false);
    } catch (err) {
      console.error("Failed to create campaign:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button id="create-campaign-trigger" className="gap-1.5">
          <Plus className="h-4 w-4" />
          Create campaign
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create campaign</DialogTitle>
          <DialogDescription>
            Set up a new acquisition campaign for a category and location.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="campaign-name">Campaign name</Label>
            <Input
              id="campaign-name"
              placeholder="e.g. Coimbatore Restaurants — Phase 2"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="campaign-category">Category</Label>
              <Select
                id="campaign-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {campaignCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="campaign-location">Location</Label>
              <Select
                id="campaign-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              >
                {campaignLocations.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="campaign-target">Lead target</Label>
            <Input
              id="campaign-target"
              type="number"
              min={10}
              value={target}
              onChange={(e) => setTarget(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="campaign-min-rating">Minimum rating</Label>
              <Input
                id="campaign-min-rating"
                type="number"
                min={1}
                max={5}
                step={0.1}
                value={minRating}
                onChange={(e) => setMinRating(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="campaign-min-reviews">Minimum reviews</Label>
              <Input
                id="campaign-min-reviews"
                type="number"
                min={0}
                value={minReviews}
                onChange={(e) => setMinReviews(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Automation mode</Label>
            <Select
              value={autoMode}
              onChange={(e) => setAutoMode(e.target.value as typeof autoMode)}
            >
              <option value="manual">Manual</option>
              <option value="semi-automatic">Semi-automatic</option>
              <option value="automatic">Automatic</option>
            </Select>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 p-3">
            <div>
              <p className="text-sm font-medium">Website opportunity required</p>
              <p className="text-xs text-muted-foreground">Only qualify leads without a website</p>
            </div>
            <Switch checked={websiteOpp} onCheckedChange={setWebsiteOpp} />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 p-3">
            <div>
              <p className="text-sm font-medium">Social presence required</p>
              <p className="text-xs text-muted-foreground">Only qualify leads with social media</p>
            </div>
            <Switch checked={socialPresence} onCheckedChange={setSocialPresence} />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              Create campaign
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = React.useState<Campaign[]>(defaultMockCampaigns);
  const [loading, setLoading] = React.useState(true);
  const [executingId, setExecutingId] = React.useState<string | null>(null);
  const [notification, setNotification] = React.useState<{ type: "success" | "error"; message: string } | null>(null);

  const refreshCampaigns = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchCampaigns();
      if (data && data.length > 0) {
        setCampaigns(data);
      }
    } catch (err) {
      console.warn("Failed to load campaigns from API, using fallback:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    let mounted = true;
    fetchCampaigns()
      .then((data) => {
        if (mounted && data && data.length > 0) {
          setCampaigns(data);
        }
      })
      .catch((err) => {
        console.warn("Failed to load campaigns from API, using fallback:", err);
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
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
        mode: "mock",
        locations: [campaign.location || "RS Puram"],
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
      // Local optimistic fallback
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

  const summary = campaigns.filter((c) => c.status === "active").length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        title="Campaigns"
        description={`${campaigns.length} campaigns · ${summary} active`}
      >
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refreshCampaigns} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <CreateCampaignDialog onCreated={addCampaign} />
        </div>
      </PageHeader>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`mb-6 flex items-center justify-between rounded-lg border p-4 text-sm ${
            notification.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border-destructive/30 bg-destructive/10 text-destructive"
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            ) : (
              <AlertCircle className="h-4 w-4 text-destructive" />
            )}
            <span>{notification.message}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => setNotification(null)}
          >
            Dismiss
          </Button>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {campaigns.map((campaign, index) => {
          const meta = statusVariant(campaign.status);
          const isExecuting = executingId === campaign.id;

          return (
            <motion.div
              key={campaign.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      {campaign.id}
                    </p>
                    <p className="mt-0.5 text-lg font-semibold">{campaign.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isExecuting ? (
                      <Badge variant="info" className="gap-1.5">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Running Agents…
                      </Badge>
                    ) : (
                      <Badge variant={meta.variant}>{meta.label}</Badge>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="iconSm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            if (campaign.status === "active") handlePauseCampaign(campaign);
                            else handleStartCampaign(campaign);
                          }}
                          disabled={isExecuting}
                        >
                          {campaign.status === "active" ? <Pause /> : <Play />}
                          {campaign.status === "active" ? "Pause campaign" : "Run campaign"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStartCampaign(campaign)} disabled={isExecuting}>
                          <RefreshCw /> Force Re-run
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge variant="outline" className="gap-1.5">
                    <Target className="h-3 w-3" />
                    {campaign.category}
                  </Badge>
                  <Badge variant="outline">📍 {campaign.location}</Badge>
                  <Badge variant="outline" className="gap-1">
                    <Users className="h-3 w-3" />
                    Target {campaign.leadTarget}
                  </Badge>
                </div>

                <div className="mt-5">
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-semibold">{campaign.progress}%</span>
                  </div>
                  <Progress
                    value={campaign.progress}
                    indicatorClassName={
                      campaign.progress === 100 ? "bg-emerald-500" : "bg-violet-500"
                    }
                  />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-lg border border-border bg-muted/40 p-2.5 text-center">
                    <p className="text-[11px] text-muted-foreground">Leads</p>
                    <p className="mt-0.5 text-sm font-semibold">
                      {campaign.leadsCollected}/{campaign.leadTarget}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/40 p-2.5 text-center">
                    <p className="text-[11px] text-muted-foreground">Qualified</p>
                    <p className="mt-0.5 text-sm font-semibold">{campaign.leadsQualified}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/40 p-2.5 text-center">
                    <p className="text-[11px] text-muted-foreground">Websites</p>
                    <p className="mt-0.5 text-sm font-semibold">{campaign.websitesBuilt}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/40 p-2.5 text-center">
                    <p className="text-[11px] text-muted-foreground">Messages</p>
                    <p className="mt-0.5 text-sm font-semibold">{campaign.messagesSent}</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Globe className="h-3.5 w-3.5" />
                      {campaign.websitesDeployed} deployed
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3.5 w-3.5" />
                      {campaign.messagesSent} sent
                    </span>
                  </span>
                  <span>Updated {formatDate(campaign.updatedAt)}</span>
                </div>

                {/* Direct Action Controls */}
                {campaign.status === "draft" && (
                  <Button
                    variant="default"
                    size="sm"
                    className="mt-4 w-full gap-1.5"
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
                        Start campaign
                      </>
                    )}
                  </Button>
                )}

                {campaign.status === "active" && (
                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1 gap-1.5"
                      disabled={isExecuting}
                      onClick={() => handleStartCampaign(campaign)}
                    >
                      {isExecuting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Running…
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4" />
                          Run batch
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isExecuting}
                      onClick={() => handlePauseCampaign(campaign)}
                    >
                      <Pause className="h-4 w-4" />
                      Pause
                    </Button>
                  </div>
                )}

                {campaign.status === "paused" && (
                  <Button
                    variant="default"
                    size="sm"
                    className="mt-4 w-full gap-1.5"
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
                        Resume campaign
                      </>
                    )}
                  </Button>
                )}

                {campaign.status === "completed" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 w-full gap-1.5"
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
                        <RefreshCw className="h-4 w-4" />
                        Re-run campaign
                      </>
                    )}
                  </Button>
                )}
              </Card>
            </motion.div>
          );
        })}

        <button
          onClick={() => document.getElementById("create-campaign-trigger")?.click()}
          className="flex min-h-[220px] items-center justify-center rounded-xl border border-dashed border-border text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
        >
          <div className="flex flex-col items-center gap-2">
            <Plus className="h-6 w-6" />
            <span className="text-sm font-medium">New campaign</span>
          </div>
        </button>
      </div>

      <Card className="mt-6">
        <CardContent className="flex items-center gap-3 p-4 text-sm text-muted-foreground">
          <Target className="h-4 w-4 shrink-0 text-primary" />
          Campaigns connect directly to the scraping pipeline. When activated, VASAW AI
          automatically scrapes leads for the selected category and location.
        </CardContent>
      </Card>
    </div>
  );
}