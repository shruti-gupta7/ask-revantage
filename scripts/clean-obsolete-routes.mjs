import { rm, stat } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const obsolete = [
  "app/page.tsx",
  "app/admin",
  "app/knowledge",
  "app/people",
  "app/support"
];

for (const relativePath of obsolete) {
  const target = path.join(root, relativePath);
  try {
    await stat(target);
    await rm(target, { recursive: true, force: true });
    console.log(`Removed obsolete route: ${relativePath}`);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}
