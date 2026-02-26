// build.mjs (repo-root)
// Purpose: build dist/ for Cloudflare Pages by injecting /partials/*.html into /index.html
// and copying static folders into dist/ so non-index routes work.

import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = __dirname;
const DIST = path.join(ROOT, "dist");

const INPUT_HTML = path.join(ROOT, "index.html");
const PARTIALS_DIR = path.join(ROOT, "partials");

// Copy these folders into dist/ (alphabetical)
const COPY_DIRS = [
  "_sdk",
  "assets",
  "legal",
  "magnets",
  "resources",
  "scripts",
  "styles",
].sort();

// Copy these root files into dist/ (alphabetical)
// Keep _redirects empty if that's what it is. We still copy it if present.
const COPY_FILES = ["_redirects"].sort();

async function exists(p) {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

async function existsReadable(filePath) {
  try {
    await readFile(filePath, "utf8");
    return true;
  } catch {
    return false;
  }
}

function extractPartialNames(html) {
  const re = /<!--\s*PARTIAL:([A-Za-z0-9_-]+)\s*-->/g;
  const names = new Set();
  let m = null;

  while ((m = re.exec(html)) !== null) {
    if (m[1]) names.add(m[1]);
  }

  return Array.from(names).sort();
}

function injectNamedPartials(html, partialMap) {
  let out = html;

  for (const name of Object.keys(partialMap).sort()) {
    const markerRe = new RegExp(`<!--\\s*PARTIAL:${name}\\s*-->`, "g");
    if (!markerRe.test(out)) {
      throw new Error(`Missing marker in index.html: <!-- PARTIAL:${name} -->`);
    }
    out = out.replace(markerRe, partialMap[name]);
  }

  return out;
}

async function main() {
  // Clean dist
  await rm(DIST, { force: true, recursive: true });
  await mkdir(DIST, { recursive: true });

  // Validate inputs
  if (!(await existsReadable(INPUT_HTML))) {
    throw new Error("Missing index.html at repo root.");
  }
  if (!(await exists(PARTIALS_DIR))) {
    throw new Error("Missing /partials directory at repo root.");
  }

  // Read index.html
  const html = await readFile(INPUT_HTML, "utf8");

  // Discover which partials are needed from markers inside index.html
  const partialNames = extractPartialNames(html);

  // Validate partial files exist and read them
  const partialMap = {};
  for (const name of partialNames) {
    const p = path.join(PARTIALS_DIR, `${name}.html`);
    if (!(await existsReadable(p))) {
      throw new Error(`Missing partial file for marker "${name}": ${p}`);
    }
    partialMap[name] = await readFile(p, "utf8");
  }

  // Inject
  const built = injectNamedPartials(html, partialMap);

  // Write built HTML
  await writeFile(path.join(DIST, "index.html"), built, "utf8");

  // Copy folders (if they exist)
  for (const dir of COPY_DIRS) {
    const src = path.join(ROOT, dir);
    const dst = path.join(DIST, dir);

    if (!(await exists(src))) continue;

    await cp(src, dst, { recursive: true });
  }

  // Copy root files (if they exist)
  for (const file of COPY_FILES) {
    const src = path.join(ROOT, file);
    const dst = path.join(DIST, file);

    if (!(await exists(src))) continue;

    await cp(src, dst);
  }

  // Optional: sanity log for partials present (doesn't affect build)
  try {
    const partialFiles = (await readdir(PARTIALS_DIR)).filter((f) => f.endsWith(".html")).sort();
    console.log("Partials available:", partialFiles.join(", "));
  } catch {
    // ignore
  }

  console.log("Build complete → dist/");
}

main().catch((err) => {
  console.error(err?.stack || err);
  process.exit(1);
});
