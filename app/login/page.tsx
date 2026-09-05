"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight, ShieldCheck, Lock, Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("admin@vasaw.ai");
  const [password, setPassword] = React.useState("••••••••");
  const [loading, setLoading] = React.useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Smooth demo sign-in redirect
    setTimeout(() => {
      router.push("/");
    }, 600);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-400 shadow-xl shadow-violet-500/25">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground">
            VASAW AI
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Autonomous Local-Business Website & WhatsApp Outreach Platform
          </p>
        </div>

        {/* Login Card */}
        <Card className="border-border/60 bg-card/60 backdrop-blur-sm shadow-xl">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-lg font-semibold">Sign In</CardTitle>
            <CardDescription className="text-xs">
              Access your campaigns, leads, and autonomous AI agents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" /> Email
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                  className="text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5" /> Password
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="text-sm"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full gap-2 bg-gradient-to-r from-violet-600 to-cyan-600 text-white hover:from-violet-500 hover:to-cyan-500"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Sign In to Dashboard <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Supabase Auth Ready
              </span>
              <Link href="/onboarding" className="text-primary hover:underline">
                Quick Start Demo
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
