// @ts-check

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import { VitePWA } from "vite-plugin-pwa";

// https://astro.build/config
export default defineConfig({
  site: "https://github-achievements-cs6.pages.dev",
  integrations: [react(), sitemap()],
  i18n: {
    defaultLocale: "en",
    locales: ["en", "es"],
    routing: {
      prefixDefaultLocale: true,
    },
  },
  vite: {
    plugins: [
      tailwindcss(),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["**/*"],
        base: "/",
      }),
    ],
  },
});
