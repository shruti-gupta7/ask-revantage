import { NextResponse } from "next/server";

export const runtime = "nodejs";

function directLineBaseUrl() {
  return (process.env.COPILOT_STUDIO_DIRECT_LINE_BASE_URL || "https://directline.botframework.com").replace(/\/$/, "");
}

function trustedOrigins(request: Request) {
  const values = new Set<string>();
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    try { values.add(new URL(configured).origin); } catch { /* invalid optional configuration */ }
  }
  try { values.add(new URL(request.url).origin); } catch { /* request URL is always expected to be absolute */ }
  return [...values];
}

export async function POST(request: Request) {
  const secret = process.env.COPILOT_STUDIO_DIRECT_LINE_SECRET?.trim();
  if (!secret) {
    return NextResponse.json({ error: "Copilot Studio Direct Line is not configured." }, { status: 503 });
  }

  const userId = `dl_${crypto.randomUUID()}`;
  const baseUrl = directLineBaseUrl();
  const response = await fetch(`${baseUrl}/v3/directline/tokens/generate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      user: { id: userId, name: "Ask Revantage user" },
      trustedOrigins: trustedOrigins(request),
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error("Direct Line token exchange failed", response.status, detail.slice(0, 500));
    return NextResponse.json({ error: "The Copilot Studio conversation could not be started." }, { status: 502 });
  }

  const payload = await response.json();
  if (!payload.token) {
    return NextResponse.json({ error: "Direct Line did not return a conversation token." }, { status: 502 });
  }

  return NextResponse.json(
    {
      token: payload.token,
      conversationId: payload.conversationId || null,
      expiresIn: payload.expires_in || 1800,
      userId,
      endpoint: `${baseUrl}/v3/directline`,
    },
    { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } },
  );
}
