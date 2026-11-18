import { NextResponse } from "next/server";

export const runtime = "nodejs";

function configuredEndpoint() {
  return process.env.DATA_SOURCE_API_URL?.trim().replace(/\/$/, "") || null;
}

async function proxy(method: "GET" | "POST" | "PATCH" | "DELETE", request: Request) {
  const endpoint = configuredEndpoint();
  if (!endpoint) {
    return NextResponse.json({ error: "No server-managed data-source API is configured." }, { status: 503 });
  }

  const requestUrl = new URL(request.url);
  const id = requestUrl.searchParams.get("id");
  const target = id ? `${endpoint}/${encodeURIComponent(id)}` : endpoint;
  const headers: Record<string, string> = { Accept: "application/json" };
  const init: RequestInit = { method, headers, cache: "no-store" };

  if (method === "POST" || method === "PATCH") {
    headers["Content-Type"] = "application/json";
    init.body = await request.text();
  }

  const response = await fetch(target, init);
  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : { message: await response.text() };
  return NextResponse.json(payload, { status: response.status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(request: Request) {
  return proxy("GET", request);
}

export async function POST(request: Request) {
  return proxy("POST", request);
}

export async function PATCH(request: Request) {
  return proxy("PATCH", request);
}

export async function DELETE(request: Request) {
  return proxy("DELETE", request);
}
