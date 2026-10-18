# Humanoid roofing — research webpage

Academic project page for **Learning Slope-Adaptive Whole-Body Locomotion for Humanoid Robots in Roofing Construction**, by Songyang Liu and Shuai Li. Content follows the unchanged arXiv:2609.20558v1 preprint.

- [Website](https://cgchrfchscyrh.github.io/humanoid_roofing_webpage/)
- [Preprint](https://arxiv.org/abs/2609.20558v1)
- [Full-text HTML](https://arxiv.org/html/2609.20558v1)

## Page structure

The overview uses a title and author block above complete, paired field/G1 videos, followed by **Abstract, Experiments, Method, Results, and Citation**. Images and experimental footage carry the main explanation. Longer descriptions, simulation figures, and limitations remain available through native details elements and dedicated research-guide, results, and accessibility pages. Paper figures, four result tables, and matching CSV files are preserved. Institutional introduction and disclaimer text are omitted from the website as requested; source paper content remains unchanged.

The design uses charcoal, gray, and white. Layout pacing was informed by [Vision-Language-Kinematics](https://vision-language-kinematics.github.io/); all research content and media belong to this project. The original site foundation is [Roman Hauksson’s Academic Project Astro Template](https://github.com/RomanHauksson/academic-project-astro-template).

## Playback and media

All three delivered videos are silent and retain their original speed. JavaScript starts visible videos unless reduced motion or data saving is enabled. A persistent header **Pause videos / Play videos** control is always available while JavaScript is enabled; each player also retains native controls. Offscreen videos pause, and manually paused videos do not restart merely because the user scrolls. Explicit playback remains available under motion/data preferences. With JavaScript disabled, native controls, downloads, and descriptions remain available without autoplay.

The field recording is team-supplied. The existing G1 title excerpt and three-part highlights retain their approved edit, including the first seven seconds of the title excerpt and omission of later falls/resets. This visual revision does not change any MP4, poster, or timed-description asset. Selected excerpts illustrate laboratory movements with a safety tether and operator; they do not establish full-trial success or functional tool impacts. Quantitative measurements remain separately reported in Table 6. Recording sources and full alternatives are on the accessibility page; edit intervals and hashes remain in `reports/media-revision.json`.

## Development and verification

Use Node.js 24 or newer.

```sh
npm ci
npm run lint
npm run audit:security
SITE_URL=https://cgchrfchscyrh.github.io BASE_PATH=/humanoid_roofing_webpage npm run build
BASE_PATH=/humanoid_roofing_webpage npm run preview -- --host 127.0.0.1 --port 4512
TEST_URL=http://127.0.0.1:4512/humanoid_roofing_webpage CHROME_PATH=/usr/bin/google-chrome npm run test:a11y
```

Use the actual preview URL if the server selects a different port. CI installs Playwright Chromium and can omit `CHROME_PATH`. The check covers five routes, WCAG 2.1 A/AA axe rules, keyboard and native media controls, automatic playback, persistent pause, reduced motion, data saving, buffering cancellation, full-frame presentation, structured tables, text spacing, 320-pixel reflow, and no-JavaScript access. See [ACCESSIBILITY.md](ACCESSIBILITY.md) for remaining limits; automated results are not ADA/WCAG certification.

## Source and deployment

Paper-specific data lives in `src/data/site.json`; the extended verified research narrative lives in `src/data/narrative.json`. `public/` contains figures, media, data, and citation files. Keep matching CSV files synchronized with any future changes to reported table values. This repository contains website source, not the robot-training implementation.

Push reviewed changes to `main` to run the existing GitHub Pages workflow. Dependency audit, lint, Astro checks, build, and accessibility checks must pass before deployment. Verify the deployed revision, HTTPS, base path, local assets, and observed security headers after publishing.
