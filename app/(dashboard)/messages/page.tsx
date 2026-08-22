import { getMessages, getLeads, getWebsites } from "@/lib/data";

export const dynamic = "force-dynamic";

async function MessagesContent() {
  const [messages, leads, websites] = await Promise.all([
    getMessages(),
    getLeads(),
    getWebsites(),
  ]);

  const prepared = messages.filter((m) => m.status === "prepared");
  const sent = messages.filter((m) => ["sent", "delivered", "read", "failed"].includes(m.status));
  const replies = messages.filter((m) => m.direction === "inbound");

  const replySummary = {
    interested: replies.filter((r) => r.replyClassification === "interested").length,
    questions: replies.filter((r) => r.replyClassification === "follow_up" || r.replyClassification === "price_request" || r.replyClassification === "call_request").length,
    notInterested: replies.filter((r) => r.replyClassification === "not_interested").length,
  };

  return (
    <html>
      <head>
        <title>Messages</title>
      </head>
      <body>
        <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
          <h1>Messages</h1>
          <p>WhatsApp outreach, delivery tracking and reply intelligence</p>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
            <div style={{ padding: "1rem", border: "1px solid #ddd", borderRadius: "8px" }}>
              <p style={{ fontSize: "0.75rem", color: "#666" }}>Interested replies</p>
              <p style={{ fontSize: "2rem", fontWeight: "bold", color: "#34d399" }}>{replySummary.interested}</p>
              <p style={{ fontSize: "0.75rem", color: "#666" }}>Ready to push further</p>
            </div>
            <div style={{ padding: "1rem", border: "1px solid #ddd", borderRadius: "8px" }}>
              <p style={{ fontSize: "0.75rem", color: "#666" }}>Need follow-up</p>
              <p style={{ fontSize: "2rem", fontWeight: "bold", color: "#0ea5e9" }}>{replySummary.questions}</p>
              <p style={{ fontSize: "0.75rem", color: "#666" }}>Questions, pricing, or call requests</p>
            </div>
            <div style={{ padding: "1rem", border: "1px solid #ddd", borderRadius: "8px" }}>
              <p style={{ fontSize: "0.75rem", color: "#666" }}>Not interested</p>
              <p style={{ fontSize: "2rem", fontWeight: "bold", color: "#f87171" }}>{replySummary.notInterested}</p>
              <p style={{ fontSize: "0.75rem", color: "#666" }}>Closed or deprioritized</p>
            </div>
          </div>
        </div>
      </body>
      </html>
  );
}

export default async function MessagesPage() {
  try {
    return <MessagesContent />;
  } catch (err) {
    return (
      <html>
        <head>
          <title>Messages</title>
        </head>
        <body>
          <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
            <h1>Messages</h1>
            <p>Unable to load messages - database not configured</p>
          </div>
        </body>
      </html>
    );
  }
}