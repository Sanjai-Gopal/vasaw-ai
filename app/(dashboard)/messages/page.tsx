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
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { messages } from "@/lib/data/messages";
import { messageStatusMeta, replyClassMeta } from "@/lib/status";
import { formatRelative } from "@/lib/utils";
import type { Message } from "@/lib/types";

const statusIcon = {
  prepared: Sparkles,
  sent: Send,
  delivered: CheckCheck,
  read: MessageSquare,
  failed: Send,
};

function MessageRow({ message, index }: { message: Message; index: number }) {
  const meta = messageStatusMeta[message.status];
  const Icon = statusIcon[message.status];
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.03 }}
      className="rounded-xl border border-border bg-muted/30 p-4"
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

export default function MessagesPage() {
  const prepared = messages.filter((m) => m.status === "prepared");
  const sent = messages.filter((m) => ["sent", "delivered", "read", "failed"].includes(m.status));
  const replies = messages.filter((m) => m.direction === "inbound");

  const replySummary = {
    interested: replies.filter((r) => r.replyClassification === "interested").length,
    questions: replies.filter((r) => r.replyClassification === "asking_questions").length,
    notInterested: replies.filter((r) => r.replyClassification === "not_interested").length,
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
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
          <p className="text-xs text-muted-foreground">Asking questions</p>
          <p className="mt-1 text-2xl font-bold text-sky-400">{replySummary.questions}</p>
          <p className="mt-1 text-xs text-muted-foreground">Need a follow-up</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Not interested</p>
          <p className="mt-1 text-2xl font-bold text-rose-400">{replySummary.notInterested}</p>
          <p className="mt-1 text-xs text-muted-foreground">Closed or deprioritized</p>
        </Card>
      </div>

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
            <MessageRow key={m.id} message={m} index={i} />
          ))}
        </TabsContent>

        <TabsContent value="sent" className="space-y-3">
          {sent.length === 0 && (
            <Card className="p-10 text-center text-sm text-muted-foreground">
              No messages sent yet.
            </Card>
          )}
          {sent.map((m, i) => (
            <MessageRow key={m.id} message={m} index={i} />
          ))}
        </TabsContent>

        <TabsContent value="replies" className="space-y-3">
          {replies.length === 0 && (
            <Card className="p-10 text-center text-sm text-muted-foreground">
              No replies yet.
            </Card>
          )}
          {replies.map((m, i) => (
            <MessageRow key={m.id} message={m} index={i} />
          ))}
        </TabsContent>
      </Tabs>

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