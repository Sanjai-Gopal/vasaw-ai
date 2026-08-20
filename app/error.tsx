"use client";

import { ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <Card className="max-w-md p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500/20 to-rose-500/5">
          <span className="text-2xl font-bold text-rose-400">!</span>
        </div>
        <h2 className="text-xl font-bold">Something went wrong</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          VASAW AI encountered an unexpected error. This has been logged for investigation.
        </p>
        {error.digest && (
          <p className="mt-2 font-mono text-xs text-muted-foreground/60">
            Error: {error.digest}
          </p>
        )}
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button variant="outline" className="gap-1.5" onClick={reset}>
            <RefreshCw className="h-4 w-4" />
            Try again
          </Button>
          <Button asChild className="gap-1.5">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
