# Prototypes

Interactive UI prototypes for the Prismatic platform. Each prototype is a standalone route served from a single Netlify site.

## Quick Start

```bash
cd .prototypes
npm install
npm run dev          # Start dev server at http://localhost:5174
npm run build        # Production build
npm run preview      # Preview production build
```

## Creating a Prototype

1. Create a directory under `.prototypes/` with a descriptive name:

```bash
mkdir -p .prototypes/my-feature
```

2. Add an `index.html` and entry file:

```
.prototypes/my-feature/
├── index.html        # HTML entry point
├── main.tsx          # React entry
└── components/       # Prototype-specific components
```

3. Register the entry in `vite.config.ts` (multi-page input).

4. Run `npm run dev` and navigate to `/my-feature/`.

## Primitive Hierarchy

When building prototype UI, follow this priority order:

1. **Prototype primitives** (`primitives/`) — Reusable blocks extracted from previous prototypes
2. **Frontend UI primitives** (`frontend/frontend/src/ui/`) — Production UI components
3. **Build new** — Create in `primitives/` first, promote to `src/ui/` after validation

### Primitives Directory

```
primitives/
├── components/     # UI building blocks (buttons, cards, inputs)
├── layouts/        # Common layout patterns (sidebar, split-pane, dashboard)
├── hooks/          # Shared React hooks
└── theme/          # Design tokens and MUI theme extensions
```

## Deployment

Prototypes deploy to Netlify as a single site with route-based access:

- **Production:** `https://prismatic-prototypes.netlify.app/<prototype-name>/`
- **Deploy previews:** Automatic on PR branches

```bash
npm run build       # Builds all prototypes
netlify deploy      # Preview deploy
netlify deploy --prod  # Production deploy
```

## Promoting to Production

When a prototype is validated and approved:

1. Extract reusable primitives to `primitives/`
2. Move production-ready components to `frontend/frontend/src/ui/` or `src/components/`
3. Archive the prototype (move to `.prototypes/_archived/`)

## Conventions

- Use MUI 5 theme tokens from `primitives/theme/` for visual consistency
- Prototypes should be self-contained — no imports from `frontend/frontend/src/`
- Keep prototypes lightweight — mock data instead of real API calls
- Name prototypes by feature, not ticket number (e.g., `connection-wizard`, not `PRIS-1234`)
