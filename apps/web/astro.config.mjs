import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  server: { port: 3000, host: true },
  preview: { port: 3000, host: true },
  vite: {
    // Tailwind v4 (CSS-first, no preflight — see src/styles/tailwind.css).
    plugins: [tailwindcss()],
    server: {
      // Preview gateway proxies the dev/preview server through rotating hosts
      // (e.g. *.space-z.ai, ws-*.fcapp.run). Allow all — this sandbox is
      // only reachable through the gateway; no public exposure.
      allowedHosts: true,
      watch: {
        ignored: [
          "**/agent-context/**",
          "**/rea-agent/**",
          "**/skills/**",
          "**/tool-results/**",
          "**/download/**",
          "**/upload/**",
          "**/dist/**",
          "**/.astro/**",
        ],
      },
    },
    preview: {
      // `astro preview` serves dist/ through vite preview — same gateway hosts.
      allowedHosts: true,
    },
  },
  devToolbar: { enabled: false },
});
