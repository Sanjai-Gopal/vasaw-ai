import { getMessages } from "@/lib/data";
import type { Message } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  let messages: Message[] = [];
  try {
    messages = await getMessages();
  } catch {
    messages = [];
  }

  const replies = messages.filter((m) => m.direction === "inbound");

  const replySummary = {
    interested: replies.filter((r) => r.replyClassification === "interested").length,
    questions: replies.filter(
      (r) =>
        r.replyClassification === "follow_up" ||
        r.replyClassification === "price_request" ||
        r.replyClassification === "call_request"
    ).length,
    notInterested: replies.filter((r) => r.replyClassification === "not_interested").length,
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Messages</h1>
        <p className="text-sm text-zinc-400 mt-1">
          WhatsApp outreach, delivery tracking and reply intelligence
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 border border-zinc-800 bg-zinc-950/60 rounded-xl">
          <p className="text-xs font-medium text-zinc-400">Interested replies</p>
          <p className="text-3xl font-bold text-emerald-400 mt-2">{replySummary.interested}</p>
          <p className="text-xs text-zinc-500 mt-1">Ready to push further</p>
        </div>
        <div className="p-5 border border-zinc-800 bg-zinc-950/60 rounded-xl">
          <p className="text-xs font-medium text-zinc-400">Need follow-up</p>
          <p className="text-3xl font-bold text-sky-400 mt-2">{replySummary.questions}</p>
          <p className="text-xs text-zinc-500 mt-1">Questions, pricing, or call requests</p>
        </div>
        <div className="p-5 border border-zinc-800 bg-zinc-950/60 rounded-xl">
          <p className="text-xs font-medium text-zinc-400">Not interested</p>
          <p className="text-3xl font-bold text-rose-400 mt-2">{replySummary.notInterested}</p>
          <p className="text-xs text-zinc-500 mt-1">Closed or deprioritized</p>
        </div>
      </div>
    </div>
  );
}