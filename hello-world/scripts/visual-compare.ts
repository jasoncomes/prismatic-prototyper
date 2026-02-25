import { chromium } from "playwright";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";
import * as fs from "fs";
import * as path from "path";
import { parseArgs } from "util";

const SCREENSHOTS_DIR = path.join(process.cwd(), "screenshots");
const REFERENCE_PATH = path.join(SCREENSHOTS_DIR, "reference.png");
const CURRENT_PATH = path.join(SCREENSHOTS_DIR, "current.png");
const DIFF_PATH = path.join(SCREENSHOTS_DIR, "diff.png");
const CONFIG_PATH = path.join(SCREENSHOTS_DIR, "config.json");

// Default configuration
const DEFAULT_CONFIG = {
  url: "http://localhost:3000",
  selector: "", // Empty means full viewport
  viewport: { width: 1280, height: 900 },
  threshold: 0.1, // Pixel matching threshold (0-1, lower = stricter)
};

interface Config {
  url: string;
  selector: string;
  viewport: { width: number; height: number };
  threshold: number;
}

function loadConfig(): Config {
  if (fs.existsSync(CONFIG_PATH)) {
    try {
      const configData = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
      return { ...DEFAULT_CONFIG, ...configData };
    } catch (e) {
      console.warn("Warning: Could not parse config.json, using defaults");
    }
  }
  return DEFAULT_CONFIG;
}

function saveConfig(config: Partial<Config>): void {
  const currentConfig = loadConfig();
  const newConfig = { ...currentConfig, ...config };
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(newConfig, null, 2));
  console.log(`Config saved to: ${CONFIG_PATH}`);
}

async function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function captureScreenshot(outputPath: string, config: Config): Promise<void> {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize(config.viewport);

  console.log(`Navigating to ${config.url}...`);
  await page.goto(config.url);
  await page.waitForLoadState("networkidle");

  if (config.selector) {
    // Scroll element into view
    await page.evaluate((sel) => {
      const element = document.querySelector(sel);
      if (element) {
        element.scrollIntoView({ behavior: "instant", block: "center" });
      }
    }, config.selector);

    // Wait for any animations
    await page.waitForTimeout(500);

    // Capture the specific element
    const element = await page.$(config.selector);
    if (element) {
      await element.screenshot({ path: outputPath });
      console.log(`Screenshot saved to: ${outputPath}`);
      console.log(`Selector: ${config.selector}`);
    } else {
      console.warn(`Warning: Selector "${config.selector}" not found, capturing viewport`);
      await page.screenshot({ path: outputPath, fullPage: false });
      console.log(`Viewport screenshot saved to: ${outputPath}`);
    }
  } else {
    // No selector - capture viewport
    await page.waitForTimeout(500);
    await page.screenshot({ path: outputPath, fullPage: false });
    console.log(`Viewport screenshot saved to: ${outputPath}`);
  }

  await browser.close();
}

function compareImages(): {
  diffPixels: number;
  totalPixels: number;
  matchPercentage: number;
} {
  if (!fs.existsSync(REFERENCE_PATH)) {
    throw new Error(
      `Reference image not found at ${REFERENCE_PATH}. Copy your design mockup to this location.`
    );
  }
  if (!fs.existsSync(CURRENT_PATH)) {
    throw new Error(
      `Current image not found at ${CURRENT_PATH}. Run with --capture first.`
    );
  }

  const config = loadConfig();
  const reference = PNG.sync.read(fs.readFileSync(REFERENCE_PATH));
  const current = PNG.sync.read(fs.readFileSync(CURRENT_PATH));

  // Handle size differences
  const width = Math.max(reference.width, current.width);
  const height = Math.max(reference.height, current.height);

  // Create normalized images if sizes differ
  const normalizedRef = new PNG({ width, height });
  const normalizedCur = new PNG({ width, height });

  // Fill with white background
  normalizedRef.data.fill(255);
  normalizedCur.data.fill(255);

  // Copy original data
  PNG.bitblt(reference, normalizedRef, 0, 0, reference.width, reference.height, 0, 0);
  PNG.bitblt(current, normalizedCur, 0, 0, current.width, current.height, 0, 0);

  const diff = new PNG({ width, height });

  const diffPixels = pixelmatch(
    normalizedRef.data,
    normalizedCur.data,
    diff.data,
    width,
    height,
    { threshold: config.threshold }
  );

  fs.writeFileSync(DIFF_PATH, PNG.sync.write(diff));

  const totalPixels = width * height;
  const matchPercentage = ((totalPixels - diffPixels) / totalPixels) * 100;

  return { diffPixels, totalPixels, matchPercentage };
}

