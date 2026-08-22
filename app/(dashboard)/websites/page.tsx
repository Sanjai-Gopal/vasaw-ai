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
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import type { Website, WebsiteStatus } from "@/lib/types";

function MockPreview({ website }: { website: Website }) {
  const gradient =
    website.category === "Restaurant" || website.category === "Cafe"
      ? "from-orange-600/40 via-amber-600/20 to-zinc-900"
      : website.category === "Salon" || website.category === "Fitness"
        ? "from-fuchsia-600/40 via-purple-600/20 to-zinc-900"
        : website.category === "Healthcare" || website.category === "Wellness"
          ? "from-emerald-600/40 via-teal-600/20 to-zinc-900"
          : website.category === "Education"
            ? "from-sky-600/40 via-blue-600/20 to-zinc-900"
            : "from-violet-600/40 via-indigo-600/20 to-zinc-900";

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-zinc-950">
      <div className={`flex h-40 items-center justify-center bg-gradient-to-br ${gradient} p-6`}>
        <p className="text-center text-xl font-bold text-white">{website.businessName}</p>
      </div>
      <div className="space-y-3 p-5">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          {website.category} · {website.location}
        </p>
        <div className="flex gap-2">
          <span className="h-2.5 w-16 rounded-full bg-zinc-700" />
          <span className="h-2.5 w-12 rounded-full bg-zinc-800" />
          <span className="h-2.5 w-14 rounded-full bg-zinc-700" />
        </div>
        <div className="flex gap-2">
          <span className="h-2 w-24 rounded-full bg-zinc-800" />
          <span className="h-2 w-20 rounded-full bg-zinc-800" />
        </div>
        <div className="grid grid-cols-3 gap-2 pt-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-14 rounded-md bg-zinc-900" />
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
  const [rebuildingId, setRebuildingId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/websites");
        const data = await res.json();
        if (data.ok && Array.isArray(data.websites)) {
          setWebsiteList(data.websites);
        } else {
          setError(data.error || "Failed to fetch websites");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const rebuildWebsite = (id: string) => {
    if (rebuildingId) return;
    setRebuildingId(id);
    setWebsiteList((prev) =>
      prev.map((w) =>
        w.id === id ? { ...w, status: "building" as WebsiteStatus, buildProgress: 0 } : w
      )
    );

    let progress = 0;
    const interval = setInterval(() => {
      progress += 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setWebsiteList((prev) =>
          prev.map((w) =>
            w.id === id
              ? { ...w, status: "built" as WebsiteStatus, buildProgress: 100, builtAt: new Date().toISOString() }
              : w
          )
        );
        setRebuildingId(null);
      } else {
        setWebsiteList((prev) =>
          prev.map((w) =>
            w.id === id ? { ...w, buildProgress: Math.min(99, Math.round(progress)) } : w
          )
        );
      }
    }, 500);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-24 animate-pulse bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !websiteList) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="text-center py-12">
          <p className="text-rose-400">Failed to load websites</p>
          <p className="text-muted-foreground mt-2">{error || "Unknown error"}</p>
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

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        title="Websites"
        description={`${counts.total} generated · ${counts.deployed} live in production`}
      >
        <Button className="gap-1.5">
          <Rocket className="h-4 w-4" />
          Deploy queue
        </Button>
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        {[
          { label: "Generated", value: counts.total, className: "text-violet-400" },
          { label: "Building", value: counts.building, className: "text-sky-400" },
          { label: "Deployed", value: counts.deployed, className: "text-emerald-400" },
          { label: "Failed", value: counts.failed, className: "text-rose-400" },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`mt-1 text-2xl font-bold ${s.className}`}>{s.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {websiteList.map((website, index) => {
          const meta = websiteStatusMeta[website.status];
          return (
            <motion.div
              key={website.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.04 }}
            >
              <Card className="flex h-full flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-muted">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-semibold leading-tight">{website.businessName}</p>
                      <p className="text-xs text-muted-foreground">
                        {website.category} · {website.location}
                      </p>
                    </div>
                  </div>
                  <Badge variant={meta.variant}>{meta.label}</Badge>
                </div>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  <Badge variant="outline" className="gap-1">
                    <LayoutTemplate className="h-3 w-3" />
                    {website.template}
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <Layers className="h-3 w-3" />
                    {website.pages} pages · {website.sections} sections
                  </Badge>
                </div>

                <div className="mt-4">
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Build progress</span>
                    <span className="font-medium">{website.buildProgress}%</span>
                  </div>
                  <Progress
                    value={website.buildProgress}
                    indicatorClassName={
                      website.status === "failed"
                        ? "bg-rose-500"
                        : website.status === "deployed"
                          ? "bg-emerald-500"
                          : "bg-violet-500"
                    }
                  />
                </div>

                <div className="mt-4 space-y-2 text-xs">
                  {website.liveUrl ? (
                    <a
                      href={website.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-info hover:underline"
                    >
                      <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{website.liveUrl.replace("https://", "")}</span>
                    </a>
                  ) : (
                    <p className="flex items-center gap-1.5 text-muted-foreground">
                      <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                      Not deployed yet
                    </p>
                  )}
                  {website.repoUrl ? (
                    <a
                      href={website.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
                    >
                      <GitBranch className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{website.repoUrl.replace("https://github.com/", "")}</span>
                    </a>
                  ) : (
                    <p className="flex items-center gap-1.5 text-muted-foreground/70">
                      <GitBranch className="h-3.5 w-3.5 shrink-0" />
                      No repository yet
                    </p>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                  <span className="text-[11px] text-muted-foreground">
                    Created {formatDate(website.createdAt)}
                  </span>
                  <div className="flex gap-1.5">
                    {(website.status === "built" || website.status === "deployed") && (
                      <Button variant="outline" size="sm" className="gap-1" onClick={() => setPreview(website)}>
                        <Eye className="h-3.5 w-3.5" />
                        Preview
                      </Button>
                    )}
                    {(website.status === "built" || website.status === "failed") && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        disabled={rebuildingId === website.id}
                        onClick={() => rebuildWebsite(website.id)}
                      >
                        {rebuildingId === website.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3.5 w-3.5" />
                        )}
                        Rebuild
                      </Button>
                    )}
                    {website.status === "built" && (
                      <Button size="sm" className="gap-1">
                        <Rocket className="h-3.5 w-3.5" />
                        Deploy
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <Dialog open={preview !== null} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary" />
              Preview — {preview?.businessName}
            </DialogTitle>
            <DialogDescription>
              {preview?.template} template · {preview?.pages} pages · generated site preview
            </DialogDescription>
          </DialogHeader>
          {preview && <MockPreview website={preview as Website} />}
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={() => setPreview(null)}>
              <X className="h-4 w-4" />
              Close
            </Button>
            {preview?.liveUrl && (
              <Button asChild>
                <a href={preview.liveUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  Open live site
                </a>
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}