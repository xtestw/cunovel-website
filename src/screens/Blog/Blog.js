'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { usePathname, useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './Blog.css';

const BLOG_SIDEBAR = [
  { title: '博客介绍', path: 'intro' },
  { title: '《Attention Is All You Need》解读', path: 'attention-is-all-you-need' },
  // { title: '第一篇文章', path: 'first-post' },
];

function removeFrontmatter(text) {
  const trimmed = text.trim();
  if (!trimmed.startsWith('---')) return text;
  const firstLineEnd = trimmed.indexOf('\n');
  if (firstLineEnd === -1) return text;
  const secondDashIndex = trimmed.indexOf('---', firstLineEnd + 1);
  if (secondDashIndex === -1) return text;
  const secondLineEnd = trimmed.indexOf('\n', secondDashIndex + 3);
  if (secondLineEnd === -1) return '';
  return trimmed.substring(secondLineEnd + 1).trim();
}

export default function Blog() {
  const pathname = usePathname() || '';
  const router = useRouter();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const routeDocPath = useMemo(() => {
    const m = pathname.match(/\/blog\/(.*)/);
    const raw = m?.[1];
    return raw && raw.length > 0 ? raw : 'intro';
  }, [pathname]);

  useEffect(() => {
    const loadDocument = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/docs/blog/${routeDocPath}.md`);
        if (!response.ok) {
          throw new Error('文章不存在');
        }
        const text = await response.text();
        setContent(removeFrontmatter(text));
      } catch (err) {
        setError(err.message || '加载失败');
        setContent('');
      } finally {
        setLoading(false);
      }
    };
    loadDocument();
  }, [routeDocPath]);

  return (
    <>
      <Helmet>
        <title>博客 | CUTool</title>
        <meta name="description" content="CUTool 博客内容，使用 markdown 编写与维护。" />
      </Helmet>
      <div className="blog-container">
        <div className={`blog-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
          <div className="blog-sidebar-header">
            <h2>博客</h2>
            <button
              className="blog-sidebar-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? '←' : '→'}
            </button>
          </div>
          <div className="blog-sidebar-content">
            {BLOG_SIDEBAR.map((item) => (
              <div
                key={item.path}
                className={`blog-sidebar-item ${routeDocPath === item.path ? 'active' : ''}`}
                onClick={() => router.push(`/blog/${item.path}`)}
              >
                {item.title}
              </div>
            ))}
          </div>
        </div>
        <div className="blog-main">
          {!sidebarOpen && (
            <button className="blog-sidebar-open-button" onClick={() => setSidebarOpen(true)} aria-label="Open sidebar">
              ☰
            </button>
          )}
          {loading ? (
            <div className="blog-state">加载中...</div>
          ) : error ? (
            <div className="blog-state">
              <h3>加载失败</h3>
              <p>{error}</p>
              <button className="blog-back-button" onClick={() => router.push('/blog/intro')}>
                返回博客首页
              </button>
            </div>
          ) : (
            <div className="blog-markdown-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
