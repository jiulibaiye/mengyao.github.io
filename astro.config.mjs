import { defineConfig } from "astro/config";
import expressiveCode from "astro-expressive-code";
import sitemap from "@astrojs/sitemap";
import icon from "astro-icon";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeExpressiveCode from "rehype-expressive-code";
import * as pagefind from "pagefind";
import { fileURLToPath } from "node:url";

const expressiveCodeOptions = {
  themes: ["github-dark"],

  defaultProps: {
    wrap: true,
    overridesByLang: {
      "bash,sh,zsh,powershell,ps1,bat,cmd": {
        frame: "terminal"
      }
    }
  },

  frames: {
    showCopyToClipboardButton: true,
    removeCommentsWhenCopyingTerminalFrames: false
  },

  styleOverrides: {
    borderRadius: "8px",
    codeFontFamily: '"Cascadia Code", "Fira Code", Consolas, monospace',
    codeFontSize: "0.9rem",
    codeLineHeight: "1.72",
    codePaddingBlock: "1.1rem",
    codePaddingInline: "1.25rem",
    codeBackground: "#111827",
    uiFontFamily: '"Cascadia Code", "Fira Code", Consolas, monospace',

    frames: {
      frameBoxShadowCssValue: "0 18px 38px rgba(12, 18, 31, 0.28)",
      editorActiveTabBackground: "#111827",
      terminalTitlebarBackground: "#fdf5f0",
      terminalTitlebarForeground: "#31425f",
      inlineButtonBackground: "#ffffff",
      inlineButtonForeground: "#31425f",
      inlineButtonBorder: "#f7b7c8"
    }
  }
};

function pagefindIntegration() {
  return {
    name: "yuimi-pagefind",

    hooks: {
      "astro:build:done": async ({ dir, logger }) => {
        const result = await pagefind.createIndex({
          forceLanguage: "zh",
          includeCharacters: "_-:"
        });

        const index = result.index;
        const errors = result.errors;

        if (!index) {
          logger.warn(
            `Pagefind index was not created: ${errors.join(", ")}`
          );
          return;
        }

        const distDir = fileURLToPath(dir);

        const addResult = await index.addDirectory({
          path: distDir,
          glob: "**/*.html"
        });

        if (addResult.errors.length > 0) {
          logger.warn(
            `Pagefind indexing warnings: ${addResult.errors.join(", ")}`
          );
        }

        const pagefindDir = new URL("./pagefind/", dir);

        const writeResult = await index.writeFiles({
          outputPath: fileURLToPath(pagefindDir)
        });

        if (writeResult.errors.length > 0) {
          logger.warn(
            `Pagefind write warnings: ${writeResult.errors.join(", ")}`
          );
        } else {
          logger.info(
            `Pagefind indexed ${addResult.page_count} pages.`
          );
        }

        await pagefind.close();
      }
    }
  };
}

export default defineConfig({
  site: "https://mengyao.ccwu.cc",

  base: "/",

  output: "static",

  prefetch: {
    prefetchAll: false,
    defaultStrategy: "tap"
  },

  integrations: [
    expressiveCode(expressiveCodeOptions),

    sitemap({
      filter: (page) =>
        !new URL(page).pathname.startsWith("/themes/")
    }),

    icon({
      include: {
        tabler: [
          "home-heart",
          "book-2",
          "device-gamepad-2",
          "code",
          "user-heart",
          "search",
          "brand-github",
          "brand-bilibili",
          "sparkles",
          "heart",
          "device-gamepad",
          "movie",
          "pin",
          "terminal-2",
          "flower",
          "mood-smile",
          "chevron-down",
          "palette",
          "x",
          "arrow-up",
          "home",
          "archive",
          "arrow-left",
          "arrow-right",
          "link",
          "copy",
          "file-text",
          "player-play",
          "player-pause",
          "flask-2",
          "user-scan",
          "arrow-back-up",
          "activity-heartbeat",
          "refresh",
          "player-skip-forward",
          "arrow-down",
          "chevron-left",
          "chevron-right",
          "external-link",
          "blade",
          "blender",
          "chef-hat",
          "glass-full",
          "hand-finger",
          "hand-grab",
          "tools-kitchen-2",
          "trash"
        ],

        "simple-icons": [
          "unity",
          "blender",
          "unrealengine",
          "github",
          "bilibili",
          "steam",
          "thefinals"
        ]
      }
    }),

    pagefindIntegration()
  ],

  markdown: {
    syntaxHighlight: false,

    gfm: true,

    remarkPlugins: [remarkGfm],

    rehypePlugins: [
      rehypeSlug,

      [
        rehypeAutolinkHeadings,
        {
          behavior: "append",

          properties: {
            className: ["heading-anchor"],
            ariaLabel: "heading anchor"
          },

          content: {
            type: "text",
            value: "#"
          }
        }
      ],

      [rehypeExpressiveCode, expressiveCodeOptions]
    ]
  },

  devToolbar: {
    enabled: false
  }
});