const cliOptions = {
  selector: { type: "string" },
  url: { type: "string" },
  viewport: { type: "string" },
  capture: { type: "boolean" },
  compare: { type: "boolean" },
  config: { type: "boolean" },
} as const;

async function main() {
  await ensureDir(SCREENSHOTS_DIR);

  // When using `pnpm visual -- --flag`, pnpm passes '--' to the script.
  // parseArgs treats '--' as end-of-options, so we strip it if it's first.
  const args = process.argv.slice(2);
  if (args[0] === "--") args.shift();

  const { values } = parseArgs({
    args,
    options: cliOptions,
    allowPositionals: true,
  });

  // Update config if arguments provided
  const hasConfigUpdate = values.selector || values.url || values.viewport;
  if (hasConfigUpdate) {
    const configUpdate: Partial<Config> = {};
    if (values.selector) configUpdate.selector = values.selector;
    if (values.url) configUpdate.url = values.url;
    if (values.viewport) {
      const [w, h] = values.viewport.split("x").map(Number);
      if (w && h) configUpdate.viewport = { width: w, height: h };
    }
    saveConfig(configUpdate);
  }

  const config = loadConfig();

  // If only config was updated (no action flags), show config and exit
  const hasActionFlag = values.capture || values.compare || values.config;
  if (hasConfigUpdate && !hasActionFlag) {
    console.log("\nCurrent configuration:");
    console.log(JSON.stringify(config, null, 2));
    console.log("\nRun 'pnpm visual:compare' to compare against reference.");
    return;
  }

  if (values.capture) {
    console.log("Capturing current screenshot...");
    await captureScreenshot(CURRENT_PATH, config);
    return;
  }

  if (values.compare) {
    console.log("Capturing current screenshot...");
    console.log(`Config: ${JSON.stringify({ url: config.url, selector: config.selector, viewport: config.viewport })}`);
    await captureScreenshot(CURRENT_PATH, config);

    console.log("\nComparing images...");
    const result = compareImages();

    const divider = "=".repeat(50);
    console.log(`
      ${divider}
      VISUAL COMPARISON RESULTS
      ${divider}
      Match: ${result.matchPercentage.toFixed(2)}%
      Diff pixels: ${result.diffPixels.toLocaleString()} / ${result.totalPixels.toLocaleString()}
      Diff image: ${DIFF_PATH}
      ${divider}
    `);

    if (result.matchPercentage >= 92) {
      console.log("\n✅ GREAT! Visual match is 92% or higher.");
    } else if (result.matchPercentage >= 85) {
      console.log("\n⚠️  CLOSE! Visual match is between 85-92%. Minor adjustments needed.");
    } else {
      console.log("\n❌ NEEDS WORK. Visual match is below 85%.");
    }

    // Write report for Claude to read
    const report = {
      matchPercentage: result.matchPercentage,
      diffPixels: result.diffPixels,
      totalPixels: result.totalPixels,
      config: {
        url: config.url,
        selector: config.selector,
        viewport: config.viewport,
      },
      paths: {
        reference: REFERENCE_PATH,
        current: CURRENT_PATH,
        diff: DIFF_PATH,
      },
      status: result.matchPercentage >= 92 ? "success" : result.matchPercentage >= 85 ? "close" : "needs_work",
    };
    fs.writeFileSync(
      path.join(SCREENSHOTS_DIR, "report.json"),
      JSON.stringify(report, null, 2)
    );
    console.log(`\nReport saved to: ${path.join(SCREENSHOTS_DIR, "report.json")}`);
    return;
  }

  if (values.config) {
    console.log("Current configuration:");
    console.log(JSON.stringify(config, null, 2));
    return;
  }

  // Default: show help
  console.log(`
Visual Comparison Tool
======================

Usage:
  pnpm visual -- --selector ".my-element" --viewport "1182x1289"
    Set selector and viewport from Agentation feedback

  pnpm visual:compare --compare
    Capture current state and compare to reference

  pnpm visual:compare --capture
    Just capture current screenshot without comparing

  pnpm visual:compare --config
    Show current configuration

Options:
  --selector <css>    CSS selector for element to capture (from Agentation)
  --url <url>         URL to navigate to (default: http://localhost:3000)
  --viewport <WxH>    Viewport size, e.g. "1182x1289" (from Agentation)

Screenshots are saved to: ${SCREENSHOTS_DIR}/
  - reference.png: Copy your design mockup here (required)
  - config.json: Current capture configuration
  - current.png: Current implementation (captured automatically)
  - diff.png: Visual diff (red = differences)

Example:
  1. Copy your design mockup to ${SCREENSHOTS_DIR}/reference.png
  2. pnpm visual -- --selector ".my-element" --viewport "1280x900"
`);
}

main().catch(console.error);
