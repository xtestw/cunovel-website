#!/usr/bin/env node
/**
 * 根据 public/docs 与固定应用路由生成 public/sitemap.xml。
 * 在 prerender-docs 之后运行更佳（逻辑上不依赖 .html 是否已生成，按 .md 推导 .html URL）。
 *
 * SITE_ORIGIN 默认 https://cutool.online
 * SITEMAP_LASTMOD 可覆盖统一 lastmod（YYYY-MM-DD），默认使用当前 UTC 日期
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PUBLIC = path.join(ROOT, 'public');
const OUT = path.join(PUBLIC, 'sitemap.xml');

const SITE = (process.env.SITE_ORIGIN || 'https://cutool.online').replace(/\/$/, '');
const LASTMOD =
  process.env.SITEMAP_LASTMOD || new Date().toISOString().slice(0, 10);

/** @type {Map<string, { lastmod: string; changefreq: string; priority: number }>} */
const byPath = new Map();

function add(pathname, opts = {}) {
  const p = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const next = {
    lastmod: opts.lastmod || LASTMOD,
    changefreq: opts.changefreq || 'weekly',
    priority: opts.priority ?? 0.8,
  };
  const prev = byPath.get(p);
  if (!prev || next.priority > prev.priority) {
    byPath.set(p, next);
  }
}

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function walkMarkdownSlugs(dir, parts, outSet) {
  if (!fs.existsSync(dir)) return;
  for (const name of fs.readdirSync(dir)) {
    if (name.startsWith('.')) continue;
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) {
      walkMarkdownSlugs(full, [...parts, name], outSet);
    } else if (name.endsWith('.md')) {
      const segment = name.replace(/\.md$/i, '');
      outSet.add(JSON.stringify([...parts, segment]));
    }
  }
}

function walkOpenclawSlugs(dir, parts, outSet) {
  if (!fs.existsSync(dir)) return;
  for (const name of fs.readdirSync(dir)) {
    if (name.startsWith('_') || name.startsWith('.')) continue;
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) {
      walkOpenclawSlugs(full, [...parts, name], outSet);
    } else if (name.endsWith('.md')) {
      const segment = name.replace(/\.md$/i, '');
      if (segment === 'README' && parts.length === 0) {
        outSet.add(JSON.stringify(['intro']));
      } else {
        outSet.add(JSON.stringify([...parts, segment]));
      }
    }
  }
}

function collectNavSlugs(navPath, outSet) {
  if (!fs.existsSync(navPath)) return;
  const data = JSON.parse(fs.readFileSync(navPath, 'utf8'));
  const items = data.items || [];
  for (const it of items) {
    if (it.type === 'doc' && it.slug) outSet.add(it.slug);
    if (it.type === 'category' && Array.isArray(it.items)) {
      for (const sub of it.items) {
        if (sub.slug) outSet.add(sub.slug);
      }
    }
  }
}

function walkDocsMdForHtmlUrls(absDocsRoot, acc) {
  if (!fs.existsSync(absDocsRoot)) return;
  for (const name of fs.readdirSync(absDocsRoot)) {
    if (name.startsWith('.')) continue;
    if (name.startsWith('_')) continue;
    walkDocsMdInner(path.join(absDocsRoot, name), name, acc);
  }
}

function walkDocsMdInner(absPath, relFromDocs, acc) {
  const st = fs.statSync(absPath);
  const base = path.basename(absPath);
  if (base.startsWith('_')) return;
  if (st.isDirectory()) {
    for (const name of fs.readdirSync(absPath)) {
      if (name.startsWith('.') || name.startsWith('_')) continue;
      walkDocsMdInner(path.join(absPath, name), path.posix.join(relFromDocs, name), acc);
    }
    return;
  }
  if (/\.(md|mdx)$/i.test(base)) {
    const htmlRel = relFromDocs.replace(/\.(md|mdx)$/i, '.html');
    acc.push(htmlRel.split(path.sep).join('/'));
  }
}

function slugArrToPath(segments) {
  return segments.length ? segments.join('/') : '';
}

