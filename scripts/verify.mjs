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
];
await Promise.all(required.map((path) => access(path)));
const pkg = JSON.parse(await readFile("package.json", "utf8"));
if (!pkg.devDependencies?.["@tailwindcss/postcss"]) throw new Error("@tailwindcss/postcss is missing");
const all = await Promise.all([
  readFile("components/chat-view.tsx", "utf8"),
  readFile("components/people-view.tsx", "utf8"),
  readFile("components/admin-view.tsx", "utf8"),
]);
const legacyBotName = ["Ask", "Revant", "Bot"].join(" ");
if (all.some((text) => text.includes(legacyBotName))) throw new Error("Legacy bot name remains");
if (!all[0].includes("Ask Revantage Bot")) throw new Error("Correct bot name is missing");
if (!all[1].includes("mailto:")) throw new Error("People Directory email actions are missing");
console.log("Static verification passed.");
