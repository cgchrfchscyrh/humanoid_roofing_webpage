# Accessibility review — 18 October 2026

## Shorter labels and compact citation — 4 November 2026

At the author's request, the page title was changed, the formal title left the opening (it remains in the citation), and the caption under paper figure 1 was removed. That figure keeps its image alternative, and its full description and source moved to the media notes. The bubbles under the videos now only name the action. Statements that no nail is fired, that footage was not used for training, and that clips end before later falls or resets remain in the media notes, not beside the videos.

## Robot clips cropped — 5 November 2026

At the author's request, laboratory clips and the robot shots in the opening film are cropped to the robot, so the operator no longer appears, and the method now comes before the robot footage. Text alternatives and timed descriptions were rewritten; they state that the operator stands just outside the frame. The safety tether stays in view. The operator's role in starting each run and controlling the emergency stop is no longer visible in the footage, and it is stated on the page only in the media notes and the paper.

## Evidence tiles and robot-first film — 5 November 2026

The opening film now starts with the robot and carries no text; the title sits below it. Text-only evidence tiles with named source links cover Florida hurricane damage and the four Ds of roofing. The homepage has a plain top bar with no section links and no footer; the accessibility and credits link and the template credit moved to one line in the citation. Sub-pages keep their footer. The labels above the clips replaced the bubbles, and statements about what the clips do not show remain in the media notes. Headings and bubbles use terms from the paper. Frame-to-frame brightness was measured as a flash screen, not a certified flash analysis.

## Simpler text and larger media — 4 November 2026

The opening paragraph and the visible text of the robot-trials and limits sections were removed at the author's request, and the remaining explanations were shortened. The robot-trials section keeps a heading for screen readers. Bubbles still state that no nail is fired and that the bending clip ends before a later loss of balance; the media notes keep the fuller descriptions. Figures and clips now use more of the screen width.

## Opening film and plainer text — 4 November 2026

The homepage now opens with one full-width silent film, using native controls, the existing viewport playback rules, a timed description track, and a complete text alternative. It replaces the two side-by-side title videos. White text sits on a dark gradient so it stays readable over bright frames. Narrow screens crop the sides of the film, which can hide the laboratory operator; the description says so, and the complete frames appear in the clips further down the page. Frame-to-frame brightness was measured for the flash criterion: no more than one large swing in any second. That is a screening check, not a certified flash analysis.

Headings and explanations were rewritten in plainer language, and short bubbles now explain the method figure and each research clip. The vision diagram was replaced with a short section on what the robot has not done. Result sentences come from Tables 2, 3, 4, and 6 of the paper. Existing PDF and screen-reader limitations still apply.

## Light vision presentation — 27 October 2026

Vision sections now share the surrounding light page background, dark type, and dark SVG linework. Evidence imagery uses a white surface; focus outlines, concept badges, and diagram relationships remain visible without relying on color.

Build, lint, dependency security audit, and the existing browser suite passed: **11 axe scans and 199 functional checks**, with no violations or failures. Desktop and 320 CSS-pixel layouts were reviewed. Original media and attachments are unchanged. Existing PDF and screen-reader limitations still apply; this is not full ADA/WCAG certification.


## Visual vision review — 27 October 2026

The project opening now uses a compact display headline while the formal paper title, author information, and citations remain intact. Each Vision section presents existing research imagery, three specific gaps paired with collaborating disciplines, and an original SVG drawing of a future system. Solid current-evidence badges and dashed “Future concept” badges distinguish demonstrated scope from proposed integration. The diagrams have concise image alternatives and a complete text equivalent; mobile layouts follow a top-to-bottom path. Original source figures remain available in keyboard-operable disclosures where applicable.

Build, lint, and security audit passed (zero reported dependency vulnerabilities). The updated browser suite passed **11 axe scans and 199 functional checks**, with zero violations or failures. Desktop views and 320 CSS-pixel layouts were inspected in the browser; all eight project headlines and vision maps fit without horizontal overflow. Native media controls, reduced-motion and data-saving preferences, manual-pause persistence, source credits, and media alternatives remain in place. See `reports/vision-review.json` and `reports/axe-wcag21aa.json`. No original attachment or research media was edited.

These checks do not constitute complete ADA/WCAG certification. PDF reading order, scientific-image legibility at every magnification, and multi-screen-reader usability still need separate review. The implementation does not claim clinical, field, or complete-system validation for future concepts.


## Current review — 27 October 2026

This revision replaces introductory topic subtitles with a title-led opening, removes visible text beneath each video, and connects a concrete research task to a larger collaborative vision. Full silent-video alternatives remain linked through `aria-describedby`, with timed WebVTT descriptions and complete descriptions/credits consolidated in the end-of-page media notes. Native controls, viewport playback, remembered manual pauses, reduced-motion and data-saving preferences remain available.

The current build and lint pass. The browser suite passed **11 axe scans and 198 functional checks**, with zero violations and errors. Desktop and 320 CSS-pixel layouts were visually reviewed after loading all figures. Dependency audit reports zero vulnerabilities. Original media and paper assets are unchanged. See `reports/story-review.json` and `reports/axe-wcag21aa.json`. This current review supersedes earlier descriptions of per-player captions or the previous section structure.

