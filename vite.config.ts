import react from "@vitejs/plugin-react";
import { readdirSync, existsSync } from "fs";
import { resolve } from "path";
import { defineConfig } from "vite";

const prototypeDirs = readdirSync(__dirname, { withFileTypes: true })
  .filter(
    (entry) =>
      entry.isDirectory() &&
      !entry.name.startsWith(".") &&
      !entry.name.startsWith("_") &&
      entry.name !== "node_modules" &&
      entry.name !== "dist" &&
      entry.name !== "primitives" &&
      existsSync(resolve(__dirname, entry.name, "index.html")),
  )
  .map((entry) => entry.name);

const input: Record<string, string> = {};
for (const dir of prototypeDirs) {
  input[dir] = resolve(__dirname, dir, "index.html");
}

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@primitives": resolve(__dirname, "primitives"),
    },
  },
  build: {
    rollupOptions: {
      input: Object.keys(input).length > 0 ? input : undefined,
    },
    outDir: "dist",
  },
});
