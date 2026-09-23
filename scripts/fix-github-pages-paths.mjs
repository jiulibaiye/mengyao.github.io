import fs from "node:fs";
import path from "node:path";

const DIST = path.resolve("dist");
const BASE = "/mengyao.github.io";

const extensions = new Set([
  ".html",
  ".css",
  ".js",
  ".json",
  ".xml",
  ".svg",
  ".pf_fragment",
]);

let changedFiles = 0;
let replacements = 0;

function fixContent(content) {
  return content.replace(
    /(["'`(=:\s]|&quot;)\/(themes|blog-covers)\//g,
    (match, prefix, folder) => {
      replacements++;
      return `${prefix}${BASE}/${folder}/`;
    }
  );
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      walk(fullPath);
      continue;
    }

    const ext = path.extname(entry.name);

    if (!extensions.has(ext)) continue;

    const original = fs.readFileSync(fullPath, "utf8");
    const fixed = fixContent(original);

    if (fixed !== original) {
      fs.writeFileSync(fullPath, fixed, "utf8");
      changedFiles++;
      console.log(`Fixed: ${path.relative(DIST, fullPath)}`);
    }
  }
}

if (!fs.existsSync(DIST)) {
  console.error("dist directory does not exist.");
  process.exit(1);
}

walk(DIST);

console.log("");
console.log(`GitHub Pages path fix complete.`);
console.log(`Changed files: ${changedFiles}`);
console.log(`Replacements: ${replacements}`);