"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Phone,
  Globe,
  MapPin,
  Star,
  Sparkles,
  ExternalLink,
  MessageSquare,
  CheckCircle2,
  Clock,
  Loader2,
  Send,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { LeadStatusBadge } from "@/components/leads/LeadStatusBadge";
import { LeadScoreBadge } from "@/components/leads/LeadScoreBadge";
import { fetchLeadById } from "@/lib/api/leads";
import { fetchWebsites } from "@/lib/api/websites";
import { fetchMessages, sendOutreachMessage } from "@/lib/api/messages";
import { formatDate, formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Lead, Website, Message } from "@/lib/types";

export default function LeadDetailPage() {
  const params = useParams();
  const id = String(params?.id || "");

  const [lead, setLead] = React.useState<Lead | null>(null);
  const [website, setWebsite] = React.useState<Website | null>(null);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Outreach message state
  const [customMsg, setCustomMsg] = React.useState("");
  const [sendingMsg, setSendingMsg] = React.useState(false);
  const [sendSuccess, setSendSuccess] = React.useState(false);

  React.useEffect(() => {
    async function loadData() {
      try {
        const [leadData, websitesList, messagesList] = await Promise.all([
          fetchLeadById(id).catch(() => null),
          fetchWebsites().catch(() => []),
          fetchMessages().catch(() => []),
        ]);

        if (leadData) {
          setLead(leadData);
          const foundSite = websitesList.find((w) => w.leadId === leadData.id);
          if (foundSite) setWebsite(foundSite);

          const leadMsgs = messagesList.filter((m) => m.leadId === leadData.id);
          setMessages(leadMsgs);

          const previewLink = foundSite?.liveUrl || foundSite?.previewUrl;
          setCustomMsg(
            previewLink
              ? `Hello ${leadData.businessName}! We have generated a custom website preview for your business: ${previewLink}. Would you like to review it?`
              : `Hello ${leadData.businessName}! We noticed your business on Google Maps and synthesized a custom website for your brand. Would you like to review it?`
          );
        }
      } catch (err) {
        console.error("Error loading lead details:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  const handleSendWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead || !customMsg) return;

    setSendingMsg(true);
    setSendSuccess(false);
    try {
      const res = await sendOutreachMessage({
        leadId: lead.id,
        phone: lead.phone,
        businessName: lead.businessName,
        message: customMsg,
        mode: "mock",
      });

      if (res.ok) {
        setSendSuccess(true);
        setMessages((prev) => [
          {
            id: res.messageId || `msg-${Date.now()}`,
            leadId: lead.id,
            businessName: lead.businessName,
            direction: "outbound",
            channel: "whatsapp",
            content: customMsg,
            status: "sent",
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);
        setLead((prev) => (prev ? { ...prev, status: "contacted" } : null));
      }
    } catch (err) {
      console.error("Failed to send WhatsApp message:", err);
    } finally {
      setSendingMsg(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 py-8">
        <Link href="/leads" className="inline-flex items-center gap-1.5 text-xs font-sans text-slate-500 hover:text-slate-900">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Leads CRM
        </Link>
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center">
          <h3 className="font-display text-lg font-bold text-slate-950">Lead Not Found</h3>
          <p className="mt-1 font-sans text-xs text-slate-500">The requested lead record does not exist or has been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      {/* Top Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <Link href="/leads" className="inline-flex items-center gap-1.5 text-xs font-sans font-semibold text-slate-500 hover:text-slate-900 mb-2">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Leads CRM
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-slate-950 flex items-center gap-2">
              <Building2 className="h-6 w-6 text-blue-600" /> {lead.businessName}
            </h1>
            <LeadStatusBadge status={lead.status} />
            <LeadScoreBadge score={lead.aiScore} priority={lead.priority} />
          </div>
          <p className="font-sans text-xs text-slate-500 mt-1">
            {lead.category} • {lead.location} • Discovered {formatDate(lead.createdAt)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {website ? (
            <>
              {website.liveUrl && (
                <a
                  href={website.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button size="sm" className="gap-1.5 text-xs font-sans rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-xs">
                    <ExternalLink className="h-3.5 w-3.5" /> Open Live Site
                  </Button>
                </a>
              )}
              <Link href={`/websites/${website.id}`}>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs font-sans rounded-xl bg-white border-slate-200">
                  <Globe className="h-3.5 w-3.5 text-blue-600" /> Inspect Website
                </Button>
              </Link>
            </>
          ) : (
            <Link href="/websites">
              <Button size="sm" className="gap-1.5 text-xs font-sans rounded-xl bg-slate-900 text-white hover:bg-slate-800">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" /> Synthesize Website
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Cols */}
        <div className="space-y-6 lg:col-span-2">
          {/* Business Contact & Overview */}
          <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-sm backdrop-blur-md">
            <h3 className="font-display text-base font-bold text-slate-950 mb-4">Business Information</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
              <div className="space-y-1 rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5">
                <span className="font-mono text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5 text-blue-600" /> Phone Number
                </span>
                <p className="font-mono text-sm font-bold text-slate-900">{lead.phone || "—"}</p>
              </div>

              <div className="space-y-1 rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5">
                <span className="font-mono text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-blue-600" /> Location / Address
                </span>
                <p className="font-sans text-sm font-medium text-slate-900">{lead.location || "—"}</p>
              </div>

              <div className="space-y-1 rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5">
                <span className="font-mono text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> Rating & Reviews
                </span>
                <p className="font-mono text-sm font-bold text-slate-900">
                  {(lead.rating ?? 0).toFixed(1)} / 5.0 ({lead.reviews ?? 0} Reviews)
                </p>
              </div>

              <div className="space-y-1 rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5">
                <span className="font-mono text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                  <Globe className="h-3.5 w-3.5 text-blue-600" /> Existing Website
                </span>
                <p className="font-sans text-sm font-medium text-slate-900">
                  {lead.website ? (
                    <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">
                      {lead.website} <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span className="text-emerald-700 font-bold font-mono">No Website (High ICP)</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* AI Qualification Evidence */}
          <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-sm backdrop-blur-md">
            <h3 className="font-display text-base font-bold text-slate-950 flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-blue-600" /> AI Qualification & Opportunity Analysis
            </h3>
            <div className="space-y-4 text-xs font-sans">
              <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                <p className="font-display text-xs font-bold text-slate-900 mb-1">Opportunity Rationale</p>
                <p className="text-slate-600 leading-relaxed">
                  {lead.qualification?.notes ||
                    `Rated ${(lead.rating ?? 4.0).toFixed(1)} with ${lead.reviews ?? 0} Google Maps reviews in ${lead.location}. High conversion potential for modern responsive web presence and automated WhatsApp booking.`}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3">
                  <p className="font-mono text-[10px] font-bold text-slate-400 uppercase">AI Score</p>
                  <p className="mt-0.5 font-display text-lg font-bold text-blue-600">{lead.aiScore ?? 75}%</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3">
                  <p className="font-mono text-[10px] font-bold text-slate-400 uppercase">Priority Tier</p>
                  <p className="mt-0.5 font-display text-lg font-bold capitalize text-amber-600">{lead.priority || "Medium"}</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3">
                  <p className="font-mono text-[10px] font-bold text-slate-400 uppercase">Opportunity</p>
                  <p className="mt-0.5 font-display text-lg font-bold text-emerald-600">High</p>
                </div>
              </div>
            </div>
          </div>

          {/* WhatsApp Outreach Center */}
          <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-sm backdrop-blur-md">
            <h3 className="font-display text-base font-bold text-slate-950 flex items-center gap-2 mb-1">
              <MessageSquare className="h-4 w-4 text-emerald-600" /> WhatsApp Outreach Dispatch
            </h3>
            <p className="font-sans text-xs text-slate-500 mb-4">
              Direct personalized pitch to business owner via Meta WhatsApp Cloud API
            </p>
            <form onSubmit={handleSendWhatsApp} className="space-y-3">
              <Textarea
                value={customMsg}
                onChange={(e) => setCustomMsg(e.target.value)}
                rows={3}
                className="text-xs font-sans rounded-2xl bg-slate-50 border-slate-200"
                placeholder="Enter customized pitch message…"
              />
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] text-slate-400">
                  Target: <strong className="text-slate-800">{lead.phone || "No phone"}</strong>
                </span>
                <Button
                  type="submit"
                  size="sm"
                  disabled={sendingMsg || !lead.phone}
                  className="gap-1.5 text-xs font-sans rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  {sendingMsg ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  Send WhatsApp Pitch
                </Button>
              </div>
            </form>

            {sendSuccess && (
              <div className="mt-4 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-3 text-xs font-sans text-emerald-800">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Message dispatched to WhatsApp queue!
              </div>
            )}

            {/* Message History */}
            {messages.length > 0 && (
              <div className="space-y-3 pt-4 mt-4 border-t border-slate-100">
                <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Outreach Dispatch History
                </p>
                <div className="space-y-2">
                  {messages.map((m) => (
                    <div key={m.id} className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5 text-xs space-y-1 font-sans">
                      <div className="flex items-center justify-between font-mono text-[10px] text-slate-400">
                        <span className="capitalize font-bold text-slate-700">Status: {m.status}</span>
                        <span>{formatDateTime(m.createdAt)}</span>
                      </div>
                      <p className="text-slate-800 leading-relaxed">{m.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Associated Website & Activity Timeline */}
        <div className="space-y-6">
          {/* Associated Website */}
          <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-sm backdrop-blur-md">
            <h3 className="font-display text-base font-bold text-slate-950 flex items-center gap-2 mb-4">
              <Globe className="h-4 w-4 text-blue-600" /> Synthesized Website
            </h3>
            <div className="space-y-3 text-xs font-sans">
              {website ? (
                <>
                  <div className="flex justify-between border-b border-slate-100 pb-2.5">
                    <span className="text-slate-500">Template</span>
                    <span className="capitalize font-bold text-slate-900 font-mono">{website.template}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2.5">
                    <span className="text-slate-500">Status</span>
                    <span className="capitalize text-emerald-600 font-bold font-mono">{website.status}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2.5">
                    <span className="text-slate-500">Live URL</span>
                    {website.liveUrl || website.previewUrl ? (
                      <a
                        href={website.liveUrl || website.previewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 font-mono font-bold hover:underline truncate max-w-[160px]"
                      >
                        {website.liveUrl || website.previewUrl}
                      </a>
                    ) : (
                      <span className="text-slate-400 font-mono">Pending Build</span>
                    )}
                  </div>
                  <Link href={`/websites`}>
                    <Button variant="outline" size="sm" className="w-full text-xs font-sans rounded-xl mt-2 bg-white">
                      Inspect in Fleet Console
                    </Button>
                  </Link>
                </>
              ) : (
                <div className="text-center py-4 space-y-2">
                  <p className="text-slate-500">No website synthesized yet for this lead.</p>
                  <Link href="/websites">
                    <Button variant="outline" size="sm" className="text-xs font-sans gap-1.5 rounded-xl bg-white">
                      <Sparkles className="h-3.5 w-3.5 text-blue-600" /> Generate Website
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-sm backdrop-blur-md">
            <h3 className="font-display text-base font-bold text-slate-950 flex items-center gap-2 mb-4">
              <Clock className="h-4 w-4 text-blue-600" /> Lead Lifecycle Timeline
            </h3>
            <div className="space-y-3 text-xs font-sans">
              <div className="flex gap-2.5 items-start">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-900">Scraped from Google Maps</p>
                  <p className="font-mono text-[10px] text-slate-400">{formatDate(lead.createdAt)}</p>
                </div>
              </div>

              <div className="flex gap-2.5 items-start">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-900">AI Opportunity Qualification</p>
                  <p className="font-mono text-[10px] text-slate-400">Score: {lead.aiScore ?? 80}%</p>
                </div>
              </div>

              {website && (
                <div className="flex gap-2.5 items-start">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-900">Website Synthesized & Deployed</p>
                    <p className="font-mono text-[10px] text-slate-400">Template: {website.template}</p>
                  </div>
                </div>
              )}

              {lead.status === "contacted" && (
                <div className="flex gap-2.5 items-start">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-900">WhatsApp Outreach Dispatched</p>
                    <p className="font-mono text-[10px] text-slate-400">{lead.phone}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}