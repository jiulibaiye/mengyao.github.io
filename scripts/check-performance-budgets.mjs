import { readFile, readdir, stat } from "node:fs/promises";
import { excludedPublicMedia } from "./lib/media-publish-policy.mjs";

const distDir = new URL("../dist/", import.meta.url);
const astroDir = new URL("_astro/", distDir);
const failures = [];

// Custom domain: https://mengyao.ccwu.cc
// No GitHub Pages repository sub-path is used.
const BASE = "";

const toDistPath = (value) => {
  if (!value) return "";
  const normalized = value.startsWith("/") ? value : `/${value}`;
  const withoutBase = normalized.startsWith(BASE)
    ? normalized.slice(BASE.length)
    : normalized;
  return withoutBase.replace(/^\/+/, "");
};

const withBase = (value) => {
  if (!value) return BASE;
  const normalized = value.startsWith("/") ? value : `/${value}`;

  if (
    BASE &&
    (normalized === BASE || normalized.startsWith(`${BASE}/`))
  ) {
    return normalized;
  }

  return `${BASE}${normalized}`;
};

const fileBudgets = [
  ["Kisara Home HTML", "index.html", 210_000],
  ["Kisara Blog HTML", "blog/index.html", 158_500],
  ["Kisara Games HTML", "games/index.html", 166_000],
  ["Kisara Works HTML", "projects/index.html", 198_000],
  ["Kisara About HTML", "about/index.html", 149_000],
  ["Fuyukawa Home HTML", "themes/fuyukawa-kagari/index.html", 101_000],
  [
    "Kisara chain material atlas",
    "themes/kisara/assets/title-chain-steel.webp",
    110_000
  ]
];

const stylesheetBudgets = [
  ["Kisara Home CSS", "index.html", 315_000],
  ["Kisara Blog CSS", "blog/index.html", 220_000],
  ["Kisara Games CSS", "games/index.html", 240_000],
  ["Kisara Works CSS", "projects/index.html", 255_000],
  ["Kisara About CSS", "about/index.html", 260_000],
  ["Fuyukawa Home CSS", "themes/fuyukawa-kagari/index.html", 150_000]
];

const bundleBudgets = [
  [
    "Kisara shared layout runtime",
    "KisaraLayout.astro_astro_type_script_index_1_lang.",
    9_000
  ],
  [
    "Kisara Home primary module",
    "HomePage.astro_astro_type_script_index_",
    225_000
  ],
  [
    "Kisara stage loader",
    "KisaraChibiStage.astro_astro_type_script_index_",
    3_500
  ],
  ["Kisara deferred stage runtime", "chibiStage.", 20_000],
  ["Kisara Blog page runtime", "blogPage.", 20_000],
  ["Kisara Works page runtime", "worksPage.", 72_000]
];

const formatBytes = (value) => `${(value / 1024).toFixed(1)} KiB`;

const recordBudget = (label, size, limit) => {
  const passed = size <= limit;

  console.log(
    `${passed ? "PASS" : "FAIL"} ${label}: ${formatBytes(size)} / ${formatBytes(limit)}`
  );

  if (!passed) {
    failures.push(
      `${label} exceeded its budget by ${formatBytes(size - limit)}`
    );
  }
};

