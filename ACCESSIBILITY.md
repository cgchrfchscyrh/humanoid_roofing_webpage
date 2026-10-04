# Accessibility review — 4 October 2026

The design target is WCAG 2.1 Level A and AA. This record describes technical checks and their limits; it is not an ADA/WCAG certification or institutional brand approval.

## Design and content

- English document language; one H1 per page; sequential heading levels; skip-to-main link; visible keyboard focus; descriptive links and native controls.
- Charcoal, off-white and gray interface, neutral favicon, no UF logo or UF blue/orange theme. Author affiliation remains as text. Every page, including the error page, includes the non-official UF disclaimer.
- Original figures have meaningful alt text, numbered captions, sources, and longer explanations. Reported numerical comparisons have text labels and structured tables rather than color-only encoding. Scientific artwork retains its original colors.
- Tables 2, 3, 4 and 6 preserve the supplied manuscript values, units, sample counts, uncertainty and experimental context. CSV files mirror the HTML tables. Wide tables have focusable, labeled scroll regions and explicit row/column headers.
- The nine-second context video contains only a video stream: no audio, autoplay or loop. A full visual description and synchronized VTT description track accompany it. Native controls, a keyboard play/pause/replay button and a no-JavaScript fallback are provided. The paper’s own physical experiments are represented by original photographs, as requested by the author.
- The guide is a selected-content HTML companion, not a complete paper conversion. Versioned arXiv PDF and experimental HTML links are provided. The supplied 49-page PDF is **untagged**; neither external PDF reading order nor equations nor assistive-technology behavior has been certified.

## Checks

`npm run test:a11y` tests five routes at desktop and mobile widths with axe-core WCAG 2.1 A/AA tags, plus skip link/focus, heading structure, unique IDs, local anchors, media keyboard controls, timed description loading, clipboard behavior, structured tables, 320/768 CSS-pixel reflow, increased text spacing, reduced-motion preferences and JavaScript-disabled access. See `reports/axe-wcag21aa.json` for the actual run and `reports/ci/` for deployment checks when available.

Visual review uses desktop and 320-pixel page renders, checks extracted figure crops against the supplied PDF, and examines the video’s sequence to verify the description. The source document remains unchanged; its SHA-256 is recorded in `reports/source-provenance.json`.

## Remaining manual limits

Axe may mark the video-caption rule for review: the adapted clip has no audio track, and the visual alternative is supplied. Scientific figure readability is supported by full-size images, descriptions and tables; automated contrast scanning does not validate every pixel inside a paper figure. Full evaluation with multiple screen readers, users with disabilities, and UF accessibility/brand reviewers has not been performed. No claim is made that the untagged external PDF is fully accessible. Contact: liusongyang@ufl.edu.

## Recorded outcome

The final local run completed **10 axe scans and 91 functional checks, with zero violations and zero errors**. The `video-caption` incomplete item was reviewed against the delivered video-only stream and its full visual alternative. Incomplete contrast items concern decorative arrows; their computed foreground/background contrast was checked separately and exceeds 4.5:1. See `reports/manual-review.json`. Desktop and narrow-screen page renders were visually inspected.
