import { getSupabaseAdmin } from "@/lib/supabase/server";
import { REFERRAL, URGENCY } from "@/lib/revenue/packages";

export interface Referral {
  id: string;
  referrerEmail: string;
  referredEmail: string;
  referredPhone?: string;
  status: "pending" | "converted" | "expired";
  bonusAmount: number;
  createdAt: string;
  convertedAt?: string;
}

export interface ReferralStats {
  totalReferrals: number;
  convertedReferrals: number;
  pendingReferrals: number;
  totalBonusEarned: number;
  conversionRate: number;
}

export interface PreviewExpiry {
  id: string;
  leadId: string;
  businessName: string;
  email: string;
  phone?: string;
  previewUrl: string;
  createdAt: string;
  expiresAt: string;
  status: "active" | "expired" | "converted";
  reminderSentAt?: string;
  finalReminderSentAt?: string;
}

export interface UrgencyMessage {
  type: "expiry_warning" | "slot_scarcity" | "discount_expiring" | "social_proof";
  message: string;
  callToAction: string;
}

export class RevenueAgent {
  private supabase = getSupabaseAdmin();

  async createReferral(data: {
    referrerEmail: string;
    referredEmail: string;
    referredPhone?: string;
  }): Promise<Referral> {
    const referral: Referral = {
      id: `ref_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      referrerEmail: data.referrerEmail,
      referredEmail: data.referredEmail,
      referredPhone: data.referredPhone,
      status: "pending",
      bonusAmount: REFERRAL.bonusAmount,
      createdAt: new Date().toISOString(),
    };

    await this.supabase.from("referrals").insert({
      id: referral.id,
      referrer_email: referral.referrerEmail,
      referred_email: referral.referredEmail,
      referred_phone: referral.referredPhone,
      status: referral.status,
      bonus_amount: referral.bonusAmount,
      created_at: referral.createdAt,
    });

    return referral;
  }

  async convertReferral(referralId: string): Promise<void> {
    await this.supabase
      .from("referrals")
      .update({
        status: "converted",
        converted_at: new Date().toISOString(),
      })
      .eq("id", referralId);
  }

  async getReferralStats(referrerEmail: string): Promise<ReferralStats> {
    const { data: referrals } = await this.supabase
      .from("referrals")
      .select("*")
      .eq("referrer_email", referrerEmail);

    const total = referrals?.length || 0;
    const converted = referrals?.filter((r) => r.status === "converted").length || 0;
    const pending = referrals?.filter((r) => r.status === "pending").length || 0;
    const totalBonus = referrals
      ?.filter((r) => r.status === "converted")
      .reduce((sum, r) => sum + r.bonus_amount, 0) || 0;

    return {
      totalReferrals: total,
      convertedReferrals: converted,
      pendingReferrals: pending,
      totalBonusEarned: totalBonus,
      conversionRate: total > 0 ? (converted / total) * 100 : 0,
    };
  }

  async createPreviewExpiry(data: {
    leadId: string;
    businessName: string;
    email: string;
    phone?: string;
    previewUrl: string;
  }): Promise<PreviewExpiry> {
    const expiresAt = new Date(
      Date.now() + URGENCY.previewExpiryDays * 24 * 60 * 60 * 1000
    ).toISOString();

    const expiry: PreviewExpiry = {
      id: `exp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      leadId: data.leadId,
      businessName: data.businessName,
      email: data.email,
      phone: data.phone,
      previewUrl: data.previewUrl,
      createdAt: new Date().toISOString(),
      expiresAt,
      status: "active",
    };

    await this.supabase.from("preview_expiries").insert({
      id: expiry.id,
      lead_id: expiry.leadId,
      business_name: expiry.businessName,
      email: expiry.email,
      phone: expiry.phone,
      preview_url: expiry.previewUrl,
      created_at: expiry.createdAt,
      expires_at: expiry.expiresAt,
      status: expiry.status,
    });

    return expiry;
  }

  async sendExpiryReminder(expiryId: string, isFinal: boolean): Promise<void> {
    const { data: expiry } = await this.supabase
      .from("preview_expiries")
      .select("*")
      .eq("id", expiryId)
      .single();

    if (!expiry || expiry.status !== "active") return;

    const daysLeft = Math.ceil(
      (new Date(expiry.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    const updateField = isFinal ? "final_reminder_sent_at" : "reminder_sent_at";
    await this.supabase
      .from("preview_expiries")
      .update({ [updateField]: new Date().toISOString() })
      .eq("id", expiryId);
  }

  async getUrgencyMessages(businessName: string): Promise<UrgencyMessage[]> {
    const messages: UrgencyMessage[] = [
      {
        type: "expiry_warning",
        message: `Your free website preview for ${businessName} expires in ${URGENCY.previewExpiryDays} days. After that, you'll need to book a new strategy session.`,
        callToAction: "Claim Your Preview Now",
      },
      {
        type: "slot_scarcity",
        message: `Only ${URGENCY.slotsPerMonth - URGENCY.currentMonth} strategy slots remaining this month. Book now to secure your spot.`,
        callToAction: "Reserve Your Slot",
      },
      {
        type: "discount_expiring",
        message: `Special launch pricing ends in ${URGENCY.discountExpiryDays} days. Save ${URGENCY.discountPercent}% on all packages.`,
        callToAction: "Get the Discount",
      },
      {
        type: "social_proof",
        message: `Join 50+ businesses in Coimbatore who upgraded their online presence with VASAW Digital.`,
        callToAction: "See Their Results",
      },
    ];

    return messages;
  }

  async getActiveExpiries(): Promise<PreviewExpiry[]> {
    const { data } = await this.supabase
      .from("preview_expiries")
      .select("*")
      .eq("status", "active")
      .lt("expires_at", new Date().toISOString());

    return (data || []).map((row: any) => ({
      id: row.id,
      leadId: row.lead_id,
      businessName: row.business_name,
      email: row.email,
      phone: row.phone,
      previewUrl: row.preview_url,
      createdAt: row.created_at,
      expiresAt: row.expires_at,
      status: row.status,
      reminderSentAt: row.reminder_sent_at,
      finalReminderSentAt: row.final_reminder_sent_at,
    }));
  }

  async markExpired(expiryId: string): Promise<void> {
    await this.supabase
      .from("preview_expiries")
      .update({ status: "expired" })
      .eq("id", expiryId);
  }

  async markConverted(expiryId: string): Promise<void> {
    await this.supabase
      .from("preview_expiries")
      .update({ status: "converted" })
      .eq("id", expiryId);
  }
}

let revenueAgentInstance: RevenueAgent | null = null;

export function getRevenueAgent(): RevenueAgent {
  if (!revenueAgentInstance) {
    revenueAgentInstance = new RevenueAgent();
  }
  return revenueAgentInstance;
}