#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
DIST_DIR="$ROOT_DIR/dist"

rm -rf "$DIST_DIR"
mkdir -p "$DIST_DIR"

built=0

for dir in "$ROOT_DIR"/*/; do
  name="$(basename "$dir")"

  # Skip non-prototype directories
  [[ "$name" == "node_modules" || "$name" == "dist" || "$name" == "primitives" || "$name" =~ ^\. ]] && continue

  # Must have a package.json with a build script
  [[ -f "$dir/package.json" ]] || continue
  grep -q '"build"' "$dir/package.json" || continue

  echo "Building $name..."
  (cd "$dir" && pnpm install --frozen-lockfile 2>/dev/null || pnpm install && pnpm build)

  # Copy build output into dist/<name>/
  if [[ -d "$dir/dist" ]]; then
    cp -r "$dir/dist" "$DIST_DIR/$name"
    echo "  -> dist/$name/"
    built=$((built + 1))
  else
    echo "  WARNING: $name build produced no dist/ output"
  fi
done

if [[ $built -eq 0 ]]; then
  echo "No prototypes found to build. Creating placeholder."
  echo "<html><body><h1>No prototypes deployed yet.</h1></body></html>" > "$DIST_DIR/index.html"
fi

echo "Done. Built $built prototype(s)."
