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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { LeadStatusBadge } from "@/components/leads/LeadStatusBadge";
import { LeadScoreBadge } from "@/components/leads/LeadScoreBadge";
import { fetchLeadById } from "@/lib/api/leads";
import { fetchWebsites } from "@/lib/api/websites";
import { fetchMessages, sendOutreachMessage } from "@/lib/api/messages";
import { formatDate, formatDateTime } from "@/lib/utils";
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

          setCustomMsg(
            `Hello ${leadData.businessName}! We have generated a custom website preview for your business: ${
              foundSite?.liveUrl || foundSite?.previewUrl || "https://preview.vasaw.app"
            }. Would you like to review it?`
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
        setLead((prev) => prev ? { ...prev, status: "contacted" } : null);
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
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 py-8">
        <Link href="/leads" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Leads
        </Link>
        <div className="rounded-xl border p-12 text-center">
          <h3 className="text-base font-semibold">Lead Not Found</h3>
          <p className="mt-1 text-sm text-muted-foreground">The requested lead could not be found or has been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 py-4">
      {/* Top Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <Link href="/leads" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-2">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Leads
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Building2 className="h-6 w-6 text-primary" /> {lead.businessName}
            </h1>
            <LeadStatusBadge status={lead.status} />
            <LeadScoreBadge score={lead.aiScore} priority={lead.priority} />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {lead.category} • {lead.location} • Discovered {formatDate(lead.createdAt)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {website ? (
            <Link href={`/websites/${website.id}`}>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <Globe className="h-3.5 w-3.5" /> View Website
              </Button>
            </Link>
          ) : (
            <Link href="/websites">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" /> Build Website
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
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Business Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
              <div className="space-y-1">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" /> Phone Number
                </span>
                <p className="font-medium text-foreground">{lead.phone || "—"}</p>
              </div>

              <div className="space-y-1">
                <span className="text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> Location / Address
                </span>
                <p className="font-medium text-foreground">{lead.location || "—"}</p>
              </div>

              <div className="space-y-1">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> Rating & Reviews
                </span>
                <p className="font-medium text-foreground">
                  {(lead.rating ?? 0).toFixed(1)} / 5.0 ({lead.reviews ?? 0} Google Reviews)
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Globe className="h-3.5 w-3.5" /> Existing Website
                </span>
                <p className="font-medium text-foreground">
                  {lead.website ? (
                    <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                      {lead.website} <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span className="text-amber-400 font-medium">No Website (High Opportunity)</span>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* AI Qualification Evidence */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-violet-400" /> AI Qualification & Opportunity Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="font-medium text-foreground mb-1">Opportunity Rationale</p>
                <p className="text-muted-foreground">
                  {lead.qualification?.notes ||
                    `Rated ${(lead.rating ?? 4.0).toFixed(1)} with ${lead.reviews ?? 0} reviews in ${lead.location}. Highly receptive candidate for high-converting website modernization and digital presence.`}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center pt-1">
                <div className="rounded-lg border p-2">
                  <p className="text-[10px] text-muted-foreground uppercase">AI Score</p>
                  <p className="text-sm font-bold text-primary mt-0.5">{lead.aiScore ?? 75}</p>
                </div>
                <div className="rounded-lg border p-2">
                  <p className="text-[10px] text-muted-foreground uppercase">Priority</p>
                  <p className="text-sm font-bold capitalize text-amber-400 mt-0.5">{lead.priority || "Medium"}</p>
                </div>
                <div className="rounded-lg border p-2">
                  <p className="text-[10px] text-muted-foreground uppercase">Opportunity</p>
                  <p className="text-sm font-bold text-emerald-400 mt-0.5">High</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* WhatsApp Outreach Center */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-emerald-400" /> WhatsApp Outreach Dispatch
              </CardTitle>
              <CardDescription className="text-xs">
                Direct message to business owner via Meta WhatsApp Cloud API
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleSendWhatsApp} className="space-y-3">
                <Textarea
                  value={customMsg}
                  onChange={(e) => setCustomMsg(e.target.value)}
                  rows={3}
                  className="text-xs"
                  placeholder="Enter message..."
                />
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">
                    Target: <span className="font-mono text-foreground">{lead.phone || "No phone"}</span>
                  </span>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={sendingMsg || !lead.phone}
                    className="gap-1.5 text-xs bg-gradient-to-r from-emerald-600 to-teal-600 text-white"
                  >
                    {sendingMsg ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                    Send WhatsApp
                  </Button>
                </div>
              </form>

              {sendSuccess && (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" /> Message sent successfully!
                </div>
              )}

              {/* Message History */}
              {messages.length > 0 && (
                <div className="space-y-2 pt-2 border-t">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Message History
                  </p>
                  <div className="space-y-2">
                    {messages.map((m) => (
                      <div key={m.id} className="rounded-lg border bg-muted/40 p-3 text-xs space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                          <span className="capitalize font-medium text-foreground">Status: {m.status}</span>
                          <span>{formatDateTime(m.createdAt)}</span>
                        </div>
                        <p className="text-foreground">{m.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Col: Associated Website & Activity Timeline */}
        <div className="space-y-6">
          {/* Associated Website */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Globe className="h-4 w-4 text-cyan-400" /> Generated Website
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              {website ? (
                <>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">Template</span>
                    <span className="capitalize font-medium text-foreground">{website.template}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">Status</span>
                    <span className="capitalize text-emerald-400 font-medium">{website.status}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">Live Link</span>
                    {website.liveUrl || website.previewUrl ? (
                      <a
                        href={website.liveUrl || website.previewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline truncate max-w-[150px]"
                      >
                        {website.liveUrl || website.previewUrl}
                      </a>
                    ) : (
                      <span className="text-muted-foreground">Pending</span>
                    )}
                  </div>
                  <Link href={`/websites/${website.id}`}>
                    <Button variant="secondary" size="sm" className="w-full text-xs mt-2">
                      Manage Website
                    </Button>
                  </Link>
                </>
              ) : (
                <div className="text-center py-4 space-y-2">
                  <p className="text-muted-foreground">No website created yet for this lead.</p>
                  <Link href="/websites">
                    <Button variant="outline" size="sm" className="text-xs gap-1.5">
                      <Sparkles className="h-3.5 w-3.5" /> Generate Website
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity Timeline */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-400" /> Lifecycle Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex gap-2.5 items-start">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">Scraped from Google Maps</p>
                  <p className="text-[10px] text-muted-foreground">{formatDate(lead.createdAt)}</p>
                </div>
              </div>

              <div className="flex gap-2.5 items-start">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">AI Opportunity Qualification</p>
                  <p className="text-[10px] text-muted-foreground">Score: {lead.aiScore ?? 80}/100</p>
                </div>
              </div>

              {website && (
                <div className="flex gap-2.5 items-start">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Website Generated & Deployed</p>
                    <p className="text-[10px] text-muted-foreground">Template: {website.template}</p>
                  </div>
                </div>
              )}

              {lead.status === "contacted" && (
                <div className="flex gap-2.5 items-start">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">WhatsApp Outreach Sent</p>
                    <p className="text-[10px] text-muted-foreground">{lead.phone}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}