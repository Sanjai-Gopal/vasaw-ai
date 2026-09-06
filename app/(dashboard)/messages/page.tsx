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
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatRelative, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Message } from "@/lib/types";

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
    phone: "+91 98421 88210",
    category: "Restaurant",
    location: "RS Puram, Coimbatore",
    websiteUrl: "https://saravana-bhavan.vasaw.app",
    lastMessage: "Yes, we would love to connect! Can you customize our catering menu section?",
    lastTimestamp: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
    status: "replied",
    classification: "interested",
    messages: [
      {
        id: "m-1",
        direction: "outbound",
        body: "Hello Saravana Bhavan team! 👋 We noticed your popular restaurant on Google Maps in RS Puram doesn't have a modern mobile website. Our AI synthesized a live custom website for you: https://saravana-bhavan.vasaw.app — Check it out and let us know if you'd like to claim it!",
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
    phone: "+91 94432 10982",
    category: "Salon & Spa",
    location: "Race Course, Coimbatore",
    websiteUrl: "https://aura-luxury-spa.vasaw.app",
    lastMessage: "What are your pricing packages for hosting and domain management?",
    lastTimestamp: new Date(Date.now() - 1000 * 60 * 85).toISOString(),
    status: "replied",
    classification: "price_request",
    messages: [
      {
        id: "m-3",
        direction: "outbound",
        body: "Hi Aura Salon! 🌸 We created a bespoke booking website for your Race Course salon with appointment scheduling: https://aura-luxury-spa.vasaw.app. It's ready to launch on your custom domain in 1 click.",
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
    businessName: "Kovai Dental Healthcare",
    phone: "+91 98940 77123",
    category: "Healthcare",
    location: "Gandhipuram, Coimbatore",
    websiteUrl: "https://kovai-dental.vasaw.app",
    lastMessage: "Can we schedule a 10 min call tomorrow at 3 PM?",
    lastTimestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    status: "replied",
    classification: "call_request",
    messages: [
      {
        id: "m-5",
        direction: "outbound",
        body: "Hello Dr. Kovai Dental team! 🦷 We built a HIPAA-compliant appointment booking preview for your clinic: https://kovai-dental.vasaw.app. Optimized for Google Maps patient traffic.",
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
    businessName: "Coimbatore Artisan Bakery",
    phone: "+91 97890 12345",
    category: "Cafe",
    location: "Saibaba Colony, Coimbatore",
    websiteUrl: "https://coimbatore-artisan-bakery.vasaw.app",
    lastMessage: "Message delivered to WhatsApp inbox",
    lastTimestamp: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
    status: "delivered",
    messages: [
      {
        id: "m-7",
        direction: "outbound",
        body: "Hello Coimbatore Artisan Bakery! 🥐 We designed a mobile bakery order portal for your Saibaba Colony store: https://coimbatore-artisan-bakery.vasaw.app. Check it out anytime!",
        timestamp: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
        status: "delivered",
      },
    ],
  },
  {
    id: "conv-5",
    businessName: "Apex CrossFit & Fitness Hub",
    phone: "+91 99440 98765",
    category: "Fitness",
    location: "Peelamedu, Coimbatore",
    websiteUrl: "https://apex-crossfit.vasaw.app",
    lastMessage: "We already have a web developer under contract, thank you.",
    lastTimestamp: new Date(Date.now() - 1000 * 60 * 500).toISOString(),
    status: "replied",
    classification: "not_interested",
    messages: [
      {
        id: "m-8",
        direction: "outbound",
        body: "Hey Apex CrossFit! 💪 Your gym preview website is ready at https://apex-crossfit.vasaw.app with class schedule filters.",
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

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 space-y-6">
      <PageHeader
        title="WhatsApp Outreach & Inbox"
        description="Meta WhatsApp Cloud API bidirectional gateway, automated template delivery, and LLM intent intelligence."
      >
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1.5 font-mono text-[11px] text-emerald-600 border-emerald-200 bg-emerald-50 py-1 px-3">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Meta Cloud Gateway: Connected
          </Badge>
        </div>
      </PageHeader>

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

      {/* Split View: Conversation Stream & Message Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[640px]">
        {/* Left Pane: Conversation List (5 cols) */}
        <div className="lg:col-span-5 flex flex-col rounded-3xl border border-slate-200/80 bg-white/90 shadow-sm backdrop-blur-md overflow-hidden">
          {/* Search & Tabs */}
          <div className="p-4 border-b border-slate-100 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search by business, phone or category…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-slate-50 border-slate-200 text-xs rounded-xl font-sans"
              />
            </div>
            <div className="flex items-center gap-1">
              {(["all", "interested", "replied", "outbound"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilterTab(tab)}
                  className={cn(
                    "px-3 py-1 text-xs font-sans rounded-xl font-medium transition-all capitalize",
                    filterTab === tab
                      ? "bg-slate-900 text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* List items */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredConversations.map((conv) => {
              const isSelected = conv.id === selectedConversation.id;
              const classification = conv.classification ? classificationConfig[conv.classification] : null;

              return (
                <div
                  key={conv.id}
                  onClick={() => setSelectedId(conv.id)}
                  className={cn(
                    "p-4 cursor-pointer transition-all duration-150 flex flex-col gap-2",
                    isSelected
                      ? "bg-blue-50/70 border-l-4 border-blue-600 pl-3.5"
                      : "hover:bg-slate-50/80"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-display text-sm font-bold text-slate-950 truncate">
                        {conv.businessName}
                      </p>
                      <p className="font-mono text-[11px] text-slate-500">{conv.phone}</p>
                    </div>
                    <span className="font-mono text-[10px] text-slate-400 whitespace-nowrap">
                      {formatRelative(conv.lastTimestamp)}
                    </span>
                  </div>

                  <p className="line-clamp-2 font-sans text-xs text-slate-600 leading-relaxed">
                    {conv.lastMessage}
                  </p>

                  <div className="flex items-center justify-between pt-1">
                    <span className="font-mono text-[10px] font-semibold text-slate-400 uppercase">
                      {conv.category}
                    </span>
                    {classification && (
                      <Badge variant={classification.variant} className="text-[10px] py-0 px-2">
                        {classification.label}
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Pane: WhatsApp Conversation Inspector (7 cols) */}
        <div className="lg:col-span-7 flex flex-col rounded-3xl border border-slate-200/80 bg-white/95 shadow-sm backdrop-blur-md overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-slate-950">
                  {selectedConversation.businessName}
                </h3>
                <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500">
                  <Phone className="h-3 w-3 text-slate-400" />
                  <span>{selectedConversation.phone}</span>
                  <span>·</span>
                  <span>{selectedConversation.location}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={selectedConversation.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-sans text-xs font-semibold text-blue-600 shadow-xs hover:bg-slate-50"
              >
                <span>Live Site</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          {/* AI Intent Summary Badge */}
          {selectedConversation.classification && (
            <div className="bg-blue-50/80 border-b border-blue-100 px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2 font-sans text-xs text-blue-900">
                <Sparkles className="h-4 w-4 text-blue-600" />
                <span>
                  <strong>AI Classification:</strong> {classificationConfig[selectedConversation.classification]?.label}
                </span>
              </div>
              <span className="font-mono text-[10px] text-blue-600 font-bold uppercase">
                AUTOMATED LLM INTENT
              </span>
            </div>
          )}

          {/* Chat Messages Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30">
            {selectedConversation.messages.map((msg) => {
              const isOutbound = msg.direction === "outbound";

              return (
                <div
                  key={msg.id}
                  className={cn("flex flex-col max-w-[82%]", isOutbound ? "ml-auto items-end" : "mr-auto items-start")}
                >
                  <div
                    className={cn(
                      "p-4 rounded-2xl shadow-xs text-xs font-sans leading-relaxed",
                      isOutbound
                        ? "bg-slate-900 text-white rounded-br-xs"
                        : "bg-white border border-slate-200 text-slate-800 rounded-bl-xs"
                    )}
                  >
                    <p>{msg.body}</p>

                    {/* If message has link, show a synthetic website preview card */}
                    {isOutbound && (
                      <div className="mt-3 rounded-xl border border-white/20 bg-white/10 p-3 backdrop-blur-sm">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                          <span className="font-mono text-[10px] text-white/90 truncate font-semibold">
                            {selectedConversation.websiteUrl}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-white/70">
                          {selectedConversation.businessName} — Custom Business Portal
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 mt-1 px-1 font-mono text-[10px] text-slate-400">
                    <span>{formatRelative(msg.timestamp)}</span>
                    {isOutbound && <CheckCheck className="h-3 w-3 text-blue-600" />}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pre-written quick response suggestions */}
          <div className="p-3 bg-white border-t border-slate-100 flex items-center gap-2 overflow-x-auto">
            <span className="font-mono text-[10px] font-bold text-slate-400 uppercase whitespace-nowrap">
              Quick AI Reply:
            </span>
            <button
              onClick={() => handleSendReply("Great! Here is our standard onboarding package: 1 domain, 99.9% Edge SLA hosting, and dynamic WhatsApp inquiries for ₹2,499/mo.")}
              className="whitespace-nowrap px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 text-[11px] font-sans font-medium text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Send Pricing Packages
            </button>
            <button
              onClick={() => handleSendReply("Sure thing! Would 3:30 PM tomorrow work best for a quick 10-minute preview walkthrough call?")}
              className="whitespace-nowrap px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 text-[11px] font-sans font-medium text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Confirm 10m Call
            </button>
            <button
              onClick={() => handleSendReply("We can certainly add a dedicated catering menu with online PDF downloads. Updating your live preview now!")}
              className="whitespace-nowrap px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 text-[11px] font-sans font-medium text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Confirm Customization
            </button>
          </div>

          {/* Reply Input Bar */}
          <div className="p-4 border-t border-slate-100 bg-white flex items-center gap-2">
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
              className="bg-slate-50 border-slate-200 text-xs rounded-xl font-sans"
            />
            <Button
              onClick={() => handleSendReply()}
              disabled={!replyInput.trim() || isSending}
              className="bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl font-sans text-xs gap-1.5 px-4"
            >
              <Send className="h-3.5 w-3.5" />
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}