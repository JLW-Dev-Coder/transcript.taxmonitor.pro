// build.mjs
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");

// Alphabetical because order matters and chaos is optional
const DIRECTORIES = [
  "_sdk",
  "assets",
  "legal",
  "magnets",
  "partials",
  "scripts",
  "styles",
].sort();

const FILES = [
  "_redirects",
  "index.html",
].sort();

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function cleanDist() {
  await fs.rm(DIST, { recursive: true, force: true });
  await fs.mkdir(DIST, { recursive: true });
}

async function copyFile(src, dest) {
  await fs.copyFile(src, dest);
}

async function copyDir(src, dest) {
  await fs.cp(src, dest, { recursive: true });
}

async function main() {
  await cleanDist();

  // Copy root files
  for (const file of FILES) {
    const src = path.join(ROOT, file);
    const dest = path.join(DIST, file);
    if (await exists(src)) {
      await copyFile(src, dest);
    }
  }

  // Copy directories
  for (const dir of DIRECTORIES) {
    const src = path.join(ROOT, dir);
    const dest = path.join(DIST, dir);
    if (await exists(src)) {
      await copyDir(src, dest);
    }
  }

  console.log("Build complete → dist/");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
