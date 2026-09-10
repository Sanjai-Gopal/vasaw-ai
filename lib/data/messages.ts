import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { Message } from "@/lib/types";

export async function getMessages(): Promise<Message[]> {
  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("messages")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1000);

    if (error) {
      return [];
    }

    return (data ?? []).map(mapMessageFromDb);
  } catch {
    return [];
  }
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

export function mapMessageFromDb(row: Record<string, unknown>): Message {
  return {
    id: (row.id as string) || "",
    leadId: (row.lead_id as string) || (row.leadId as string) || "",
    businessName: (row.business_name as string) || (row.businessName as string) || "WhatsApp Lead",
    direction: (row.direction as "outbound" | "inbound") || "outbound",
    channel: (row.channel as "whatsapp") || "whatsapp",
    content: (row.content as string) || "",
    status: (row.status as Message["status"]) || "sent",
    replyClassification: (row.reply_classification as Message["replyClassification"] | undefined) || (row.replyClassification as Message["replyClassification"] | undefined),
    sentAt: (row.sent_at as string | undefined) || (row.sentAt as string | undefined),
    createdAt: (row.created_at as string) || (row.createdAt as string) || new Date().toISOString(),
  };
}