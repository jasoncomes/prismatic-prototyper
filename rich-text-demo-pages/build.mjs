import { cpSync, mkdirSync, rmSync } from "node:fs";

rmSync("dist", { recursive: true, force: true });
mkdirSync("dist", { recursive: true });
cpSync("pages", "dist", { recursive: true });
console.log("rich-text-demo-pages: copied 11 files");
