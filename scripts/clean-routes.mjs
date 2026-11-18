import { rm } from "node:fs/promises";

// Root-ready ZIPs overwrite files but cannot delete files left by older releases.
// Remove routes and modules that were replaced by the canonical workspace shell,
// Direct Line client, and source storage implementation.
const obsoletePaths = [
  "app/admin",
  "app/knowledge",
  "app/people",
  "app/page.tsx",
  "app/api/requests",
  "app/api/sources",
  "components/workspace-shell.tsx",
  "context",
  "lib/direct-line-client.ts",
  "lib/direct-line-classifier.js",
  "lib/direct-line-classifier.d.ts",
  "lib/store.ts",
];

for (const path of obsoletePaths) {
  await rm(path, { recursive: true, force: true });
}
