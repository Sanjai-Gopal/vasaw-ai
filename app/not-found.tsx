import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-400 shadow-lg shadow-violet-500/25">
          <Sparkles className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="text-6xl font-bold tracking-tight">404</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            This page doesn&apos;t exist in VASAW AI.
          </p>
          <p className="mt-1 text-sm text-muted-foreground/70">
            The page you&apos;re looking for may have been moved or removed.
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
