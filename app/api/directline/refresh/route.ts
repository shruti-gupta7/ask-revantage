import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let token = "";
  try { token = (await request.json())?.token || ""; } catch { /* handled below */ }
  if (!token) return NextResponse.json({ error: "A conversation token is required." }, { status: 400 });
  const base = (process.env.DIRECT_LINE_BASE_URL || "https://directline.botframework.com").replace(/\/$/, "");
  try {
    const response = await fetch(`${base}/v3/directline/tokens/refresh`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store"
    });
    if (!response.ok) return NextResponse.json({ error: "The conversation token could not be refreshed." }, { status: response.status });
    const refreshed = await response.json();
    return NextResponse.json({ token: refreshed.token, expiresIn: refreshed.expires_in }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "The token refresh service is unavailable." }, { status: 502 });
  }
}
