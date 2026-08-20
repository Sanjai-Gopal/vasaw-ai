"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Plus, Pause, Play, Target, MoreHorizontal, Globe, MessageSquare, Users } from "lucide-react";
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
import { campaigns as initialCampaigns, campaignCategories, campaignLocations } from "@/lib/data/campaigns";
import { campaignStatusMeta } from "@/lib/status";
import { formatDate } from "@/lib/utils";
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

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date().toISOString();
    onCreated({
      id: `C-${Math.floor(200 + Math.random() * 900)}`,
      name: name || `${category} — ${location}`,
      category,
      location,
      leadTarget: Number(target) || 100,
      status: "draft",
      progress: 0,
      leadsCollected: 0,
      leadsQualified: 0,
      websitesBuilt: 0,
      websitesDeployed: 0,
      messagesSent: 0,
      minimumRating: Number(minRating) || 4.0,
      minimumReviews: Number(minReviews) || 25,
      websiteOpportunityRequirement: websiteOpp,
      socialPresenceRequirement: socialPresence,
      automationMode: autoMode,
      createdAt: now,
      updatedAt: now,
    });
    setName("");
    setTarget("100");
    setMinRating("4.0");
    setMinReviews("25");
    setWebsiteOpp(true);
    setSocialPresence(false);
    setAutoMode("semi-automatic");
    setOpen(false);
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
            <Button type="submit">Create campaign</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = React.useState<Campaign[]>(initialCampaigns);

  const toggleStatus = (id: string) => {
    setCampaigns((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              status: c.status === "active" ? "paused" : "active",
              updatedAt: new Date().toISOString(),
            }
          : c
      )
    );
  };

  const addCampaign = (campaign: Campaign) => {
    setCampaigns((prev) => [campaign, ...prev]);
  };

  const summary = campaigns.filter((c) => c.status === "active").length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        title="Campaigns"
        description={`${campaigns.length} campaigns · ${summary} active`}
      >
        <CreateCampaignDialog onCreated={addCampaign} />
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-2">
        {campaigns.map((campaign, index) => {
          const meta = statusVariant(campaign.status);
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
                    <Badge variant={meta.variant}>{meta.label}</Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="iconSm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => toggleStatus(campaign.id)}>
                          {campaign.status === "active" ? <Pause /> : <Play />}
                          {campaign.status === "active" ? "Pause campaign" : "Start campaign"}
                        </DropdownMenuItem>
                        <DropdownMenuItem>Duplicate campaign</DropdownMenuItem>
                        <DropdownMenuItem>Archive campaign</DropdownMenuItem>
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

                {campaign.status === "active" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 w-full gap-1.5"
                    onClick={() => toggleStatus(campaign.id)}
                  >
                    <Pause className="h-4 w-4" />
                    Pause campaign
                  </Button>
                )}
                {campaign.status === "paused" && (
                  <Button
                    variant="default"
                    size="sm"
                    className="mt-4 w-full gap-1.5"
                    onClick={() => toggleStatus(campaign.id)}
                  >
                    <Play className="h-4 w-4" />
                    Resume campaign
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