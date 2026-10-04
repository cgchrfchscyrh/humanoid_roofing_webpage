import { defineConfig } from "astro/config";

// The Pages workflow provides the site origin and repository base path.
export default defineConfig({
  output: "static",
  site: process.env.SITE_URL || undefined,
  base: process.env.BASE_PATH || "/",
});
