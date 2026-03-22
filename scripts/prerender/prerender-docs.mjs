#!/usr/bin/env node
/**
 * 将 public/docs 下 .md / .mdx 预渲染为同目录 .html（完整 HTML 文档，利于爬虫直接抓取）。
 * 正文容器 id=cutool-prerendered-doc，与 src/utils/prerenderedDoc.js 一致。
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';
import { visit } from 'unist-util-visit';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const PUBLIC = path.join(ROOT, 'public');
const CSS_PATH = path.join(__dirname, 'markdown-standalone.css');

const SITE_ORIGIN = (process.env.SITE_ORIGIN || 'https://cutool.online').replace(/\/$/, '');

const DOC_ROOTS = [path.join(PUBLIC, 'docs', 'agent-skills'), path.join(PUBLIC, 'docs', 'prompts-learning')];

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** 解析简单单行 YAML frontmatter 中的 title / description，并返回正文（去掉首尾 --- 块） */
function stripFrontmatterAndMeta(text) {
  let trimmed = text.trim();
  let metaTitle = '';
  let metaDesc = '';
  if (trimmed.startsWith('---')) {
    const firstNl = trimmed.indexOf('\n');
    if (firstNl !== -1) {
      const close = trimmed.indexOf('\n---', firstNl + 1);
      if (close !== -1) {
        const fm = trimmed.slice(firstNl + 1, close);
        trimmed = trimmed.slice(close + 4).trim();
        for (const line of fm.split('\n')) {
          const t = line.trim();
          if (t.startsWith('title:')) {
            const v = t.slice(6).trim().replace(/^["']|["']$/g, '');
            if (v) metaTitle = v;
          } else if (t.startsWith('description:')) {
            const v = t.slice(12).trim().replace(/^["']|["']$/g, '');
            if (v) metaDesc = v;
          }
        }
      }
    }
  }
  const lines = trimmed.split('\n');
  const filtered = lines.filter((line) => {
    const t = line.trim();
    return !t.startsWith('import ') && !t.startsWith('export ');
  });
  const body = filtered.join('\n').trim();
  return { body, metaTitle, metaDesc };
}

function guessLangFromPath(relPosix) {
  if (relPosix.includes('/zh/')) return 'zh-Hans';
  if (relPosix.includes('/en/')) return 'en';
  return 'zh-Hans';
}

function extractTitle(md) {
  const m = md.match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : '';
}

function excerptFromMd(md) {
  const lines = md.split('\n').map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    if (line.startsWith('#')) continue;
    if (/^[-*]\s/.test(line)) continue;
    if (line.startsWith('|')) continue;
    if (line.startsWith('```')) continue;
    const t = line.replace(/\*\*?|`|__/g, '').slice(0, 200);
    if (t) return t;
  }
  return '';
}

function webDirForFile(relFromPublic) {
  const dir = path.posix.dirname(relFromPublic.split(path.sep).join('/'));
  return `/${dir}/`;
}

function canonicalPathFromRel(relFromPublic) {
  const posix = relFromPublic.split(path.sep).join('/');
  return posix.replace(/\.(md|mdx)$/i, '.html');
}

function resolveAssetUrl(docWebDir, src) {
  if (!src || typeof src !== 'string' || src.startsWith('data:')) return src;
  if (/^https?:\/\//i.test(src)) return src;
  if (src.startsWith('/')) return src;
  try {
    const u = new URL(src, `https://placeholder.invalid${docWebDir}`);
    return u.pathname + (u.search || '') + (u.hash || '');
  } catch {
    return src;
  }
}

function resolveHref(docWebDir, href) {
  if (!href || typeof href !== 'string' || href.startsWith('#')) return href;
  if (/^https?:\/\//i.test(href)) return href;
  if (/^mailto:/i.test(href)) return href;

  let h = href;
  if (h.endsWith('.md') || h.endsWith('.mdx')) {
    h = h.replace(/\.mdx?$/i, '.html');
  }

  if (h.startsWith('/')) {
    return h.replace(/\.mdx?$/i, '.html');
  }

  try {
    const u = new URL(h, `https://placeholder.invalid${docWebDir}`);
    return u.pathname + (u.search || '') + (u.hash || '');
  } catch {
    return href;
  }
}

function rehypeResolveUrls(docWebDir) {
  return (tree) => {
    if (!tree || typeof tree !== 'object') return tree;
    visit(tree, 'element', (node) => {
      if (node.tagName === 'img' && typeof node.properties?.src === 'string') {
        node.properties.src = resolveAssetUrl(docWebDir, node.properties.src);
      }
      if (node.tagName === 'a' && typeof node.properties?.href === 'string') {
        node.properties.href = resolveHref(docWebDir, node.properties.href);
      }
    });
    return tree;
  };
}

async function markdownToHtmlFragment(markdown, docWebDir) {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeResolveUrls(docWebDir))
    .use(rehypeSanitize)
    .use(rehypeStringify)
    .process(markdown);
  return String(file).trim();
}

function walkFiles(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walkFiles(full, acc);
    else if (/\.(md|mdx)$/i.test(e.name)) acc.push(full);
  }
  return acc;
}

function buildStandaloneHtml({ title, description, canonicalUrl, lang, bodyHtml, inlineCss }) {
  const t = escapeHtml(title || 'Document');
  const d = escapeHtml(description || '');
  return `<!DOCTYPE html>
<html lang="${escapeHtml(lang)}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${t}</title>
  <meta name="description" content="${d}">
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}">
  <meta property="og:type" content="article">
  <meta property="og:title" content="${t}">
  <meta property="og:description" content="${d}">
  <meta property="og:url" content="${escapeHtml(canonicalUrl)}">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${t}">
  <meta name="twitter:description" content="${d}">
  <style>
${inlineCss}
  </style>
</head>
<body>
  <article id="cutool-prerendered-doc" class="markdown-content">
${bodyHtml}
  </article>
</body>
</html>
`;
}

async function main() {
  const inlineCss = fs.readFileSync(CSS_PATH, 'utf8');
  const files = DOC_ROOTS.flatMap((d) => walkFiles(d));
  if (files.length === 0) {
    console.warn('[prerender-docs] No .md/.mdx found under docs roots.');
    return;
  }

  let ok = 0;
  for (const abs of files) {
    const relFromPublic = path.relative(PUBLIC, abs);
    const outAbs = abs.replace(/\.(md|mdx)$/i, '.html');
    const raw = fs.readFileSync(abs, 'utf8');
    const { body: md, metaTitle, metaDesc } = stripFrontmatterAndMeta(raw);
    const docWebDir = webDirForFile(relFromPublic);
    const title = metaTitle || extractTitle(md) || path.basename(abs, path.extname(abs));
    const description = metaDesc || excerptFromMd(md);
    const canonicalUrl = `${SITE_ORIGIN}/${canonicalPathFromRel(relFromPublic)}`;
    const lang = guessLangFromPath(relFromPublic.split(path.sep).join('/'));

    try {
      const bodyHtml = await markdownToHtmlFragment(md, docWebDir);
      const html = buildStandaloneHtml({
        title,
        description,
        canonicalUrl,
        lang,
        bodyHtml,
        inlineCss,
      });
      fs.writeFileSync(outAbs, html, 'utf8');
      ok += 1;
    } catch (e) {
      console.error(`[prerender-docs] Failed: ${relFromPublic}`, e);
      process.exitCode = 1;
    }
  }

  console.log(`[prerender-docs] Wrote ${ok} HTML file(s).`);
}

main();
