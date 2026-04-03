'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import { remarkMath, rehypeKatex } from '@/lib/markdownKatex';
import { rehypeHighlightPlugin } from '@/lib/markdownCodeHighlight';
import { extractPrerenderedBody } from '../../utils/prerenderedDoc';
import '../AgentSkill/AgentSkill.css';

function encodePublicDocSegments(file) {
  return file
    .split('/')
    .map((s) => encodeURIComponent(s))
    .join('/');
}

const ClaudeTutorial = () => {
  const { i18n, t } = useTranslation();
  const pathname = usePathname() || '';
  const router = useRouter();

  const routeDocPath = (() => {
    const m = pathname.match(/\/claude-tutorial\/(.*)/);
    const raw = m?.[1];
    return raw && raw.length > 0 ? decodeURIComponent(raw) : 'intro';
  })();

  const [sidebarData, setSidebarData] = useState([]);
  const [slugToFile, setSlugToFile] = useState(() => new Map());
  const [slugToTitle, setSlugToTitle] = useState(() => new Map());
  const [content, setContent] = useState('');
  const [renderHtml, setRenderHtml] = useState(null);
  const [currentDocFile, setCurrentDocFile] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [navReady, setNavReady] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({});

  const lang = i18n.language.startsWith('zh') ? 'zh' : 'en';
  const isZh = lang === 'zh';

  const removeFrontmatter = (text) => {
    let trimmed = text.trim();
    if (trimmed.startsWith('---')) {
      const firstLineEnd = trimmed.indexOf('\n');
      if (firstLineEnd === -1) return text;
      const secondDashIndex = trimmed.indexOf('---', firstLineEnd + 1);
      if (secondDashIndex !== -1) {
        const secondLineEnd = trimmed.indexOf('\n', secondDashIndex + 3);
        if (secondLineEnd !== -1) {
          trimmed = trimmed.substring(secondLineEnd + 1).trim();
        } else {
          trimmed = '';
        }
      }
    }
    return trimmed;
  };

  const walkNavigation = useCallback((items) => {
    const fileMap = new Map();
    const titleMap = new Map();
    const structure = [];

    for (const it of items || []) {
      if (it.type === 'doc' && it.slug && it.file) {
        fileMap.set(it.slug, it.file);
        titleMap.set(it.slug, it.title);
        structure.push({ type: 'doc', title: it.title, path: it.slug });
      } else if (it.type === 'category' && it.items) {
        const subItems = it.items.map((sub) => {
          if (sub.slug && sub.file) {
            fileMap.set(sub.slug, sub.file);
            titleMap.set(sub.slug, sub.title);
          }
          return { type: 'doc', title: sub.title, path: sub.slug };
        });
        structure.push({ type: 'category', title: it.title, items: subItems });
      }
    }

    return { structure, fileMap, titleMap };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setNavReady(false);
    setLoading(true);
    setContent('');
    setError(null);
    (async () => {
      try {
        const response = await fetch(`/docs/claude-tutorial/${lang}/navigation.json`);
        if (!response.ok) throw new Error('navigation.json');
        const data = await response.json();
        const { structure, fileMap, titleMap } = walkNavigation(data.items);
        if (!cancelled) {
          setSidebarData(structure);
          setSlugToFile(fileMap);
          setSlugToTitle(titleMap);
          setNavReady(true);
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setSidebarData([]);
          setSlugToFile(new Map());
          setSlugToTitle(new Map());
          setNavReady(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lang, walkNavigation]);

  const loadDocument = useCallback(
    async (slug) => {
      setLoading(true);
      setError(null);
      try {
        let file = slugToFile.get(slug);
        if (!file) file = slugToFile.get('intro');
        if (!file) throw new Error('No document mapping');

        const mdUrl = `/docs/claude-tutorial/${lang}/${encodePublicDocSegments(file)}`;
        const htmlFile = file.replace(/\.md$/i, '.html');
        const htmlUrl = `/docs/claude-tutorial/${lang}/${encodePublicDocSegments(htmlFile)}`;

        const htmlRes = await fetch(htmlUrl);
        if (htmlRes.ok) {
          const htmlText = await htmlRes.text();
          const fragment = extractPrerenderedBody(htmlText);
          if (fragment) {
            setRenderHtml(fragment);
            setContent('');
            setCurrentDocFile(file);
            return;
          }
        }

        setRenderHtml(null);
        const response = await fetch(mdUrl);
        if (!response.ok) throw new Error('Document not found');
        const text = await response.text();
        setContent(removeFrontmatter(text));
        setCurrentDocFile(file);
      } catch (err) {
        console.error(err);
        setError(err.message);
        setContent('');
        setRenderHtml(null);
        setCurrentDocFile('');
      } finally {
        setLoading(false);
      }
    },
    [lang, slugToFile]
  );

  useEffect(() => {
    if (!navReady) return;
    if (slugToFile.size === 0) {
      setLoading(false);
      setError(isZh ? '无法加载教程目录' : 'Failed to load tutorial index');
      return;
    }
    loadDocument(routeDocPath);
  }, [routeDocPath, navReady, slugToFile, loadDocument, isZh]);

  const handleNavClick = (path) => router.push(`/claude-tutorial/${path}`);
  const isActive = (path) => routeDocPath === path;
  const categoryHasActiveDoc = (category) =>
    Array.isArray(category?.items) && category.items.some((sub) => isActive(sub.path));

  useEffect(() => {
    if (!sidebarData.length) return;
    const categories = sidebarData.filter((item) => item.type === 'category');
    const activeCategory = categories.find((item) => categoryHasActiveDoc(item));
    setExpandedCategories((prev) => {
      const next = { ...prev };
      if (activeCategory) {
        next[activeCategory.title] = true;
        return next;
      }
      if (Object.keys(next).length === 0 && categories.length > 0) {
        next[categories[0].title] = true;
      }
      return next;
    });
  }, [sidebarData, routeDocPath]);

  const renderSidebarItem = (item, level = 0) => {
    if (item.type === 'category') {
      const expanded = expandedCategories[item.title] ?? categoryHasActiveDoc(item);
      return (
        <div key={item.title} className={`sidebar-category sidebar-level-${level}`}>
          <div
            className="sidebar-category-title"
            role="button"
            tabIndex={0}
            onClick={() =>
              setExpandedCategories((prev) => ({ ...prev, [item.title]: !expanded }))
            }
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setExpandedCategories((prev) => ({ ...prev, [item.title]: !expanded }));
              }
            }}
          >
            {expanded ? '▾ ' : '▸ '}
            {item.title}
          </div>
          {expanded && item.items && item.items.map((subItem) => renderSidebarItem(subItem, level + 1))}
        </div>
      );
    }
    return (
      <div
        key={item.path}
        className={`sidebar-item sidebar-level-${level} ${isActive(item.path) ? 'active' : ''}`}
        onClick={() => handleNavClick(item.path)}
        role="presentation"
      >
        {item.title}
      </div>
    );
  };

  const pageTitle = slugToTitle.get(routeDocPath) || slugToTitle.get('intro') || 'ClaudeCode Code Walkthrough';
  const seoTitle = isZh
    ? `${pageTitle} - ClaudeCode 代码解读教程 | CUTool`
    : `${pageTitle} - ClaudeCode Code Walkthrough | CUTool`;
  const seoDescription = isZh
    ? 'ClaudeCode 代码解读教程在线阅读，聚焦架构、主流程和关键源码实现。'
    : 'ClaudeCode code walkthrough tutorial, focusing on architecture, main flow, and key source implementation.';
  const seoKeywords = isZh
    ? 'ClaudeCode,代码解读,AI教程,源码分析'
    : 'ClaudeCode,code walkthrough,AI tutorial,source code analysis';

  const currentUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${pathname}`
      : 'https://cutool.online/claude-tutorial/intro';

  const resolveImgSrc = (src) => {
    if (!src || src.startsWith('http') || src.startsWith('data:')) return src;
    const dir = currentDocFile.includes('/') ? currentDocFile.replace(/\/[^/]+$/, '') : '';
    const rel = src.startsWith('./') ? src.slice(2) : src;
    const base = dir ? `${dir}/${rel}` : rel;
    return `/docs/claude-tutorial/${lang}/${encodePublicDocSegments(base)}`;
  };

  return (
    <>
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <meta name="keywords" content={seoKeywords} />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={currentUrl} />
        <link rel="canonical" href={currentUrl} />
      </Helmet>
      <div className="agent-skill-container">
        <div className={`agent-skill-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
          <div className="sidebar-header">
            <h2>{t('common.claudeCodeTutorial')}</h2>
            <button
              type="button"
              className="sidebar-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? '←' : '→'}
            </button>
          </div>
          <div className="sidebar-content">{sidebarData.map((item) => renderSidebarItem(item))}</div>
        </div>
        <div className="agent-skill-main">
          {!sidebarOpen && (
            <button
              type="button"
              className="sidebar-open-button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              ☰
            </button>
          )}
          {!navReady || loading ? (
            <div className="loading">{isZh ? '加载中...' : 'Loading...'}</div>
          ) : error ? (
            <div className="error">
              <h2>{isZh ? '加载失败' : 'Failed to load'}</h2>
              <p>{error}</p>
              <button type="button" onClick={() => router.push('/claude-tutorial/intro')} className="back-button">
                {isZh ? '返回首页' : 'Back to Home'}
              </button>
            </div>
          ) : renderHtml !== null ? (
            <div className="markdown-content" dangerouslySetInnerHTML={{ __html: renderHtml }} />
          ) : (
            <div className="markdown-content">
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeRaw, rehypeSanitize, rehypeKatex, rehypeHighlightPlugin]}
                components={{
                  img: ({ node, ...props }) => (
                    <img
                      {...props}
                      src={resolveImgSrc(props.src || '')}
                      alt={props.alt || ''}
                      style={{ maxWidth: '100%', height: 'auto' }}
                    />
                  ),
                  a: ({ node, ...props }) => {
                    if (props.href && props.href.startsWith('/claude-tutorial/')) {
                      return (
                        <a
                          {...props}
                          href={props.href}
                          onClick={(e) => {
                            e.preventDefault();
                            router.push(props.href);
                          }}
                        />
                      );
                    }
                    return <a {...props} target="_blank" rel="noopener noreferrer" />;
                  },
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ClaudeTutorial;
