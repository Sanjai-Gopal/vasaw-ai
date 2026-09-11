"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Laptop,
  Tablet,
  Smartphone,
  ExternalLink,
  ArrowLeft,
  RefreshCw,
  Eye,
  ShieldCheck,
  Zap,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type DeviceMode = "desktop" | "tablet" | "mobile";

export default function WebsitePreviewPage() {
  const params = useParams();
  const id = String(params?.id || "");

  const [device, setDevice] = React.useState<DeviceMode>("desktop");
  const [iframeKey, setIframeKey] = React.useState(0);
  const [showBar, setShowBar] = React.useState(true);
  const [businessName, setBusinessName] = React.useState("Live Website Preview");
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadMeta() {
      try {
        const res = await fetch(`/api/websites`);
        const json = await res.json();
        if (json.ok && Array.isArray(json.websites)) {
          const found = json.websites.find(
            (w: { id: string; leadId?: string }) => w.id === id || w.leadId === id
          );
          if (found) {
            setBusinessName(found.businessName);
          }
        }
      } catch (err) {
        console.warn("Could not fetch website metadata:", err);
      } finally {
        setLoading(false);
      }
    }
    if (id) loadMeta();
  }, [id]);

  const previewUrl = `/api/websites/${id}/html`;

  return (
    <div className="flex h-screen w-screen flex-col bg-slate-900 text-white overflow-hidden selection:bg-blue-600">
      {/* Top Preview Dock */}
      {showBar && (
        <header className="z-50 flex h-14 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-950/95 px-4 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <Link href="/websites">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 rounded-lg text-xs font-sans text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Console
              </Button>
            </Link>
            <div className="h-4 w-[1px] bg-slate-800" />
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <h1 className="font-display text-sm font-bold tracking-tight text-slate-100 truncate max-w-xs sm:max-w-md">
                {businessName}
              </h1>
              <Badge
                variant="outline"
                className="hidden sm:inline-flex border-emerald-500/30 bg-emerald-500/10 text-[10px] font-mono font-semibold text-emerald-400"
              >
                Live Edge Preview
              </Badge>
            </div>
          </div>

          {/* Device Switcher */}
          <div className="flex items-center rounded-xl border border-slate-800 bg-slate-900/90 p-1 shadow-inner">
            <button
              onClick={() => setDevice("desktop")}
              className={cn(
                "flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-xs font-sans font-medium transition-colors",
                device === "desktop"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-slate-200"
              )}
              title="Desktop View (100%)"
            >
              <Laptop className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Desktop</span>
            </button>
            <button
              onClick={() => setDevice("tablet")}
              className={cn(
                "flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-xs font-sans font-medium transition-colors",
                device === "tablet"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-slate-200"
              )}
              title="Tablet View (768px)"
            >
              <Tablet className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Tablet</span>
            </button>
            <button
              onClick={() => setDevice("mobile")}
              className={cn(
                "flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-xs font-sans font-medium transition-colors",
                device === "mobile"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-slate-200"
              )}
              title="Mobile View (390px)"
            >
              <Smartphone className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Mobile</span>
            </button>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIframeKey((k) => k + 1)}
              className="h-8 w-8 p-0 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              title="Reload preview"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
            <a href={previewUrl} target="_blank" rel="noopener noreferrer">
              <Button
                size="sm"
                className="h-8 gap-1.5 rounded-lg bg-slate-800 text-xs font-sans font-semibold text-white hover:bg-slate-700 border border-slate-700"
              >
                <span>Standalone</span>
                <ExternalLink className="h-3 w-3" />
              </Button>
            </a>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBar(false)}
              className="h-8 px-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200 text-xs"
              title="Hide top bar"
            >
              <ChevronUp className="h-3.5 w-3.5" />
            </Button>
          </div>
        </header>
      )}

      {/* Floating restore button when top bar is hidden */}
      {!showBar && (
        <button
          onClick={() => setShowBar(true)}
          className="fixed top-3 right-4 z-50 flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-900/90 px-3 py-1.5 text-xs font-sans text-slate-200 shadow-xl backdrop-blur-md hover:bg-slate-800"
        >
          <ChevronDown className="h-3.5 w-3.5" /> Show Controls
        </button>
      )}

      {/* Main Preview Container */}
      <main className="relative flex flex-1 items-center justify-center overflow-auto bg-slate-950 p-0 sm:p-4">
        <div
          className={cn(
            "relative h-full transition-all duration-300 ease-in-out flex flex-col bg-white overflow-hidden",
            device === "desktop" && "w-full rounded-none sm:rounded-xl shadow-2xl border border-slate-800",
            device === "tablet" && "w-[768px] max-w-[95vw] rounded-3xl shadow-2xl border-4 border-slate-700 my-4",
            device === "mobile" && "w-[390px] max-w-[95vw] rounded-[40px] shadow-2xl border-8 border-slate-800 my-4 ring-1 ring-slate-700"
          )}
        >
          {/* Mobile phone notch mockup */}
          {device === "mobile" && (
            <div className="absolute top-0 inset-x-0 h-6 bg-slate-800 z-20 flex justify-center items-center rounded-t-[32px]">
              <div className="h-3 w-28 bg-slate-900 rounded-full" />
            </div>
          )}

          <iframe
            key={iframeKey}
            src={previewUrl}
            title={businessName}
            className={cn(
              "h-full w-full border-0 bg-stone-950",
              device === "mobile" && "pt-6"
            )}
            allow="geolocation; camera; microphone"
          />
        </div>
      </main>
    </div>
  );
}
