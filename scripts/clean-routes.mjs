import { rm } from "node:fs/promises";

// Older ZIPs created top-level pages that collide with the canonical route group.
for (const path of ["app/admin", "app/knowledge", "app/people", "app/page.tsx"]) {
  await rm(path, { recursive: true, force: true });
}
