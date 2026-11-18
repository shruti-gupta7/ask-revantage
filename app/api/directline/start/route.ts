import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const baseUrl = () => (process.env.DIRECT_LINE_BASE_URL || "https://directline.botframework.com").replace(/\/$/, "");

export async function POST(request: NextRequest) {
  const secret = process.env.DIRECT_LINE_SECRET;
  if (!secret) return NextResponse.json({ error: "Copilot Studio is not configured on the server." }, { status: 503 });

  let name = "Ask Revantage user";
  try {
    const body = await request.json();
    if (typeof body?.name === "string" && body.name.trim()) name = body.name.trim().slice(0, 80);
  } catch { /* A body is optional. */ }

  const userId = `dl_${randomUUID()}`;
  const configuredOrigins = (process.env.DIRECT_LINE_TRUSTED_ORIGINS || "").split(",").map(v => v.trim()).filter(Boolean);
  const requestOrigin = request.headers.get("origin");
  const trustedOrigins = Array.from(new Set([...configuredOrigins, ...(requestOrigin ? [requestOrigin] : [])]));

  try {
    const tokenResponse = await fetch(`${baseUrl()}/v3/directline/tokens/generate`, {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
      body: JSON.stringify({ user: { id: userId, name }, trustedOrigins }),
      cache: "no-store"
    });
    if (!tokenResponse.ok) {
      console.error("Direct Line token generation failed", tokenResponse.status, (await tokenResponse.text()).slice(0, 500));
      return NextResponse.json({ error: "Copilot Studio rejected the server configuration." }, { status: 502 });
    }
    const generated = await tokenResponse.json();
    const conversationResponse = await fetch(`${baseUrl()}/v3/directline/conversations`, {
      method: "POST",
      headers: { Authorization: `Bearer ${generated.token}` },
      cache: "no-store"
    });
    if (!conversationResponse.ok) {
      console.error("Direct Line conversation start failed", conversationResponse.status, (await conversationResponse.text()).slice(0, 500));
      return NextResponse.json({ error: "Copilot Studio could not start a conversation." }, { status: 502 });
    }
    const conversation = await conversationResponse.json();
    return NextResponse.json({
      conversationId: conversation.conversationId,
      token: conversation.token || generated.token,
      expiresIn: conversation.expires_in || generated.expires_in || 1800,
      streamUrl: conversation.streamUrl,
      userId,
      directLineBaseUrl: baseUrl()
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Direct Line start request failed", error);
    return NextResponse.json({ error: "Copilot Studio is temporarily unreachable." }, { status: 502 });
  }
}
