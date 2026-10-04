# Security review — 4 October 2026

Only static `dist/` files are deployed to GitHub Pages. Node.js and Astro run during the build, not as a public application server. The website has no accounts, forms, analytics, embedded third-party players, remote-image transformations, or authenticated shared caches. Media and fonts are hosted locally.

## Dependencies

The dependency audit on 4 October 2026 reports **zero vulnerabilities**. The previously affected transitive package `http-cache-semantics` was updated to **4.3.0**, resolving the finding affecting 4.2.0. The current audit script has **no advisory exceptions**: any reported vulnerability or audit failure blocks the workflow. The raw results are retained in `reports/security-audit.json`, with a dated summary in `reports/security-review.json`. This is a point-in-time dependency check, not a guarantee against future vulnerabilities.

## Browser and hosting controls

Every generated page receives a restrictive hash-based Content Security Policy in an HTML meta element: same-origin resources, no objects, no forms, and hashes for generated inline scripts. Referrer policy is `strict-origin-when-cross-origin`. External links open in the same tab.

GitHub Pages controls response headers. HTML cannot configure HTTP-only directives or impose HSTS, X-Frame-Options, or X-Content-Type-Options. Verify HTTPS enforcement, actual response headers, canonical links, base paths, assets, and media range requests after deployment and record the observations in `reports/live-deployment.json`. Do not describe absent headers as configured.