async function main() {
  // 1. 静态文件大小校验
  for (const [label, relativePath, limit] of fileBudgets) {
    try {
      const details = await stat(new URL(relativePath, distDir));
      recordBudget(label, details.size, limit);
    } catch {
      failures.push(`${label} is missing: dist/${relativePath}`);
    }
  }

  // 2. CSS 资源校验
  for (const [label, relativePath, limit] of stylesheetBudgets) {
    try {
      const html = await readFile(new URL(relativePath, distDir), "utf8");

      const stylesheetPattern =
        /href="[^"]*\/_astro\/([^"?]+\.css)(?:\?[^"]*)?"/g;

      const stylesheetPaths = [
        ...html.matchAll(stylesheetPattern)
      ].map((match) => match[1]);

      const uniquePaths = [...new Set(stylesheetPaths)];

      if (uniquePaths.length === 0) {
        throw new Error("no stylesheets found");
      }

      const sizes = await Promise.all(
        uniquePaths.map((name) => stat(new URL(name, astroDir)))
      );

      recordBudget(
        label,
        sizes.reduce((total, details) => total + details.size, 0),
        limit
      );
    } catch (error) {
      failures.push(`${label} could not be measured: ${error.message}`);
    }
  }

  // 3. JS bundle 校验
  let astroFiles = [];
  try {
    astroFiles = await readdir(astroDir);
  } catch {
    failures.push("dist/_astro is missing");
  }

  for (const [label, prefix, limit] of bundleBudgets) {
    const matches = astroFiles.filter(
      (name) => name.startsWith(prefix) && name.endsWith(".js")
    );

    if (matches.length !== 1) {
      failures.push(
        `${label} expected one emitted bundle, found ${matches.length}`
      );
      continue;
    }

    const details = await stat(new URL(matches[0], astroDir));
    recordBudget(label, details.size, limit);
  }

  // 4. Kisara首页HTML内容校验
  try {
    const homeHtml = await readFile(new URL("index.html", distDir), "utf8");

    if (/kisara-title-gloss|memory-attack|memory-clash/.test(homeHtml)) {
      failures.push(
        "Kisara Home restored a retired blade stage or superseded memory shot"
      );
    }

    if (
      /kisara-title-cross|kisara-screen-impact|kisara-burst-canvas/.test(
        homeHtml
      )
    ) {
      failures.push(
        "Kisara Home restored a retired black-hole or warning pass"
      );
    }

    if (!homeHtml.includes("kisara-gate-background-fight-wash")) {
      failures.push(
        "Kisara Home lost its original clear reconstruction wash"
      );
    }

    const manifestPattern = new RegExp(
      '<script\\b[^>]*data-kisara-scene-manifest[^>]*>([\\s\\S]*?)</script>'
    );
    const manifestMatch = homeHtml.match(manifestPattern);
    const manifestText = manifestMatch?.[1];

    const scenes = JSON.parse(manifestText ?? "[]");

    if (
      scenes.filter((scene) => scene.kind === "memory").length !== 9 ||
      scenes.filter((scene) => scene.kind === "transformation").length !== 3
    ) {
      failures.push(
        "Kisara Gate lost its nine memory and three smoke shots"
      );
    }

    const storySizes = await Promise.all(
      scenes.map((scene) => {
        const imagePath = toDistPath(scene.image);

        if (!imagePath) {
          throw new Error("Kisara scene image path is empty");
        }

        return stat(new URL(imagePath, distDir));
      })
    );

    const finalShot = await stat(
      new URL("themes/kisara/assets/fight.webp", distDir)
    );

    recordBudget(
      "Kisara complete story images",
      storySizes.reduce((sum, file) => sum + file.size, finalShot.size),
      850_000
    );

    recordBudget(
      "Kisara first two story images",
      storySizes
        .slice(0, 2)
        .reduce((sum, file) => sum + file.size, 0),
      140_000
    );

    const preloadPath = withBase(
      "/themes/kisara/assets/gate-background.webp"
    );

    const preloadPattern = new RegExp(
      `<link\\s+rel="preload"\\s+as="image"\\s+href="${preloadPath.replaceAll(
        "/",
        "\\/"
      )}"\\s+fetchpriority="high"\\s*/?>`,
      "i"
    );

    if (!preloadPattern.test(homeHtml)) {
      failures.push(
        "Kisara Home lost its high-priority Gate background preload"
      );
    }

    const homeEventVideoPath = withBase(
      "/themes/kisara/assets/home-event-003-new.mp4"
    );

    if (!homeHtml.includes(`data-src="${homeEventVideoPath}"`)) {
      failures.push(
        "Kisara Home 003 video lost its deferred data-src"
      );
    }

    const eagerHomeEventVideoPattern = new RegExp(
      `<source\\b[^>]*\\ssrc=["']${homeEventVideoPath.replaceAll(
        "/",
        "\\/"
      )}`,
      "i"
    );

    if (eagerHomeEventVideoPattern.test(homeHtml)) {
      failures.push(
        "Kisara Home 003 video regressed to an eager source request"
      );
    }

    const fridgeVideoPattern =
      /<video\b[^>]*data-fridge-video[^>]*>/i;

    const fridgeVideo = homeHtml.match(fridgeVideoPattern)?.[0];

    const fridgeDataSrcPattern =
      /\sdata-src=["'][^"']*fridge-opening-002.mp4/i;

    const fridgeSrcPattern = /\ssrc=/i;
    const fridgePreloadPattern = /\spreload=["']none["']/i;

    if (
      !fridgeVideo ||
      !fridgeDataSrcPattern.test(fridgeVideo) ||
      fridgeSrcPattern.test(fridgeVideo) ||
      !fridgePreloadPattern.test(fridgeVideo)
    ) {
      failures.push(
        "Kisara Home 002 video lost its deferred loading contract"
      );
    }
  } catch (error) {
    failures.push(
      `Kisara Home critical-image validation failed: ${error.message}`
    );
  }

  // 5. 封面图媒体校验
  try {
    const covers = JSON.parse(
      await readFile(
        new URL(
          "../src/core/content/responsive-covers.json",
          import.meta.url
        ),
        "utf8"
      )
    );

    let bytes = 0;
    let smallBytes = 0;
    let originalBytes = 0;

    for (const [source, cover] of Object.entries(covers)) {
      const sourcePath = source.startsWith("/")
        ? source.slice(1)
        : source;

      originalBytes += (
        await stat(new URL(sourcePath, distDir))
      ).size;

      smallBytes += cover.variants[0]?.bytes ?? 0;

      for (const variant of cover.variants) {
        const variantPath = variant.src.startsWith("/")
          ? variant.src.slice(1)
          : variant.src;

        const published = await stat(
          new URL(variantPath, distDir)
        );

        if (published.size !== variant.bytes) {
          failures.push(
            `Responsive cover size mismatch: ${variant.src}`
          );
        }

        bytes += published.size;
      }
    }

    recordBudget(
      "Responsive cover derivatives",
      bytes,
      5_000_000
    );

    recordBudget(
      "Small covers versus originals",
      smallBytes,
      Math.floor(originalBytes * 0.4)
    );

    for (const relative of excludedPublicMedia) {
      try {
        await stat(new URL(relative, distDir));
        failures.push(
          `Reviewed source media leaked into the build: ${relative}`
        );
      } catch (error) {
        if (error.code !== "ENOENT") {
          throw error;
        }
      }
    }
  } catch (error) {
    failures.push(
      `Published media validation failed: ${error.message}`
    );
  }

  // 输出结果
  if (failures.length > 0) {
    console.error("\nPerformance budget violations:");
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exitCode = 1;
  } else {
    console.log("\nAll performance budgets passed.");
  }
}

// 执行主函数
await main();