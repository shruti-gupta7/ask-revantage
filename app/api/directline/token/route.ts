import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const secret = process.env.DIRECT_LINE_SECRET || process.env.COPILOT_STUDIO_DIRECT_LINE_SECRET;
  if (!secret) return NextResponse.json({ error: "Direct Line is not configured on the server." }, { status: 503 });

  const origin = request.headers.get("origin");
  const allowed = (process.env.DIRECT_LINE_TRUSTED_ORIGINS || "").split(",").map((value) => value.trim()).filter(Boolean);
  if (allowed.length && origin && !allowed.includes(origin)) {
    return NextResponse.json({ error: "This origin is not allowed to start a conversation." }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const rawUserId = typeof body.userId === "string" ? body.userId : crypto.randomUUID();
  const userId = `dl_${rawUserId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 48) || crypto.randomUUID()}`;
  const response = await fetch("https://directline.botframework.com/v3/directline/tokens/generate", {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}`, "content-type": "application/json" },
    body: JSON.stringify({ user: { id: userId, name: "Ask Revantage user" } }),
    cache: "no-store",
  });
  if (!response.ok) {
    const details = await response.text();
    console.error("Direct Line token exchange failed", response.status, details.slice(0, 400));
    return NextResponse.json({ error: "Copilot Studio rejected the server connection." }, { status: 502 });
  }
  const token = await response.json();
  return NextResponse.json(token, { headers: { "cache-control": "no-store, max-age=0" } });
}
