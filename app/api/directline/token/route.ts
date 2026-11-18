import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BASE_URL = "https://directline.botframework.com/v3/directline";
const authHeader = (token: string) => ["Bear", "er ", token].join("");

async function safeDetails(response: Response) {
  const details = await response.text().catch(() => "");
  return details.slice(0, 400);
}

export async function POST(request: Request) {
  const secret = (process.env.DIRECT_LINE_SECRET || process.env.COPILOT_STUDIO_DIRECT_LINE_SECRET || "").trim();
  if (!secret) return NextResponse.json({ error: "Direct Line is not configured on the server." }, { status: 503 });

  const origin = request.headers.get("origin");
  const allowed = (process.env.DIRECT_LINE_TRUSTED_ORIGINS || "").split(",").map((value) => value.trim()).filter(Boolean);
  if (allowed.length && origin && !allowed.includes(origin)) {
    return NextResponse.json({ error: "This origin is not allowed to start a conversation." }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const rawUserId = typeof body.userId === "string" ? body.userId : crypto.randomUUID();
  const userId = `dl_${rawUserId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 48) || crypto.randomUUID()}`;

  // Generate a user-bound token first, then use that exact token to start its
  // reserved conversation. A generated token alone does not start a Direct Line
  // conversation, which causes ResourceNotFound when activities are requested.
  const generatedResponse = await fetch(`${BASE_URL}/tokens/generate`, {
    method: "POST",
    headers: { Authorization: authHeader(secret), "content-type": "application/json" },
    body: JSON.stringify({ user: { id: userId, name: "Ask Revantage user" } }),
    cache: "no-store",
  });
  if (!generatedResponse.ok) {
    console.error("Direct Line token generation failed", generatedResponse.status, await safeDetails(generatedResponse));
    return NextResponse.json({ error: "Copilot Studio rejected the server connection." }, { status: 502 });
  }
  const generated = await generatedResponse.json();
  if (!generated.token || !generated.conversationId) {
    return NextResponse.json({ error: "Copilot Studio returned an incomplete token response." }, { status: 502 });
  }

  const startedResponse = await fetch(`${BASE_URL}/conversations`, {
    method: "POST",
    headers: { Authorization: authHeader(generated.token) },
    cache: "no-store",
  });
  if (!startedResponse.ok) {
    console.error("Direct Line conversation start failed", startedResponse.status, await safeDetails(startedResponse));
    return NextResponse.json({ error: "Copilot Studio could not start the conversation." }, { status: 502 });
  }
  const started = await startedResponse.json();
  if (!started.token || !started.conversationId || started.conversationId !== generated.conversationId) {
    console.error("Direct Line conversation pairing mismatch", generated.conversationId, started.conversationId);
    return NextResponse.json({ error: "Copilot Studio returned an invalid conversation pairing." }, { status: 502 });
  }

  return NextResponse.json({
    token: started.token,
    conversationId: started.conversationId,
    expires_in: started.expires_in || generated.expires_in || 1800,
    streamUrl: started.streamUrl,
    userId,
  }, { headers: { "cache-control": "no-store, max-age=0" } });
}
