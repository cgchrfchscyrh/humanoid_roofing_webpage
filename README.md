# Humanoid roofing — research webpage

Academic project page for **Learning Slope-Adaptive Whole-Body Locomotion for Humanoid Robots in Roofing Construction**, by Songyang Liu and Shuai Li. Content follows the supplied `roofing.pdf`, arXiv:2609.20558v1 (17 September 2026), not a claimed journal publication.

- Website: <https://cgchrfchscyrh.github.io/humanoid_roofing_webpage/>
- Preprint record: <https://arxiv.org/abs/2609.20558v1>
- Full-text HTML (arXiv experimental rendering): <https://arxiv.org/html/2609.20558v1>
- Source template: [Roman Hauksson’s Academic Project Astro Template](https://github.com/RomanHauksson/academic-project-astro-template)

## Content

The homepage follows a research narrative: problem, related work, research gap, method, experimental setup, results, and conclusions with limitations. On larger screens, the title appears over a pair of research-team videos: roofing fieldwork and a 7-second physical-G1 excerpt. The “Show full video frames” control moves the title above the uncropped frames. Narrow screens use this unobscured layout automatically; phones stack the videos vertically. All media starts paused.

The experimental section includes 16.6 seconds of original-speed G1 highlights from three separate recordings: incline walking, stepping and bending with a tool, and bending toward the roof surface. Labels identify the clips and cuts; the operator and safety tether remain visible. Each selected motion excerpt ends before the later loss of balance, fall, or gantry-assisted reset. The clips illustrate the motions and supervised laboratory setup, not uninterrupted autonomous completion or successful tool impacts. The quantitative trials are reported separately in Table 6.

The research guide summarizes the method and evaluation scope. The results page contains nine original figures with text alternatives and four transcribed tables (Tables 2, 3, 4 and 6), with matching CSV downloads. The original manuscript is unchanged and is not duplicated in this repository. This repository contains the website, not the robot training implementation.

Paper-specific content is in `src/data/site.json`; the concise homepage narrative and checked related-work references are in `src/data/narrative.json`. Images, timed media descriptions, table data, and the citation are in `public/`. Changes to table values must also update the matching CSV. Original scientific figure colors are preserved; the interface is charcoal, gray, and off-white. Every page carries the UF non-endorsement disclaimer. See [ACCESSIBILITY.md](ACCESSIBILITY.md) and [SECURITY.md](SECURITY.md).

## Development and checks

Use Node.js 24 or newer.

```sh
npm ci
npm run dev
```

Production checks, with the actual GitHub Pages path:

```sh
npm run lint
npm run audit:security
SITE_URL=https://cgchrfchscyrh.github.io BASE_PATH=/humanoid_roofing_webpage npm run build
npx playwright install chromium
BASE_PATH=/humanoid_roofing_webpage npm run preview -- --host 127.0.0.1 --port 4332
TEST_URL=http://127.0.0.1:4332/humanoid_roofing_webpage npm run test:a11y
```

If the preview chooses another port, use its printed address for `TEST_URL`. On a workstation with Chrome installed, `CHROME_PATH=/usr/bin/google-chrome` can be passed to the accessibility check.

For the 11 October 2026 revision, verify all three players, their timed/full descriptions, keyboard playback, the desktop title/full-frame toggle, mobile title placement, 320 CSS-pixel reflow, increased text spacing, and no-JavaScript access before publication. Record the new run and remaining manual limits; the earlier one-video checks do not verify the revised page.

## Publishing updates

Push changes to `main`. The GitHub Actions workflow audits dependencies, lints, type-checks, builds using the repository base path, and runs the accessibility checks before deploying the static `dist/` artifact to GitHub Pages. Failed checks block deployment. Check the Actions run and then verify the live pages and assets. See `reports/` for recorded checks; automated checks are not an ADA/WCAG certification or UF institutional approval.

## Media attribution

All three delivered MP4 files are silent, play at the original speed, and have complete text alternatives plus timed WebVTT visual descriptions. Native controls and downloads work without JavaScript; JavaScript adds paired title playback, the desktop full-frame toggle, and a highlights play/pause/replay button. No player autoplays or loops.

- `roofing-fieldwork.mp4`: the complete approximately 36-second field recording supplied by the team as `IMG_7082 (1).MOV`. Its browser copy is resized, converted from phone HDR to SDR H.264, and stripped of audio and source capture metadata.
- `g1-roofing-hero.mp4`: a 7-second excerpt from `bending_real_test_20260905_185804_260763_nailgun.mp4`, source time 00:55–01:02. The complete source frame is retained in the media file; the desktop title-background presentation crops it until the full-frame view is selected.
- `g1-roofing-highlights.mp4`: a 16.6-second montage comprising `roofer_real_upwalk.MOV` at 00:01.80–00:05.60, the same 7-second nailgun-recording excerpt, and `hammer.mp4` at 00:09–00:14.80. Each complete source frame fits below a separate top text-label band; portrait footage has side bars. Hard cuts separate recordings, without speed changes.

Source videos remain unchanged. The physical recordings came from the author’s `/home/liusongyang/Videos/roofing` folder. Video filenames are source identifiers, not claims of successful nailing or hammer impact. `reports/media-review.json` records the field conversion; `reports/media-revision.json` records the G1 sources, intervals, transformations, descriptions, and hashes. `reports/narrative-review.json` records manuscript-based content verification. These media and narrative records do not substitute for the current browser and accessibility checks.
