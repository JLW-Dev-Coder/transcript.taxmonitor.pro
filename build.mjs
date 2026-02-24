// build.mjs (repo-root)
// Purpose: build dist/ for Cloudflare Pages by injecting /partials/*.html into /index.html

import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { cp } from "node:fs/promises";

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

const COPY_DIRS = ["_sdk", "styles"].sort();

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

  // Copy dirs (if they exist)
  for (const dir of COPY_DIRS) {
    const src = path.join(ROOT, dir);
    const dst = path.join(DIST, dir);

    try {
      await cp(src, dst, { recursive: true });
    } catch {
      // If the folder doesn't exist, skip quietly.
      // (Because humans love renaming folders without telling anyone.)
    }
  }

  console.log("Build complete → dist/");
}

main().catch((err) => {
  console.error(err?.stack || err);
  process.exit(1);
});