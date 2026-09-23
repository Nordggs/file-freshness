const esbuild = require("esbuild");

const isProd = process.argv.includes("--prod");

esbuild.build({
  entryPoints: ["src/main.ts"],
  bundle: true,
  platform: "browser",
  target: "es2020",
  format: "cjs",
  outfile: "main.js",
  external: ["obsidian"],
  sourcemap: isProd ? false : "inline",
  minify: isProd,
  logLevel: "info",
}).catch(() => process.exit(1));
