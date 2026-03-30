/**
 * 将 public/docs/hello-agents/zh 下 navigation.json 所列中文教程合并为单份 PDF。
 * 依赖：md-to-pdf（puppeteer）。运行：npm run export:hello-agents-pdf-zh
 *
 * 将 GitHub raw 图片 URL 替换为本地 images/，以加速渲染、减少外网依赖。
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { mdToPdf } from 'md-to-pdf';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '../..');
const ZH = path.join(ROOT, 'public/docs/hello-agents/zh');
const OUT_PDF = path.join(ZH, 'Hello-Agents-中文教程.pdf');

/** 使用本机 Chrome，避免 puppeteer 自带 Chromium 未下载或下载失败 */
function resolveChromeExecutable() {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) {
    return process.env.CHROME_PATH;
  }
  const mac = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  if (fs.existsSync(mac)) return mac;
  const macEdge = '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge';
  if (fs.existsSync(macEdge)) return macEdge;
  return undefined;
}

const GITHUB_IMAGES_PREFIX =
  'https://raw.githubusercontent.com/datawhalechina/Hello-Agents/main/docs/images/';

function stripFrontmatter(text) {
  const t = text.trim();
  if (!t.startsWith('---')) return text;
  const end = t.indexOf('\n---', 3);
  if (end === -1) return text;
  return t.slice(end + 4).trimStart();
}

function rewriteImageUrls(body) {
  return body.split(GITHUB_IMAGES_PREFIX).join('images/');
}

function collectOrderedFiles(items, out) {
  for (const it of items || []) {
    if (it.type === 'doc' && it.file) {
      out.push({ title: it.title, file: it.file });
    } else if (it.type === 'category' && it.items) {
      for (const sub of it.items) {
        if (sub.file) out.push({ title: sub.title, file: sub.file });
      }
    }
  }
}

async function main() {
  const navPath = path.join(ZH, 'navigation.json');
  if (!fs.existsSync(navPath)) {
    console.error('缺少 navigation.json:', navPath);
    process.exit(1);
  }
  const nav = JSON.parse(fs.readFileSync(navPath, 'utf8'));
  const ordered = [];
  collectOrderedFiles(nav.items, ordered);

  const parts = [];
  for (let i = 0; i < ordered.length; i++) {
    const { title, file } = ordered[i];
    const fp = path.join(ZH, file);
    if (!fs.existsSync(fp)) {
      console.error('文件不存在，跳过:', fp);
      continue;
    }
    let body = fs.readFileSync(fp, 'utf8');
    body = stripFrontmatter(body);
    body = rewriteImageUrls(body);
    const breaker = i > 0 ? '\n\n<div style="page-break-before: always;"></div>\n\n' : '\n\n';
    parts.push(`${breaker}# ${title}\n\n${body}`);
  }

  const merged = parts.join('\n');
  console.log('合并章节数:', ordered.length, '；近似字符数:', merged.length);

  const stylesheet = path.join(__dirname, 'hello-agents-pdf.css');
  const chromePath = resolveChromeExecutable();
  const launch_options = {
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    ...(chromePath ? { executablePath: chromePath } : {}),
  };
  if (!chromePath) {
    console.warn(
      '未检测到本机 Chrome/Edge，请设置环境变量 CHROME_PATH 指向浏览器可执行文件，或执行: npx puppeteer browsers install chrome'
    );
  }

  const result = await mdToPdf(
    { content: merged },
    {
      dest: OUT_PDF,
      basedir: ZH,
      stylesheet,
      pdf_options: {
        format: 'A4',
        printBackground: true,
        margin: { top: '14mm', right: '14mm', bottom: '16mm', left: '14mm' },
      },
      launch_options,
    }
  );

  const outFile = result?.filename || OUT_PDF;
  const stat = fs.statSync(outFile);
  console.log('已生成:', outFile, '（', Math.round(stat.size / 1024 / 1024), 'MB）');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
