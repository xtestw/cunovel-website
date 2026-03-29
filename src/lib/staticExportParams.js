/**
 * 仅用于 `output: 'export'` 的 `generateStaticParams`：枚举**本地可穷举**的工具路径与文档 slug。
 *
 * 凡依赖登录态、订单历史、今日日报等**后端接口**的页面，不得在此按记录预生成路径（参见 `src/config/api.js` 注释）。
 */
import fs from 'fs';
import path from 'path';

/** 与 Tools 内嵌组件路由一致（不含仅外链的工具） */
export function getToolsStaticParams() {
  return [
    { category: 'json', tool: 'formatter' },
    { category: 'json', tool: 'compare' },
    { category: 'time', tool: 'timestamp' },
    { category: 'time', tool: 'cron' },
    { category: 'text', tool: 'compare' },
    { category: 'text', tool: 'process' },
    { category: 'text', tool: 'counter' },
    { category: 'text', tool: 'regex' },
    { category: 'encode', tool: 'base64' },
    { category: 'encode', tool: 'url' },
    { category: 'image', tool: 'imageNav' },
    { category: 'code', tool: 'formatter' },
  ];
}

/** 与 public/docs/agent-skills 下各语言的 docs.json navigation 一致 */
export function getAgentSkillStaticParams() {
  return [
    { slug: [] },
    { slug: ['intro'] },
    { slug: ['home'] },
    { slug: ['what-are-skills'] },
    { slug: ['specification'] },
    { slug: ['integrate-skills'] },
  ];
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

export function getPromptTutorialStaticParams() {
  const outSet = new Set();
  outSet.add(JSON.stringify([]));
  for (const lang of ['zh', 'en']) {
    const base = path.join(
      process.cwd(),
      'public/docs/prompts-learning',
      lang,
      'current'
    );
    walkMarkdownSlugs(base, [], outSet);
  }
  return [...outSet].map((s) => ({ slug: JSON.parse(s) }));
}

export function getBlogStaticParams() {
  const outSet = new Set();
  outSet.add(JSON.stringify([]));
  const base = path.join(process.cwd(), 'public/docs/blog');
  walkMarkdownSlugs(base, [], outSet);
  return [...outSet].map((s) => ({ slug: JSON.parse(s) }));
}

function collectHelloAgentsSlugsFromNav(navPath, outSet) {
  if (!fs.existsSync(navPath)) return;
  const raw = fs.readFileSync(navPath, 'utf8');
  const data = JSON.parse(raw);
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

/** 与 public/docs/hello-agents/{zh,en}/navigation.json 中的 slug 一致 */
export function getHelloAgentsStaticParams() {
  const slugs = new Set();
  for (const lang of ['zh', 'en']) {
    const navPath = path.join(process.cwd(), 'public/docs/hello-agents', lang, 'navigation.json');
    collectHelloAgentsSlugsFromNav(navPath, slugs);
  }
  const out = [{ slug: [] }];
  for (const s of slugs) {
    out.push({ slug: [s] });
  }
  return out;
}
