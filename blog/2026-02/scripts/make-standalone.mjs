import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const inputPath = path.resolve(projectRoot, process.argv[2] ?? "grammar.html");
const outputPath = path.resolve(projectRoot, process.argv[3] ?? "grammar-standalone.html");

function isRemoteUrl(href) {
  return /^https?:\/\//i.test(href);
}

function escapeForHtmlComment(s) {
  return s.replaceAll("--", "—");
}

let html = await fs.readFile(inputPath, "utf8");

// Drop polyfill.io (can be blocked / DNS-disabled; modern browsers don't need it).
html = html.replace(
  /<script\b[^>]*\bsrc="https:\/\/polyfill\.io\/v3\/polyfill\.min\.js\?features=es6"[^>]*>\s*<\/script>\s*/gi,
  ""
);

// 3) Inline local stylesheets referenced via <link rel="stylesheet" href="...">.
//    Keep remote CSS as-is.
html = await (async () => {
  const linkRe = /<link\s+rel="stylesheet"\s+href="([^"]+)"\s*\/?>/gi;
  let out = "";
  let lastIndex = 0;
  for (;;) {
    const m = linkRe.exec(html);
    if (!m) break;
    const [full, href] = m;
    out += html.slice(lastIndex, m.index);
    lastIndex = m.index + full.length;

    if (isRemoteUrl(href)) {
      out += full;
      continue;
    }

    const assetPath = path.resolve(projectRoot, href);
    const css = await fs.readFile(assetPath, "utf8");
    out += `\n<!-- inlined ${escapeForHtmlComment(href)} -->\n<style data-href="${href}">\n${css}\n</style>\n`;
  }
  out += html.slice(lastIndex);
  return out;
})();

// 4) Inline the interactive JS so the demo works when only the HTML is deployed.
html = await (async () => {
  const scriptRe = /<script\s+src="([^"]+)"\s*>\s*<\/script>/gi;
  let out = "";
  let lastIndex = 0;
  for (;;) {
    const m = scriptRe.exec(html);
    if (!m) break;
    const [full, src] = m;
    out += html.slice(lastIndex, m.index);
    lastIndex = m.index + full.length;

    if (isRemoteUrl(src)) {
      out += full;
      continue;
    }

    const assetPath = path.resolve(projectRoot, src);
    const js = await fs.readFile(assetPath, "utf8");
    out += `\n<!-- inlined ${escapeForHtmlComment(src)} -->\n<script>\n${js}\n//# sourceURL=${src}\n</script>\n`;
  }
  out += html.slice(lastIndex);
  return out;
})();

await fs.writeFile(outputPath, html, "utf8");
console.log(`Wrote ${path.relative(projectRoot, outputPath)} (from ${path.relative(projectRoot, inputPath)})`);
