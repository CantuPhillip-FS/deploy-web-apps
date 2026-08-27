import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import solidJs from "@astrojs/solid-js";
import vercel from "@astrojs/vercel";

export default defineConfig({
  site: "https://phillipcantu.com",
  trailingSlash: "ignore",
  integrations: [solidJs(), mdx(), sitemap()],
  adapter: vercel(),
  markdown: {
    shikiConfig: {
      theme: "github-light",
    },
  },
});
