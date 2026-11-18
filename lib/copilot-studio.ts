import { containsSensitivePattern } from "./safety";

type AgentAnswer = {
  answer: string;
  confidence?: string;
  team?: string;
  sources?: Array<{ id: string; name: string; category: string; updated: string }>;
};

export async function askCopilotStudio(question: string): Promise<AgentAnswer> {
  const endpoint = process.env.COPILOT_STUDIO_AGENT_ENDPOINT;
  const token = process.env.COPILOT_STUDIO_AGENT_TOKEN;
  if (!endpoint || !token) throw new Error("Copilot Studio server configuration is incomplete.");
  const url = new URL(endpoint);
  if (url.protocol !== "https:") throw new Error("Copilot Studio endpoint must use HTTPS.");

  // The endpoint is an approved server-side broker for the organization's
  // Copilot Studio agent. Tokens never reach the browser.
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ question, context: { dataPolicy: "synthetic-only", application: "ask-revantage" } }),
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`Copilot Studio broker returned ${response.status}.`);
  const result = await response.json() as AgentAnswer;
  if (!result?.answer || containsSensitivePattern(JSON.stringify(result))) throw new Error("Agent response failed safety validation.");
  return {
    answer: String(result.answer).slice(0, 4000),
    confidence: String(result.confidence || "Needs review").slice(0, 30),
    team: String(result.team || "Employee Experience").slice(0, 80),
    sources: Array.isArray(result.sources) ? result.sources.slice(0, 5) : [],
  };
}