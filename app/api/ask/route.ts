import { sources } from "@/lib/store";
import { containsSensitivePattern } from "@/lib/safety";
import { askCopilotStudio } from "@/lib/copilot-studio";

const stop = new Set(["what","where","when","which","with","from","that","this","about","have","does","into","your","there","please","could"]);
const tokens = (value: string) => value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((x) => x.length > 2 && !stop.has(x));
const teams: [RegExp, string][] = [
  [/cab|travel|office|facility|transport|parking/i, "Workplace Team"],
  [/leave|benefit|holiday|people|parental|hr/i, "People Team"],
  [/expense|reimburse|invoice|payroll|salary|finance/i, "Finance Operations"],
  [/access|software|laptop|security|phishing|password|technology|it\b/i, "Technology Team"],
];
export async function POST(request: Request) {
  const body = await request.json();
  const question = String(body?.question || "").trim();
  if (!question) return Response.json({ error: "A question is required." }, { status: 400 });
  if (containsSensitivePattern(question)) return Response.json({ error: "This demo blocks personal or potentially sensitive data. Please use a fictional question." }, { status: 400 });
  if (process.env.AI_PROVIDER === "copilot-studio") {
    try { return Response.json(await askCopilotStudio(question)); }
    catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Copilot Studio agent failed." }, { status: 502 }); }
  }
  const words = [...new Set(tokens(question))];
  const ready = sources.filter((s) => s.status === "Ready");
  const ranked = ready.map((source) => {
    const text = `${source.name} ${source.category} ${source.content}`.toLowerCase();
    return { source, score: words.reduce((sum, word) => sum + (text.includes(word) ? 1 : 0), 0) };
  }).sort((a, b) => b.score - a.score);
  const best = ranked[0];
  const team = teams.find(([pattern]) => pattern.test(question))?.[1] || "Employee Experience";
  if (!best || best.score === 0) {
    return Response.json({ answer: "I couldn’t find a confident answer in the approved knowledge available to this demo. I can route the question to the right team instead of guessing.", confidence: "Needs review", team, sources: [] });
  }
  return Response.json({ answer: best.source.content, confidence: best.score >= 2 ? "High" : "Medium", team, sources: [{ id: best.source.id, name: best.source.name, category: best.source.category, updated: best.source.updated }] });
}
