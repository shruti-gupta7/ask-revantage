import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const tokenEndpointConfigured = Boolean(process.env.COPILOT_STUDIO_TOKEN_ENDPOINT?.trim());
  const directLineConfigured = Boolean(process.env.COPILOT_STUDIO_DIRECT_LINE_SECRET?.trim());

  return NextResponse.json(
    {
      agent: {
        provider: "Microsoft Copilot Studio",
        configured: tokenEndpointConfigured || directLineConfigured,
        connectionMethod: tokenEndpointConfigured ? "Token endpoint" : directLineConfigured ? "Direct Line" : null,
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
