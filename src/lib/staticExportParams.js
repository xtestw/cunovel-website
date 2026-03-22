import fs from 'fs';
import path from 'path';

/** 构建期拉取日报列表（与 src/config/api 服务端分支一致，不读 window） */
function buildTimeApiBase() {
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.REACT_APP_API_BASE_URL ||
    (process.env.NODE_ENV === 'development'
      ? 'http://localhost:3003/api'
      : 'https://api.cutool.online/api')
  );
}

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

export async function getAiDailyDateParams() {
  try {
    const base = buildTimeApiBase();
    const r = await fetch(
      `${base}/ai-daily/history?lang=zh&page=1&pageSize=300`,
      { cache: 'no-store' }
    );
    if (!r.ok) return [];
    const data = await r.json();
    const list = Array.isArray(data?.data)
      ? data.data
      : Array.isArray(data)
        ? data
        : [];
    const dates = [
      ...new Set(
        list.map((item) => item?.date).filter(Boolean)
      ),
    ];
    return dates.map((date) => ({ date: String(date) }));
  } catch {
    return [];
  }
}

export async function getAiDailyNewsParams() {
  const dateParams = await getAiDailyDateParams();
  const base = buildTimeApiBase();
  const out = [];
  for (const { date } of dateParams) {
    try {
      const r = await fetch(`${base}/ai-daily/${date}?lang=zh`, {
        cache: 'no-store',
      });
      if (!r.ok) continue;
      const daily = await r.json();
      const n = Array.isArray(daily?.news) ? daily.news.length : 0;
      for (let i = 0; i < n; i++) {
        out.push({ date: String(date), newsId: String(i) });
      }
    } catch {
      /* 单日失败则跳过 */
    }
  }
  return out;
}
