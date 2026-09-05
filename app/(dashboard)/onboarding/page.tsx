"use client";

import * as React from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Search,
  Target,
  Globe,
  UploadCloud,
  MessageSquare,
  Play,
  RotateCcw,
  ExternalLink,
  Layers,
  FileSpreadsheet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { runOrchestrator } from "@/lib/api/agents";

interface StepInfo {
  id: number;
  title: string;
  agent: string;
  desc: string;
  icon: React.ElementType;
}

const steps: StepInfo[] = [
  {
    id: 1,
    title: "1. Discover Businesses",
    agent: "Agent 1 — Scraping",
    desc: "Extracts local businesses with ratings, reviews, and phone numbers from Google Maps.",
    icon: Search,
  },
  {
    id: 2,
    title: "2. Qualify Opportunities",
    agent: "Agent 2 — Qualification",
    desc: "AI scores each business, identifying high-potential targets missing responsive modern websites.",
    icon: Target,
  },
  {
    id: 3,
    title: "3. Build Custom Websites",
    agent: "Agent 4 — Website Builder",
    desc: "Generates tailored Next.js websites using industry templates and dynamic AI copy.",
    icon: Globe,
  },
  {
    id: 4,
    title: "4. Deploy Instantly",
    agent: "Agent 5 — Deployment",
    desc: "Publishes live preview sites with isolated production build validation and HTTPS URLs.",
    icon: UploadCloud,
  },
  {
    id: 5,
    title: "5. Automated WhatsApp Outreach",
    agent: "Agent 6 — WhatsApp",
    desc: "Contacts qualified business owners via Meta WhatsApp Cloud API with their live preview link.",
    icon: MessageSquare,
  },
];

export default function OnboardingPage() {
  const [isRunning, setIsRunning] = React.useState(false);
  const [activeStep, setActiveStep] = React.useState(0);
  const [completed, setCompleted] = React.useState(false);
  const [workflowResult, setWorkflowResult] = React.useState<{
    stats?: {
      scraped?: number;
      qualified?: number;
      websitesBuilt?: number;
      websitesDeployed?: number;
      messagesSent?: number;
    };
  } | null>(null);

  const startDemo = async () => {
    setIsRunning(true);
    setActiveStep(1);
    setCompleted(false);
    setWorkflowResult(null);

    try {
      // Step through visual progress
      const stepInterval = setInterval(() => {
        setActiveStep((prev) => {
          if (prev < 5) return prev + 1;
          return prev;
        });
      }, 1500);

      const res = await runOrchestrator({
        campaignId: "onboarding-demo",
        locations: ["Coimbatore"],
        categories: ["restaurant"],
        maxItems: 3,
        mode: "mock",
      });

      clearInterval(stepInterval);
      setActiveStep(5);
      setCompleted(true);
      if (res && res.result) {
        setWorkflowResult(res.result as { stats?: Record<string, number> });
      }
    } catch (err) {
      console.error("Onboarding demo run error:", err);
      setCompleted(true);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 py-4">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
          <Sparkles className="h-4 w-4" /> Quick Start Guide
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Welcome to VASAW AI
        </h1>
        <p className="text-sm text-muted-foreground">
          Understand how VASAW AI turns local Google Maps business listings into deployed custom websites and automated WhatsApp outreach in seconds.
        </p>
      </div>

      {/* Interactive Demo Card */}
      <Card className="border-primary/20 bg-card/60 backdrop-blur-sm">
        <CardHeader>
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <Play className="h-4 w-4 text-primary" /> Live 30-Second Workflow Demo
              </CardTitle>
              <CardDescription>
                Execute an end-to-end 6-agent mock lifecycle right now without external API keys.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={startDemo}
                disabled={isRunning}
                className="gap-2 bg-gradient-to-r from-violet-600 to-cyan-600 text-white hover:from-violet-500 hover:to-cyan-500"
              >
                {isRunning ? (
                  <>Running Agent Pipeline...</>
                ) : completed ? (
                  <>
                    <RotateCcw className="h-4 w-4" /> Run Demo Again
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" /> Start Interactive Demo
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress Flow */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
            {steps.map((s, idx) => {
              const isCurrent = activeStep === s.id && isRunning;
              const isPast = activeStep > s.id || completed;
              const Icon = s.icon;
              return (
                <div
                  key={s.id}
                  className={`relative flex flex-col justify-between rounded-xl border p-4 transition-all ${
                    isCurrent
                      ? "border-primary bg-primary/10 shadow-sm"
                      : isPast
                      ? "border-emerald-500/40 bg-emerald-500/5"
                      : "border-border bg-card/40 opacity-70"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                          isPast
                            ? "bg-emerald-500/20 text-emerald-400"
                            : isCurrent
                            ? "bg-primary text-white"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {isPast ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        Stage {idx + 1}
                      </Badge>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-foreground">{s.title}</h4>
                      <p className="text-[11px] text-muted-foreground">{s.agent}</p>
                    </div>
                  </div>
                  <p className="mt-2 text-[10px] text-muted-foreground/80">{s.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Results Summary if Completed */}
          {completed && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5">
              <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    <h4 className="text-sm font-semibold text-emerald-400">
                      Workflow Completed Successfully!
                    </h4>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    All 6 agents finished. {workflowResult?.stats?.scraped ?? 3} leads discovered, {workflowResult?.stats?.websitesBuilt ?? 1} site generated & deployed, and {workflowResult?.stats?.messagesSent ?? 1} outreach dispatched.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link href="/leads">
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                      View Leads <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                  <Link href="/websites">
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                      View Websites <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Next Steps Navigation */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Layers className="h-4 w-4 text-violet-400" /> Manage Campaigns
            </CardTitle>
            <CardDescription className="text-xs">
              Create campaigns targeting specific business categories and locations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/campaigns">
              <Button variant="secondary" className="w-full justify-between text-xs">
                Go to Campaigns <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Target className="h-4 w-4 text-cyan-400" /> Review Leads
            </CardTitle>
            <CardDescription className="text-xs">
              Inspect AI scoring, opportunity evidence, and phone contacts.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/leads">
              <Button variant="secondary" className="w-full justify-between text-xs">
                Explore Leads <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <FileSpreadsheet className="h-4 w-4 text-emerald-400" /> Google Sheets Sync
            </CardTitle>
            <CardDescription className="text-xs">
              Export and sync leads, websites, and outreach logs directly to Google Sheets.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/settings">
              <Button variant="secondary" className="w-full justify-between text-xs">
                Configure Sheets <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
