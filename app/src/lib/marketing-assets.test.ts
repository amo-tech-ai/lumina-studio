import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const SRC_DIR = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const IMAGES_DIR = resolve(SRC_DIR, "../public/images");

const MARKETING_SOURCE_DIRS = [
  join(SRC_DIR, "app/(marketing)"),
  join(SRC_DIR, "components/marketing"),
] as const;

/** Walk a directory tree and return absolute paths to .ts/.tsx files. */
function collectSourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const abs = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...collectSourceFiles(abs));
    else if (/\.(tsx?)$/.test(entry.name)) out.push(abs);
  }
  return out;
}

/**
 * Extract image filenames referenced by marketing source (static paths, data
 * fields, and known image-array constants used with `/images/${…}` templates).
 */
function extractReferencedImageFiles(source: string): Set<string> {
  const files = new Set<string>();

  const add = (raw: string) => {
    const name = raw.replace(/^\/images\//, "");
    if (/\.(jpg|jpeg|png|webp)$/i.test(name)) files.add(name);
    else files.add(`${name}.jpg`);
  };

  for (const m of source.matchAll(/["']\/images\/([^"']+)["']/g)) {
    add(m[1]);
  }

  for (const m of source.matchAll(
    /(?:image|src|img):\s*["']([^"']+\.(?:jpg|jpeg|png|webp))["']/gi,
  )) {
    add(m[1]);
  }

  const arrayRe =
    /const\s+(?:\w+Images|portfolio|problemImages|sliderImages|whyImages)\s*=\s*\[([\s\S]*?)\];/g;
  for (const m of source.matchAll(arrayRe)) {
    const block = m[1];
    const objectFields = [...block.matchAll(/(?:src|img|image):\s*["']([^"']+)["']/g)];
    if (objectFields.length > 0) {
      for (const item of objectFields) add(item[1]);
    } else {
      for (const item of block.matchAll(/["']([^"']+)["']/g)) add(item[1]);
    }
  }

  return files;
}

describe("marketing image assets (WEB-001…011)", () => {
  const sources = MARKETING_SOURCE_DIRS.flatMap(collectSourceFiles);
  const referenced = new Set<string>();

  for (const file of sources) {
    for (const img of extractReferencedImageFiles(readFileSync(file, "utf8"))) {
      referenced.add(img);
    }
  }

  it("discovers image references across marketing source", () => {
    expect(referenced.size).toBeGreaterThan(30);
  });

  it("maps every referenced image to a file under public/images", () => {
    const missing: string[] = [];
    for (const img of [...referenced].sort()) {
      if (!existsSync(join(IMAGES_DIR, img))) missing.push(img);
    }
    expect(missing, `missing assets: ${missing.join(", ")}`).toEqual([]);
  });

  it("covers openGraph hero images declared on service pages", () => {
    const ogImages = new Set<string>();
    const serviceDir = join(SRC_DIR, "app/(marketing)/services");
    for (const entry of readdirSync(serviceDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const src = readFileSync(join(serviceDir, entry.name, "page.tsx"), "utf8");
      for (const m of src.matchAll(/images:\s*\["(\/images\/[^"]+)"\]/g)) {
        ogImages.add(m[1].replace(/^\/images\//, ""));
      }
    }
    expect(ogImages.size).toBe(9);
    for (const img of ogImages) {
      expect(existsSync(join(IMAGES_DIR, img)), img).toBe(true);
    }
  });
});
