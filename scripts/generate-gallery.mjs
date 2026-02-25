#!/usr/bin/env node
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { execSync } from "node:child_process";

const ROOT_DIR = resolve(import.meta.dirname, "..");
const DIST_DIR = join(ROOT_DIR, "dist");

const titleCase = (str) =>
  str
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

const getGitDate = (dirName, format) => {
  try {
    const flag = format === "created" ? "--diff-filter=A --follow" : "";
    const cmd = `git log ${flag} --format=%aI -- "${dirName}" | tail -1`;
    return execSync(cmd, { cwd: ROOT_DIR, encoding: "utf-8" }).trim() || null;
  } catch {
    return null;
  }
};

const getUpdatedDate = (dirName) => {
  try {
    const cmd = `git log -1 --format=%aI -- "${dirName}"`;
    return execSync(cmd, { cwd: ROOT_DIR, encoding: "utf-8" }).trim() || null;
  } catch {
    return null;
  }
};

const prototypes = readdirSync(DIST_DIR)
  .filter((name) => {
    const full = join(DIST_DIR, name);
    return statSync(full).isDirectory();
  })
  .map((name) => {
    let meta = {};
    try {
      const pkg = JSON.parse(
        readFileSync(join(ROOT_DIR, name, "package.json"), "utf-8")
      );
      meta = pkg.prototype ?? {};
    } catch {
      // no package.json or no prototype field
    }

    return {
      name,
      title: meta.title || titleCase(name),
      description: meta.description || "No description provided.",
      tags: meta.tags ?? [],
      created: getGitDate(name, "created"),
      updated: getUpdatedDate(name),
    };
  });

const formatDate = (iso) => {
  if (!iso) return "Unknown";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Prismatic Prototypes</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #0f0f13;
      color: #e2e2e8;
      min-height: 100vh;
    }

    header {
      background: linear-gradient(135deg, #1a1033 0%, #2d1b69 100%);
      padding: 2.5rem 2rem;
      border-bottom: 1px solid rgba(139, 92, 246, 0.2);
    }

    header h1 {
      font-size: 1.75rem;
      font-weight: 700;
      color: #fff;
      margin-bottom: 0.25rem;
    }

    header p {
      color: #a5a5b8;
      font-size: 0.9rem;
    }

    .controls {
      display: flex;
      gap: 0.75rem;
      padding: 1.25rem 2rem;
      background: #16161d;
      border-bottom: 1px solid #2a2a35;
      flex-wrap: wrap;
    }

    .controls input,
    .controls select {
      background: #1e1e28;
      border: 1px solid #2a2a35;
      color: #e2e2e8;
      padding: 0.5rem 0.75rem;
      border-radius: 6px;
      font-size: 0.875rem;
      outline: none;
      transition: border-color 0.15s;
    }

    .controls input:focus,
    .controls select:focus {
      border-color: #8b5cf6;
    }

    .controls input { flex: 1; min-width: 200px; }
    .controls select { min-width: 180px; }

    .count {
      display: flex;
      align-items: center;
      margin-left: auto;
      color: #6b6b80;
      font-size: 0.8rem;
      white-space: nowrap;
    }

    main { padding: 1.5rem 2rem 3rem; }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1rem;
    }

    .card {
      background: #1a1a24;
      border: 1px solid #2a2a35;
      border-radius: 10px;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      transition: border-color 0.15s, transform 0.15s;
      text-decoration: none;
      color: inherit;
    }

    .card:hover {
      border-color: #8b5cf6;
      transform: translateY(-2px);
    }

    .card h2 {
      font-size: 1.1rem;
      font-weight: 600;
      color: #fff;
      margin-bottom: 0.5rem;
    }

    .card .desc {
      color: #a5a5b8;
      font-size: 0.85rem;
      line-height: 1.5;
      flex: 1;
      margin-bottom: 0.75rem;
    }

    .tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.375rem;
      margin-bottom: 0.75rem;
    }

    .tag {
      background: rgba(139, 92, 246, 0.15);
      color: #a78bfa;
      font-size: 0.7rem;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-weight: 500;
    }

    .dates {
      display: flex;
      gap: 1rem;
      font-size: 0.75rem;
      color: #6b6b80;
      border-top: 1px solid #2a2a35;
      padding-top: 0.75rem;
    }

    .dates span { display: flex; align-items: center; gap: 0.3rem; }

    .empty {
      text-align: center;
      padding: 4rem 2rem;
      color: #6b6b80;
    }

    .empty h2 { color: #a5a5b8; margin-bottom: 0.5rem; font-size: 1.25rem; }
  </style>
</head>
<body>
  <header>
    <h1>Prismatic Prototypes</h1>
    <p>Interactive UI prototypes and experiments</p>
  </header>

  <div class="controls">
    <input type="text" id="search" placeholder="Search prototypes..." />
    <select id="sort">
      <option value="name-asc">Name A\u2013Z</option>
      <option value="name-desc">Name Z\u2013A</option>
      <option value="updated" selected>Recently Updated</option>
      <option value="created">Recently Created</option>
    </select>
    <div class="count" id="count"></div>
  </div>

  <main>
    <div class="grid" id="grid"></div>
    <div class="empty" id="empty" style="display:none">
      <h2>No prototypes found</h2>
      <p>Nothing matches your search, or no prototypes have been built yet.</p>
    </div>
  </main>

  <script>
    const DATA = ${JSON.stringify(prototypes)};

    const grid = document.getElementById("grid");
    const empty = document.getElementById("empty");
    const search = document.getElementById("search");
    const sort = document.getElementById("sort");
    const count = document.getElementById("count");

    const fmtDate = (iso) => {
      if (!iso) return "Unknown";
      return new Date(iso).toLocaleDateString("en-US", {
        month: "short", day: "numeric", year: "numeric"
      });
    };

    const render = () => {
      const q = search.value.toLowerCase();
      let items = DATA.filter((p) => {
        const haystack = [p.name, p.title, p.description, ...p.tags]
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      });

      const s = sort.value;
      items.sort((a, b) => {
        if (s === "name-asc") return a.title.localeCompare(b.title);
        if (s === "name-desc") return b.title.localeCompare(a.title);
        if (s === "updated") return (b.updated || "").localeCompare(a.updated || "");
        if (s === "created") return (b.created || "").localeCompare(a.created || "");
        return 0;
      });

      count.textContent = items.length + " prototype" + (items.length !== 1 ? "s" : "");

      if (!items.length) {
        grid.style.display = "none";
        empty.style.display = "block";
        return;
      }

      grid.style.display = "grid";
      empty.style.display = "none";

      grid.innerHTML = items.map((p) => \`
        <a class="card" href="./\${p.name}/">
          <h2>\${p.title}</h2>
          <p class="desc">\${p.description}</p>
          \${p.tags.length ? \`<div class="tags">\${p.tags.map((t) => \`<span class="tag">\${t}</span>\`).join("")}</div>\` : ""}
          <div class="dates">
            <span>Created: \${fmtDate(p.created)}</span>
            <span>Updated: \${fmtDate(p.updated)}</span>
          </div>
        </a>
      \`).join("");
    };

    search.addEventListener("input", render);
    sort.addEventListener("change", render);
    render();
  </script>
</body>
</html>`;

writeFileSync(join(DIST_DIR, "index.html"), html);
console.log(`Gallery generated with ${prototypes.length} prototype(s).`);
