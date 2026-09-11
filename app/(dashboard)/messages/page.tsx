"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  MessageSquare,
  Send,
  CheckCheck,
  Check,
  Sparkles,
  Search,
  Filter,
  Phone,
  ArrowUpRight,
  ExternalLink,
  Bot,
  User,
  Clock,
  ThumbsUp,
  AlertCircle,
  HelpCircle,
  XCircle,
  Smile,
  Paperclip,
  ShieldCheck,
  RefreshCw,
  FileSpreadsheet,
  Loader2,
  CheckCircle2,
  Edit2,
  Trash2,
  SlidersHorizontal,
  ArrowLeft,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatRelative, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Message } from "@/lib/types";
import { exportMessagesToSheets } from "@/lib/api/sheets";

interface ConversationLead {
  id: string;
  businessName: string;
  phone: string;
  category: string;
  location: string;
  websiteUrl: string;
  lastMessage: string;
  lastTimestamp: string;
  status: "delivered" | "read" | "replied" | "failed";
  classification?: "interested" | "follow_up" | "price_request" | "call_request" | "not_interested";
  messages: Array<{
    id: string;
    direction: "outbound" | "inbound";
    body: string;
    timestamp: string;
    status?: "sent" | "delivered" | "read";
    classification?: string;
  }>;
}

const mockConversations: ConversationLead[] = [
  {
    id: "conv-1",
    businessName: "Saravana Bhavan Grand",
    phone: "+44 20 7946 0991",
    category: "Restaurant",
    location: "Covent Garden, London",
    websiteUrl: "/preview/conv-1",
    lastMessage: "Yes, we would love to connect! Can you customize our catering menu section?",
    lastTimestamp: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
    status: "replied",
    classification: "interested",
    messages: [
      {
        id: "m-1",
        direction: "outbound",
        body: "Hello Saravana Bhavan team! 👋 We noticed your popular restaurant on Google Maps in Covent Garden doesn't have a modern mobile website. Our AI synthesized a live custom website for you: /preview/conv-1 — Check it out and let us know if you'd like to claim it!",
        timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        status: "read",
      },
      {
        id: "m-2",
        direction: "inbound",
        body: "Yes, we would love to connect! Can you customize our catering menu section?",
        timestamp: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
        classification: "interested",
      },
    ],
  },
  {
    id: "conv-2",
    businessName: "Aura Luxury Salon & Spa",
    phone: "+1 212 555 0192",
    category: "Salon & Spa",
    location: "SoHo, New York",
    websiteUrl: "/preview/conv-2",
    lastMessage: "What are your pricing packages for hosting and domain management?",
    lastTimestamp: new Date(Date.now() - 1000 * 60 * 85).toISOString(),
    status: "replied",
    classification: "price_request",
    messages: [
      {
        id: "m-3",
        direction: "outbound",
        body: "Hi Aura Salon! 🌸 We created a bespoke booking website for your SoHo salon with appointment scheduling: /preview/conv-2. It's ready to launch on your custom domain in 1 click.",
        timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
        status: "read",
      },
      {
        id: "m-4",
        direction: "inbound",
        body: "What are your pricing packages for hosting and domain management?",
        timestamp: new Date(Date.now() - 1000 * 60 * 85).toISOString(),
        classification: "price_request",
      },
    ],
  },
  {
    id: "conv-3",
    businessName: "Metropolitan Dental Healthcare",
    phone: "+81 3 5555 0143",
    category: "Healthcare",
    location: "Shibuya, Tokyo",
    websiteUrl: "/preview/conv-3",
    lastMessage: "Can we schedule a 10 min call tomorrow at 3 PM?",
    lastTimestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    status: "replied",
    classification: "call_request",
    messages: [
      {
        id: "m-5",
        direction: "outbound",
        body: "Hello Metropolitan Dental team! 🦷 We built an appointment booking preview for your Shibuya clinic: /preview/conv-3. Optimized for Google Maps patient traffic.",
        timestamp: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
        status: "read",
      },
      {
        id: "m-6",
        direction: "inbound",
        body: "Can we schedule a 10 min call tomorrow at 3 PM?",
        timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
        classification: "call_request",
      },
    ],
  },
  {
    id: "conv-4",
    businessName: "L'Artisan Boulangerie",
    phone: "+971 4 321 4567",
    category: "Cafe",
    location: "Downtown, Dubai",
    websiteUrl: "/preview/conv-4",
    lastMessage: "Message delivered to WhatsApp inbox",
    lastTimestamp: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
    status: "delivered",
    messages: [
      {
        id: "m-7",
        direction: "outbound",
        body: "Hello L'Artisan Boulangerie! 🥐 We designed a mobile bakery order portal for your Downtown Dubai store: /preview/conv-4. Check it out anytime!",
        timestamp: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
        status: "delivered",
      },
    ],
  },
  {
    id: "conv-5",
    businessName: "Apex CrossFit & Fitness Hub",
    phone: "+1 415 555 0188",
    category: "Fitness",
    location: "SOMA, San Francisco",
    websiteUrl: "/preview/conv-5",
    lastMessage: "We already have a web developer under contract, thank you.",
    lastTimestamp: new Date(Date.now() - 1000 * 60 * 500).toISOString(),
    status: "replied",
    classification: "not_interested",
    messages: [
      {
        id: "m-8",
        direction: "outbound",
        body: "Hey Apex CrossFit! 💪 Your gym preview website is ready at /preview/conv-5 with class schedule filters.",
        timestamp: new Date(Date.now() - 1000 * 60 * 600).toISOString(),
        status: "read",
      },
      {
        id: "m-9",
        direction: "inbound",
        body: "We already have a web developer under contract, thank you.",
        timestamp: new Date(Date.now() - 1000 * 60 * 500).toISOString(),
        classification: "not_interested",
      },
    ],
  },
];

