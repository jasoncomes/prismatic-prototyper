import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  // Relative asset paths. On Netlify this is served at
  // /rich-text-editor/, not at the root, and Vite's default absolute
  // `/assets/...` would 404 there. The other prototypes never hit this because
  // rsbuild inlines their JS and CSS into the HTML.
  base: "./",
  server: { port: 5199, open: true },
});
