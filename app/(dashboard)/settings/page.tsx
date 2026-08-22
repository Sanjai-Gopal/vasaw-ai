"use client";

import * as React from "react";
import { ShieldCheck, Info } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { ConnectionCard } from "@/components/dashboard/connection-card";
import { Card, CardContent } from "@/components/ui/card";
import type { Connection } from "@/lib/types";

export default function SettingsPage() {
  const [connections, setConnections] = React.useState<Connection[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

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
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-24 animate-pulse bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="text-center py-12">
          <p className="text-rose-400">Failed to load settings</p>
          <p className="text-muted-foreground mt-2">{error || "Unknown error"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        title="Settings"
        description="Connections and integrations"
      />

      <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted-foreground">
        Integrations
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

      {connections.length === 0 && (
        <Card className="mt-6">
          <CardContent className="flex items-center justify-center py-12 text-sm text-muted-foreground">
            No connections configured. Add integrations via the API.
          </CardContent>
        </Card>
      )}
    </div>
  );
}