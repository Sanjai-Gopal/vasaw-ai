"use client";

import * as React from "react";
import {
  FileSpreadsheet,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { ConnectionCard } from "@/components/dashboard/connection-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
            ? `Successfully exported ${res.rowsWritten} leads to sheet "${res.sheetName}"`
            : res.error || "Failed to export leads",
        });
      } else if (type === "websites") {
        const res = await exportWebsitesToSheets(spreadsheetId);
        setSyncStatus({
          type: res.success ? "success" : "error",
          message: res.success
            ? `Successfully exported ${res.rowsWritten} websites to sheet "${res.sheetName}"`
            : res.error || "Failed to export websites",
        });
      } else if (type === "messages") {
        const res = await exportMessagesToSheets(spreadsheetId);
        setSyncStatus({
          type: res.success ? "success" : "error",
          message: res.success
            ? `Successfully exported ${res.rowsWritten} outreach messages to sheet "${res.sheetName}"`
            : res.error || "Failed to export messages",
        });
      } else if (type === "campaigns") {
        const res = await exportCampaignsToSheets(spreadsheetId);
        setSyncStatus({
          type: res.success ? "success" : "error",
          message: res.success
            ? `Successfully exported ${res.rowsWritten} campaigns to sheet "${res.sheetName}"`
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
            <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="py-12 text-center">
          <p className="text-rose-400">Failed to load settings</p>
          <p className="mt-2 text-muted-foreground">{error || "Unknown error"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        title="Settings & Integrations"
        description="Manage connected cloud services, export targets, and Google Sheets synchronization."
      />

      {/* Google Sheets Synchronization Card */}
      <Card className="border-primary/20 bg-card/60 backdrop-blur-sm">
        <CardHeader>
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <FileSpreadsheet className="h-5 w-5 text-emerald-400" /> Google Sheets Export & Sync
              </CardTitle>
              <CardDescription>
                Export CRM data, qualified leads, generated website links, and outreach records directly into Google Sheets.
              </CardDescription>
            </div>
            <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-xs text-emerald-400">
              Operational Sync Layer
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-medium text-muted-foreground">Target Spreadsheet ID</label>
              <Input
                value={spreadsheetId}
                onChange={(e) => setSpreadsheetId(e.target.value)}
                placeholder="e.g. 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                className="font-mono text-xs"
              />
              <p className="text-[11px] text-muted-foreground">
                In mock mode, writes are safely simulated with deduplication. In real mode, requires service account credentials.
              </p>
            </div>
            <div className="flex items-end">
              <Button
                onClick={() => handleExport("all")}
                disabled={!!exporting}
                className="w-full gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500"
              >
                {exporting === "all" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Sync All to Sheets
              </Button>
            </div>
          </div>

          {/* Quick entity export buttons */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("leads")}
              disabled={!!exporting}
              className="gap-1.5 text-xs"
            >
              {exporting === "leads" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
              Export Leads
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("websites")}
              disabled={!!exporting}
              className="gap-1.5 text-xs"
            >
              {exporting === "websites" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
              Export Websites
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("messages")}
              disabled={!!exporting}
              className="gap-1.5 text-xs"
            >
              {exporting === "messages" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
              Export Outreach Logs
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("campaigns")}
              disabled={!!exporting}
              className="gap-1.5 text-xs"
            >
              {exporting === "campaigns" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
              Export Campaigns
            </Button>
          </div>

          {/* Feedback alert */}
          {syncStatus && (
            <div
              className={`flex items-center gap-2.5 rounded-lg border p-3 text-xs ${
                syncStatus.type === "success"
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                  : "border-destructive/30 bg-destructive/10 text-destructive"
              }`}
            >
              {syncStatus.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0" />
              )}
              <span>{syncStatus.message}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Connected Services Section */}
      <div className="space-y-4">
        <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Platform Integrations
        </h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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