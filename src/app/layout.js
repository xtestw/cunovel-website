import Script from 'next/script';
import Providers from '@/components/Providers';
import AppShell from '@/components/AppShell';
import './globals.css';
import 'katex/dist/katex.min.css';
import 'highlight.js/styles/github.css';
import '@/styles/markdown-code-overrides.css';

export const metadata = {
  metadataBase: new URL('https://cutool.online'),
  title: {
    default:
      'CuTool - 在线开发者工具与 AI 教程站 | JSON 格式化、Token 计算、Prompt、Agent、Claude Code',
    template: '%s | CuTool',
  },
  description:
    'CuTool 是在线开发者工具与 AI 资料站：JSON/代码格式化、时间戳、文本与编解码工具；AI 日报、AI 导航、大模型 Token 计算器；Prompt 教程、Agent Skill 规范、Hello-Agents 智能体教程、Claude Code 源码解读等，免费在线使用。',
  keywords: [
    'CuTool',
    '在线工具',
    '开发者工具',
    'JSON 格式化',
    'AI 工具',
    '人工智能',
    '大模型',
    'LLM',
    'AI 教程',
    'Prompt 工程',
    'Prompt 教程',
    'AI Agent',
    '智能体',
    'Agent Skill',
    'MCP',
    'Claude',
    'Claude Code',
    'OpenAI',
    'ChatGPT',
    'Gemini',
    'AI Token 计算器',
    'Token 计算',
    'AI 日报',
    'AI 导航',
    'Hello-Agents',
    'Datawhale',
    '上下文工程',
    '源码解读',
  ],
  authors: [{ name: 'CuTool' }],
  applicationName: 'CuTool',
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    url: 'https://cutool.online/',
    title: 'CuTool - 在线开发者工具与 AI 教程',
    description:
      '开发者在线工具 + AI 日报、Token 计算、Prompt/Agent 教程、Claude Code 解读、Hello-Agents 智能体教程，一站可查。',
    images: ['https://cutool.online/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CuTool - 在线开发者工具与 AI 教程',
    description:
      '开发者在线工具 + AI 日报、Token 计算、Prompt/Agent 教程、Claude Code 解读、Hello-Agents 智能体教程。',
    images: ['https://cutool.online/og-image.jpg'],
  },
  alternates: { canonical: 'https://cutool.online/' },
  other: {
    'sogou_site_verification': '0ZZ5kf0BG4',
    '360-site-verification': '6d82a11803ef6749aad7340caf7f9bb4',
  },
};

const jsonLdWebApp = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'CuTool',
  alternateName: 'CuTool在线工具箱 · CUTool AI 工具与教程',
  url: 'https://cutool.online/',
  description:
    '在线开发者工具与人工智能相关资源：JSON/代码格式化、时间戳与文本工具；AI 日报与导航、大模型 Token 估算；Prompt 教程、Agent Skill、Hello-Agents 智能体教程、Claude Code 源码解读等。',
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'Web',
  keywords:
    'AI,LLM,Prompt,Agent,Claude Code,Token,MCP,智能体,大模型,AI教程,开发者工具',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
};

const noscriptHtml = `<!--static-noscript-fallback-->
<div style="max-width:720px;margin:24px auto;padding:20px;line-height:1.65;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#333">
<p><strong>CuTool</strong>：在线开发者工具与 AI 相关文档。带侧栏与路由的完整站点需要启用 JavaScript。</p>
<p>以下页面为<strong>预生成的静态 HTML</strong>，无需脚本即可阅读正文：</p>
<h2 style="font-size:1.15rem;margin-top:1.25rem">Agent Skills</h2>
<ul>
<li><a href="/docs/agent-skills/zh/home.html">概述（中文全文）</a></li>
<li><a href="/docs/agent-skills/en/home.html">Overview (English)</a></li>
<li><a href="/docs/agent-skills/zh/what-are-skills.html">什么是技能（中文）</a></li>
<li><a href="/docs/agent-skills/zh/specification.html">规范（中文）</a></li>
<li><a href="/docs/agent-skills/zh/integrate-skills.html">集成技能（中文）</a></li>
</ul>
<h2 style="font-size:1.15rem;margin-top:1.25rem">Prompt 教程</h2>
<ul>
<li><a href="/docs/prompts-learning/zh/current/intro.html">欢迎页（中文）</a></li>
<li><a href="/docs/prompts-learning/en/current/intro.html">Introduction (English)</a></li>
</ul>
<h2 style="font-size:1.15rem;margin-top:1.25rem">Claude Code 教程</h2>
<ul>
<li><a href="/docs/claude-tutorial/zh/README.html">教程首页（中文预渲染）</a></li>
<li><a href="/docs/claude-tutorial/en/README.html">Introduction (English prerender)</a></li>
</ul>
<p style="margin-top:1rem;color:#555">可访问 <a href="/">首页</a> 查看导航。</p>
</div>`;

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/logo192.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body suppressHydrationWarning>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebApp) }}
        />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-NFZJRDSN77"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-NFZJRDSN77');
          `}
        </Script>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1217509255829092"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        <noscript dangerouslySetInnerHTML={{ __html: noscriptHtml }} />
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
