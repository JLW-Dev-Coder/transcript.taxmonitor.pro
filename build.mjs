// build.mjs (repo-root)
// Purpose: build dist/ for Cloudflare Pages by injecting /partials/*.html into /index.html
// and copying static folders into dist/ so non-index routes work.

import { cp, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = __dirname;
const DIST = path.join(ROOT, "dist");

const INPUT_HTML = path.join(ROOT, "index.html");
const PARTIALS_DIR = path.join(ROOT, "partials");

const PARTIAL_MARKERS = {
  footer: "<!-- PARTIAL:footer -->",
  header: "<!-- PARTIAL:header -->",
};

const PARTIAL_PATHS = {
  footer: path.join(PARTIALS_DIR, "footer.html"),
  header: path.join(PARTIALS_DIR, "header.html"),
};

// Copy these folders into dist/ (alphabetical)
const COPY_DIRS = [
  "_sdk",
  "assets",
  "legal",
  "magnets",
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

function injectPartials(html, partials) {
  let out = html;

  for (const key of Object.keys(PARTIAL_MARKERS).sort()) {
    const marker = PARTIAL_MARKERS[key];
    const content = partials[key];

    if (!out.includes(marker)) {
      throw new Error(`Missing marker in index.html: ${marker}`);
    }
    out = out.replace(marker, content);
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

  for (const key of Object.keys(PARTIAL_PATHS).sort()) {
    const p = PARTIAL_PATHS[key];
    if (!(await existsReadable(p))) {
      throw new Error(`Missing partial: ${p}`);
    }
  }

  // Read
  const [html, header, footer] = await Promise.all([
    readFile(INPUT_HTML, "utf8"),
    readFile(PARTIAL_PATHS.header, "utf8"),
    readFile(PARTIAL_PATHS.footer, "utf8"),
  ]);

  // Inject
  const built = injectPartials(html, { footer, header });

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

  console.log("Build complete → dist/");
}

main().catch((err) => {
  console.error(err?.stack || err);
  process.exit(1);
});