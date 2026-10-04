import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import assert from "node:assert/strict";
const site = JSON.parse(
  await readFile(new URL("../src/data/site.json", import.meta.url), "utf8"),
);
const base = (process.env.TEST_URL || "http://127.0.0.1:4332").replace(
  /\/$/,
  "",
);
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROME_PATH
    ? { executablePath: process.env.CHROME_PATH }
    : {}),
  args: ["--no-sandbox"],
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  permissions: ["clipboard-read", "clipboard-write"],
});
const page = await context.newPage();
const report = {
  date: new Date().toISOString(),
  project: site.id,
  target: "WCAG 2.1 A/AA",
  engine: "axe-core via Playwright",
  scans: [],
  checks: [],
  errors: [],
  limitations: [
    "Automated checks are not a complete WCAG or ADA certification.",
    "External full-text PDFs, screen-reader usability, scientific image contrast, and institutional approval need separate review.",
  ],
};
const check = (value, message) => {
  if (value) report.checks.push(message);
  else report.errors.push(message);
};
page.on("pageerror", (e) => report.errors.push(e.message));
page.on("console", (m) => {
  if (m.type() === "error") report.errors.push(m.text());
});
page.on("requestfailed", (r) => {
  if (!r.failure()?.errorText.includes("ERR_ABORTED"))
    report.errors.push(r.url() + ": " + r.failure()?.errorText);
});
async function scan(name) {
  const r = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  report.scans.push({
    name,
    passes: r.passes.length,
    violations: r.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      nodes: v.nodes.map((n) => ({
        target: n.target,
        reason: n.failureSummary,
      })),
    })),
    incomplete: r.incomplete.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => n.target),
    })),
  });
}
try {
  for (const route of [
    "/",
    "/paper/",
    "/results/",
    "/accessibility/",
    "/404.html",
  ]) {
    const response = await page.goto(base + route, {
      waitUntil: "networkidle",
    });
    check(response?.ok() || route === "/404.html", route + ": page loads");
    check((await page.locator("h1").count()) === 1, route + ": one H1");
    check(
      (await page.locator("html").getAttribute("lang")) === "en",
      route + ": English language declared",
    );
    check(
      (await page.locator('img:not([alt]), img[alt=""]').count()) === 0,
      route + ": informative images have nonempty alternatives",
    );
    check(
      (await page.locator("video[autoplay],video[loop],iframe").count()) === 0,
      route + ": no autoplay, loops, or third-party players",
    );
    check(
      (await page.locator("footer").innerText()).includes(
        "do not represent the official views or policies",
      ),
      route + ": institutional disclaimer is present",
    );
    check(
      await page.evaluate(() => {
        const ids = Array.from(document.querySelectorAll("[id]"), (e) => e.id);
        return ids.length === new Set(ids).size;
      }),
      route + ": IDs are unique",
    );
    check(
      await page.evaluate(() => {
        let prev = 0;
        return Array.from(document.querySelectorAll("h1,h2,h3,h4,h5,h6"))
          .filter((el) => el.getClientRects().length)
          .every((el) => {
            const level = Number(el.tagName[1]);
            const good = level <= prev + 1;
            prev = level;
            return good;
          });
      }),
      route + ": visible headings do not skip levels",
    );
    check(
      await page.evaluate(() =>
        Array.from(document.querySelectorAll('a[href^="#"]')).every((el) =>
          document.getElementById(el.getAttribute("href").slice(1)),
        ),
      ),
      route + ": in-page links have targets",
    );
    await page.keyboard.press("Tab");
    check(
      (await page.locator(":focus").getAttribute("class")) === "skip-link",
      route + ": skip link is first keyboard stop",
    );
    check(
      await page
        .locator(":focus")
        .evaluate((el) => getComputedStyle(el).outlineStyle !== "none"),
      route + ": keyboard focus has visible outline",
    );
    await page.keyboard.press("Enter");
    check(
      (await page.locator(":focus").getAttribute("id")) === "main",
      route + ": skip link focuses main",
    );
    await scan(route + " desktop");
    if (route === "/") {
      if (site.comparisons.length > 1) {
        await page.getByRole("tab").first().focus();
        await page.keyboard.press("ArrowRight");
        check(
          await page.locator("#panel-" + site.comparisons[1].id).isVisible(),
          "Result tabs support arrow-key navigation",
        );
        await scan("Second comparison selected");
        await page.keyboard.press("Home");
        check(
          await page.locator("#panel-" + site.comparisons[0].id).isVisible(),
          "Home key selects first result tab",
        );
        await page.keyboard.press("End");
        check(
          await page.locator("#panel-" + site.comparisons[1].id).isVisible(),
          "End key selects last result tab",
        );
        await page.keyboard.press("ArrowRight");
      }
      const video = page.locator("#context-video"),
        toggle = page.locator("#video-toggle");
      check(
        await video.evaluate((v) => v.paused && v.currentTime === 0),
        "Video is paused on initial load",
      );
      await toggle.focus();
      await page.keyboard.press("Enter");
      await page.waitForFunction(
        () => {
          const v = document.querySelector("video");
          return !v.paused && v.currentTime > 0.2;
        },
        {},
        { timeout: 30000 },
      );
      check(
        (await toggle.innerText()) === "Pause context clip",
        "Keyboard starts video and exposes pause",
      );
      await page.keyboard.press("Space");
      check(await video.evaluate((v) => v.paused), "Keyboard pauses video");
      await video.evaluate((v) => {
        v.textTracks[0].mode = "hidden";
      });
      await page.waitForFunction(
        () => document.querySelector("video").textTracks[0].cues?.length > 0,
      );
      check(
        await video.evaluate((v) => v.textTracks[0].kind === "descriptions"),
        "Timed visual description track loads",
      );
      await video.evaluate((v) => {
        v.currentTime = v.duration - 0.25;
      });
      await toggle.click();
      await page.waitForFunction(() => document.querySelector("video").ended);
      check(
        (await toggle.innerText()) === "Replay context clip",
        "Video ends without looping and exposes replay",
      );
      await toggle.click();
      await page.waitForFunction(() => {
        const v = document.querySelector("video");
        return !v.paused && v.currentTime < 2;
      });
      check(true, "Replay restarts video");
      await toggle.click();
      await page
        .getByRole("button", { name: "Copy citation", exact: true })
        .focus();
      await page.keyboard.press("Enter");
      check(
        (await page.evaluate(() => navigator.clipboard.readText())).includes(
          site.citationKey,
        ),
        "Citation can be copied with keyboard",
      );
    }
    if (route === "/results/") {
      check(
        (await page.locator("table").count()) === site.tables.length,
        "All expected result tables are present",
      );
      check(
        (await page.locator("table caption").count()) === site.tables.length,
        "All tables have descriptive captions",
      );
      check(
        (await page.locator("th:not([scope])").count()) === 0,
        "Table headers define their scope",
      );
    }
    for (const width of [320, 768]) {
      await page.setViewportSize({ width, height: 900 });
      check(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        route + `: no page-level horizontal overflow at ${width} CSS px`,
      );
    }
    await page.setViewportSize({ width: 320, height: 900 });
    const spacing = await page.addStyleTag({
      content:
        "*{line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important}p{margin-bottom:2em!important}",
    });
    check(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      route + ": reflows at 320 CSS px with increased text spacing",
    );
    await spacing.evaluate((el) => el.remove());
    await page.setViewportSize({ width: 390, height: 900 });
    await scan(route + " mobile");
    if (route === "/results/") {
      const table = page.locator(".table-scroll").first();
      await table.focus();
      await page.keyboard.press("ArrowRight");
      await page.waitForTimeout(200);
      check(
        await table.evaluate((el) => el.scrollLeft > 0),
        "Wide result table supports keyboard horizontal scrolling",
      );
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
  }
  const nojs = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 320, height: 900 },
  });
  const n = await nojs.newPage();
  await n.goto(base + "/");
  for (const d of site.comparisons)
    check(
      await n.locator("#panel-" + d.id).isVisible(),
      "Comparison " + d.label + " remains visible without JavaScript",
    );
  check(
    (await n.locator("video[controls]").count()) === 1,
    "Native video controls remain available without JavaScript",
  );
  check(
    (await n.locator("#citation-text").innerText()).includes(site.citationKey),
    "Citation remains readable without JavaScript",
  );
  check(
    await n.locator("#copy-citation").isHidden(),
    "Unavailable JavaScript copy control is hidden",
  );
  await nojs.close();
  const reduced = await browser.newContext({ reducedMotion: "reduce" });
  const rp = await reduced.newPage();
  await rp.goto(base + "/");
  check(
    await rp.locator("video").evaluate((v) => v.paused),
    "Reduced-motion visit does not start media",
  );
  await reduced.close();
} catch (e) {
  report.errors.push(e.stack || String(e));
} finally {
  await browser.close();
  await mkdir("reports", { recursive: true });
  await writeFile(
    "reports/axe-wcag21aa.json",
    JSON.stringify(report, null, 2) + "\n",
  );
}
const violations = report.scans.reduce((n, s) => n + s.violations.length, 0);
console.log(
  JSON.stringify(
    {
      project: site.id,
      scans: report.scans.length,
      checks: report.checks.length,
      violations,
      errors: report.errors,
    },
    null,
    2,
  ),
);
assert.equal(
  violations,
  0,
  "axe violations found; see reports/axe-wcag21aa.json",
);
assert.equal(
  report.errors.length,
  0,
  "Functional or accessibility checks failed; see report",
);
