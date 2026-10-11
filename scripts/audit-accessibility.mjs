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
      const heroVideos = page.locator('video[data-playback-group="hero"]');
      const highlights = page.locator("#g1-highlights-video");
      const heroToggle = page.locator("#hero-playback-toggle");
      const viewToggle = page.locator("#hero-view-toggle");
      const highlightsToggle = page.locator("#highlights-toggle");
      check(
        (await page.locator("video").count()) === 3 &&
          (await heroVideos.count()) === 2,
        "Two title videos and one experiment highlights video are present",
      );
      check(
        await page
          .locator("video")
          .evaluateAll((videos) =>
            videos.every((v) => v.paused && v.currentTime === 0),
          ),
        "All three videos are paused on initial load",
      );
      check(
        await page
          .locator("video")
          .evaluateAll((videos) =>
            videos.every((v) => v.muted && v.controls && v.playsInline),
          ),
        "Every silent video retains native controls and inline playback",
      );
      check(
        await page.locator("video").evaluateAll((videos) =>
          videos.every((v) => {
            const descriptions = (v.getAttribute("aria-describedby") || "")
              .split(/\s+/)
              .filter(Boolean);
            return (
              descriptions.length >= 2 &&
              descriptions.every(
                (id) =>
                  document.getElementById(id)?.textContent.trim().length > 30,
              )
            );
          }),
        ),
        "Each video references its caption and complete visual alternative",
      );
      await heroToggle.focus();
      check(
        await heroToggle.evaluate(
          (el) => getComputedStyle(el).outlineStyle !== "none",
        ),
        "Title playback control has a visible keyboard focus outline",
      );
      await page.keyboard.press("Enter");
      await page.waitForFunction(
        () =>
          [
            ...document.querySelectorAll('video[data-playback-group="hero"]'),
          ].every((v) => !v.paused && v.currentTime > 0.2),
        {},
        { timeout: 30000 },
      );
      check(
        (await heroToggle.innerText()) === "Pause clips" &&
          (await highlights.evaluate((v) => v.paused)),
        "Keyboard starts both title videos together and exposes pause",
      );
      await page.keyboard.press("Space");
      check(
        await heroVideos.evaluateAll((videos) => videos.every((v) => v.paused)),
        "Keyboard pauses both title videos together",
      );
      await viewToggle.focus();
      await page.keyboard.press("Enter");
      check(
        (await viewToggle.getAttribute("aria-pressed")) === "true" &&
          (await heroVideos.evaluateAll((videos) =>
            videos.every((v) => getComputedStyle(v).objectFit === "contain"),
          )),
        "Keyboard activates full-frame mode without cropping either title video",
      );
      check(
        await page.evaluate(
          () =>
            document.querySelector(".hero-backdrops").getBoundingClientRect()
              .top >=
            document.querySelector(".hero-text").getBoundingClientRect()
              .bottom -
              1,
        ),
        "Full-frame mode places the videos below the title text",
      );
      await scan("Title videos in full-frame mode");
      await page.keyboard.press("Space");
      check(
        (await viewToggle.getAttribute("aria-pressed")) === "false" &&
          (await viewToggle.innerText()) === "Show full video frames",
        "Keyboard restores the title background layout",
      );
      await highlightsToggle.focus();
      await page.keyboard.press("Enter");
      await page.waitForFunction(
        () => {
          const v = document.querySelector("#g1-highlights-video");
          return !v.paused && v.currentTime > 0.2;
        },
        {},
        { timeout: 30000 },
      );
      check(
        (await highlightsToggle.innerText()) === "Pause G1 highlights",
        "Keyboard starts the G1 highlights and exposes pause",
      );
      await heroToggle.focus();
      await page.keyboard.press("Enter");
      await page.waitForFunction(
        () =>
          document.querySelector("#g1-highlights-video").paused &&
          !document
            .querySelector("#hero-playback-toggle")
            .hasAttribute("aria-busy") &&
          [
            ...document.querySelectorAll('video[data-playback-group="hero"]'),
          ].every((v) => !v.paused),
      );
      check(true, "Starting the title pair pauses the experiment highlights");
      await highlightsToggle.focus();
      await page.keyboard.press("Enter");
      await page.waitForFunction(
        () =>
          !document.querySelector("#g1-highlights-video").paused &&
          !document
            .querySelector("#highlights-toggle")
            .hasAttribute("aria-busy") &&
          [
            ...document.querySelectorAll('video[data-playback-group="hero"]'),
          ].every((v) => v.paused),
      );
      check(true, "Starting the highlights pauses both title videos");
      await page.keyboard.press("Space");
      check(
        await highlights.evaluate((v) => v.paused),
        "Keyboard pauses the experiment highlights",
      );
      await highlights.evaluate((v) => v.play());
      await page.locator("#context-video").evaluate((v) => v.play());
      check(
        (await highlights.evaluate((v) => v.paused)) &&
          (await page.locator("#g1-hero-video").evaluate((v) => v.paused)) &&
          (await heroToggle.innerText()) === "Pause clips",
        "Native playback also pauses the other group without starting a second clip",
      );
      await heroToggle.click();
      for (const [id, expectedDuration] of [
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
          await video.evaluate((v) => v.textTracks[0].kind === "descriptions"),
          id + ": timed visual descriptions load",
        );
        check(
          await video.evaluate(
            (v, duration) =>
              Number.isFinite(v.duration) &&
              Math.abs(v.duration - duration) < 0.8 &&
              v.playbackRate === 1,
            expectedDuration,
          ),
          id + ": intended excerpt duration and original playback speed",
        );
      }
      await heroVideos.evaluateAll((videos) => {
        for (const v of videos) v.currentTime = v.duration - 0.3;
      });
      await page.waitForFunction(() =>
        [
          ...document.querySelectorAll('video[data-playback-group="hero"]'),
        ].every((v) => !v.seeking && !v.ended),
      );
      await heroToggle.click();
      await page.waitForFunction(() =>
        [
          ...document.querySelectorAll('video[data-playback-group="hero"]'),
        ].every((v) => v.ended),
      );
      check(
        (await heroToggle.innerText()) === "Replay both clips",
        "Both title videos end without looping and expose replay",
      );
      await heroToggle.click();
      await page.waitForFunction(() =>
        [
          ...document.querySelectorAll('video[data-playback-group="hero"]'),
        ].every((v) => !v.paused && v.currentTime > 0 && v.currentTime < 2),
      );
      check(true, "Replay restarts both title videos from the beginning");
      await heroToggle.click();
      await highlights.evaluate((v) => {
        v.currentTime = v.duration - 0.3;
      });
      await highlightsToggle.click();
      await page.waitForFunction(
        () => document.querySelector("#g1-highlights-video").ended,
      );
      check(
        (await highlightsToggle.innerText()) === "Replay G1 highlights",
        "Experiment highlights end without looping and expose replay",
      );
      await highlightsToggle.click();
      await page.waitForFunction(() => {
        const v = document.querySelector("#g1-highlights-video");
        return !v.paused && v.currentTime > 0 && v.currentTime < 2;
      });
      check(true, "Replay restarts the experiment highlights");
      await highlightsToggle.click();
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
      if (route === "/")
        check(
          await page
            .locator('video[data-playback-group="hero"]')
            .evaluateAll((videos) =>
              videos.every((v) => getComputedStyle(v).objectFit === "contain"),
            ),
          `Both title videos show complete frames at ${width} CSS px`,
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
    (await n.locator("video[controls]").count()) === 3,
    "All three native video controls remain available without JavaScript",
  );
  check(
    (await n.locator("#hero-playback-toggle").isHidden()) &&
      (await n.locator("#hero-view-toggle").isHidden()) &&
      (await n.locator("#highlights-toggle").isHidden()),
    "Unavailable JavaScript media controls are hidden without JavaScript",
  );
  for (const id of [
    "field-visual-description",
    "robot-visual-description",
    "highlights-visual-description",
  ])
    check(
      await n.locator("#" + id).isVisible(),
      id + ": complete visual alternative remains visible without JavaScript",
    );
  check(
    await n.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    "Homepage reflows at 320 CSS px without JavaScript",
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
    await rp
      .locator("video")
      .evaluateAll(
        (videos) =>
          videos.length === 3 &&
          videos.every((v) => v.paused && v.currentTime === 0),
      ),
    "Reduced-motion visit does not start any of the three videos",
  );
  await reduced.close();

  // Hold real media responses so play() remains pending when Pause is pressed.
  const bufferingPage = await context.newPage();
  let releaseMedia;
  const mediaGate = new Promise((resolve) => {
    releaseMedia = resolve;
  });
  const pendingRoutes = new Set();
  bufferingPage.on("pageerror", (error) => report.errors.push(error.message));
  await bufferingPage.route(/\.mp4(?:\?|$)/, async (route) => {
    const continued = mediaGate.then(() => route.continue());
    pendingRoutes.add(continued);
    try {
      await continued;
    } catch (error) {
      if (!bufferingPage.isClosed()) report.errors.push(error.message);
    } finally {
      pendingRoutes.delete(continued);
    }
  });
  try {
    await bufferingPage.goto(base + "/", { waitUntil: "domcontentloaded" });
    for (const [buttonId, videoIds, label] of [
      [
        "hero-playback-toggle",
        ["context-video", "g1-hero-video"],
        "Title pair",
      ],
      ["highlights-toggle", ["g1-highlights-video"], "G1 highlights"],
    ]) {
      const toggle = bufferingPage.locator("#" + buttonId);
      await toggle.waitFor({ state: "visible" });
      await toggle.focus();
      await bufferingPage.keyboard.press("Enter");
      await bufferingPage.waitForFunction(
        ({ buttonId, videoIds }) =>
          document.getElementById(buttonId).getAttribute("aria-busy") ===
            "true" &&
          videoIds.every((id) => !document.getElementById(id).paused),
        { buttonId, videoIds },
      );
      check(
        await bufferingPage.evaluate(
          (ids) =>
            ids.every((id) => {
              const video = document.getElementById(id);
              return video.readyState === 0 && video.currentTime === 0;
            }),
          videoIds,
        ),
        label + ": keyboard play remains busy while MP4 requests are held",
      );
      await bufferingPage.keyboard.press("Space");
      await bufferingPage.waitForFunction(
        (ids) => ids.every((id) => document.getElementById(id).paused),
        videoIds,
        { timeout: 5000 },
      );
      check(
        !(await toggle.getAttribute("aria-busy")) &&
          (await bufferingPage.locator("#media-status").innerText()).trim() ===
            "" &&
          (await toggle.innerText()) ===
            (await toggle.getAttribute("data-idle-label")),
        label +
          ": keyboard pause cancels buffered playback, clears busy, and shows no error",
      );
    }
  } finally {
    // Always release before closing: even a failed assertion cannot strand routes.
    releaseMedia();
    await Promise.allSettled([...pendingRoutes]);
    await bufferingPage.close();
  }
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
