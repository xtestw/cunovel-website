import Script from 'next/script';
import Providers from '@/components/Providers';
import AppShell from '@/components/AppShell';
import './globals.css';

export const metadata = {
  metadataBase: new URL('https://cutool.online'),
  title: {
    default: 'CuTool - 免费在线开发者工具箱 | JSON格式化、代码格式化、AI Token计算器',
    template: '%s | CuTool',
  },
  description:
    'CuTool - 免费在线开发者工具箱，提供JSON格式化、代码格式化、时间戳转换、文本对比、正则匹配、Base64编码、URL编码、AI Token计算器等实用工具。',
  keywords: [
    '开发者工具',
    '在线工具',
    'JSON格式化',
    'AI Token计算器',
    'CuTool',
  ],
  authors: [{ name: 'CuTool' }],
  applicationName: 'CuTool',
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    url: 'https://cutool.online/',
    title: 'CuTool - 免费在线开发者工具箱',
    description: '免费在线开发者工具箱与 AI 工具',
    images: ['https://cutool.online/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CuTool - 免费在线开发者工具箱',
    description: '免费在线开发者工具箱与 AI 工具',
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
  alternateName: 'CuTool在线工具箱',
  url: 'https://cutool.online/',
  description:
    '免费在线开发者工具箱，提供JSON格式化、代码格式化、时间戳转换、文本对比、正则匹配、Base64编码、URL编码、AI Token计算器等实用工具。',
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'Web',
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
