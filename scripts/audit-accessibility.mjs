import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import assert from "node:assert/strict";
const site = JSON.parse(
  await readFile(new URL("../src/data/site.json", import.meta.url), "utf8"),
);
const base = (
  process.env.TEST_URL || "http://127.0.0.1:4512/humanoid_roofing_webpage"
).replace(/\/$/, "");
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
    "External PDFs, screen-reader usability, and scientific image contrast require separate review.",
  ],
};
const check = (value, message) =>
  (value ? report.checks : report.errors).push(message);
page.on("pageerror", (error) => report.errors.push(error.message));
page.on("console", (message) => {
  if (message.type() === "error") report.errors.push(message.text());
});
async function scan(name) {
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  report.scans.push({
    name,
    passes: result.passes.length,
    violations: result.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      nodes: v.nodes.map((n) => ({
        target: n.target,
        reason: n.failureSummary,
      })),
    })),
    incomplete: result.incomplete.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => n.target),
    })),
  });
}
const paused = (target) =>
  target
    .locator("video")
    .evaluateAll((videos) => videos.every((video) => video.paused));
async function expectHeroPlaying(target) {
  await target.waitForFunction(() =>
    [...document.querySelectorAll('video[data-playback-group="hero"]')].every(
      (v) => !v.paused && v.currentTime > 0.1,
    ),
  );
}
async function atTop(target) {
  await target.evaluate(() => scrollTo(0, 0));
  await target.waitForTimeout(300);
}
try {
  for (const route of [
    "/",
    "/paper/",
    "/results/",
    "/accessibility/",
    "/404.html",
  ]) {
    await page.setViewportSize({ width: 1440, height: 1000 });
    const response = await page.goto(base + route, {
      waitUntil: "networkidle",
    });
    check(response?.ok() || route === "/404.html", route + ": page loads");
    check((await page.locator("h1").count()) === 1, route + ": one H1");
    check(
      (await page.locator("html").getAttribute("lang")) === "en",
      route + ": English document language",
    );
    check(
      (await page.locator('img:not([alt]), img[alt=""]').count()) === 0,
      route + ": informative images have alternatives",
    );
    check(
      (await page.locator("iframe,video[autoplay]").count()) === 0,
      route + ": no embedded third-party player or uncontrolled HTML autoplay",
    );
    check(
      !/University of Florida|\bUF\b|official views or policies|official position/i.test(
        await page.locator("body").innerText(),
      ),
      route + ": no institutional affiliation or disclaimer text",
    );
    check(
      await page.evaluate(() => {
        const ids = [...document.querySelectorAll("[id]")].map((el) => el.id);
        return ids.length === new Set(ids).size;
      }),
      route + ": unique IDs",
    );
    check(
      await page.evaluate(() =>
        [...document.querySelectorAll('a[href^="#"]')].every((el) =>
          document.getElementById(el.getAttribute("href").slice(1)),
        ),
      ),
      route + ": valid local anchors",
    );
    check(
      await page.evaluate(() => {
        let previous = 0;
        return [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")]
          .filter((el) => el.getClientRects().length)
          .every((el) => {
            const level = Number(el.tagName[1]);
            const valid = level <= previous + 1;
            previous = level;
            return valid;
          });
      }),
      route + ": heading hierarchy",
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
      route + ": visible focus",
    );
    await page.keyboard.press("Enter");
    check(
      (await page.locator(":focus").getAttribute("id")) === "main",
      route + ": skip link targets main",
    );
    if (route === "/") {
      const master = page.locator("#media-toggle");
      await atTop(page);
      await expectHeroPlaying(page);
      check(true, "Visible title videos automatically play without a click");
      check(
        (await master.innerText()) === "Pause videos" &&
          (await master.isVisible()),
        "Automatic playback exposes a visible Pause videos button",
      );
      check(
        (await page.locator("video").count()) === 3,
        "Three original research video players remain available",
      );
      check(
        await page
          .locator("video")
          .evaluateAll((videos) =>
            videos.every(
              (v) =>
                v.muted &&
                v.controls &&
                v.playsInline &&
                v.loop &&
                v.playbackRate === 1,
            ),
          ),
        "Silent inline playback, original speed, native controls, and controllable loops",
      );
      check(
        await page
          .locator(".hero-backdrops video")
          .evaluateAll((videos) =>
            videos.every((v) => getComputedStyle(v).objectFit === "contain"),
          ),
        "Desktop title media shows complete frames",
      );
      check(
        await page.evaluate(
          () =>
            document.querySelector(".hero-text").getBoundingClientRect()
              .bottom <=
            document.querySelector(".hero-backdrops").getBoundingClientRect()
              .top +
              1,
        ),
        "Title and author names are above the footage",
      );
      await master.focus();
      await page.keyboard.press("Space");
      await page.waitForFunction(() =>
        [...document.querySelectorAll("video")].every((v) => v.paused),
      );
      check(
        (await master.innerText()) === "Play videos",
        "Keyboard pause stops every video and offers Play videos",
      );
      await page.locator("#g1-highlights-video").scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      await atTop(page);
      check(
        await paused(page),
        "Global manual pause persists after leaving and re-entering the viewport",
      );
      await master.focus();
      await page.keyboard.press("Enter");
      await expectHeroPlaying(page);
      check(true, "Keyboard Play videos explicitly resumes visible media");
      await page.locator("#g1-hero-video").evaluate((v) => {
        if (v instanceof HTMLVideoElement) v.pause();
      });
      await page.waitForTimeout(150);
      await page.locator("#g1-highlights-video").scrollIntoViewIfNeeded();
      await page.waitForFunction(
        () =>
          !document.querySelector("#g1-highlights-video").paused &&
          [
            ...document.querySelectorAll('video[data-playback-group="hero"]'),
          ].every((v) => v.paused),
      );
      check(
        true,
        "Entering experiment video plays it and pauses offscreen title media",
      );
      await atTop(page);
      check(
        (await page.locator("#g1-hero-video").evaluate((v) => v.paused)) &&
          (await page.locator("#context-video").evaluate((v) => !v.paused)),
        "A native individual pause remains remembered after scrolling",
      );
      await master.click();
      await master.click();
      await expectHeroPlaying(page);
      await page.locator("#g1-hero-video").evaluate((v) => {
        v.currentTime = v.duration - 0.15;
      });
      await page.waitForFunction(() => {
        const v = document.querySelector("#g1-hero-video");
        return !v.paused && !v.seeking && v.currentTime < 1;
      });
      check(true, "Video looping preserves playback and remains pausable");
      await master.click();
      for (const [id, duration] of [
        ["context-video", site.contextDuration],
        ["g1-hero-video", site.robotHero.duration],
        ["g1-highlights-video", site.robotHighlights.duration],
      ]) {
        const video = page.locator("#" + id);
        await video.evaluate((v) => {
          v.textTracks[0].mode = "hidden";
        });
        await page.waitForFunction(
          (videoId) =>
            document.getElementById(videoId).textTracks[0]?.cues?.length > 0,
          id,
        );
        check(
          await video.evaluate(
            (v, expected) =>
              Math.abs(v.duration - expected) < 0.8 &&
              v.textTracks[0].kind === "descriptions",
            duration,
          ),
          id + ": unchanged excerpt duration and loaded timed description",
        );
      }
      check(
        JSON.stringify(
          await page
            .locator(
              ".visual-home > section > h2, .visual-home > section > .section-heading > h2",
            )
            .allTextContents(),
        ) ===
          JSON.stringify([
            "Abstract",
            "Experiments",
            "Method",
            "Results",
            "Citation",
          ]),
        "Concise standard research headings",
      );
      await page
        .getByRole("button", { name: "Copy citation", exact: true })
        .focus();
      await page.keyboard.press("Enter");
      check(
        (await page.evaluate(() => navigator.clipboard.readText())).includes(
          site.citationKey,
        ),
        "Keyboard citation copy",
      );
      await page
        .locator(".research-details")
        .first()
        .locator(":scope > summary")
        .click();
      check(
        await page.locator("#figure-simulation").isVisible(),
        "Simulation evidence opens through native details",
      );
      await page
        .locator(".research-details")
        .first()
        .locator(":scope > summary")
        .click();
    }
    if (route === "/results/") {
      check(
        (await page.locator("table").count()) === site.tables.length &&
          (await page.locator("table caption").count()) === site.tables.length,
        "All original result tables and captions preserved",
      );
      check(
        (await page.locator("th:not([scope])").count()) === 0,
        "Table headers declare scope",
      );
      for (const table of site.tables)
        check(
          (await page.locator("#" + table.id + " table").innerText()).includes(
            table.rows[0][0],
          ),
          table.title + ": data remains available",
        );
    }
    if (route === "/accessibility/")
      for (const id of [
        "field-visual-description",
        "robot-visual-description",
        "highlights-visual-description",
      ])
        check(
          (await page.locator("#" + id).innerText()).length > 100,
          id + ": complete visual alternative available",
        );
    await scan(route + " desktop");
    for (const width of [320, 768]) {
      await page.setViewportSize({ width, height: 900 });
      check(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        route + `: no horizontal page overflow at ${width}px`,
      );
      if (route === "/")
        check(
          await page
            .locator(".hero-backdrops video")
            .evaluateAll((videos) =>
              videos.every((v) => getComputedStyle(v).objectFit === "contain"),
            ),
          `Complete video frames at ${width}px`,
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
      route + ": 320px text-spacing reflow",
    );
    await spacing.evaluate((el) => el.remove());
    await scan(route + " mobile");
    if (route === "/results/") {
      await page.locator(".table-scroll").first().focus();
      await page.keyboard.press("ArrowRight");
      await page.waitForTimeout(200);
      check(
        await page
          .locator(".table-scroll")
          .first()
          .evaluate((el) => el.scrollLeft > 0),
        "Keyboard scrolls wide result tables",
      );
    }
  }
  for (const preference of ["reduced-motion", "save-data"]) {
    const ctx = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      ...(preference === "reduced-motion" ? { reducedMotion: "reduce" } : {}),
    });
    if (preference === "save-data")
      await ctx.addInitScript(() =>
        Object.defineProperty(navigator, "connection", {
          value: Object.assign(new EventTarget(), { saveData: true }),
          configurable: true,
        }),
      );
    const p = await ctx.newPage();
    await p.goto(base + "/", { waitUntil: "networkidle" });
    check(
      await p
        .locator("video")
        .evaluateAll((videos) =>
          videos.every((v) => v.paused && v.currentTime === 0),
        ),
      preference + ": no automatic motion on entry",
    );
    await p.locator("#g1-highlights-video").scrollIntoViewIfNeeded();
    await p.waitForTimeout(200);
    check(await paused(p), preference + ": scrolling does not start media");
    await atTop(p);
    await p.locator("#media-toggle").click();
    await expectHeroPlaying(p);
    check(true, preference + ": explicit Play videos remains available");
    await p.locator("#media-toggle").click();
    await atTop(p);
    check(await paused(p), preference + ": user can pause explicit playback");
    await ctx.close();
  }
  const dynamic = await context.newPage();
  await dynamic.goto(base + "/", { waitUntil: "networkidle" });
  await expectHeroPlaying(dynamic);
  await dynamic.emulateMedia({ reducedMotion: "reduce" });
  await dynamic.waitForFunction(() =>
    [...document.querySelectorAll("video")].every((v) => v.paused),
  );
  check(true, "Changing reduced-motion preference stops automatic playback");
  await dynamic.close();
  const nojs = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 320, height: 900 },
  });
  const n = await nojs.newPage();
  await n.goto(base + "/");
  check(
    (await n.locator("video[controls]").count()) === 3 && (await paused(n)),
    "No-JavaScript media retains native controls without automatic motion",
  );
  check(
    (await n.locator("#media-toggle").isHidden()) &&
      (await n.locator("#copy-citation").isHidden()),
    "Unavailable script controls stay hidden without JavaScript",
  );
  check(
    await n.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    "No-JavaScript 320px reflow",
  );
  await n.goto(base + "/accessibility/");
  check(
    (await n.locator("#highlights-visual-description").innerText()).length >
      100,
    "Complete video alternatives accessible without JavaScript",
  );
  await nojs.close();
  const buffering = await context.newPage();
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  const routes = new Set();
  await buffering.route(/\.mp4(?:\?|$)/, async (route) => {
    const pending = gate.then(() => route.continue()).catch(() => {});
    routes.add(pending);
    await pending;
    routes.delete(pending);
  });
  try {
    await buffering.goto(base + "/", { waitUntil: "domcontentloaded" });
    await buffering.waitForFunction(() =>
      [...document.querySelectorAll('video[data-playback-group="hero"]')].some(
        (v) => !v.paused,
      ),
    );
    await buffering.locator("#media-toggle").focus();
    await buffering.keyboard.press("Space");
    check(
      await paused(buffering),
      "Pause interrupts pending autoplay while media is buffering",
    );
    release();
    await Promise.allSettled([...routes]);
    await buffering.waitForTimeout(300);
    check(
      await paused(buffering),
      "Releasing buffered media does not undo a user pause",
    );
  } finally {
    release();
    await Promise.allSettled([...routes]);
    await buffering.close();
  }
} catch (error) {
  report.errors.push(error.stack || String(error));
} finally {
  await browser.close();
  await mkdir("reports", { recursive: true });
  await writeFile(
    "reports/axe-wcag21aa.json",
    JSON.stringify(report, null, 2) + "\n",
  );
}
const violations = report.scans.reduce(
  (sum, scan) => sum + scan.violations.length,
  0,
);
console.log(
  JSON.stringify(
    {
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
  "Accessibility or functional checks failed; see report",
);
