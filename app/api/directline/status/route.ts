import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export async function GET() {
  return NextResponse.json({ configured: Boolean(process.env.DIRECT_LINE_SECRET) }, { headers: { "Cache-Control": "no-store" } });
}
