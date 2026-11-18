import { NextResponse } from "next/server";
import { matchKnowledge, routeForQuery } from "@/data/knowledge";

export const runtime = "nodejs";

type DirectLineActivity = {
  type?: string;
  text?: string;
  from?: { id?: string };
};

const delay = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function getDirectLineToken() {
  const tokenEndpoint = process.env.COPILOT_STUDIO_TOKEN_ENDPOINT?.trim();
  const secret = process.env.COPILOT_STUDIO_DIRECT_LINE_SECRET?.trim();
  const baseUrl = (process.env.COPILOT_STUDIO_DIRECT_LINE_BASE_URL || "https://directline.botframework.com").replace(/\/$/, "");

  if (tokenEndpoint) {
    const tokenResponse = await fetch(tokenEndpoint, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!tokenResponse.ok) throw new Error(`Copilot Studio token endpoint returned ${tokenResponse.status}`);
    const payload = await tokenResponse.json();
    const token = typeof payload === "string" ? payload : payload.token;
    if (!token) throw new Error("Copilot Studio token endpoint did not return a token");
    return { token, baseUrl };
  }

  if (secret) {
    const tokenResponse = await fetch(`${baseUrl}/v3/directline/tokens/generate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user: { id: `dl_${crypto.randomUUID()}`, name: "User" } }),
      cache: "no-store",
    });
    if (!tokenResponse.ok) throw new Error(`Direct Line token request returned ${tokenResponse.status}`);
    const payload = await tokenResponse.json();
    if (!payload.token) throw new Error("Direct Line did not return a token");
    return { token: payload.token as string, baseUrl };
  }

  return null;
}

async function askCopilotStudio(message: string) {
  const auth = await getDirectLineToken();
  if (!auth) return null;

  const userId = `user_${crypto.randomUUID()}`;
  const conversationResponse = await fetch(`${auth.baseUrl}/v3/directline/conversations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${auth.token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });
  if (!conversationResponse.ok) throw new Error(`Could not start Copilot Studio conversation (${conversationResponse.status})`);
  const conversation = await conversationResponse.json();
  const conversationId = conversation.conversationId as string;
  const conversationToken = (conversation.token as string | undefined) || auth.token;

  const sendResponse = await fetch(`${auth.baseUrl}/v3/directline/conversations/${conversationId}/activities`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${conversationToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "message",
      from: { id: userId, name: "User" },
      text: message,
      channelData: { source: "ask-revantage" },
    }),
    cache: "no-store",
  });
  if (!sendResponse.ok) throw new Error(`Could not send message to Copilot Studio (${sendResponse.status})`);

  let watermark = "";
  for (let attempt = 0; attempt < 10; attempt += 1) {
    await delay(attempt === 0 ? 450 : 700);
    const activityResponse = await fetch(
      `${auth.baseUrl}/v3/directline/conversations/${conversationId}/activities${watermark ? `?watermark=${encodeURIComponent(watermark)}` : ""}`,
      {
        headers: { Authorization: `Bearer ${conversationToken}` },
        cache: "no-store",
      },
    );
    if (!activityResponse.ok) continue;
    const payload = await activityResponse.json();
    watermark = payload.watermark || watermark;
    const activities = (payload.activities || []) as DirectLineActivity[];
    const answer = [...activities]
      .reverse()
      .find((activity) => activity.type === "message" && activity.from?.id !== userId && activity.text?.trim());
    if (answer?.text) return answer.text.trim();
  }

  throw new Error("Copilot Studio did not return a message before the request timed out");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const query = typeof body.query === "string" ? body.query.trim() : "";
    if (!query) return NextResponse.json({ error: "Enter a question to continue." }, { status: 400 });
    if (query.length > 1200) return NextResponse.json({ error: "Keep the question under 1,200 characters." }, { status: 400 });

    const match = matchKnowledge(query);
    if (match) {
      return NextResponse.json({
        answer: match.section.answer,
        sourceType: "policy",
        confidence: Math.min(98, 68 + match.score),
        source: {
          title: match.policy.title,
          section: match.section.title,
          category: match.policy.category,
          version: match.policy.version,
          href: match.policy.href,
          owner: match.policy.owner,
          effective: match.policy.effective,
          description: match.policy.description,
          downloadName: match.policy.href.split("/").pop() || `${match.policy.id}.md`,
        },
        agentStatus: process.env.COPILOT_STUDIO_TOKEN_ENDPOINT || process.env.COPILOT_STUDIO_DIRECT_LINE_SECRET ? "connected" : "ready",
      });
    }

    try {
      const copilotAnswer = await askCopilotStudio(query);
      if (copilotAnswer) {
        return NextResponse.json({
          answer: copilotAnswer,
          sourceType: "copilot",
          confidence: 82,
          source: { title: "Copilot Studio agent", section: "Agent response", category: "Connected AI", version: "Live", href: "" },
          agentStatus: "connected",
        });
      }
    } catch (error) {
      console.error("Copilot Studio request failed", error);
    }

    const route = routeForQuery(query);
    return NextResponse.json({
      answer: "I could not find a confident answer in the available policy sections. I have identified the best support route so the question can move forward without you searching for the right team.",
      sourceType: "route",
      confidence: 0,
      route,
      agentStatus: process.env.COPILOT_STUDIO_TOKEN_ENDPOINT || process.env.COPILOT_STUDIO_DIRECT_LINE_SECRET ? "unavailable" : "ready",
    });
  } catch {
    return NextResponse.json({ error: "The request could not be processed. Please try again." }, { status: 500 });
  }
}