function main() {
  add('/', { lastmod: LASTMOD, changefreq: 'daily', priority: 1.0 });

  for (const [p, cf, pr] of [
    ['/about-us', 'monthly', 0.75],
    ['/contact-us', 'monthly', 0.75],
    ['/privacy-policy', 'monthly', 0.75],
    ['/terms-of-service', 'monthly', 0.75],
    ['/chrome-plugin', 'monthly', 0.78],
    ['/ai-nav', 'weekly', 0.9],
    ['/ai-tutorial', 'weekly', 0.85],
    ['/ai-daily', 'daily', 0.9],
    ['/ai-daily/history', 'daily', 0.82],
    ['/blog', 'weekly', 0.85],
    ['/token-calculator/text', 'weekly', 0.9],
    ['/token-calculator/image', 'weekly', 0.9],
    ['/phone-verify', 'monthly', 0.75],
    ['/phone-verify/online-time', 'monthly', 0.72],
    ['/phone-verify/orders', 'monthly', 0.65],
    ['/vehicle-verify', 'monthly', 0.75],
    ['/vehicle-verify/orders', 'monthly', 0.65],
    ['/bank-card-verify', 'monthly', 0.72],
    ['/bank-card-verify/orders', 'monthly', 0.65],
    ['/user/credits', 'weekly', 0.7],
    ['/user/credits/recharge', 'weekly', 0.7],
    ['/verify-result', 'monthly', 0.65],
  ]) {
    add(p, { changefreq: cf, priority: pr });
  }

  const tools = [
    ['json', 'formatter'],
    ['json', 'compare'],
    ['time', 'timestamp'],
    ['time', 'cron'],
    ['text', 'compare'],
    ['text', 'process'],
    ['text', 'counter'],
    ['text', 'regex'],
    ['encode', 'base64'],
    ['encode', 'url'],
    ['image', 'imageNav'],
    ['code', 'formatter'],
  ];
  for (const [c, t] of tools) {
    add(`/tools/${c}/${t}`, { changefreq: 'monthly', priority: 0.8 });
  }

  const promptSet = new Set();
  for (const lang of ['zh', 'en']) {
    const base = path.join(PUBLIC, 'docs/prompts-learning', lang, 'current');
    walkMarkdownSlugs(base, [], promptSet);
  }
  for (const key of promptSet) {
    const slug = JSON.parse(key);
    const tail = slugArrToPath(slug);
    if (!tail) continue;
    const isIntro = tail === 'intro';
    add(`/prompt-tutorial/${tail}`, {
      changefreq: 'monthly',
      priority: isIntro ? 0.9 : 0.8,
    });
  }

  const blogSet = new Set();
  walkMarkdownSlugs(path.join(PUBLIC, 'docs/blog'), [], blogSet);
  for (const key of blogSet) {
    const slug = JSON.parse(key);
    const tail = slugArrToPath(slug);
    if (!tail) continue;
    add(`/blog/${tail}`, { changefreq: 'monthly', priority: tail === 'intro' ? 0.88 : 0.78 });
  }

  for (const slug of ['intro', 'home', 'what-are-skills', 'specification', 'integrate-skills']) {
    add(`/agent-skill/${slug}`, {
      changefreq: slug === 'intro' || slug === 'home' ? 'weekly' : 'monthly',
      priority: slug === 'intro' || slug === 'home' ? 0.9 : 0.8,
    });
  }

  const helloSlugs = new Set();
  for (const lang of ['zh', 'en']) {
    collectNavSlugs(path.join(PUBLIC, 'docs/hello-agents', lang, 'navigation.json'), helloSlugs);
  }
  for (const s of helloSlugs) {
    const isIntro = s === 'intro';
    add(`/hello-agents/${s}`, {
      changefreq: isIntro ? 'weekly' : 'monthly',
      priority: isIntro ? 0.95 : 0.82,
    });
  }

  const claudeSlugs = new Set();
  for (const lang of ['zh', 'en']) {
    collectNavSlugs(path.join(PUBLIC, 'docs/claude-tutorial', lang, 'navigation.json'), claudeSlugs);
  }
  for (const s of claudeSlugs) {
    const isIntro = s === 'intro';
    const isWalkthrough = s === 'claude-code-walkthrough';
    add(`/claude-tutorial/${s}`, {
      changefreq: isIntro ? 'weekly' : 'monthly',
      priority: isIntro ? 0.95 : isWalkthrough ? 0.9 : 0.85,
    });
  }

  const openclawSet = new Set();
  for (const lang of ['zh', 'en']) {
    walkOpenclawSlugs(path.join(PUBLIC, 'docs/openclaw-tutorial', lang), [], openclawSet);
  }
  for (const key of openclawSet) {
    const slug = JSON.parse(key);
    const tail = slugArrToPath(slug);
    if (!tail) continue;
    const isIntro = tail === 'intro';
    add(`/openclaw-tutorial/${tail}`, {
      changefreq: 'weekly',
      priority: isIntro ? 0.88 : 0.85,
    });
  }

  const docHtmlRels = [];
  walkDocsMdForHtmlUrls(path.join(PUBLIC, 'docs'), docHtmlRels);
  for (const rel of docHtmlRels) {
    const isReadme = /(^|\/)README\.html$/i.test(rel);
    const isAgentHome = /^agent-skills\/(zh|en)\/home\.html$/i.test(rel);
    const isPromptIntro = /^prompts-learning\/(zh|en)\/current\/intro\.html$/i.test(rel);
    const isClaudeReadme = /^claude-tutorial\/(zh|en)\/README\.html$/i.test(rel);
    const isOpenclawReadme = /^openclaw-tutorial\/(zh|en)\/README\.html$/i.test(rel);
    let priority = 0.86;
    if (isAgentHome || isPromptIntro || isClaudeReadme || isOpenclawReadme) priority = 0.92;
    else if (isReadme) priority = 0.9;
    add(`/docs/${rel}`, { changefreq: 'weekly', priority });
  }

  const sorted = [...byPath.entries()].sort((a, b) => a[0].localeCompare(b[0]));

  const body = sorted
    .map(([pathname, meta]) => {
      const loc = `${SITE}${pathname}`;
      return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${escapeXml(meta.lastmod)}</lastmod>
    <changefreq>${escapeXml(meta.changefreq)}</changefreq>
    <priority>${meta.priority}</priority>
  </url>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;

  fs.writeFileSync(OUT, xml, 'utf8');
  console.log(`[generate-sitemap] Wrote ${sorted.length} URL(s) → ${path.relative(ROOT, OUT)}`);
}

main();
