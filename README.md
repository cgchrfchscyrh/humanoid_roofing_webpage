# Humanoid roofing — research webpage

Academic project page for **Learning Slope-Adaptive Whole-Body Locomotion for Humanoid Robots in Roofing Construction**, by Songyang Liu and Shuai Li. Content follows the supplied `roofing.pdf`, arXiv:2609.20558v1 (17 September 2026), not a claimed journal publication.

- Website: <https://cgchrfchscyrh.github.io/humanoid_roofing_webpage/>
- Preprint record: <https://arxiv.org/abs/2609.20558v1>
- Full-text HTML (arXiv experimental rendering): <https://arxiv.org/html/2609.20558v1>
- Source template: [Roman Hauksson’s Academic Project Astro Template](https://github.com/RomanHauksson/academic-project-astro-template)

## Content

The overview pairs an attributed roofing-context video with real-robot photographs from the paper. The author requested paper photographs for this version; no unrelated robot footage is presented as a research demonstration. The research guide summarizes the method and evaluation scope. The results page contains nine original figures with text alternatives and four transcribed tables (Tables 2, 3, 4 and 6), with matching CSV downloads. The original manuscript is unchanged and is not duplicated in this repository. This repository contains the website, not the robot training implementation.

Paper-specific content is in `src/data/site.json`. Images, media descriptions, table data, and the citation are in `public/`. Changes to table values must also update the matching CSV. Original scientific figure colors are preserved; the interface is charcoal, gray, and off-white. Every page carries the UF non-endorsement disclaimer. See [ACCESSIBILITY.md](ACCESSIBILITY.md) and [SECURITY.md](SECURITY.md).

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

## Publishing updates

Push changes to `main`. The GitHub Actions workflow audits dependencies, lints, type-checks, builds using the repository base path, and runs the accessibility checks before deploying the static `dist/` artifact to GitHub Pages. Failed checks block deployment. Check the Actions run and then verify the live pages and assets. See `reports/` for recorded checks; automated checks are not an ADA/WCAG certification or UF institutional approval.

## Media attribution

The nine-second silent context clip is adapted from [Jorge Serrano’s “A Hard Working Man” on Pexels](https://www.pexels.com/video/a-hard-working-man-2675565/) under the [Pexels License](https://www.pexels.com/license/). It is independent contextual footage, not an author experiment. The site supplies a complete visual description and timed description track. Rights in research figures and third-party media remain with their respective holders; source credits do not imply endorsement.
