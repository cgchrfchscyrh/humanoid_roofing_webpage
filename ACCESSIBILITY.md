# Accessibility review — 11 October 2026 revision

The design target is WCAG 2.1 Level A and AA. This record describes the design, verification workflow, and remaining limits; it is not an ADA/WCAG certification or institutional brand approval. The revised three-video layout passed the local production-preview checks on 11 October 2026: **11 axe scans, 121 functional checks, zero recorded violations or errors**. The deployment checks passed the same counts; live verification is recorded separately below.

## Design and content

- English document language; one H1 per page; sequential heading levels; skip-to-main link; visible keyboard focus; descriptive links and native controls.
- Charcoal, off-white and gray interface, neutral favicon, no UF logo or UF blue/orange theme. Author affiliation remains as text. Every page, including the error page, retains the non-official UF disclaimer.
- The homepage follows problem, related work, research gap, method, experimental setup, results, and conclusions with limitations. References and headline values are checked against the unchanged arXiv:2609.20558v1 manuscript; see `reports/narrative-review.json`.
- Original figures have meaningful alt text, numbered captions, sources, and longer explanations. Reported numerical comparisons have text labels and structured tables rather than color-only encoding. Scientific artwork retains its original colors.
- Tables 2, 3, 4 and 6 preserve the supplied manuscript values, units, sample counts, uncertainty and experimental context. CSV files mirror the HTML tables. Wide tables have focusable, labeled scroll regions and explicit row/column headers.
- The guide is a selected-content HTML companion, not a complete paper conversion. Versioned arXiv PDF and experimental HTML links are provided. The supplied 49-page PDF is **untagged**; neither external PDF reading order nor equations nor assistive-technology behavior has been certified.

## Video presentation and alternatives

The homepage has three local MP4 players: the complete approximately 36-second team-recorded field video, a 12-second G1 title excerpt, and a 33.034-second montage of three G1 experiment excerpts. All viewing copies have no audio stream and preserve the original playback speed. None autoplays or loops. Each has a descriptive accessible name, full visual alternative, timed WebVTT description track, native player controls, and download links. Timed visual descriptions are not a replacement for checked speech captions if audio is introduced later.

On larger screens, the field and laboratory videos sit side by side behind the title with a dark overlay. The keyboard-operable “Show full video frames” button moves the title above the videos and presents both uncropped frames without an overlay; its pressed state and label communicate the selected view. Narrow screens place the title above the full frames automatically, and phone widths stack the videos. Native fullscreen and media downloads provide additional full-frame access. With JavaScript enabled, separate buttons provide paired title play/pause/replay and highlights play/pause/replay. Without JavaScript, the native controls, downloads, text alternatives, and core research content remain available; the paired-playback and title-view buttons are enhancements.

The highlights show three independent recordings with visible labels and hard cuts: incline walking; stepping and bending with a tool; and bending/crouching. The complete source image fits below a separate top text-label band, with side bars around the portrait clip. The label stays clear of the native player controls. The operator, safety tether, and gantry-assisted resets remain visible. Text alternatives describe the transitions and assistance. These selected clips illustrate supervised laboratory motion; they do not establish uninterrupted autonomous completion, successful nailing, or hammer impact. Table 6 reports quantitative trials separately.

The field video’s unchanged full sequence comes from `IMG_7082 (1).MOV`. The G1 sources are the author-supplied recordings in the roofing video folder. `reports/media-review.json` records the field-video conversion, and `reports/media-revision.json` records the G1 excerpt intervals, transformations, source hashes, visual descriptions, and delivered streams. Source recordings are not modified. Full descriptions and attribution appear on the homepage and the accessibility page.

## Verification workflow for this revision

Run `npm run test:a11y` against the production preview and retain the actual report in `reports/axe-wcag21aa.json`. The deployment workflow must also pass its checks before publication. Verify five routes with axe-core WCAG 2.1 A/AA tags, plus keyboard navigation, skip-link focus, heading structure, unique IDs, local anchors, all three media players and description tracks, clipboard behavior, structured tables, 320/768 CSS-pixel reflow, increased text spacing, reduced-motion preferences, and JavaScript-disabled access.

