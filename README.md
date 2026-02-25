# Prototypes

Interactive UI prototypes for the Prismatic platform. Each prototype is a standalone rsbuild project deployed as a route on a single Netlify site.

## Quick Start

```bash
# Create a new prototype via the skill
/prototype-builder <name>

# Or manually
bash /path/to/init-prototype.sh my-feature

# Dev server (inside a prototype dir)
cd my-feature
pnpm dev              # http://localhost:5173

# Build all prototypes
npm run build         # Runs build.sh → dist/<name>/
```

## Project Structure

```
.prototypes/
├── build.sh          # Iterates prototypes, runs each build, collects into dist/
├── netlify.toml      # Netlify config (publish: dist/)
├── package.json      # Root build script only
├── hello-world/      # Example prototype
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── index.css           # Theme tokens (DO NOT MODIFY)
│   │   ├── components/ui/      # Core primitives (DO NOT MODIFY)
│   │   └── components/*.tsx    # Purpose-built components
│   ├── index.html
│   ├── rsbuild.config.ts
│   ├── package.json
│   └── pnpm-lock.yaml
└── another-prototype/
    └── ...
```

## Creating a Prototype

The `/prototype-builder` skill scaffolds a complete prototype with the full design system (Radix UI + Tailwind CSS), including core primitives and purpose-built components.

Each prototype is fully self-contained — its own `package.json`, `pnpm-lock.yaml`, `rsbuild.config.ts`, and `src/` directory. No shared dependencies at the workspace level.

## Build Pipeline

`npm run build` at the root runs `build.sh`, which:

1. Discovers prototype directories (has `package.json` with a `build` script)
2. Runs `pnpm install && pnpm build` in each one
3. Copies each prototype's `dist/` into the root `dist/<name>/`

Netlify publishes `dist/`, so each prototype is served at `/<name>/`.

## Deployment

Prototypes deploy to Netlify as a single site with route-based access:

- **Production:** `https://prismatic-prototypes.netlify.app/<name>/`
- **Deploy previews:** Automatic on PR branches

## Conventions

- Each prototype gets the full Radix/Tailwind design system via the skill template
- Do NOT modify `src/index.css` or `src/components/ui/*` — these are production primitives
- Create new components in `src/components/` that compose the primitives
- Prototypes should be self-contained — mock data instead of real API calls
- Name prototypes by feature, not ticket number (e.g., `connection-wizard`, not `PRIS-1234`)
