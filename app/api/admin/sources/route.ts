import { NextResponse } from "next/server";

export async function GET() {
  const configured = Boolean(process.env.DATA_SOURCE_API_URL);
  return NextResponse.json({ configured, sources: [], message: configured ? "Source API is configured." : "No server-managed source API is configured." });
}

export async function POST() {
  return NextResponse.json({ error: "Connect DATA_SOURCE_API_URL to enable server-managed source creation." }, { status: 501 });
}
