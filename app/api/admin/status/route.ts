import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const directLineConfigured = Boolean(process.env.COPILOT_STUDIO_DIRECT_LINE_SECRET?.trim());

  return NextResponse.json(
    {
      agent: {
        provider: "Microsoft Copilot Studio",
        configured: directLineConfigured,
        connectionMethod: directLineConfigured ? "Secured Direct Line token exchange" : null,
      },
      sources: {
        persistence: process.env.DATA_SOURCE_STORE ? "Server-managed" : "Browser workspace",
        apiConfigured: Boolean(process.env.DATA_SOURCE_API_URL?.trim()),
      },
    },
    {
      headers: { "Cache-Control": "no-store" },
    },
  );
}