Manually inspect the desktop title overlay and both full-frame videos, native control visibility, narrow-screen title placement and stacking, and the complete montage. Check description timing against the delivered files and confirm that the silent copies have no audio stream. Test the paired play/pause/replay behavior and focus after changing views. Contrast checks must cover title text over the lightest video imagery as well as button and focus states. The source document remains unchanged; its SHA-256 is recorded in `reports/source-provenance.json` and `reports/narrative-review.json`.

After deployment, verify the actual live revision, HTTPS, repository base paths, posters, MP4s, WebVTT files, descriptions, download links, pause/replay behavior, and security response headers. Record observed results and provider-controlled limitations. Do not treat a previous deployment report as verification of this revision.

## Current local results — 11 October 2026

The production preview passed 11 axe WCAG 2.1 A/AA scans and 121 functional checks, including the title full-frame mode and all three video controls. Browser errors were empty. Four regression checks hold MP4 requests pending and verify that keyboard pause immediately cancels buffered playback for both the title pair and body highlights, clears the busy state, and produces no false playback error. Desktop, narrow-screen, section layouts, and 1100-pixel increased text spacing were visually reviewed. At the latter size, the title actions remain more than 75 pixels above the native controls and the page has no horizontal overflow.

Axe requested manual review of 20 title/arrow contrast nodes and three video-caption items. Computed title contrast uses the darkest-overlay composite over an entirely white video frame as the worst case; the minimum ratio across the reviewed nodes was 6.89:1. All three delivered MP4s have zero audio streams, with full and timed visual descriptions. Details and review limitations are recorded in `reports/manual-review.json` and `reports/media-revision.json`.

## Deployment and live verification — 11 October 2026

GitHub Actions run [38167971851](https://github.com/cgchrfchscyrh/humanoid_roofing_webpage/actions/runs/38167971851) successfully deployed commit `31105896d6b8e4dafdf5e7474e1b2a50a9f4d334`. Its independent CI report contains 11 axe scans and 121 functional checks, with zero recorded violations or errors (`reports/ci/axe-wcag21aa.json`).

The live resource check verified five routes, 36 resources, and 40 internal fragment links. All public asset hashes matched local files, including the three MP4s, posters, and description tracks. All three media range requests returned 206; HTTPS is enforced. Observed security response headers and hosting limitations are recorded in `reports/live-deployment.json` and `SECURITY.md`. The custom missing-page response retains the disclaimer and access to the main site. Live Chrome verification also confirmed initially paused media, keyboard play/pause for both groups, full-frame toggling, the 12- and 33-second G1 files, and a 320-pixel layout without horizontal overflow or browser errors (`reports/live-browser.json`).

## Remaining manual limits

Axe may flag video-caption rules for review. All delivered viewing copies are silent and have full visual alternatives; review this against each actual stream, rather than dismissing findings globally. Scientific figure readability is supported by full-size images, descriptions, and tables; automated contrast scanning does not validate every pixel inside a paper figure. Full evaluation with multiple screen readers, users with disabilities, and UF accessibility/brand reviewers has not been performed. A neutral design is not institutional brand approval. No claim is made that the untagged external PDF is fully accessible. Contact: liusongyang@ufl.edu.

## Previous-version results — 4 October 2026

The preceding page, which paired one field video with a robot photograph, passed 10 local axe scans and 91 functional checks with zero recorded violations or errors. The deployment checks passed the same counts. The caption-review item was assessed against that silent field-video stream and its full visual alternative; decorative-arrow contrast was checked separately. Desktop and narrow-screen renders were inspected.

The earlier self-recorded-video deployment was verified to use `roofing-fieldwork.mp4` with its full 35.836-second duration, team credit, initially paused playback, working play/pause controls, and no recorded browser errors. Five live pages and 30 resources were checked, with public-media hashes matching the source files. Those earlier results are retained as history; the current revision is covered by the fresh reports linked above.
