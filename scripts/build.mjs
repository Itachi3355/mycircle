import { appendFileSync, cpSync, existsSync, lstatSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = join(root, "dist");
const landing = join(root, "landing", "dist");
const hasLanding = existsSync(join(landing, "index.html")) && existsSync(join(landing, "assets"));
const requiresLanding = process.env.VERCEL_ENV === "production" || process.argv.includes("--require-landing");
const supabaseUrl = process.env.MYCIRCLE_SUPABASE_URL;
const supabaseKey = process.env.MYCIRCLE_SUPABASE_PUBLISHABLE_KEY;

if (requiresLanding && !hasLanding) {
  throw new Error("Production includes the existing 3D sign-in page. Build the private landing/ project before packaging this release.");
}

if (supabaseUrl || supabaseKey) {
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(supabaseUrl || "") || !/^sb_publishable_[a-zA-Z0-9_-]+$/.test(supabaseKey || "")) {
    throw new Error("Set both a Supabase project URL and an sb_publishable_ key. Keep server credentials out of the static build.");
  }
}

if (existsSync(output)) {
  const info = lstatSync(output);
  if (info.isSymbolicLink() || !info.isDirectory()) throw new Error("Expected dist to be a local build directory.");
  rmSync(output, { recursive: true });
}
mkdirSync(output);

for (const asset of ["index.html", "css", "js", "vendor", "demo"]) {
  cpSync(join(root, asset), join(output, asset), { recursive: true });
}
if (hasLanding) cpSync(landing, join(output, "landing", "dist"), { recursive: true });
if (supabaseUrl) {
  const config = { supabaseUrl, supabaseKey };
  appendFileSync(join(output, "js", "config.js"), "\nObject.assign(window.MYCIRCLE_CONFIG, " + JSON.stringify(config) + ");\n");
}

console.log(hasLanding ? "Built MyCircle with the 3D sign-in page." : "Built MyCircle with the email sign-in form.");
