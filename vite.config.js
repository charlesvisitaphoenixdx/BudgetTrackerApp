import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// GitHub Pages serves this repo at /BudgetTrackerApp/, not the domain root.
// Only the Pages build sets GITHUB_PAGES, so `npm run dev`/`npm run build`
// locally are unaffected and still serve from "/".
const base = process.env.GITHUB_PAGES ? "/BudgetTrackerApp/" : "/";

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "BudgetTrackerApp",
        short_name: "BudgetTracker",
        description: "Track expenses against a custom monthly budget period.",
        theme_color: "#4f46e5",
        background_color: "#f5f6f8",
        display: "standalone",
        start_url: base,
        scope: base,
        icons: [
          {
            src: "icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
    }),
  ],
});
