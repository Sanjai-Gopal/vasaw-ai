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
  ShieldCheck,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { fetchWebsites, deployWebsite, rebuildWebsite } from "@/lib/api/websites";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
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
      const res = await fetch(`/api/websites/${website.id}/deploy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.ok && data.result) {
        const liveUrl = data.result.url || "";
        setStatusMsg({ type: "success", text: `Website deployed successfully to ${liveUrl || "Edge Production"}` });
        setWebsite((prev) => (prev ? { ...prev, status: "deployed", liveUrl: liveUrl || prev.liveUrl } : null));
      } else {
        setStatusMsg({ type: "error", text: data.error || "Deployment failed to complete." });
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
      const res = await fetch(`/api/websites/${website.id}/rebuild`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.ok) {
        setStatusMsg({ type: "success", text: "Website AST rebuilt successfully from updated lead data." });
        const list = await fetchWebsites();
        const found = list.find((w) => w.id === id || w.leadId === id);
        if (found) setWebsite(found);
      } else {
        setStatusMsg({ type: "error", text: data.error || "Rebuild failed" });
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
        <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!website) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 py-8 px-4">
        <Link href="/websites" className="inline-flex items-center gap-1.5 text-xs font-sans text-slate-500 hover:text-slate-900">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Websites Fleet
        </Link>
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-xs">
          <h3 className="font-display text-lg font-bold text-slate-950">Website Not Found</h3>
          <p className="mt-1 font-sans text-xs text-slate-500">The requested website could not be found or has not been synthesized yet.</p>
        </div>
      </div>
    );
  }

  const isDeployed = website.status === "deployed";
  const liveLink = isDeployed ? website.liveUrl : undefined;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link href="/websites" className="inline-flex items-center gap-1.5 text-xs font-sans font-semibold text-slate-500 hover:text-slate-900">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Websites Fleet
            </Link>
            {website.leadId && (
              <Link href={`/leads/${website.leadId}`} className="inline-flex items-center gap-1.5 text-xs font-sans font-semibold text-blue-600 hover:underline">
                View Lead Profile →
              </Link>
            )}
          </div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-slate-950 flex items-center gap-2.5">
            <Globe className="h-6 w-6 text-blue-600" /> {website.businessName}
          </h1>
          <p className="font-sans text-xs text-slate-500 mt-0.5">
            {website.category} • {website.location} • Template: <span className="capitalize font-bold font-mono text-slate-800">{website.template}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRebuild}
            disabled={!!actionLoading}
            className="gap-1.5 text-xs font-sans rounded-xl bg-white border-slate-200"
          >
            {actionLoading === "rebuild" ? <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" /> : <RefreshCw className="h-3.5 w-3.5 text-slate-500" />}
            Rebuild AST
          </Button>
          {!isDeployed && (
            <Button
              size="sm"
              onClick={handleDeploy}
              disabled={!!actionLoading}
              className="gap-1.5 text-xs font-sans rounded-xl bg-slate-900 text-white hover:bg-slate-800"
            >
              {actionLoading === "deploy" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UploadCloud className="h-3.5 w-3.5" />}
              Deploy to Vercel
            </Button>
          )}
          {liveLink && (
            <a href={liveLink} target="_blank" rel="noopener noreferrer">
              <Button size="sm" className="gap-1.5 text-xs font-sans rounded-xl bg-blue-600 text-white hover:bg-blue-700">
                <ExternalLink className="h-3.5 w-3.5" /> View Live Production
              </Button>
            </a>
          )}
        </div>
      </div>


      {statusMsg && (
        <div
          className={cn(
            "flex items-center gap-2.5 rounded-2xl border p-3.5 text-xs font-sans shadow-xs",
            statusMsg.type === "success"
              ? "border-emerald-200 bg-emerald-50/80 text-emerald-800"
              : "border-rose-200 bg-rose-50/80 text-rose-800"
          )}
        >
          {statusMsg.type === "success" ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertCircle className="h-4 w-4 text-rose-600" />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Details & Pages Breakdown */}
        <div className="space-y-6 lg:col-span-2">
          {/* Status & Progress */}
          <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-sm backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <h3 className="font-display text-base font-bold text-slate-950">Build & Edge Deployment Status</h3>
              <Badge variant="outline" className="capitalize font-mono text-[11px] text-emerald-700 border-emerald-200 bg-emerald-50">
                {website.status}
              </Badge>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-sans text-slate-500 mb-1.5">
                  <span className="font-medium">AST Build Completion</span>
                  <span className="font-mono font-bold text-slate-800">{website.buildProgress ?? 100}%</span>
                </div>
                <Progress value={website.buildProgress ?? 100} className="h-2" />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5">
                  <p className="font-mono text-[10px] font-bold text-slate-400 uppercase">Generated Pages</p>
                  <p className="mt-1 font-mono text-base font-bold text-slate-900">{typeof website.pages === "number" ? website.pages : 3} Pages</p>
                  <p className="font-sans text-[11px] text-slate-500 mt-0.5">
                    home, about, services, contact
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5">
                  <p className="font-mono text-[10px] font-bold text-slate-400 uppercase">UI Sections</p>
                  <p className="mt-1 font-mono text-base font-bold text-slate-900">{typeof website.sections === "number" ? website.sections : 5} Sections</p>
                  <p className="font-sans text-[11px] text-slate-500 mt-0.5">
                    hero, features, gallery, reviews, booking
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Preview Sandbox Card */}
          <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-sm backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <h3 className="font-display text-base font-bold text-slate-950 flex items-center gap-2">
                <Eye className="h-4 w-4 text-blue-600" /> Live Preview Sandbox
              </h3>
              {liveLink && (
                <span className="font-mono text-[11px] text-slate-400 truncate max-w-xs">
                  {liveLink}
                </span>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm aspect-[16/10] flex flex-col">
              {/* Browser bar */}
              <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-2.5 text-xs text-slate-400">
                <div className="flex gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                  <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                </div>
                <div className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1 text-center font-mono text-[11px] text-slate-600 truncate flex items-center justify-center gap-1.5">
                  <ShieldCheck className="h-3 w-3 text-emerald-500" />
                  {liveLink || "https://preview.vasaw.app/"}
                </div>
              </div>

              {/* Preview Content */}
              <div className="flex-1 p-8 flex flex-col justify-center items-center text-center bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 text-white">
                <Globe className="h-12 w-12 text-white/40 mb-3" />
                <h3 className="font-display text-2xl font-extrabold tracking-tight text-white">{website.businessName}</h3>
                <p className="font-sans text-xs text-white/80 max-w-md mt-1">
                  Custom {website.template} website synthesized with Next.js 16 App Router, responsive modern layouts, high-conversion CTA booking triggers, and edge cache optimization.
                </p>
                {liveLink && (
                  <a
                    href={liveLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-5"
                  >
                    <Button size="sm" className="gap-1.5 text-xs font-sans rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-bold shadow-md">
                      Open in Full Window <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Metadata & Quick Outreach */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-sm backdrop-blur-md">
            <h3 className="font-display text-base font-bold text-slate-950 mb-4">Website Telemetry Details</h3>
            <div className="space-y-3 text-xs font-sans">
              <div className="flex justify-between border-b border-slate-100 pb-2.5">
                <span className="text-slate-500">Website ID</span>
                <span className="font-mono font-bold text-slate-800">{website.id}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2.5">
                <span className="text-slate-500">Lead Association</span>
                <Link href={`/leads/${website.leadId}`} className="text-blue-600 hover:underline font-mono font-bold">
                  {website.leadId}
                </Link>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2.5">
                <span className="text-slate-500">Template Type</span>
                <span className="capitalize font-bold text-slate-900 font-mono">{website.template}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2.5">
                <span className="text-slate-500">Created Date</span>
                <span className="font-mono text-slate-700">{formatDate(website.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Edge Hosting Status</span>
                <span className="text-emerald-600 font-bold font-mono">Vercel Edge Ready</span>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-blue-200/70 bg-blue-50/50 p-6 shadow-sm backdrop-blur-md">
            <h3 className="font-display text-base font-bold text-slate-950 flex items-center gap-2 mb-1">
              <MessageSquare className="h-4 w-4 text-blue-600" /> WhatsApp Outreach
            </h3>
            <p className="font-sans text-xs text-slate-600 mb-4">
              Dispatch a personalized WhatsApp preview message to the business owner.
            </p>
            <Link href="/messages">
              <Button size="sm" className="w-full text-xs font-sans rounded-xl bg-slate-900 text-white hover:bg-slate-800">
                Go to Outreach Console
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
