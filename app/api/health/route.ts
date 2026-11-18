export async function GET() {
  const adapter = process.env.AI_PROVIDER === "copilot-studio" ? "copilot-studio" : "demo-memory";
  return Response.json({ status: "ok", service: "ask-revantage", adapter, data: "synthetic-only" });
}