const classificationConfig: Record<string, { label: string; variant: "success" | "info" | "warning" | "destructive" | "muted"; icon: React.ElementType }> = {
  interested: { label: "High Intent / Interested", variant: "success", icon: ThumbsUp },
  price_request: { label: "Pricing Inquiry", variant: "info", icon: HelpCircle },
  call_request: { label: "Call Requested", variant: "warning", icon: Phone },
  follow_up: { label: "Follow-up Needed", variant: "info", icon: Clock },
  not_interested: { label: "Not Interested", variant: "destructive", icon: XCircle },
};

export default function MessagesPage() {
  const [conversations, setConversations] = React.useState<ConversationLead[]>(mockConversations);
  const [selectedId, setSelectedId] = React.useState<string>(mockConversations[0].id);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [filterTab, setFilterTab] = React.useState<"all" | "interested" | "replied" | "outbound">("all");
  const [replyInput, setReplyInput] = React.useState("");
  const [isSending, setIsSending] = React.useState(false);
  const [mobileView, setMobileView] = React.useState<"list" | "chat">("list");

  const selectedConversation = conversations.find((c) => c.id === selectedId) || conversations[0];

  const handleSendReply = (text?: string) => {
    const msgToSend = text || replyInput;
    if (!msgToSend.trim() || !selectedConversation) return;

    setIsSending(true);
    const newMsg = {
      id: `msg-${Date.now()}`,
      direction: "outbound" as const,
      body: msgToSend,
      timestamp: new Date().toISOString(),
      status: "delivered" as const,
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === selectedConversation.id
          ? {
              ...c,
              lastMessage: msgToSend,
              lastTimestamp: new Date().toISOString(),
              messages: [...c.messages, newMsg],
            }
          : c
      )
    );

    setReplyInput("");
    setIsSending(false);
  };

  const filteredConversations = conversations.filter((c) => {
    const matchesSearch =
      c.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      c.category.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (filterTab === "interested") return c.classification === "interested" || c.classification === "call_request";
    if (filterTab === "replied") return c.status === "replied";
    if (filterTab === "outbound") return c.status === "delivered" || c.status === "read";
    return true;
  });

  const totalDispatched = conversations.reduce((acc, c) => acc + c.messages.filter((m) => m.direction === "outbound").length, 0);
  const totalReplies = conversations.filter((c) => c.status === "replied").length;
  const replyRate = Math.round((totalReplies / conversations.length) * 100);
  const interestedCount = conversations.filter((c) => c.classification === "interested" || c.classification === "call_request").length;

  const [isExportingSheets, setIsExportingSheets] = React.useState(false);
  const [exportNotice, setExportNotice] = React.useState<string | null>(null);

  const handleExportSheets = async () => {
    setIsExportingSheets(true);
    try {
      const res = await exportMessagesToSheets("mock-spreadsheet-vasaw");
      if (res.success) {
        setExportNotice(`Successfully exported ${res.rowsWritten} outreach messages to Google Sheets (${res.filename || "file downloaded"}).`);
      } else {
        setExportNotice(res.error || "Failed to export outreach logs.");
      }
    } catch (err) {
      setExportNotice(err instanceof Error ? err.message : "Export network error");
    } finally {
      setIsExportingSheets(false);
      setTimeout(() => setExportNotice(null), 4000);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 space-y-6">
      <PageHeader
        title="WhatsApp Outreach & Inbox"
        description="Meta WhatsApp Cloud API bidirectional gateway, automated template delivery, and LLM intent intelligence."
      >
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportSheets}
            disabled={isExportingSheets}
            className="gap-1.5 font-sans border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
          >
            {isExportingSheets ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-600" />
            ) : (
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
            )}
            Export to Sheets
          </Button>
          <Badge variant="outline" className="gap-1.5 font-mono text-[11px] text-emerald-600 border-emerald-200 bg-emerald-50 py-1 px-3">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Meta Cloud Gateway: Connected
          </Badge>
        </div>
      </PageHeader>

      {exportNotice && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/90 px-4 py-2.5 text-xs font-sans text-emerald-800 shadow-xs animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{exportNotice}</span>
        </div>
      )}

      {/* Porcelain Summary Telemetry Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Outreach Dispatched", value: totalDispatched.toLocaleString(), sub: "Verified WhatsApp deliveries", color: "text-slate-950", accent: "from-blue-500 to-indigo-500" },
          { label: "Response Rate SLA", value: `${replyRate}%`, sub: "High-intent reply ratio", color: "text-emerald-600", accent: "from-emerald-400 to-teal-500" },
          { label: "Interested Leads", value: interestedCount, sub: "Ready for contract closing", color: "text-blue-600", accent: "from-blue-400 to-cyan-500" },
          { label: "Auto AI Classifications", value: `${conversations.length}`, sub: "Zero manual tagging needed", color: "text-purple-600", accent: "from-purple-400 to-indigo-500" },
        ].map((s) => (
          <div
            key={s.label}
            className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-md transition-all duration-200 hover-lift"
          >
            <div className={cn("absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r opacity-70", s.accent)} />
            <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-400">{s.label}</p>
            <p className={cn("mt-1.5 font-display text-3xl font-extrabold tracking-tight", s.color)}>{s.value}</p>
            <p className="mt-1 font-sans text-xs text-slate-500">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Split View: Conversation Stream & Message Inspector (Matching Stitch Dual-Pane with Mobile Responsiveness) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[660px]">
        {/* Left Pane: Conversation List (5 cols on lg, toggled on mobile) */}
        <div className={cn("lg:col-span-5 flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden transition-colors", mobileView === "chat" ? "hidden lg:flex" : "flex")}>
          {/* Search & Tabs matching Stitch Inbox */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-[17px] text-slate-900 dark:text-white tracking-tight">Inbox</h2>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[11px] font-mono font-medium">
                  {conversations.length} Conversations
                </span>
              </div>
              <button
                onClick={() => setExportNotice("Inbox filter preferences applied")}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Filter settings"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Filter by sender, company or tag..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-8 bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 text-xs rounded-lg font-sans placeholder:text-slate-400"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
              {(
                [
                  { id: "all", label: "All" },
                  { id: "replied", label: "Needs Reply" },
                  { id: "interested", label: "High Intent" },
                  { id: "outbound", label: "Automated" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilterTab(tab.id)}
                  className={cn(
                    "px-2.5 py-1 text-[11px] rounded-md font-medium transition-all whitespace-nowrap",
                    filterTab === tab.id
                      ? "bg-slate-900 dark:bg-blue-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* List items */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
            {filteredConversations.map((conv) => {
              const isSelected = conv.id === selectedConversation.id;

              return (
                <div
                  key={conv.id}
                  onClick={() => {
                    setSelectedId(conv.id);
                    setMobileView("chat");
                  }}
                  className={cn(
                    "p-3.5 cursor-pointer transition-colors duration-150 flex flex-col gap-1.5",
                    isSelected
                      ? "bg-blue-50/60 dark:bg-blue-950/30 border-l-2 border-blue-600"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={cn(
                        "w-2 h-2 rounded-full shrink-0",
                        conv.status === "replied" ? "bg-blue-600 ring-2 ring-blue-200 dark:ring-blue-900" : "bg-slate-300 dark:bg-slate-600"
                      )} />
                      <span className="font-semibold text-[13px] text-slate-900 dark:text-white truncate">
                        {conv.businessName}
                      </span>
                      <span className="text-[12px] text-slate-500 dark:text-slate-400 truncate">
                        · {conv.category}
                      </span>
                    </div>
                    <span className="font-mono text-[10.5px] text-slate-400 shrink-0" suppressHydrationWarning>
                      {formatRelative(conv.lastTimestamp)}
                    </span>
                  </div>

                  <p className="line-clamp-1 font-sans text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {conv.lastMessage}
                  </p>

                  <div className="flex items-center justify-between pt-0.5">
                    <span className="text-[11px] text-blue-600 dark:text-blue-400 flex items-center gap-1 font-medium font-sans">
                      <Sparkles className="w-3 h-3" />
                      Smart Draft Ready
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {conv.location}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Pane: Active Conversation & AI Copilot Workspace (7 cols on lg, toggled on mobile) */}
        <div className={cn("lg:col-span-7 flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden transition-colors", mobileView === "list" ? "hidden lg:flex" : "flex")}>
          {/* Mobile Back Header */}
          <div className="lg:hidden px-4 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 flex items-center">
            <button
              onClick={() => setMobileView("list")}
              className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Conversations</span>
            </button>
          </div>

          {/* Header matching Stitch */}
          <div className="px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-[16px] text-slate-900 dark:text-white tracking-tight">
                  {selectedConversation.businessName}
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300 text-[10.5px] font-semibold font-mono">
                  Active
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11.5px] text-slate-500 dark:text-slate-400 mt-0.5 font-sans">
                <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live channel
                </span>
                <span>·</span>
                <span>{selectedConversation.phone}</span>
                <span>·</span>
                <span>{selectedConversation.location}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={selectedConversation.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="h-8 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <span>Live Site</span>
                <ExternalLink className="h-3 w-3" />
              </a>
              <button
                onClick={() => setExportNotice(`Synced lead record for ${selectedConversation.businessName}`)}
                className="h-8 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <User className="h-3.5 w-3.5" />
                <span>CRM</span>
              </button>
            </div>
          </div>

          {/* Sub-ribbon matching Stitch */}
          <div className="px-6 py-2 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11.5px] text-slate-600 dark:text-slate-400 font-sans">
            <div className="flex items-center gap-2 flex-wrap">
              <span><strong className="font-semibold text-slate-800 dark:text-slate-200">Campaign:</strong> Q3 Autonomous Inbound</span>
              <span>·</span>
              <span><strong className="font-semibold text-slate-800 dark:text-slate-200">Stage:</strong> Discovery & Qualification</span>
              <span>·</span>
              <span><strong className="font-semibold text-slate-800 dark:text-slate-200">Lead Owner:</strong> Sarah Jenkins</span>
            </div>
            <span className="font-mono text-[10.5px] text-emerald-600 dark:text-emerald-400 font-semibold">
              99.2% DELIVERY SLA
            </span>
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/40 dark:bg-slate-950/20">
            {selectedConversation.messages.map((msg) => {
              const isOutbound = msg.direction === "outbound";

              return (
                <div
                  key={msg.id}
                  className={cn("flex flex-col max-w-[82%]", isOutbound ? "ml-auto items-end" : "mr-auto items-start")}
                >
                  <div
                    className={cn(
                      "p-4 rounded-2xl shadow-xs text-[13px] font-sans leading-relaxed",
                      isOutbound
                        ? "bg-blue-50/90 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 text-slate-900 dark:text-white rounded-tr-xs"
                        : "bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700/80 text-slate-800 dark:text-slate-200 rounded-tl-xs"
                    )}
                  >
                    <p>{msg.body}</p>

                    {/* Live Site Preview Card */}
                    {isOutbound && (
                      <div className="mt-3 rounded-xl border border-blue-200 dark:border-blue-800 bg-white/80 dark:bg-slate-800/80 p-3 backdrop-blur-sm">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                          <span className="font-mono text-[11px] text-blue-700 dark:text-blue-300 truncate font-semibold">
                            {selectedConversation.websiteUrl}
                          </span>
                        </div>
                        <p className="mt-1 text-[11.5px] text-slate-500 dark:text-slate-400">
                          {selectedConversation.businessName} — Custom Edge Portal
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 mt-1 px-1 font-mono text-[10px] text-slate-400">
                    <span suppressHydrationWarning>{formatRelative(msg.timestamp)}</span>
                    {isOutbound && <CheckCheck className="h-3 w-3 text-blue-600" />}
                  </div>
                </div>
              );
            })}
          </div>

          {/* AI Copilot Workspace: AI Suggested Reply Card (Matching Stitch) */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 p-4 shadow-xs">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="font-semibold text-[13px] text-slate-900 dark:text-white">AI Suggested Reply</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Synthesized live</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-[13px] text-slate-800 dark:text-slate-200 leading-relaxed font-sans">
                <p className="mb-1 text-[11px] font-medium text-slate-400 dark:text-slate-500 font-mono">Proposed message:</p>
                &ldquo;Here is our custom SLA breakdown and dedicated onboarding package configured for {selectedConversation.businessName}. I’ve attached the full security packet with volume discounting. Let me know if you need any adjustments before your review.&rdquo;
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 mt-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSendReply(`Here is our custom SLA breakdown and dedicated onboarding package configured for ${selectedConversation.businessName}. I’ve attached the full security packet with volume discounting. Let me know if you need any adjustments before your review.`)}
                    disabled={isSending}
                    className="h-8 px-3.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-medium flex items-center gap-1.5 shadow-xs transition-all active:scale-[0.98]"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Reply</span>
                  </button>
                  <button
                    onClick={() => setReplyInput(`Here is our custom SLA breakdown and dedicated onboarding package configured for ${selectedConversation.businessName}. I’ve attached the full security packet with volume discounting. Let me know if you need any adjustments before your review.`)}
                    className="h-8 px-3 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-[12px] font-medium flex items-center gap-1.5 transition-all shadow-xs"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Text</span>
                  </button>
                  <button
                    onClick={() => setReplyInput(`Confirmed! Custom package sent over for ${selectedConversation.businessName}. Let us know if you need any updates.`)}
                    className="h-8 px-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 text-[12px] font-medium flex items-center gap-1 transition-colors"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>Shorten</span>
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 font-mono">Press ⌘ + Enter to send</span>
                  <button
                    onClick={() => setReplyInput("")}
                    className="text-slate-400 hover:text-rose-500 p-1 rounded transition-colors"
                    title="Discard suggestion"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Manual Reply Input Bar */}
            <div className="mt-3 flex items-center gap-2">
              <Input
                placeholder={`Reply to ${selectedConversation.businessName} via Meta WhatsApp API…`}
                value={replyInput}
                onChange={(e) => setReplyInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendReply();
                  }
                }}
                className="h-9 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-xs rounded-lg font-sans"
              />
              <Button
                onClick={() => handleSendReply()}
                disabled={!replyInput.trim() || isSending}
                className="h-9 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-sans text-xs gap-1.5 px-4 shadow-xs"
              >
                <Send className="h-3.5 w-3.5" />
                Send
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}