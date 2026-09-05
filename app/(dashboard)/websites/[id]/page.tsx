"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Globe,
  ExternalLink,
  RefreshCw,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Eye,
  Loader2,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { fetchWebsites, deployWebsite, rebuildWebsite } from "@/lib/api/websites";
import { formatDate } from "@/lib/utils";
import type { Website } from "@/lib/types";

export default function WebsiteDetailPage() {
  const params = useParams();
  const id = String(params?.id || "");

  const [website, setWebsite] = React.useState<Website | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);
  const [statusMsg, setStatusMsg] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  React.useEffect(() => {
    async function load() {
      try {
        const list = await fetchWebsites();
        const found = list.find((w) => w.id === id || w.leadId === id);
        if (found) {
          setWebsite(found);
        } else if (list.length > 0) {
          setWebsite(list[0]);
        }
      } catch (err) {
        console.error("Failed to load website details:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleDeploy = async () => {
    if (!website) return;
    setActionLoading("deploy");
    setStatusMsg(null);
    try {
      const res = await deployWebsite(website.id, "mock");
      if (res.ok) {
        setStatusMsg({ type: "success", text: `Website deployed successfully to ${res.url || "live URL"}` });
        setWebsite((prev) => prev ? { ...prev, status: "deployed", liveUrl: res.url || prev.previewUrl } : null);
      } else {
        setStatusMsg({ type: "error", text: "Deployment failed" });
      }
    } catch (err) {
      setStatusMsg({ type: "error", text: err instanceof Error ? err.message : "Deployment error" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRebuild = async () => {
    if (!website) return;
    setActionLoading("rebuild");
    setStatusMsg(null);
    try {
      const res = await rebuildWebsite(website.id, "mock");
      if (res.ok && res.website) {
        setStatusMsg({ type: "success", text: "Website rebuilt successfully" });
        setWebsite(res.website);
      } else {
        setStatusMsg({ type: "error", text: "Rebuild failed" });
      }
    } catch (err) {
      setStatusMsg({ type: "error", text: err instanceof Error ? err.message : "Rebuild error" });
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!website) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 py-8">
        <Link href="/websites" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Websites
        </Link>
        <div className="rounded-xl border p-12 text-center">
          <h3 className="text-base font-semibold">Website Not Found</h3>
          <p className="mt-1 text-sm text-muted-foreground">The requested website could not be found.</p>
        </div>
      </div>
    );
  }

  const liveLink = website.liveUrl || website.previewUrl;

  return (
    <div className="mx-auto max-w-5xl space-y-6 py-4">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <Link href="/websites" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-2">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Websites
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Globe className="h-6 w-6 text-primary" /> {website.businessName}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {website.category} • {website.location} • Template: <span className="capitalize font-medium text-foreground">{website.template}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRebuild}
            disabled={!!actionLoading}
            className="gap-1.5 text-xs"
          >
            {actionLoading === "rebuild" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Rebuild
          </Button>
          <Button
            size="sm"
            onClick={handleDeploy}
            disabled={!!actionLoading || website.status === "deployed"}
            className="gap-1.5 text-xs bg-gradient-to-r from-violet-600 to-cyan-600 text-white"
          >
            {actionLoading === "deploy" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UploadCloud className="h-3.5 w-3.5" />}
            {website.status === "deployed" ? "Deployed" : "Deploy Live"}
          </Button>
          {liveLink && (
            <a href={liveLink} target="_blank" rel="noopener noreferrer">
              <Button variant="secondary" size="sm" className="gap-1.5 text-xs">
                <ExternalLink className="h-3.5 w-3.5" /> View Live
              </Button>
            </a>
          )}
        </div>
      </div>

      {statusMsg && (
        <div
          className={`flex items-center gap-2.5 rounded-lg border p-3 text-xs ${
            statusMsg.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
              : "border-destructive/30 bg-destructive/10 text-destructive"
          }`}
        >
          {statusMsg.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Details & Pages Breakdown */}
        <div className="space-y-6 lg:col-span-2">
          {/* Status & Progress */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Build & Deployment Status</CardTitle>
                <Badge variant="outline" className="capitalize text-xs">
                  {website.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                  <span>Build Progress</span>
                  <span className="font-semibold text-foreground">{website.buildProgress ?? 100}%</span>
                </div>
                <Progress value={website.buildProgress ?? 100} className="h-2" />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                <div className="rounded-lg border bg-muted/40 p-3">
                  <p className="text-muted-foreground">Generated Pages</p>
                  <p className="mt-1 font-semibold text-foreground">{typeof website.pages === "number" ? website.pages : 3} Pages</p>
                  <p className="text-[11px] text-muted-foreground/80 mt-0.5">
                    home, about, services, contact
                  </p>
                </div>
                <div className="rounded-lg border bg-muted/40 p-3">
                  <p className="text-muted-foreground">UI Sections</p>
                  <p className="mt-1 font-semibold text-foreground">{typeof website.sections === "number" ? website.sections : 5} Sections</p>
                  <p className="text-[11px] text-muted-foreground/80 mt-0.5">
                    hero, features, gallery, testimonials, contact
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Interactive Preview Sandbox Card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Eye className="h-4 w-4 text-cyan-400" /> Live Preview Sandbox
                </CardTitle>
                {liveLink && (
                  <span className="text-[11px] text-muted-foreground font-mono truncate max-w-xs">
                    {liveLink}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border border-border/80 bg-background/50 overflow-hidden shadow-inner aspect-[16/10] flex flex-col">
                {/* Browser bar */}
                <div className="flex items-center gap-2 border-b bg-muted/70 px-3 py-2 text-xs text-muted-foreground">
                  <div className="flex gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
                    <div className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
                  </div>
                  <div className="flex-1 rounded bg-background/80 px-2 py-0.5 text-center font-mono text-[10px] truncate">
                    {liveLink || "https://preview.vasaw.app/"}
                  </div>
                </div>

                {/* Preview Content */}
                <div className="flex-1 p-6 flex flex-col justify-center items-center text-center bg-gradient-to-b from-background to-muted/20">
                  <Globe className="h-12 w-12 text-primary/40 mb-3" />
                  <h3 className="text-base font-bold text-foreground">{website.businessName}</h3>
                  <p className="text-xs text-muted-foreground max-w-md mt-1">
                    Custom {website.template} website rendered with responsive modern layouts, high-conversion CTA buttons, and optimized metadata.
                  </p>
                  {liveLink && (
                    <a
                      href={liveLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4"
                    >
                      <Button size="sm" className="gap-1.5 text-xs">
                        Open in New Window <ExternalLink className="h-3 w-3" />
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Col: Metadata & Quick Outreach */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Website Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Website ID</span>
                <span className="font-mono text-foreground">{website.id}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Lead ID</span>
                <Link href={`/leads/${website.leadId}`} className="text-primary hover:underline font-mono">
                  {website.leadId}
                </Link>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Template Type</span>
                <span className="capitalize font-medium text-foreground">{website.template}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Created Date</span>
                <span className="text-foreground">{formatDate(website.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Hosting Status</span>
                <span className="text-emerald-400 font-medium">Vercel Edge Ready</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4 text-primary" /> WhatsApp Outreach
              </CardTitle>
              <CardDescription className="text-xs">
                Contact the business owner with this published preview link.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/messages">
                <Button variant="outline" size="sm" className="w-full text-xs">
                  Go to Messages
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
