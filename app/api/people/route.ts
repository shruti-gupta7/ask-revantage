import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const endpoint = process.env.PEOPLE_DIRECTORY_API_URL?.trim();
  if (!endpoint) {
    return NextResponse.json({ configured: false, people: [] }, { headers: { "Cache-Control": "no-store" } });
  }

  const headers: Record<string, string> = { Accept: "application/json" };
  const token = process.env.PEOPLE_DIRECTORY_API_TOKEN?.trim();
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(endpoint, { headers, cache: "no-store" });
  if (!response.ok) {
    console.error("People Directory API failed", response.status, (await response.text()).slice(0, 500));
    return NextResponse.json({ error: "The People Directory service could not be loaded." }, { status: 502 });
  }

  const payload = await response.json();
  const people = Array.isArray(payload) ? payload : payload.people || [];
  return NextResponse.json({ configured: true, people }, { headers: { "Cache-Control": "no-store" } });
}
