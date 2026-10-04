// Production build into dist/: minified HTML with inlined CSS, bundled JS. Run: npm run build
import { transform } from "esbuild";
import { minify } from "html-minifier-terser";
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const SRC = (p) => join(ROOT, p);
const OUT = (p) => join(ROOT, "dist", p);

rmSync(OUT(""), { recursive: true, force: true });
mkdirSync(OUT("assets/js"), { recursive: true });
mkdirSync(OUT("assets/img"), { recursive: true });

// CSS
const css = (await transform(readFileSync(SRC("assets/css/style.css"), "utf8"), { loader: "css", minify: true, target: ["chrome100", "safari15", "firefox100"] })).code;

// JS
const js = (src) => transform(src, { loader: "js", minify: true, target: "es2020" }).then((r) => r.code);
const app = await js(readFileSync(SRC("assets/js/config.js"), "utf8") + "\n" + readFileSync(SRC("assets/js/main.js"), "utf8"));
writeFileSync(OUT("assets/js/app.js"), app);
for (const f of ["theme.js", "shop.js"]) writeFileSync(OUT(`assets/js/${f}`), await js(readFileSync(SRC(`assets/js/${f}`), "utf8")));

// HTML pages
for (const page of ["index.html", "sklep.html"]) {
  let html = readFileSync(SRC(page), "utf8")
    .replace(/<link rel="stylesheet" href="assets\/css\/style.css">/, `<style>${css.replace(/<\/style/gi, "<\/style")}</style>`)
    .replace(/<script src="assets\/js\/config.js"><\/script>\s*<script src="assets\/js\/main.js"><\/script>/, `<script src="assets/js/app.js" defer></script>`)
    .replace(/<script src="assets\/js\/shop.js"><\/script>/, `<script src="assets/js/shop.js" defer></script>`);
  html = await minify(html, {
    collapseWhitespace: true, removeComments: true, removeRedundantAttributes: true, minifyJS: true, sortAttributes: true,
  });
  writeFileSync(OUT(page), html);
}

// Static files
for (const f of ["favicon.svg", "og-image.png", "logo-mark.png"]) cpSync(SRC(`assets/img/${f}`), OUT(`assets/img/${f}`));
cpSync(SRC("api"), OUT("api"), { recursive: true });
for (const f of ["robots.txt", "sitemap.xml"]) cpSync(SRC(f), OUT(f));

// Size report
const rep = (p) => { const b = readFileSync(OUT(p)); return `${p.padEnd(26)} ${(b.length / 1024).toFixed(1).padStart(6)} KB   gzip ${(gzipSync(b).length / 1024).toFixed(1).padStart(5)} KB`; };
console.log(["index.html", "sklep.html", "assets/js/app.js", "assets/js/shop.js", "assets/js/theme.js"].map(rep).join("\n"));
