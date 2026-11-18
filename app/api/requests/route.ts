import { requests } from "@/lib/store";
import type { SupportRequest } from "@/lib/types";
import { containsSensitivePattern } from "@/lib/safety";

export async function GET() { return Response.json({ requests }); }
export async function POST(request: Request) {
  const body = await request.json();
  if (!body?.subject || !body?.description) return Response.json({ error: "Subject and description are required." }, { status: 400 });
  if (containsSensitivePattern(JSON.stringify(body))) return Response.json({ error: "Potential personal or sensitive data detected. Use synthetic demo content only." }, { status: 400 });
  const item: SupportRequest = {
    id: `AR-${String(Date.now()).slice(-4)}`,
    subject: String(body.subject).slice(0, 120),
    description: String(body.description).slice(0, 1200),
    team: String(body.team || "Employee Experience"),
    status: "Open",
    created: new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date())
  };
  requests.unshift(item);
  return Response.json({ request: item }, { status: 201 });
}
