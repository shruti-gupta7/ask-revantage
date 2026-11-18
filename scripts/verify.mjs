import { access, readFile } from "node:fs/promises";

const required = [
  "postcss.config.mjs",
  "public/assets/source-icons/sharepoint.svg",
  "public/assets/source-icons/onedrive.svg",
  "public/assets/source-icons/word.svg",
  "public/assets/source-icons/excel.svg",
  "public/assets/source-icons/powerpoint.svg",
  "public/assets/source-icons/pdf.svg",
  "public/assets/source-icons/website.svg",
  "public/assets/source-icons/copilot-studio.svg",
  "public/assets/shruti-gupta-avatar.jpg",
  "public/assets/ask-revantage-wordmark-full.png",
  "public/assets/people/maya-patel-avatar.jpg",
  "public/assets/people/oliver-chen-avatar.jpg",
  "public/assets/people/sofia-ramirez-avatar.jpg",
  "public/assets/people/noah-williams-avatar.jpg",
  "public/assets/people/ava-thompson-avatar.jpg",
  "public/assets/people/liam-foster-avatar.jpg",
];
await Promise.all(required.map((path) => access(path)));

const obsolete = [
  "app/api/requests",
  "app/api/sources",
  "components/workspace-shell.tsx",
  "context/chat-context.tsx",
  "lib/direct-line-client.ts",
  "lib/direct-line-classifier.js",
  "lib/direct-line-classifier.d.ts",
  "lib/store.ts",
];
await Promise.all(obsolete.map(async (path) => {
  try {
    await access(path);
    throw new Error(`Obsolete source remains: ${path}`);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Obsolete source remains:")) throw error;
  }
}));

const pkg = JSON.parse(await readFile("package.json", "utf8"));
if (pkg.devDependencies?.["@tailwindcss/postcss"] || pkg.devDependencies?.tailwindcss) throw new Error("Unused Tailwind build dependency remains");
const [chat, people, admin, directline, tokenRoute, types, sharepoint, markdown, parser, knowledge, sourceLinks, shell] = await Promise.all([
  readFile("components/chat-view.tsx", "utf8"),
  readFile("components/people-view.tsx", "utf8"),
  readFile("components/admin-view.tsx", "utf8"),
  readFile("lib/directline.ts", "utf8"),
  readFile("app/api/directline/token/route.ts", "utf8"),
  readFile("lib/types.ts", "utf8"),
  readFile("public/assets/source-icons/sharepoint.svg", "utf8"),
  readFile("components/markdown-message.tsx", "utf8"),
  readFile("lib/source-parser.ts", "utf8"),
  readFile("components/knowledge-view.tsx", "utf8"),
  readFile("lib/source-links.ts", "utf8"),
  readFile("components/app-shell.tsx", "utf8"),
]);
const all = [chat, people, admin];
const legacyBotName = ["Ask", "Revant", "Bot"].join(" ");
if (all.some((text) => text.includes(legacyBotName))) throw new Error("Legacy bot name remains");
if (!chat.includes("Ask Revantage Bot")) throw new Error("Correct bot name is missing");
if (!people.includes("mailto:")) throw new Error("People Directory email actions are missing");
if (!tokenRoute.includes("/tokens/generate") || !tokenRoute.includes("/conversations")) throw new Error("Direct Line generate/start lifecycle is incomplete");
if (!directline.includes("/tokens/refresh") || !directline.includes("ResourceNotFound")) throw new Error("Direct Line refresh/recovery logic is incomplete");
if (!chat.includes("clearPersistedSession") || !chat.includes("isRecoverableDirectLineError")) throw new Error("Persisted-session recovery is missing");
if (!types.includes("userId: string") || !directline.includes("from: { id: session.userId")) throw new Error("Direct Line user/token pairing is missing");
if (!admin.includes("connector-form") || !admin.includes("Save prototype configuration")) throw new Error("Connector forms are missing");
if (!sharepoint.includes("Microsoft SharePoint") || !sharepoint.includes(">S</text>")) throw new Error("Recognizable SharePoint asset is missing");
if (!pkg.dependencies?.["react-markdown"] || !pkg.dependencies?.["remark-gfm"]) throw new Error("Markdown dependencies are missing");
if (!markdown.includes("skipHtml") || !markdown.includes("safeMarkdownUrl") || !markdown.includes("remarkGfm")) throw new Error("Safe GitHub-Flavored Markdown rendering is incomplete");
if (!["entities", "attachments", "channelData", "@id", "sameAs"].every((value) => parser.includes(value))) throw new Error("Citation URL parsing coverage is incomplete");
if (!chat.includes("source-main-link") || !chat.includes("noopener noreferrer") || !chat.includes("Open</a>")) throw new Error("Clickable chat source cards are incomplete");
if (!knowledge.includes("document-main-link") || !knowledge.includes("without a document URL") || !knowledge.includes("Open</a>")) throw new Error("Knowledge Library source availability handling is incomplete");
if (!sourceLinks.includes("new URL") || !sourceLinks.includes("downloadUrl")) throw new Error("Source URL validation is incomplete");
if (!shell.includes("ask-revantage-wordmark-full.png")) throw new Error("Complete navbar logo is not configured");
console.log("Static verification passed.");
