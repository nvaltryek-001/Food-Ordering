/**
 * Frontend build powered by esbuild.
 *   node scripts/build.mjs          → production bundle in dist/
 *   node scripts/build.mjs --dev    → watch + live reload on http://localhost:5173 (proxies /api → :5000)
 */
import * as esbuild from "esbuild";
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import http from "node:http";
import { dirname, join, basename } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const dev = process.argv.includes("--dev");
const API = process.env.API_URL || "http://localhost:5000";

const writeHtml = (result) => {
  const outputs = Object.keys(result.metafile.outputs);
  const js = outputs.find((f) => f.endsWith(".js"));
  const css = outputs.find((f) => f.endsWith(".css"));
  let html = readFileSync(join(root, "index.html"), "utf8")
    .replace("<!-- styles -->", css ? `<link rel="stylesheet" href="/assets/${basename(css)}">` : "")
    .replace("<!-- scripts -->", `<script type="module" src="/assets/${basename(js)}"></script>` +
      (dev ? `\n<script>new EventSource('/esbuild').addEventListener('change', () => location.reload())</script>` : ""));
  writeFileSync(join(dist, "index.html"), html);
};

const options = {
  entryPoints: [join(root, "src/main.jsx")],
  bundle: true,
  outdir: join(dist, "assets"),
  entryNames: dev ? "[name]" : "[name]-[hash]",
  assetNames: "[name]-[hash]",
  format: "esm",
  target: ["es2020", "chrome100", "safari15", "firefox100"],
  jsx: "automatic",
  loader: { ".woff": "file", ".svg": "file" },
  minify: !dev,
  sourcemap: dev ? "inline" : "linked",
  metafile: true,
  external: ["/fonts/*"],
  logLevel: "info",
  define: { "process.env.NODE_ENV": JSON.stringify(dev ? "development" : "production") },
  plugins: [{ name: "html", setup(b) { b.onEnd((r) => { if (!r.errors.length) writeHtml(r); }); } }],
};

rmSync(dist, { recursive: true, force: true });
mkdirSync(join(dist, "assets"), { recursive: true });
cpSync(join(root, "public"), dist, { recursive: true });

if (!dev) {
  const result = await esbuild.build(options);
  const size = Object.entries(result.metafile.outputs).filter(([f]) => !f.endsWith(".map"))
    .map(([f, o]) => `  ${basename(f).padEnd(28)} ${(o.bytes / 1024).toFixed(1)} kB`).join("\n");
  console.log(`\n✓ Built to dist/\n${size}`);
} else {
  const ctx = await esbuild.context(options);
  await ctx.watch();
  const { port } = await ctx.serve({ servedir: dist, port: 5174 });
  http.createServer((req, res) => {
    const toApi = req.url.startsWith("/api/");
    const target = toApi ? new URL(API) : { hostname: "127.0.0.1", port };
    const isAsset = /\.[a-z0-9]+(\?|$)/i.test(req.url) || req.url.startsWith("/esbuild");
    const path = toApi || isAsset ? req.url : "/index.html"; // SPA fallback
    const proxy = http.request({ hostname: target.hostname, port: target.port, path, method: req.method, headers: req.headers }, (p) => {
      res.writeHead(p.statusCode, p.headers);
      p.pipe(res);
    });
    proxy.on("error", () => { res.writeHead(502); res.end(toApi ? "Backend not running on " + API : "Dev server error"); });
    req.pipe(proxy);
  }).listen(5173, () => console.log(`\n🍛 Dev server → http://localhost:5173  (API proxied to ${API})\n`));
}
