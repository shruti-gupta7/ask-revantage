import { sources } from "@/lib/store";
import type { KnowledgeSource } from "@/lib/types";
import { containsSensitivePattern } from "@/lib/safety";

export async function GET() { return Response.json({ sources }); }
export async function POST(request: Request) {
  const body = await request.json();
  if (!body?.name || !body?.category || !body?.type || body?.isSynthetic !== "on") {
    return Response.json({ error: "Complete the required fields and confirm the content is synthetic or non-production." }, { status: 400 });
  }
  if (containsSensitivePattern(JSON.stringify(body))) return Response.json({ error: "Potential personal or sensitive data detected. Use synthetic demo content only." }, { status: 400 });
  const source: KnowledgeSource = {
    id: `src-${Date.now()}`,
    name: String(body.name).slice(0, 120),
    category: String(body.category).slice(0, 80),
    type: body.type,
    status: "Indexing",
    owner: String(body.owner || "Knowledge Admin").slice(0, 80),
    updated: new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date()),
    location: String(body.location || "Pending connection").slice(0, 180),
    content: String(body.content || `${body.name} is awaiting ingestion and review.`).slice(0, 4000),
    dataClass: "Synthetic demo",
  };
  sources.unshift(source);
  return Response.json({ source }, { status: 201 });
}
