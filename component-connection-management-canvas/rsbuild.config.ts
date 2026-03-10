import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";
import path from "path";


// Conditionally import node polyfill plugin
let pluginNodePolyfill: any = null;
try {
  const module = await import("@rsbuild/plugin-node-polyfill");
  pluginNodePolyfill = module.pluginNodePolyfill;
} catch (e) {
  console.warn(
    "@rsbuild/plugin-node-polyfill not installed, skipping Node.js polyfills",
  );
}

export default defineConfig({
  plugins: [
    pluginReact(),
    ...(pluginNodePolyfill ? [pluginNodePolyfill()] : []),
  ],

  source: {
    entry: {
      index: "./src/main.tsx",
    },
  },

  output: {
    distPath: {
      root: "dist",
    },
    // Inline all JS and CSS files into HTML for single-file artifact
    inlineScripts: true,
    inlineStyles: true,
    // Disable source maps for production bundle
    sourceMap: false,
  },

  html: {
    template: "./index.html",
  },

  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "./src"),
    },
  },

  tools: {
    rspack: {
      resolve: {
        extensions: [".ts", ".tsx", ".js", ".jsx", ".mts", ".mjs"],
      },
    },
  },

  performance: {
    chunkSplit: {
      strategy: "all-in-one",
    },
  },
});
