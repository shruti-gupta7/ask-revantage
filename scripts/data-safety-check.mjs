import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const roots = ["app", "lib", "docs", "public"];
const allowed = new Set([".ts", ".tsx", ".md", ".css", ".json", ".mjs"]);
const findings = [];
const patterns = [
  ["email address", /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i],
  ["private key", /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/],
  ["populated secret", /(?:AZURE_OPENAI_API_KEY|AZURE_CLIENT_SECRET)\s*=\s*[^\s#]+/],
  ["Indian mobile number", /\b[6-9]\d{9}\b/],
];

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path);
    else if (allowed.has(name.slice(name.lastIndexOf(".")))) {
      const text = readFileSync(path, "utf8");
      for (const [label, pattern] of patterns) if (pattern.test(text)) findings.push(`${relative(root, path)}: possible ${label}`);
    }
  }
}
for (const item of roots) walk(join(root, item));
const store = readFileSync(join(root, "lib/store.ts"), "utf8");
if (!store.includes("SYNTHETIC SAMPLE")) findings.push("lib/store.ts: seeded content is not explicitly marked synthetic");
if (findings.length) { console.error("Data safety check failed:\n" + findings.map((x) => `- ${x}`).join("\n")); process.exit(1); }
console.log("Data safety check passed: no obvious secrets, emails, phone numbers, or unlabelled seed data detected.");