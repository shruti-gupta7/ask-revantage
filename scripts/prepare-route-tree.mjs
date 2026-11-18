import { access, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const appRoot = path.join(projectRoot, "app");
const workspaceRoot = path.join(appRoot, "(workspace)");
const routeNames = ["admin", "knowledge", "people"];

async function exists(target) {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

async function removeStaleRoute(staleRoute, canonicalPage, publicRoute) {
  if (!(await exists(canonicalPage))) {
    throw new Error(
      `Cannot prepare ${publicRoute}: canonical route is missing at ${path.relative(
        projectRoot,
        canonicalPage,
      )}`,
    );
  }

  if (await exists(staleRoute)) {
    await rm(staleRoute, { recursive: true, force: true });
    console.log(
      `Removed stale ${path.relative(projectRoot, staleRoute)} route; ` +
        `${path.relative(projectRoot, canonicalPage)} is canonical.`,
    );
  }
}

// The shared workspace owns the root route. Browser ZIP uploads can leave an
// older app/page.tsx behind, including the obsolete initialView prop. Remove
// that stale page before both type checking and production builds.
await removeStaleRoute(
  path.join(appRoot, "page.tsx"),
  path.join(workspaceRoot, "page.tsx"),
  "/",
);

for (const routeName of routeNames) {
  await removeStaleRoute(
    path.join(appRoot, routeName),
    path.join(workspaceRoot, routeName, "page.tsx"),
    `/${routeName}`,
  );
}
