import { defineConfig } from "vite";

// served from a subpath on the prototypes site (/orby/), so every asset URL is relative
export default defineConfig({
  base: "./",
});
