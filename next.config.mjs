/** @type {import('next').NextConfig} */
const isStaticExport = process.env.NEXT_STATIC_EXPORT === '1';

const nextConfig = {
  reactStrictMode: true,
  compiler: {
    styledComponents: true,
  },
  webpack: (config) => {
    config.experiments = { ...config.experiments, asyncWebAssembly: true };
    return config;
  },
};

if (isStaticExport) {
  nextConfig.output = 'export';
  nextConfig.images = { unoptimized: true };
  // 静态导出不支持下面的 redirects / headers，请在 CDN/OSS 配置跳转与 Content-Type
} else {
  nextConfig.redirects = async () => [
    { source: '/tools', destination: '/tools/json/formatter', permanent: false },
    { source: '/prompt-tutorial', destination: '/prompt-tutorial/intro', permanent: false },
    { source: '/agent-skill', destination: '/agent-skill/intro', permanent: false },
    { source: '/token-calculator', destination: '/token-calculator/text', permanent: false },
    { source: '/json_format.html', destination: '/tools/json/formatter', permanent: true },
    { source: '/diff.html', destination: '/tools/text/compare', permanent: true },
    { source: '/regexr.html', destination: '/tools/text/regex', permanent: true },
    { source: '/sql_format.html', destination: '/tools/code/formatter', permanent: true },
    { source: '/url.html', destination: '/tools/encode/url', permanent: true },
  ];
  nextConfig.headers = async () => [
    {
      source: '/docs/:path*.md',
      headers: [
        { key: 'Content-Type', value: 'text/markdown; charset=utf-8' },
        { key: 'Cache-Control', value: 'public, max-age=3600' },
      ],
    },
    {
      source: '/docs/:path*.json',
      headers: [
        { key: 'Content-Type', value: 'application/json; charset=utf-8' },
        { key: 'Cache-Control', value: 'public, max-age=3600' },
      ],
    },
    {
      source: '/docs/:path*.html',
      headers: [
        { key: 'Content-Type', value: 'text/html; charset=utf-8' },
        { key: 'Cache-Control', value: 'public, max-age=3600' },
      ],
    },
  ];
}

export default nextConfig;
