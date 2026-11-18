import { access, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const workspaceRoot = path.join(projectRoot, "app", "(workspace)");
const routeNames = ["admin", "knowledge", "people"];

async function exists(target) {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

for (const routeName of routeNames) {
  const canonicalPage = path.join(workspaceRoot, routeName, "page.tsx");
  const staleRoute = path.join(projectRoot, "app", routeName);

  if (!(await exists(canonicalPage))) {
    throw new Error(
      `Cannot prepare /${routeName}: canonical route is missing at ${path.relative(
        projectRoot,
        canonicalPage,
      )}`,
    );
  }

  if (await exists(staleRoute)) {
    await rm(staleRoute, { recursive: true, force: true });
    console.log(
      `Removed stale ${path.relative(projectRoot, staleRoute)} route; ` +
        `app/(workspace)/${routeName}/page.tsx is canonical.`,
    );
  }
}
