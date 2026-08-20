import type { Message } from "@/lib/types";

const daysAgo = (days: number, hour = 11) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};

const minutesAgo = (minutes: number) => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - minutes);
  return d.toISOString();
};

export const messages: Message[] = [
  {
    id: "M-501",
    leadId: "L-1001",
    businessName: "Annapurna Veg Restaurant",
    direction: "outbound",
    channel: "whatsapp",
    content:
      "Hi! We noticed Annapurna Veg Restaurant has no website despite excellent reviews on Google. We've built a free modern website for your business — want to take a look?",
    status: "read",
    sentAt: daysAgo(6, 16),
    createdAt: daysAgo(6, 16),
  },
  {
    id: "M-502",
    leadId: "L-1001",
    businessName: "Annapurna Veg Restaurant",
    direction: "inbound",
    channel: "whatsapp",
    content: "Sounds interesting! Yes please, share the link.",
    status: "read",
    replyClassification: "interested",
    createdAt: daysAgo(6, 17),
  },
  {
    id: "M-503",
    leadId: "L-1002",
    businessName: "Kovai Iron Gym & Fitness",
    direction: "outbound",
    channel: "whatsapp",
    content:
      "Hi! We built a free professional website for Kovai Iron Gym to showcase your membership plans and trainers. Would you like to see it?",
    status: "delivered",
    sentAt: daysAgo(3, 10),
    createdAt: daysAgo(3, 10),
  },
  {
    id: "M-504",
    leadId: "L-1002",
    businessName: "Kovai Iron Gym & Fitness",
    direction: "inbound",
    channel: "whatsapp",
    content: "Yes, we are interested. How much does this cost?",
    status: "read",
    replyClassification: "price_request",
    createdAt: daysAgo(3, 10),
  },
  {
    id: "M-505",
    leadId: "L-1016",
    businessName: "Nellai's Biryani House",
    direction: "outbound",
    channel: "whatsapp",
    content:
      "Hi! Your biryani is the talk of Saibaba Colony. We built a free website so customers can view your menu and order online. Want to see it?",
    status: "sent",
    sentAt: daysAgo(2, 12),
    createdAt: daysAgo(2, 12),
  },
  {
    id: "M-506",
    leadId: "L-1004",
    businessName: "Trendz Unisex Salon",
    direction: "outbound",
    channel: "whatsapp",
    content:
      "Hi! Trendz has great reviews but no online booking. We've built a free website with a booking section. Would you like a preview?",
    status: "prepared",
    createdAt: minutesAgo(25),
  },
  {
    id: "M-507",
    leadId: "L-1003",
    businessName: "DentaCare Dental Clinic",
    direction: "outbound",
    channel: "whatsapp",
    content:
      "Hi! Your current website is a bit dated. We rebuilt a modern, mobile-friendly site for DentaCare. Care to preview it?",
    status: "delivered",
    sentAt: daysAgo(4, 15),
    createdAt: daysAgo(4, 15),
  },
  {
    id: "M-508",
    leadId: "L-1007",
    businessName: "Little Angels Play School",
    direction: "outbound",
    channel: "whatsapp",
    content:
      "Hi! Admissions season is coming. We built a free website for Little Angels with program details and enquiry form. Interested?",
    status: "read",
    sentAt: daysAgo(2, 9),
    createdAt: daysAgo(2, 9),
  },
  {
    id: "M-509",
    leadId: "L-1007",
    businessName: "Little Angels Play School",
    direction: "inbound",
    channel: "whatsapp",
    content: "How long does it take? We need it before June admissions.",
    status: "read",
    replyClassification: "follow_up",
    createdAt: daysAgo(2, 10),
  },
  {
    id: "M-510",
    leadId: "L-1014",
    businessName: "Ganga Garment Showroom",
    direction: "outbound",
    channel: "whatsapp",
    content:
      "Hi! We made a free website for Ganga Garment Showroom to showcase your festive collection. Want to see the preview?",
    status: "failed",
    createdAt: daysAgo(2, 18),
  },
  {
    id: "M-511",
    leadId: "L-1005",
    businessName: "Sri Murugan Bakery & Sweets",
    direction: "outbound",
    channel: "whatsapp",
    content:
      "Hi! Sri Murugan Bakery is loved for its cakes. We built a free website where customers can browse and order cakes. Interested?",
    status: "prepared",
    createdAt: minutesAgo(12),
  },
  {
    id: "M-512",
    leadId: "L-1008",
    businessName: "GreenLeaf Ayurvedic Center",
    direction: "outbound",
    channel: "whatsapp",
    content:
      "Hi! We built a free website for GreenLeaf Ayurvedic Center to showcase your treatments. Would you like a preview?",
    status: "delivered",
    sentAt: daysAgo(3, 14),
    createdAt: daysAgo(3, 14),
  },
  {
    id: "M-513",
    leadId: "L-1008",
    businessName: "GreenLeaf Ayurvedic Center",
    direction: "inbound",
    channel: "whatsapp",
    content: "We already work with an agency. Not interested, thanks.",
    status: "read",
    replyClassification: "not_interested",
    createdAt: daysAgo(3, 15),
  },
  {
    id: "M-514",
    leadId: "L-1010",
    businessName: "Saravana Stores Home Appliances",
    direction: "outbound",
    channel: "whatsapp",
    content:
      "Hi! We built a free product showcase website for Saravana Stores. Customers can browse your appliances online. Interested?",
    status: "sent",
    sentAt: daysAgo(5, 11),
    createdAt: daysAgo(5, 11),
  },
  {
    id: "M-515",
    leadId: "L-1010",
    businessName: "Saravana Stores Home Appliances",
    direction: "inbound",
    channel: "whatsapp",
    content: "Can you call me on Monday? I want to discuss this.",
    status: "read",
    replyClassification: "call_request",
    createdAt: daysAgo(5, 14),
  },
  {
    id: "M-516",
    leadId: "L-1003",
    businessName: "DentaCare Dental Clinic",
    direction: "inbound",
    channel: "whatsapp",
    content: "Stop messaging me, I'm not the right person.",
    status: "read",
    replyClassification: "stop",
    createdAt: daysAgo(4, 16),
  },
  {
    id: "M-517",
    leadId: "L-1006",
    businessName: "Lakshmi Auto Care Centre",
    direction: "inbound",
    channel: "whatsapp",
    content: "What kind of website are you talking about?",
    status: "read",
    replyClassification: "unknown",
    createdAt: daysAgo(1, 11),
  },
];
