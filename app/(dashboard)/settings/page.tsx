"use client";

import * as React from "react";
import {
  FileSpreadsheet,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Plug,
  ShieldCheck,
  Database,
  Globe,
  Sliders,
  Sparkles,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { ConnectionCard } from "@/components/dashboard/connection-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Connection } from "@/lib/types";
import {
  exportLeadsToSheets,
  exportWebsitesToSheets,
  exportMessagesToSheets,
  exportCampaignsToSheets,
  syncAllToSheets,
} from "@/lib/api/sheets";

export default function SettingsPage() {
  const [connections, setConnections] = React.useState<Connection[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Google Sheets state
  const [spreadsheetId, setSpreadsheetId] = React.useState("mock-spreadsheet-vasaw");
  const [exporting, setExporting] = React.useState<string | null>(null);
  const [syncStatus, setSyncStatus] = React.useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  React.useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/connections");
        const data = await res.json();
        if (data.ok) {
          setConnections(data.connections);
        } else {
          setError(data.error || "Failed to fetch connections");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleExport = async (type: "leads" | "websites" | "messages" | "campaigns" | "all") => {
    setExporting(type);
    setSyncStatus(null);
    try {
      if (type === "leads") {
        const res = await exportLeadsToSheets(spreadsheetId);
        setSyncStatus({
          type: res.success ? "success" : "error",
          message: res.success
            ? `Successfully exported ${res.rowsWritten} leads to sheet "${res.sheetName}" and downloaded ${res.filename || "file"}`
            : res.error || "Failed to export leads",
        });
      } else if (type === "websites") {
        const res = await exportWebsitesToSheets(spreadsheetId);
        setSyncStatus({
          type: res.success ? "success" : "error",
          message: res.success
            ? `Successfully exported ${res.rowsWritten} websites to sheet "${res.sheetName}" and downloaded ${res.filename || "file"}`
            : res.error || "Failed to export websites",
        });
      } else if (type === "messages") {
        const res = await exportMessagesToSheets(spreadsheetId);
        setSyncStatus({
          type: res.success ? "success" : "error",
          message: res.success
            ? `Successfully exported ${res.rowsWritten} outreach messages to sheet "${res.sheetName}" and downloaded ${res.filename || "file"}`
            : res.error || "Failed to export messages",
        });
      } else if (type === "campaigns") {
        const res = await exportCampaignsToSheets(spreadsheetId);
        setSyncStatus({
          type: res.success ? "success" : "error",
          message: res.success
            ? `Successfully exported ${res.rowsWritten} campaigns to sheet "${res.sheetName}" and downloaded ${res.filename || "file"}`
            : res.error || "Failed to export campaigns",
        });
      } else if (type === "all") {
        const res = await syncAllToSheets({ spreadsheetId });
        setSyncStatus({
          type: res.success ? "success" : "error",
          message: res.success
            ? `Full sync completed: ${res.summary.totalRows} total rows written across Leads, Websites, Outreach, and Campaigns.`
            : res.errors?.join(", ") || "Failed to complete full sync",
        });
      }
    } catch (err) {
      setSyncStatus({
        type: "error",
        message: err instanceof Error ? err.message : "Sync request failed",
      });
    } finally {
      setExporting(null);
    }
  };

  const connect = (id: Connection["id"]) => {
    setConnections((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              status: "connecting",
              config: c.config.map((item) =>
                item.key === "Status" ? { ...item, value: "Connecting…" } : item
              ),
            }
          : c
      )
    );
    window.setTimeout(() => {
      setConnections((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
                ...c,
                status: "connected",
                lastSync: new Date().toISOString(),
                config: c.config.map((item) =>
                  item.key === "Status" ? { ...item, value: "Connected" } : item
                ),
              }
            : c
        )
      );
    }, 1800);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
        <PageHeader title="Settings" description="Connections, integrations, and data sync" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-44 animate-pulse rounded-2xl bg-white/70 border border-slate-200" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-12 text-center">
          <p className="font-display text-lg font-bold text-rose-600">Failed to load system settings</p>
          <p className="mt-2 font-sans text-sm text-slate-500">{error || "Unknown error"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        title="Settings & Integrations"
        description="Autonomous cloud connections, API security boundaries, and Google Sheets bi-directional sync."
      />

      {/* Google Sheets Synchronization Hub Card */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 p-6 sm:p-8 shadow-sm backdrop-blur-md">
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />

        <div className="flex flex-col items-start justify-between gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-center">
          <div>
            <h3 className="font-display text-xl font-bold text-slate-950 flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
              Google Sheets Export & Real-Time Sync
            </h3>
            <p className="font-sans text-xs text-slate-500 mt-1">
              Synchronize qualified CRM leads, live website links, and outreach logs directly into your Google Sheets workspace.
            </p>
          </div>
          <Badge variant="outline" className="border-emerald-200 bg-emerald-50 font-mono text-[11px] text-emerald-700 py-1 px-3">
            <ShieldCheck className="h-3.5 w-3.5 mr-1 text-emerald-600" />
            Operational Sync Layer
          </Badge>
        </div>

        <div className="space-y-5 pt-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-1.5 md:col-span-2">
              <label className="font-mono text-xs font-bold uppercase tracking-wider text-slate-500">
                Target Spreadsheet ID
              </label>
              <Input
                value={spreadsheetId}
                onChange={(e) => setSpreadsheetId(e.target.value)}
                placeholder="e.g. 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                className="font-mono text-xs bg-slate-50 border-slate-200 rounded-xl"
              />
              <p className="font-sans text-[11px] text-slate-400">
                In mock mode, writes are safely simulated with automated deduplication. In real mode, requires service account OAuth credentials.
              </p>
            </div>
            <div className="flex items-end">
              <Button
                onClick={() => handleExport("all")}
                disabled={!!exporting}
                className="w-full gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500 shadow-sm rounded-xl font-sans text-xs h-10"
              >
                {exporting === "all" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Sync All Data to Sheets
              </Button>
            </div>
          </div>

          {/* Quick entity export buttons */}
          <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("leads")}
              disabled={!!exporting}
              className="gap-1.5 text-xs font-sans rounded-xl bg-white border-slate-200"
            >
              {exporting === "leads" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3 text-slate-500" />}
              Export Leads
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("websites")}
              disabled={!!exporting}
              className="gap-1.5 text-xs font-sans rounded-xl bg-white border-slate-200"
            >
              {exporting === "websites" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3 text-slate-500" />}
              Export Websites
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("messages")}
              disabled={!!exporting}
              className="gap-1.5 text-xs font-sans rounded-xl bg-white border-slate-200"
            >
              {exporting === "messages" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3 text-slate-500" />}
              Export Outreach Logs
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("campaigns")}
              disabled={!!exporting}
              className="gap-1.5 text-xs font-sans rounded-xl bg-white border-slate-200"
            >
              {exporting === "campaigns" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3 text-slate-500" />}
              Export Campaigns
            </Button>
          </div>

          {/* Feedback alert */}
          {syncStatus && (
            <div
              className={cn(
                "flex items-center gap-2.5 rounded-2xl border p-4 text-xs font-sans shadow-xs",
                syncStatus.type === "success"
                  ? "border-emerald-200 bg-emerald-50/80 text-emerald-800"
                  : "border-rose-200 bg-rose-50/80 text-rose-800"
              )}
            >
              {syncStatus.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              )}
              <span>{syncStatus.message}</span>
            </div>
          )}
        </div>
      </div>

      {/* Connected Services Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-bold text-slate-950">Platform Cloud Gateways</h2>
            <p className="font-sans text-xs text-slate-500">
              Live service status and connection parameters for micro-agents and storage layers.
            </p>
          </div>
          <span className="font-mono text-xs text-slate-500">
            {connections.filter((c) => c.status === "connected").length} / {connections.length} Connected
          </span>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {connections.map((connection, index) => (
            <ConnectionCard
              key={connection.id}
              connection={connection}
              index={index}
              onAction={() => connect(connection.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}