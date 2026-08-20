"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  CheckCheck,
  MessageSquare,
  Reply,
  Send,
  Inbox,
  Sparkles,
  ArrowUpRight,
  ArrowLeft,
  Check,
  Phone,
  MapPin,
  Star,
  ExternalLink,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { messages as initialMessages } from "@/lib/data/messages";
import { leads } from "@/lib/data/leads";
import { websites } from "@/lib/data/websites";
import { messageStatusMeta, replyClassMeta, leadStatusMeta } from "@/lib/status";
import { formatRelative, formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Message } from "@/lib/types";

const statusIcon = {
  prepared: Sparkles,
  sent: Send,
  delivered: CheckCheck,
  read: MessageSquare,
  failed: Send,
};

function MessageRow({
  message,
  index,
  isSelected,
  onClick,
}: {
  message: Message;
  index: number;
  isSelected: boolean;
  onClick: () => void;
}) {
  const meta = messageStatusMeta[message.status];
  const Icon = statusIcon[message.status];
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.03 }}
      onClick={onClick}
      className={cn(
        "cursor-pointer rounded-xl border p-4 transition-colors",
        isSelected
          ? "border-primary/50 bg-primary/5"
          : "border-border bg-muted/30 hover:border-border hover:bg-muted/50"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border ${
              message.direction === "inbound" ? "bg-info/10 text-info" : "bg-primary/10 text-primary"
            }`}
          >
            {message.direction === "inbound" ? (
              <Reply className="h-4 w-4" />
            ) : (
              <Icon className="h-4 w-4" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/leads/${message.leadId}`}
                onClick={(e) => e.stopPropagation()}
                className="font-semibold hover:text-primary"
              >
                {message.businessName}
              </Link>
              <Badge variant={message.direction === "inbound" ? "info" : "outline"}>
                {message.direction === "inbound" ? "Reply" : "Outreach"}
              </Badge>
              {message.replyClassification && (
                <Badge variant={replyClassMeta[message.replyClassification].variant}>
                  {replyClassMeta[message.replyClassification].label}
                </Badge>
              )}
            </div>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{message.content}</p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <Badge variant={meta.variant}>{meta.label}</Badge>
          <span className="text-[11px] text-muted-foreground">
            {formatRelative(message.sentAt ?? message.createdAt)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function ConversationView({
  leadId,
  messages: allMessages,
}: {
  leadId: string;
  messages: Message[];
}) {
  const lead = leads.find((l) => l.id === leadId);
  const leadWebsite = websites.find((w) => w.leadId === leadId);
  const leadMessages = [...allMessages]
    .filter((m) => m.leadId === leadId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  if (!lead) return null;

  const statusMeta = leadStatusMeta[lead.status];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden">
        <div className="border-b border-border bg-muted/30 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted text-xs font-bold uppercase text-muted-foreground">
                {lead.businessName.slice(0, 2)}
              </div>
              <div>
                <Link href={`/leads/${lead.id}`} className="font-semibold hover:text-primary">
                  {lead.businessName}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {lead.category} · {lead.location}
                </p>
              </div>
            </div>
            <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="flex items-center gap-1 rounded-md border border-border bg-muted px-2 py-1 text-xs text-muted-foreground">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              {lead.rating.toFixed(1)}
            </span>
            <span className="flex items-center gap-1 rounded-md border border-border bg-muted px-2 py-1 text-xs text-muted-foreground">
              <Phone className="h-3 w-3" />
              {lead.phone}
            </span>
            <span className="flex items-center gap-1 rounded-md border border-border bg-muted px-2 py-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {lead.location}
            </span>
          </div>
        </div>

        <div className="max-h-[400px] overflow-y-auto p-4">
          <div className="space-y-3">
            {leadMessages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex",
                  msg.direction === "outbound" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-3",
                    msg.direction === "outbound"
                      ? "bg-primary/15 text-foreground"
                      : "bg-muted border border-border text-foreground"
                  )}
                >
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                  <div className="mt-1.5 flex items-center justify-between gap-3">
                    <span className="text-[10px] text-muted-foreground">
                      {formatDateTime(msg.sentAt ?? msg.createdAt)}
                    </span>
                    <div className="flex items-center gap-1">
                      {msg.status === "read" && (
                        <CheckCheck className="h-3 w-3 text-info" />
                      )}
                      {msg.status === "delivered" && (
                        <CheckCheck className="h-3 w-3 text-muted-foreground" />
                      )}
                      {msg.status === "sent" && (
                        <Check className="h-3 w-3 text-muted-foreground" />
                      )}
                      <span className="text-[10px] text-muted-foreground">
                        {messageStatusMeta[msg.status].label}
                      </span>
                    </div>
                  </div>
                  {msg.replyClassification && (
                    <div className="mt-1.5">
                      <Badge variant={replyClassMeta[msg.replyClassification].variant}>
                        {replyClassMeta[msg.replyClassification].label}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-border p-3">
          <div className="flex items-center gap-2">
            <Link
              href={`/leads/${lead.id}`}
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              View full lead profile
              <ExternalLink className="h-3 w-3" />
            </Link>
            {leadWebsite?.liveUrl && (
              <a
                href={leadWebsite.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-info hover:underline"
              >
                View website
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function PreparedMessageActions({
  message,
  onApprove,
}: {
  message: Message;
  onApprove: (id: string) => void;
}) {
  return (
    <div className="mt-2 flex gap-2">
      <Button size="sm" className="gap-1.5" onClick={() => onApprove(message.id)}>
        <Check className="h-3.5 w-3.5" />
        Approve & Send
      </Button>
      <Button variant="outline" size="sm">
        Edit
      </Button>
    </div>
  );
}

export default function MessagesPage() {
  const [messages, setMessages] = React.useState<Message[]>(initialMessages);
  const [selectedLeadId, setSelectedLeadId] = React.useState<string | null>(null);

  const prepared = messages.filter((m) => m.status === "prepared");
  const sent = messages.filter((m) => ["sent", "delivered", "read", "failed"].includes(m.status));
  const replies = messages.filter((m) => m.direction === "inbound");

  const replySummary = {
    interested: replies.filter((r) => r.replyClassification === "interested").length,
    questions: replies.filter((r) => r.replyClassification === "follow_up" || r.replyClassification === "price_request" || r.replyClassification === "call_request").length,
    notInterested: replies.filter((r) => r.replyClassification === "not_interested").length,
  };

  const handleApprove = (id: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === id
          ? {
              ...m,
              status: "sent" as const,
              sentAt: new Date().toISOString(),
            }
          : m
      )
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        title="Messages"
        description="WhatsApp outreach, delivery tracking and reply intelligence"
      >
        <Button className="gap-1.5">
          <Sparkles className="h-4 w-4" />
          Draft with AI
        </Button>
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Interested replies</p>
          <p className="mt-1 text-2xl font-bold text-emerald-400">{replySummary.interested}</p>
          <p className="mt-1 text-xs text-muted-foreground">Ready to push further</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Need follow-up</p>
          <p className="mt-1 text-2xl font-bold text-sky-400">{replySummary.questions}</p>
          <p className="mt-1 text-xs text-muted-foreground">Questions, pricing, or call requests</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Not interested</p>
          <p className="mt-1 text-2xl font-bold text-rose-400">{replySummary.notInterested}</p>
          <p className="mt-1 text-xs text-muted-foreground">Closed or deprioritized</p>
        </Card>
      </div>

      {selectedLeadId ? (
        <div className="space-y-4">
          <button
            onClick={() => setSelectedLeadId(null)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to all messages
          </button>
          <ConversationView leadId={selectedLeadId} messages={messages} />
        </div>
      ) : (
        <Tabs defaultValue="prepared">
          <TabsList>
            <TabsTrigger value="prepared" className="gap-1.5">
              <Sparkles className="h-4 w-4" />
              Prepared ({prepared.length})
            </TabsTrigger>
            <TabsTrigger value="sent" className="gap-1.5">
              <Send className="h-4 w-4" />
              Sent ({sent.length})
            </TabsTrigger>
            <TabsTrigger value="replies" className="gap-1.5">
              <Inbox className="h-4 w-4" />
              Replies ({replies.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="prepared" className="space-y-3">
            {prepared.length === 0 && (
              <Card className="p-10 text-center text-sm text-muted-foreground">
                No prepared messages right now.
              </Card>
            )}
            {prepared.map((m, i) => (
              <div key={m.id}>
                <MessageRow
                  message={m}
                  index={i}
                  isSelected={false}
                  onClick={() => setSelectedLeadId(m.leadId)}
                />
                <PreparedMessageActions message={m} onApprove={handleApprove} />
              </div>
            ))}
          </TabsContent>

          <TabsContent value="sent" className="space-y-3">
            {sent.length === 0 && (
              <Card className="p-10 text-center text-sm text-muted-foreground">
                No messages sent yet.
              </Card>
            )}
            {sent.map((m) => (
              <MessageRow
                key={m.id}
                message={m}
                index={0}
                isSelected={false}
                onClick={() => setSelectedLeadId(m.leadId)}
              />
            ))}
          </TabsContent>

          <TabsContent value="replies" className="space-y-3">
            {replies.length === 0 && (
              <Card className="p-10 text-center text-sm text-muted-foreground">
                No replies yet.
              </Card>
            )}
            {replies.map((m) => (
              <MessageRow
                key={m.id}
                message={m}
                index={0}
                isSelected={false}
                onClick={() => setSelectedLeadId(m.leadId)}
              />
            ))}
          </TabsContent>
        </Tabs>
      )}

      <div className="mt-6 flex items-center justify-between rounded-xl border border-border bg-muted/30 p-4 text-sm">
        <p className="text-muted-foreground">
          Replies are automatically classified by the WhatsApp Agent.
        </p>
        <Link href="/agents" className="flex items-center gap-1 font-medium text-primary hover:underline">
          View agent <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
