import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { Message } from "@/lib/types";

export async function getMessages(): Promise<Message[]> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("messages")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1000);

  if (error) {
    throw new Error(`Failed to fetch messages: ${error.message}`);
  }

  return (data ?? []).map(mapMessageFromDb);
}

export async function getMessagesByLead(leadId: string): Promise<Message[]> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("messages")
    .select("*")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch messages by lead: ${error.message}`);
  }

  return (data ?? []).map(mapMessageFromDb);
}

export async function getMessagesByStatus(status: string): Promise<Message[]> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("messages")
    .select("*")
    .eq("status", status)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch messages by status: ${error.message}`);
  }

  return (data ?? []).map(mapMessageFromDb);
}

function mapMessageFromDb(row: Record<string, unknown>): Message {
  return {
    id: row.id as string,
    leadId: row.lead_id as string,
    businessName: row.business_name as string,
    direction: row.direction as "outbound" | "inbound",
    channel: row.channel as "whatsapp",
    content: row.content as string,
    status: row.status as Message["status"],
    replyClassification: row.reply_classification as Message["replyClassification"] | undefined,
    sentAt: row.sent_at as string | undefined,
    createdAt: row.created_at as string,
  };
}