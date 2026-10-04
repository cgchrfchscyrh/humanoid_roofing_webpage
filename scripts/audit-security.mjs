import { spawnSync } from "node:child_process";
import { mkdir, writeFile, readFile, readdir } from "node:fs/promises";
const run = spawnSync("npm", ["audit", "--json"], { encoding: "utf8" });
let audit;
try {
  audit = JSON.parse(run.stdout);
} catch {
  throw new Error("npm audit returned no valid JSON: " + run.stderr);
}
await mkdir("reports", { recursive: true });
await writeFile(
  "reports/security-audit.json",
  JSON.stringify(audit, null, 2) + "\n",
);
if (
  audit.error ||
  run.status !== 0 ||
  audit.metadata?.vulnerabilities?.total !== 0
)
  throw new Error("Dependency audit failed; see reports/security-audit.json");
const config = await readFile("astro.config.ts", "utf8");
if (!/output:\s*["']static["']/.test(config) || /\badapter\s*:/.test(config))
  throw new Error(
    "This deployment is reviewed for static output without a server adapter.",
  );
async function inspect(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = dir + "/" + entry.name;
    if (entry.isDirectory()) await inspect(path);
    else if (
      /astro:assets|prerender\s*=\s*false|\bfetch\s*\(/.test(
        await readFile(path, "utf8"),
      )
    )
      throw new Error(
        path + ": remote assets or dynamic behavior requires review",
      );
  }
}
await inspect("src");
const report = {
  date: new Date().toISOString(),
  vulnerabilities: audit.metadata.vulnerabilities,
  scope:
    "Static output, local assets, no server adapter or authenticated cache",
  exceptions: [],
};
await writeFile(
  "reports/security-review.json",
  JSON.stringify(report, null, 2) + "\n",
);
console.log(JSON.stringify(report, null, 2));
