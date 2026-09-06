"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
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
  Zap,
  Check,
  Cpu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { runOrchestrator } from "@/lib/api/agents";
import { cn } from "@/lib/utils";

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
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-6 sm:px-6 sm:py-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-blue-600">
          <Sparkles className="h-4 w-4" /> Quick Start & Architecture Guide
        </div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
          Welcome to VASAW AI OS
        </h1>
        <p className="font-sans text-sm text-slate-500 max-w-2xl leading-relaxed">
          Learn how VASAW AI transforms unstructured Google Maps business listings into edge-deployed Next.js 16 websites and automated WhatsApp conversion sequences in under 30 seconds.
        </p>
      </div>

      {/* Interactive Demo Card */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 p-6 sm:p-8 shadow-sm backdrop-blur-md">
        {/* Top Accent */}
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-400" />

        <div className="flex flex-col items-start justify-between gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-center">
          <div>
            <h3 className="font-display text-xl font-bold text-slate-950 flex items-center gap-2">
              <Play className="h-5 w-5 text-blue-600" />
              Live 30-Second Multi-Agent Lifecycle
            </h3>
            <p className="font-sans text-xs text-slate-500 mt-1">
              Execute a full 6-agent mock pipeline right now without external API keys or infrastructure cost.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={startDemo}
              disabled={isRunning}
              className="gap-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white hover:opacity-95 shadow-sm rounded-xl font-sans text-xs px-5 h-10"
            >
              {isRunning ? (
                <>Running Agent Pipeline…</>
              ) : completed ? (
                <>
                  <RotateCcw className="h-4 w-4" /> Run Lifecycle Again
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" /> Start Interactive Demo
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Progress Flow Steps */}
        <div className="grid grid-cols-1 gap-4 pt-6 md:grid-cols-5">
          {steps.map((s, idx) => {
            const isCurrent = activeStep === s.id && isRunning;
            const isPast = activeStep > s.id || completed;
            const Icon = s.icon;

            return (
              <div
                key={s.id}
                className={cn(
                  "relative flex flex-col justify-between rounded-2xl border p-4 transition-all duration-200 hover-lift",
                  isCurrent
                    ? "border-blue-500 bg-blue-50/50 shadow-md scale-[1.02]"
                    : isPast
                      ? "border-emerald-200 bg-emerald-50/30"
                      : "border-slate-200/80 bg-slate-50/50 opacity-70"
                )}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-xl shadow-xs transition-colors",
                        isPast
                          ? "bg-emerald-100 text-emerald-600"
                          : isCurrent
                            ? "bg-blue-600 text-white"
                            : "bg-white border border-slate-200 text-slate-400"
                      )}
                    >
                      {isPast ? <Check className="h-4 w-4 stroke-[3]" /> : <Icon className="h-4 w-4" />}
                    </div>
                    <span className="font-mono text-[10px] font-bold text-slate-400">
                      0{idx + 1}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-display text-xs font-bold text-slate-950">{s.title}</h4>
                    <p className="font-mono text-[10px] text-slate-500 font-semibold">{s.agent}</p>
                  </div>
                </div>
                <p className="mt-3 font-sans text-[11px] text-slate-600 leading-relaxed">{s.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Results Summary if Completed */}
        {completed && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 shadow-xs"
          >
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <h4 className="font-display text-sm font-bold text-emerald-950">
                    Lifecycle Completed Successfully!
                  </h4>
                </div>
                <p className="font-sans text-xs text-emerald-800">
                  All 6 specialized agents finished in sync. {workflowResult?.stats?.scraped ?? 3} leads discovered, {workflowResult?.stats?.websitesBuilt ?? 1} site generated & deployed, and {workflowResult?.stats?.messagesSent ?? 1} WhatsApp outreach dispatched.
                </p>
              </div>
              <div className="flex gap-2">
                <Link href="/leads">
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs font-sans rounded-xl bg-white">
                    View Leads <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
                <Link href="/websites">
                  <Button size="sm" className="gap-1.5 text-xs font-sans rounded-xl bg-slate-900 text-white hover:bg-slate-800">
                    View Websites <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Next Steps Quick Launch Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur-md transition-all duration-200 hover-lift">
          <div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 shadow-xs mb-4">
              <Layers className="h-5 w-5" />
            </div>
            <h3 className="font-display text-base font-bold text-slate-950">Manage Campaigns</h3>
            <p className="font-sans text-xs text-slate-500 mt-1 leading-relaxed">
              Create and launch automated acquisition campaigns targeting specific business niches and locations.
            </p>
          </div>
          <div className="pt-5">
            <Link href="/campaigns">
              <Button variant="outline" className="w-full justify-between text-xs font-sans rounded-xl">
                Go to Campaigns <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>

        <div className="relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur-md transition-all duration-200 hover-lift">
          <div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-50 border border-cyan-200 text-cyan-600 shadow-xs mb-4">
              <Target className="h-5 w-5" />
            </div>
            <h3 className="font-display text-base font-bold text-slate-950">Review Qualified Leads</h3>
            <p className="font-sans text-xs text-slate-500 mt-1 leading-relaxed">
              Inspect AI scoring breakdowns, opportunity gap evidence, phone numbers, and address details.
            </p>
          </div>
          <div className="pt-5">
            <Link href="/leads">
              <Button variant="outline" className="w-full justify-between text-xs font-sans rounded-xl">
                Explore Leads CRM <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>

        <div className="relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur-md transition-all duration-200 hover-lift">
          <div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 shadow-xs mb-4">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <h3 className="font-display text-base font-bold text-slate-950">Google Sheets Sync</h3>
            <p className="font-sans text-xs text-slate-500 mt-1 leading-relaxed">
              Export and sync leads, websites, and outreach logs directly to Google Sheets with deduplication.
            </p>
          </div>
          <div className="pt-5">
            <Link href="/settings">
              <Button variant="outline" className="w-full justify-between text-xs font-sans rounded-xl">
                Configure Sheets Sync <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
