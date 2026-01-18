import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import './AgentSkill.css';

const AgentSkill = () => {
  const { i18n, t } = useTranslation();
  const params = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarData, setSidebarData] = useState([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // 获取当前语言代码（zh 或 en）
  const getLanguageCode = () => {
    return i18n.language.startsWith('zh') ? 'zh' : 'en';
  };

  // 构建文档路径
  const getDocPath = (path = '') => {
    const lang = getLanguageCode();
    const basePath = `/docs/agent-skills/${lang}`;
    if (!path || path === 'intro') {
      // 默认尝试 home.mdx，如果没有则尝试 intro.md
      return `${basePath}/home.mdx`;
    }
    // 如果路径已经包含扩展名，直接使用
    if (path.endsWith('.md') || path.endsWith('.mdx')) {
      return `${basePath}/${path}`;
    }
    // 否则先尝试 .mdx，再尝试 .md
    return `${basePath}/${path}.mdx`;
  };

  // 加载侧边栏数据
  useEffect(() => {
    loadSidebarData();
  }, [i18n.language]);

  // 加载文档内容
  useEffect(() => {
    // 从 URL 路径中提取文档路径
    const pathMatch = location.pathname.match(/\/agent-skill\/(.*)/);
    const path = pathMatch ? pathMatch[1] : 'intro';
    loadDocument(path);
  }, [location.pathname, i18n.language]);

  const loadSidebarData = async () => {
    try {
      const lang = getLanguageCode();
      const response = await fetch(`/docs/agent-skills/${lang}/docs.json`);
      if (!response.ok) {
        throw new Error('Failed to load docs.json');
      }
      const data = await response.json();
      
      // 根据 docs.json 构建侧边栏结构
      const structure = buildSidebarStructure(data);
      setSidebarData(structure);
    } catch (err) {
      console.error('Error loading sidebar:', err);
      // 如果加载失败，使用默认结构
      setSidebarData(getDefaultSidebarStructure());
    }
  };

  const buildSidebarStructure = (jsonData) => {
    const lang = getLanguageCode();
    const isZh = lang === 'zh';
    
    // 从 docs.json 的 navigation.pages 构建侧边栏
    if (jsonData.navigation && jsonData.navigation.pages) {
      return jsonData.navigation.pages.map(page => {
        // 将页面名称转换为标题
        const title = formatPageTitle(page, isZh);
        return {
          title: title,
          path: page === 'home' ? 'intro' : page,
          type: 'doc'
        };
      });
    }
    
    return getDefaultSidebarStructure();
  };

  const formatPageTitle = (pageName, isZh) => {
    // 将页面名称转换为可读的标题
    const titleMap = {
      'home': isZh ? '首页' : 'Home',
      'what-are-skills': isZh ? '什么是技能' : 'What are skills?',
      'specification': isZh ? '规范' : 'Specification',
      'integrate-skills': isZh ? '集成技能' : 'Integrate skills'
    };
    
    return titleMap[pageName] || pageName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getDefaultSidebarStructure = () => {
    const lang = getLanguageCode();
    const isZh = lang === 'zh';
    
    return [
      {
        title: isZh ? '首页' : 'Home',
        path: 'intro',
        type: 'doc'
      }
    ];
  };

  // 移除 frontmatter 和 import 语句
  const removeFrontmatter = (text) => {
    let trimmed = text.trim();
    
    // 移除 frontmatter
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
    
    // 移除 import 语句（MDX 特有）
    const lines = trimmed.split('\n');
    const filteredLines = lines.filter(line => {
      const trimmedLine = line.trim();
      return !trimmedLine.startsWith('import ') && !trimmedLine.startsWith('export ');
    });
    
    return filteredLines.join('\n').trim();
  };

  const loadDocument = async (path) => {
    setLoading(true);
    setError(null);
    try {
      // 如果路径是 intro，尝试加载 home.mdx
      const actualPath = path === 'intro' ? 'home' : path;
      let docPath = getDocPath(actualPath);
      let response = await fetch(docPath);
      
      // 如果 .mdx 不存在，尝试 .md
      if (!response.ok && !docPath.endsWith('.md')) {
        docPath = docPath.replace('.mdx', '.md');
        response = await fetch(docPath);
      }
      
      // 如果还是不存在，尝试 intro.md
      if (!response.ok && actualPath !== 'intro') {
        docPath = getDocPath('intro');
        response = await fetch(docPath);
      }
      
      if (!response.ok) {
        throw new Error('Document not found');
      }
      
      const text = await response.text();
      const contentWithoutFrontmatter = removeFrontmatter(text);
      setContent(contentWithoutFrontmatter);
    } catch (err) {
      console.error('Error loading document:', err);
      setError(err.message);
      // 如果文档不存在，显示默认内容
      const lang = getLanguageCode();
      const isZh = lang === 'zh';
      setContent(isZh ? 
        '# Agent Skill\n\n欢迎来到 Agent Skill 页面。内容即将更新。' :
        '# Agent Skill\n\nWelcome to Agent Skill page. Content will be updated soon.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleNavClick = (path) => {
    navigate(`/agent-skill/${path}`);
  };

  const isActive = (path) => {
    const pathMatch = location.pathname.match(/\/agent-skill\/(.*)/);
    const currentPath = pathMatch ? pathMatch[1] : 'intro';
    return currentPath === path;
  };

  const renderSidebarItem = (item, level = 0) => {
    if (item.type === 'category') {
      return (
        <div key={item.title} className={`sidebar-category sidebar-level-${level}`}>
          <div className="sidebar-category-title">{item.title}</div>
          {item.items && item.items.map((subItem) => renderSidebarItem(subItem, level + 1))}
        </div>
      );
    } else {
      return (
        <div
          key={item.path}
          className={`sidebar-item sidebar-level-${level} ${isActive(item.path) ? 'active' : ''}`}
          onClick={() => handleNavClick(item.path)}
        >
          {item.title}
        </div>
      );
    }
  };

  const lang = getLanguageCode();
  const isZh = lang === 'zh';
  
  // 获取当前页面路径
  const pathMatch = location.pathname.match(/\/agent-skill\/(.*)/);
  const currentPath = pathMatch ? pathMatch[1] : 'intro';
  const actualPath = currentPath === 'intro' ? 'home' : currentPath;
  
  // 根据路径生成 SEO 信息
  const getSEOTitle = () => {
    const titleMap = {
      'home': isZh ? 'Agent Skills 概述 - AI 智能体技能教程 | CUTool' : 'Agent Skills Overview - AI Agent Skills Tutorial | CUTool',
      'what-are-skills': isZh ? '什么是 Agent Skills？- AI 智能体技能指南 | CUTool' : 'What are Agent Skills? - AI Agent Skills Guide | CUTool',
      'specification': isZh ? 'Agent Skills 规范 - 完整格式说明 | CUTool' : 'Agent Skills Specification - Complete Format Guide | CUTool',
      'integrate-skills': isZh ? '集成 Agent Skills - 为智能体添加技能支持 | CUTool' : 'Integrate Agent Skills - Add Skills Support to Your Agent | CUTool',
    };
    return titleMap[actualPath] || (isZh ? 'Agent Skill | CUTool' : 'Agent Skill | CUTool');
  };
  
  const getSEODescription = () => {
    const descMap = {
      'home': isZh 
        ? 'Agent Skills 是一个简单、开放的格式，用于为 AI 智能体提供新的能力和专业知识。了解如何通过技能扩展智能体的功能。'
        : 'Agent Skills is a simple, open format for giving AI agents new capabilities and expertise. Learn how to extend agent functionality through skills.',
      'what-are-skills': isZh
        ? '了解 Agent Skills 是什么，它们如何工作，以及为什么重要。Agent Skills 是一种轻量级、开放的格式，用于通过专业知识和工作流扩展 AI 智能体的能力。'
        : 'Learn what Agent Skills are, how they work, and why they matter. Agent Skills is a lightweight, open format for extending AI agent capabilities with specialized knowledge and workflows.',
      'specification': isZh
        ? 'Agent Skills 格式的完整规范说明，包括 SKILL.md 文件格式、目录结构、元数据字段和最佳实践。'
        : 'Complete specification for the Agent Skills format, including SKILL.md file format, directory structure, metadata fields, and best practices.',
      'integrate-skills': isZh
        ? '学习如何为您的 AI 智能体或开发工具添加 Agent Skills 支持。包括技能发现、元数据加载、匹配和激活的完整指南。'
        : 'Learn how to add Agent Skills support to your AI agent or development tool. Complete guide including skill discovery, metadata loading, matching, and activation.',
    };
    return descMap[actualPath] || (isZh ? 'AI Agent 技能教程和文档' : 'AI Agent Skills Tutorial and Documentation');
  };
  
  const getSEOKeywords = () => {
    const keywordsMap = {
      'home': isZh 
        ? 'Agent Skills,AI Agent,智能体技能,AI 技能,Agent 技能格式,AI 工具,智能体开发'
        : 'Agent Skills,AI Agent,agent skills,AI skills,agent skill format,AI tools,agent development',
      'what-are-skills': isZh
        ? 'Agent Skills,什么是技能,SKILL.md,智能体技能,AI Agent 技能,技能格式'
        : 'Agent Skills,what are skills,SKILL.md,agent skills,AI agent skills,skill format',
      'specification': isZh
        ? 'Agent Skills 规范,SKILL.md 格式,技能规范,智能体技能格式,元数据,技能开发'
        : 'Agent Skills specification,SKILL.md format,skill specification,agent skill format,metadata,skill development',
      'integrate-skills': isZh
        ? '集成 Agent Skills,智能体集成,技能支持,AI Agent 开发,技能发现,技能激活'
        : 'integrate Agent Skills,agent integration,skills support,AI agent development,skill discovery,skill activation',
    };
    return keywordsMap[actualPath] || (isZh ? 'Agent Skill,AI Agent,AI教程' : 'Agent Skill,AI Agent,AI Tutorial');
  };
  
  const currentUrl = typeof window !== 'undefined' ? `${window.location.origin}${location.pathname}` : 'https://cutool.online/agent-skill';
  const seoTitle = getSEOTitle();
  const seoDescription = getSEODescription();
  const seoKeywords = getSEOKeywords();

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
        <meta property="og:site_name" content="CUTool" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={seoDescription} />
        <link rel="canonical" href={currentUrl} />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": seoTitle,
            "description": seoDescription,
            "url": currentUrl,
            "author": {
              "@type": "Organization",
              "name": "CUTool"
            },
            "publisher": {
              "@type": "Organization",
              "name": "CUTool",
              "logo": {
                "@type": "ImageObject",
                "url": "https://cutool.online/logo512.png"
              }
            },
            "datePublished": "2026-01-18",
            "dateModified": "2026-01-18",
            "mainEntityOfPage": {
              "@type": "WebPage",
              "@id": currentUrl
            }
          })}
        </script>
      </Helmet>
      <div className="agent-skill-container">
        <div className={`agent-skill-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
          <div className="sidebar-header">
            <h2>{t('common.agentSkill')}</h2>
            <button 
              className="sidebar-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? '←' : '→'}
            </button>
          </div>
          <div className="sidebar-content">
            {sidebarData.map((item) => renderSidebarItem(item))}
          </div>
        </div>
        <div className="agent-skill-main">
          {!sidebarOpen && (
            <button 
              className="sidebar-open-button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              ☰
            </button>
          )}
          {loading ? (
            <div className="loading">{isZh ? '加载中...' : 'Loading...'}</div>
          ) : error ? (
            <div className="error">
              <h2>{isZh ? '加载失败' : 'Failed to load'}</h2>
              <p>{error}</p>
              <button onClick={() => navigate('/agent-skill/intro')} className="back-button">
                {isZh ? '返回首页' : 'Back to Home'}
              </button>
            </div>
          ) : (
            <div className="markdown-content">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw, rehypeSanitize]}
                components={{
                  img: ({ node, ...props }) => {
                    let src = props.src || '';
                    if (src && !src.startsWith('http') && !src.startsWith('/')) {
                      const currentPath = location.pathname.match(/\/agent-skill\/(.*)/)?.[1] || 'intro';
                      const actualPath = currentPath === 'intro' ? 'home' : currentPath;
                      const pathParts = actualPath.split('/');
                      pathParts.pop();
                      const basePath = pathParts.length > 0 ? pathParts.join('/') : '';
                      src = `/docs/agent-skills/${lang}/${basePath ? basePath + '/' : ''}${src}`;
                    } else if (src && src.startsWith('./')) {
                      const currentPath = location.pathname.match(/\/agent-skill\/(.*)/)?.[1] || 'intro';
                      const actualPath = currentPath === 'intro' ? 'home' : currentPath;
                      const pathParts = actualPath.split('/');
                      pathParts.pop();
                      const basePath = pathParts.length > 0 ? pathParts.join('/') : '';
                      src = `/docs/agent-skills/${lang}/${basePath ? basePath + '/' : ''}${src.replace('./', '')}`;
                    }
                    return (
                      <img 
                        {...props} 
                        src={src}
                        alt={props.alt || ''} 
                        style={{ maxWidth: '100%', height: 'auto' }} 
                      />
                    );
                  },
                  a: ({ node, ...props }) => {
                    if (props.href && props.href.startsWith('/agent-skill/')) {
                      return (
                        <a
                          {...props}
                          onClick={(e) => {
                            e.preventDefault();
                            navigate(props.href);
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

export default AgentSkill;

