# Security review — 18 October 2026

Only static `dist/` files are deployed to GitHub Pages. Node.js and Astro run during the build, not as a public application server. The website has no accounts, forms, analytics, embedded third-party players, remote-image transformations, or authenticated shared caches. Media and fonts are hosted locally.

## Dependencies

The dependency audit on 18 October 2026 reports **zero vulnerabilities**. The unused `@eslint/markdown` checker was removed together with its transitive KaTeX dependency after [GHSA-238p-pmpm-9mq7](https://github.com/advisories/GHSA-238p-pmpm-9mq7) was reported. The site has no Markdown or MDX source pages; JavaScript, TypeScript, Astro, CSS, and JSON linting remain enabled. The previously affected transitive package `http-cache-semantics` remains at **4.3.0**. The current audit script has **no advisory exceptions**: any reported vulnerability or audit failure blocks the workflow. The raw results are retained in `reports/security-audit.json`, with a dated summary in `reports/security-review.json`. This is a point-in-time dependency check, not a guarantee against future vulnerabilities.

## Browser and hosting controls

Every generated page receives a restrictive hash-based Content Security Policy in an HTML meta element: same-origin resources, no objects, no forms, and hashes for generated inline scripts. Referrer policy is `strict-origin-when-cross-origin`. External links open in the same tab.

GitHub Pages controls response headers. HTML cannot configure HTTP-only directives or impose HSTS, X-Frame-Options, or X-Content-Type-Options. Verify HTTPS enforcement, actual response headers, canonical links, base paths, assets, and media range requests after deployment and record the observations in `reports/live-deployment.json`. Do not describe absent headers as configured.

## Verified production response

The 18 October 2026 live check verified five pages and 31 local resources, including source hashes for public assets. HTTPS is enforced and the response includes `Strict-Transport-Security: max-age=31556952`. Generated pages carry the intended HTML CSP; all three MP4 byte-range requests return 206 Partial Content. No HTTP `X-Frame-Options`, `X-Content-Type-Options`, or CSP response header was observed; those GitHub Pages limitations remain recorded, not configured by this site. The error-page route also retains its CSP, with no institutional disclaimer. The build, zero-vulnerability dependency audit, and accessibility deployment gates passed for commit `0cf632dff76eee62478f6c0b5aecabdf0a60c2a7`.
