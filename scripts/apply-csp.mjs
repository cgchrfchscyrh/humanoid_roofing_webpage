import { readdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";

// Hash Astro's generated inline scripts rather than permitting arbitrary inline JS.
async function secure(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) await secure(file);
    else if (entry.name.endsWith(".html")) {
      let html = await readFile(file, "utf8");
      html = html.replace(
        /<meta\b[^>]*http-equiv="Content-Security-Policy"[^>]*>/gi,
        "",
      );
      const hashes = [
        ...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi),
      ]
        .filter((match) => !/\bsrc\s*=/.test(match[1]))
        .map(
          (match) =>
            `'sha256-${createHash("sha256").update(match[2]).digest("base64")}'`,
        );
      const policy = `default-src 'self'; script-src 'self' ${[...new Set(hashes)].join(" ")}; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; media-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'`;
      html = html.replace(
        /<meta\s+charset="[^"]+"\s*\/?>/i,
        (tag) =>
          `${tag}<meta http-equiv="Content-Security-Policy" content="${policy}">`,
      );
      await writeFile(file, html);
    }
  }
}
await secure(process.env.BUILD_OUTPUT || "dist");
