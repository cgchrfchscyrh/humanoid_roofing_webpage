import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import assert from "node:assert/strict";
const site = JSON.parse(
  await readFile(new URL("../src/data/site.json", import.meta.url), "utf8"),
);
const clipManifest = JSON.parse(
  await readFile(
    new URL("../public/media/roofing-clips.json", import.meta.url),
    "utf8",
  ),
);
const clipByFile = new Map(clipManifest.clips.map((clip) => [clip.file, clip]));
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
const expectedVideoIds = [
  "context-video",
  "g1-hero-video",
  "g1-walking-video",
  "field-crouch-video",
  "g1-tool-video",
  "g1-bending-video",
];
const paperUrl = "https://arxiv.org/pdf/2609.20558";
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
// Traverse real keyboard stops into Chrome's native video controls.
async function tabToVideo(target, video) {
  await target.locator(".skip-link").focus();
  for (let i = 0; i < 100; i++) {
    await target.keyboard.press("Tab");
    if (await video.evaluate((v) => document.activeElement === v)) return;
  }
  throw new Error(
    "Native video controls were not reachable through the tab order",
  );
}
async function waitForPlayback(video, expected) {
  await video.page().waitForFunction(
    ({ id, paused }) => {
      const v = document.getElementById(id);
      return v instanceof HTMLVideoElement && v.paused === paused;
    },
    { id: await video.getAttribute("id"), paused: expected },
  );
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
      (await page
        .locator(
          "table, .numeric-pair, .results-highlights, .metric-comparison",
        )
        .count()) === 0,
      route + ": numerical result displays are removed",
    );
    check(
      (await page
        .getByRole("link", {
          name: /Research guide|Results & figures|All results, figures, and data/i,
        })
        .count()) === 0,
      route +
        ": removed research-guide and result-index navigation stays absent",
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
      await atTop(page);
      await expectHeroPlaying(page);
      check(true, "Visible title videos automatically play without a click");
      check(
        (await page.locator("#media-toggle").count()) === 0,
        "No separate global playback button remains; native controls are available",
      );
      check(
        JSON.stringify(
          await page
            .locator("video")
            .evaluateAll((videos) => videos.map((v) => v.id).sort()),
        ) === JSON.stringify([...expectedVideoIds].sort()),
        "Six expected roofing excerpts are distributed across the page",
      );
      check(
        (await page.locator(".hero-text .actions a").count()) === 1 &&
          (await page
            .locator(".hero-text .actions")
            .getByRole("link", { name: /^arXiv/ })
            .getAttribute("href")) === paperUrl,
        "The hero has only the arXiv button linked to the requested PDF",
      );
      for (const [section, ids] of [
        ["abstract", ["g1-walking-video"]],
        ["method", ["field-crouch-video"]],
        ["results", ["g1-tool-video", "g1-bending-video"]],
      ])
        check(
          JSON.stringify(
            await page
              .locator("#" + section + " video")
              .evaluateAll((videos) => videos.map((v) => v.id)),
          ) === JSON.stringify(ids),
          section +
            ": the intended short excerpts accompany the research section",
        );
      check(
        (await page.locator("video").count()) === expectedVideoIds.length,
        "All expected video players are available",
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
      const heroVideo = page.locator("#g1-hero-video");
      await tabToVideo(page, heroVideo);
      check(true, "Native video playback controls are reachable through Tab");
      await page.keyboard.press("Space");
      await waitForPlayback(heroVideo, true);
      check(true, "Space on the native player pauses the video");
      for (const video of await page
        .locator('video[data-playback-group="research"]')
        .all()) {
        await video.scrollIntoViewIfNeeded();
        await waitForPlayback(video, false);
        check(
          await video.evaluate((v) => v.muted && v.loop),
          "Research excerpt plays silently when visible: " +
            (await video.getAttribute("id")),
        );
      }
      check(
        await page
          .locator('video[data-playback-group="hero"]')
          .evaluateAll((videos) => videos.every((v) => v.paused)),
        "Offscreen title videos pause automatically",
      );
      await atTop(page);
      check(
        (await heroVideo.evaluate((v) => v.paused)) &&
          (await page.locator("#context-video").evaluate((v) => !v.paused)),
        "Native manual pause remains remembered after scrolling while other media can play",
      );
      await tabToVideo(page, heroVideo);
      await page.keyboard.press("Space");
      await waitForPlayback(heroVideo, false);
      check(true, "Space on the native player explicitly resumes playback");
      await heroVideo.evaluate((v) => {
        v.currentTime = v.duration - 0.15;
      });
      await page.waitForFunction(() => {
        const v = document.querySelector("#g1-hero-video");
        return !v.paused && !v.seeking && v.currentTime < 1;
      });
      check(true, "Video looping preserves playback and remains pausable");
      await page.keyboard.press("Space");
      await waitForPlayback(heroVideo, true);
      check(true, "Native keyboard pause still works after a loop");
      for (const id of expectedVideoIds) {
        const video = page.locator("#" + id);
        const sourceFile = (await video.locator("source").getAttribute("src"))
          .split("/")
          .pop();
        const expectedClip =
          id === "g1-hero-video" ? site.robotHero : clipByFile.get(sourceFile);
        const expectedDuration = expectedClip?.duration;
        check(
          Number.isFinite(expectedDuration) &&
            Number(await video.getAttribute("data-duration")) ===
              expectedDuration,
          id + ": the selected duration matches the reviewed media manifest",
        );
        await video.evaluate((v) => {
          if (v.readyState === 0) {
            v.preload = "metadata";
            v.load();
          }
          v.textTracks[0].mode = "hidden";
        });
        await page.waitForFunction((videoId) => {
          const v = document.getElementById(videoId);
          return (
            Number.isFinite(v.duration) && v.textTracks[0]?.cues?.length > 0
          );
        }, id);
        check(
          await video.evaluate(
            (v, expected) =>
              Math.abs(v.duration - expected) < 0.15 &&
              v.textTracks[0].kind === "descriptions",
            expectedDuration,
          ),
          id +
            ": selected excerpt duration and timed description load correctly",
        );
        check(
          await video.evaluate((v) => {
            const ids = v.getAttribute("aria-describedby")?.split(/\s+/) || [];
            const descriptions = ids.map((descriptionId) =>
              document.getElementById(descriptionId),
            );
            return (
              descriptions.length > 0 &&
              descriptions.every(Boolean) &&
              descriptions
                .map((description) => description.textContent.trim())
                .join(" ").length > 100
            );
          }),
          id + ": a complete text alternative is programmatically associated",
        );
        check(
          await video.evaluate((v) => {
            const cues = [...v.textTracks[0].cues];
            return cues.every(
              (cue) =>
                cue.startTime >= 0 &&
                cue.endTime > cue.startTime &&
                cue.endTime <= v.duration + 0.2 &&
                cue.text.trim().length > 0,
            );
          }),
          id + ": description cues use valid times within the clip",
        );
        for (const [kind, url] of Object.entries(
          await video.evaluate((v) => ({
            video: v.querySelector("source")?.src,
            poster: v.poster,
            description: v.querySelector('track[kind="descriptions"]')?.src,
          })),
        )) {
          check(
            Boolean(url) && url.startsWith(base + "/media/"),
            id + ": local " + kind + " asset is declared",
          );
          if (url) {
            const assetResponse = await context.request.get(
              url,
              kind === "video" ? { headers: { Range: "bytes=0-1" } } : {},
            );
            check(
              assetResponse.ok(),
              id + ": " + kind + " asset responds successfully",
            );
          }
        }
      }
      check(
        Math.abs(
          (await page.locator("#g1-hero-video").evaluate((v) => v.duration)) -
            7,
        ) < 0.15,
        "The title G1 excerpt preserves the requested first seven seconds",
      );
      check(
        JSON.stringify(
          await page
            .locator(
              ".visual-home > section > h2, .visual-home > section > .section-heading > h2",
            )
            .allTextContents(),
        ) === JSON.stringify(["Abstract", "Method", "Results", "Citation"]),
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
      for (const description of await page
        .locator("details.clip-description")
        .all()) {
        const summary = description.locator(":scope > summary");
        await summary.focus();
        await page.keyboard.press("Enter");
        check(
          (await description.evaluate((el) => el.open)) &&
            (await description.innerText()).length > 150,
          "Keyboard opens a complete clip description",
        );
      }
      await scan("Expanded clip descriptions desktop");
      for (const description of await page
        .locator("details.clip-description")
        .all()) {
        await description.locator(":scope > summary").focus();
        await page.keyboard.press("Space");
        check(
          !(await description.evaluate((el) => el.open)),
          "Keyboard closes the clip description",
        );
      }
      check(
        (await page.locator("details.clip-description").count()) >= 4,
        "Every section excerpt offers an expandable complete visual description",
      );
    }
    if (route === "/paper/" || route === "/results/") {
      check(
        (
          await page.locator('meta[name="robots"]').getAttribute("content")
        )?.includes("noindex"),
        route + ": retired page is excluded from indexing",
      );
      check(
        (await page
          .locator(
            'main a[href="' +
              base.replace(/^https?:\/\/[^/]+/, "") +
              (route === "/paper/" ? "/#method" : "/#results") +
              '"]',
          )
          .count()) > 0,
        route +
          ": existing bookmarks have a clear route back to the research page",
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
    await p.locator("#g1-bending-video").scrollIntoViewIfNeeded();
    await p.waitForTimeout(200);
    check(await paused(p), preference + ": scrolling does not start media");
    await atTop(p);
    const video = p.locator("#g1-hero-video");
    await tabToVideo(p, video);
    await p.keyboard.press("Space");
    await waitForPlayback(video, false);
    await p.waitForTimeout(200);
    check(
      await video.evaluate((v) => !v.paused),
      preference + ": explicit native keyboard playback remains available",
    );
    await p.keyboard.press("Space");
    await waitForPlayback(video, true);
    check(
      await paused(p),
      preference + ": native keyboard pause remains available",
    );
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
    (await n.locator("video[controls]").count()) === expectedVideoIds.length &&
      (await paused(n)),
    "No-JavaScript media retains native controls without automatic motion",
  );
  check(
    (await n.locator("#media-toggle").count()) === 0 &&
      (await n.locator("#copy-citation").isHidden()),
    "No global playback button; unavailable citation control stays hidden without JavaScript",
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
    const bufferingVideo = buffering.locator("#g1-hero-video");
    await tabToVideo(buffering, bufferingVideo);
    await buffering.keyboard.press("Space");
    await waitForPlayback(bufferingVideo, true);
    check(
      true,
      "Native keyboard pause interrupts pending autoplay while media is buffering",
    );
    release();
    await Promise.allSettled([...routes]);
    await buffering.waitForTimeout(300);
    check(
      await bufferingVideo.evaluate((v) => v.paused),
      "Releasing buffered media does not undo the native user pause",
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
