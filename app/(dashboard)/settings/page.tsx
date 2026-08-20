"use client";

import * as React from "react";
import { ShieldCheck, Info } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { ConnectionCard } from "@/components/dashboard/connection-card";
import { Card, CardContent } from "@/components/ui/card";
import { connections as initialConnections } from "@/lib/data/activities";
import type { Connection } from "@/lib/types";

export default function SettingsPage() {
  const [connections, setConnections] = React.useState<Connection[]>(initialConnections);

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

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        title="Settings"
        description="Connections and integrations — shown in mock state until APIs are wired up"
      />

      <div className="mb-6 flex items-start gap-2 rounded-xl border border-border bg-muted/30 p-4 text-sm">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-info" />
        <p className="text-muted-foreground">
          These are demo connection states. Credentials, scopes and live sync will be
          connected in the next phase of the build.
        </p>
      </div>

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

      <Card className="mt-6">
        <CardContent className="flex items-start gap-3 p-4 text-sm">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
          <p className="text-muted-foreground">
            No real credentials are stored. All API keys shown are masked placeholders.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}