Automated checks are not complete ADA/WCAG certification. External PDF reading order, detailed scientific-artwork contrast, and multi-screen-reader usability still require separate review.


The design target is WCAG 2.1 Level A and AA. Automated tests and technical review are not complete ADA/WCAG certification. This revision simplifies the visible research narrative and introduces user-controllable silent autoplay at the author’s request.

## Content and layout

The website uses semantic English HTML, one H1 per page, short section headings, descriptive links, a skip-to-main link, and visible keyboard focus. Title and author names sit above complete video frames. Videos appear side by side on wide screens and stack on phones; title text does not cover or crop footage. A neutral charcoal/gray/white interface is used. The website omits institutional affiliation and disclaimer blocks; original research attachments are unchanged.

Images retain meaningful alt text. Native details elements expose longer figure descriptions, sources, simulation evidence, and limitations without requiring JavaScript. Numerical results use explicit labels and structured HTML tables with captions and row/column headers, plus matching CSV downloads. Scientific artwork retains original colors, while accompanying text and data convey its meaning without relying only on color. Wide tables and BibTeX have labeled keyboard-scrollable regions.

## Motion controls and media alternatives

All three MP4 assets are silent and play at their original speed. Visible videos may autoplay and loop through JavaScript, with no HTML autoplay attribute. A persistent header keyboard-operable **Pause videos / Play videos** button controls playback, including pending buffered playback. Native media controls remain available. Intersection observation pauses offscreen media; a global or individual user pause remains in effect after scrolling away and back.

Automatic playback is disabled for `prefers-reduced-motion: reduce` and the browser’s data-saving preference. The user can explicitly request playback in these modes. A later motion-preference change pauses playback again. When JavaScript is unavailable, videos stay paused until the native controls are used, and unavailable script buttons remain hidden.

Each video has an accessible name, caption, timed WebVTT visual descriptions, and a link to complete text alternatives and source attribution on the accessibility page. These are silent media alternatives, not a substitute for checked speech captions if audio is introduced later. Existing video assets and their approved motion-only edits are unchanged in this revision. The selected G1 excerpts omit subsequent falls and resets and must not be interpreted as complete successful trials. Operator and tether remain visible in the retained footage; quantitative trials are documented separately.

## Verification

The updated `npm run test:a11y` checks five routes at desktop/mobile widths with axe-core WCAG 2.1 A/AA tags, headings, unique IDs, anchors, images, keyboard focus, clipboard, tables, 320/768-pixel reflow, increased text spacing, and no-JavaScript access. It also checks actual automatic playback, a visible pause control, global and native pause persistence, offscreen pause, explicit resume, looping, reduced-motion and data-saving suppression, dynamic preference changes, description-track loading, unchanged excerpt durations, and cancelling buffered playback. The current results are recorded in `reports/axe-wcag21aa.json`; failed checks block deployment.

Desktop and 320-pixel screenshots must be inspected for frame visibility, legibility, overlap, and focus/control placement. Security audit and production build are required. Live deployment verification is separate and must record the actual deployed revision, URLs, assets, HTTPS, and observed response headers.

## Remaining limits

The 49-page source PDF is untagged. Its external reading order, equations, screen-reader behavior, and experimental arXiv HTML rendering have not been certified. The local HTML guide covers selected content and is not a full accessible conversion of the paper. Full-size figures, explanations, and data tables aid access; an automated scan does not validate every pixel in scientific artwork. Video-caption review items must be evaluated against the actual silent streams and alternatives. Multi-screen-reader testing and review with users with disabilities remain outstanding. Contact: liusongyang@ufl.edu.

## Recorded local result

The final production-preview run for this revision passed **10 axe scans and 120 functional checks**, with **zero violations and zero errors**. Lint and the production build passed; Astro reported zero errors, warnings, or hints. The dependency audit reported zero vulnerabilities. Desktop and 320-pixel screenshots were inspected, and 320-pixel page width matched the viewport. The three MP4 hashes and all reported numeric data match the pre-edit versions. See `reports/axe-wcag21aa.json`, `reports/security-review.json`, and `reports/visual-refresh-review.json`. Live deployment verification is recorded below.

## Deployed revision

[GitHub Actions run 39156586314](https://github.com/cgchrfchscyrh/humanoid_roofing_webpage/actions/runs/39156586314) successfully deployed code commit `0cf632dff76eee62478f6c0b5aecabdf0a60c2a7`. Its downloaded artifact confirms **10 axe scans and 120 functional checks**, with zero violations and errors. Post-deployment verification checked five live pages, 31 local resources, and 22 browser behaviors, with no recorded errors. HTTPS, CSP, muted automatic playback, keyboard pause/resume, pause persistence, reduced-motion suppression, timed descriptions, and 320-pixel reflow were verified. All three live MP4s match their source SHA-256 hashes and have no audio stream; durations remain 35.836, 7.000, and 16.600 seconds. See `reports/ci/axe-wcag21aa.json`, `reports/deployment.json`, `reports/live-browser.json`, and `reports/live-deployment.json`.
