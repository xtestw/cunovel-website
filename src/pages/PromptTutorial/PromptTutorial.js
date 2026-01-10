import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import './PromptTutorial.css';

const PromptTutorial = () => {
  const { i18n } = useTranslation();
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
    const basePath = `/docs/prompts-learning/${lang}/current`;
    if (!path) {
      return `${basePath}/intro.md`;
    }
    // 如果路径以 .md 结尾，直接使用
    if (path.endsWith('.md')) {
      return `${basePath}/${path}`;
    }
    // 否则添加 .md
    return `${basePath}/${path}.md`;
  };

  // 加载侧边栏数据
  useEffect(() => {
    loadSidebarData();
  }, [i18n.language]);

  // 加载文档内容
  useEffect(() => {
    // 从 URL 路径中提取文档路径
    const pathMatch = location.pathname.match(/\/prompt-tutorial\/(.*)/);
    const path = pathMatch ? pathMatch[1] : 'intro';
    loadDocument(path);
  }, [location.pathname, i18n.language]);

  const loadSidebarData = async () => {
    try {
      const lang = getLanguageCode();
      const response = await fetch(`/docs/prompts-learning/${lang}/current.json`);
      if (!response.ok) {
        throw new Error('Failed to load sidebar data');
      }
      const data = await response.json();
      
      // 构建侧边栏结构
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
    
    // 根据 current.json 和实际文件结构构建侧边栏
    // 这里我们根据文件系统结构来构建
    const structure = [
      {
        title: isZh ? '欢迎' : 'Welcome',
        path: 'intro',
        type: 'doc'
      },
      {
        title: isZh ? '😃 基础' : '😃 Basics',
        type: 'category',
        items: [
          { title: isZh ? '介绍' : 'Introduction', path: 'basics/intro', type: 'doc' },
          { title: isZh ? '提示词基础' : 'Prompting', path: 'basics/prompting', type: 'doc' },
          { title: isZh ? '聊天机器人基础' : 'Chatbot Basics', path: 'basics/chatbot_basics', type: 'doc' },
          { title: isZh ? '指令' : 'Instructions', path: 'basics/instructions', type: 'doc' },
          { title: isZh ? '角色' : 'Roles', path: 'basics/roles', type: 'doc' },
          { title: isZh ? '标准提示' : 'Standard Prompt', path: 'basics/standard_prompt', type: 'doc' },
          { title: isZh ? '提示词进阶' : 'More on Prompting', path: 'basics/more_on_prompting', type: 'doc' },
          { title: isZh ? '世界知识' : 'World Knowledge', path: 'basics/world', type: 'doc' },
        ]
      },
      {
        title: isZh ? '💼 基础应用' : '💼 Basic Applications',
        type: 'category',
        items: [
          { title: isZh ? '介绍' : 'Introduction', path: 'basic_applications/introduction', type: 'doc' },
          { title: isZh ? '写邮件' : 'Writing Emails', path: 'basic_applications/writing_emails', type: 'doc' },
        ]
      },
      {
        title: isZh ? '🧙‍♂️ 进阶' : '🧙‍♂️ Intermediate',
        type: 'category',
        items: [
          { title: isZh ? '提示词中的内容' : "What's in a Prompt", path: 'intermediate/whats_in_a_prompt', type: 'doc' },
          { title: isZh ? '思维链' : 'Chain of Thought', path: 'intermediate/chain_of_thought', type: 'doc' },
          { title: isZh ? '零样本思维链' : 'Zero-Shot CoT', path: 'intermediate/zero_shot_cot', type: 'doc' },
          { title: isZh ? '自洽性' : 'Self-Consistency', path: 'intermediate/self_consistency', type: 'doc' },
          { title: isZh ? '生成知识' : 'Generated Knowledge', path: 'intermediate/generated_knowledge', type: 'doc' },
          { title: isZh ? '最少到最多' : 'Least to Most', path: 'intermediate/least_to_most', type: 'doc' },
        ]
      },
      {
        title: isZh ? '🧪 提示的应用' : '🧪 Applied Prompting',
        type: 'category',
        items: [
          { title: isZh ? '概述' : 'Overview', path: 'applied_prompting/overview', type: 'doc' },
          { title: isZh ? '构建 ChatGPT' : 'Build ChatGPT', path: 'applied_prompting/build_chatgpt', type: 'doc' },
          { title: isZh ? '从知识库构建聊天机器人' : 'Build Chatbot from KB', path: 'applied_prompting/build_chatbot_from_kb', type: 'doc' },
          { title: isZh ? '简短回复' : 'Short Response', path: 'applied_prompting/short_response', type: 'doc' },
          { title: isZh ? 'MC 教程' : 'MC Tutorial', path: 'applied_prompting/mc_tutorial', type: 'doc' },
        ]
      },
      {
        title: isZh ? '🚀 高级应用' : '🚀 Advanced Applications',
        type: 'category',
        items: [
          { title: isZh ? '概述' : 'Overview', path: 'advanced_applications/overview', type: 'doc' },
          { title: 'ReAct', path: 'advanced_applications/react', type: 'doc' },
          { title: 'MRKL', path: 'advanced_applications/mrkl', type: 'doc' },
          { title: 'PAL', path: 'advanced_applications/pal', type: 'doc' },
        ]
      },
      {
        title: isZh ? '⚖️ 可靠性' : '⚖️ Reliability',
        type: 'category',
        items: [
          { title: isZh ? '介绍' : 'Introduction', path: 'reliability/intro', type: 'doc' },
          { title: isZh ? '校准' : 'Calibration', path: 'reliability/calibration', type: 'doc' },
          { title: isZh ? '去偏见' : 'Debiasing', path: 'reliability/debiasing', type: 'doc' },
          { title: isZh ? '多样性' : 'Diversity', path: 'reliability/diverse', type: 'doc' },
          { title: isZh ? '语言模型自我评估' : 'LM Self-Eval', path: 'reliability/lm_self_eval', type: 'doc' },
        ]
      },
      {
        title: isZh ? '🖼️ 图片提示词' : '🖼️ Image Prompting',
        type: 'category',
        items: [
          { title: isZh ? '介绍' : 'Introduction', path: 'Images/intro', type: 'doc' },
          { title: 'Midjourney', path: 'Images/midjourney', type: 'doc' },
          { title: isZh ? '质量提升器' : 'Quality Boosters', path: 'Images/quality_boosters', type: 'doc' },
          { title: isZh ? '风格修饰符' : 'Style Modifiers', path: 'Images/style_modifiers', type: 'doc' },
          { title: isZh ? '加权术语' : 'Weighted Terms', path: 'Images/weighted_terms', type: 'doc' },
          { title: isZh ? '修复变形生成' : 'Fix Deformed Generations', path: 'Images/fix_deformed_generations', type: 'doc' },
          { title: isZh ? '重复' : 'Repetition', path: 'Images/repetition', type: 'doc' },
          { title: isZh ? '资源' : 'Resources', path: 'Images/resources', type: 'doc' },
        ]
      },
      {
        title: isZh ? '🔓 破解提示' : '🔓 Prompt Hacking',
        type: 'category',
        items: [
          { title: isZh ? '注入' : 'Injection', path: 'prompt_hacking/injection', type: 'doc' },
          { title: isZh ? '越狱' : 'Jailbreaking', path: 'prompt_hacking/jailbreaking', type: 'doc' },
          { title: isZh ? '泄露' : 'Leaking', path: 'prompt_hacking/leaking', type: 'doc' },
          { title: isZh ? '防御措施' : 'Defensive Measures', path: 'prompt_hacking/defensive_measures', type: 'doc' },
        ]
      },
      {
        title: isZh ? '💪 提示微调' : '💪 Prompt Tuning',
        type: 'category',
        items: [
          { title: isZh ? '软提示' : 'Soft Prompting', path: 'trainable/soft_prompting', type: 'doc' },
          { title: isZh ? '离散化' : 'Discretized', path: 'trainable/discretized', type: 'doc' },
        ]
      },
      {
        title: isZh ? '🎲 杂项' : '🎲 Miscellaneous',
        type: 'category',
        items: [
          { title: isZh ? '检测' : 'Detect', path: 'miscl/detect', type: 'doc' },
          { title: isZh ? '音乐' : 'Music', path: 'miscl/music', type: 'doc' },
          { title: isZh ? '技巧' : 'Trickery', path: 'miscl/trickery', type: 'doc' },
        ]
      },
    ];

    return structure;
  };

  const getDefaultSidebarStructure = () => {
    return buildSidebarStructure({});
  };

  // 移除 frontmatter
  const removeFrontmatter = (text) => {
    // 检查是否有 frontmatter（以 --- 开头）
    const trimmed = text.trim();
    if (trimmed.startsWith('---')) {
      // 找到第一个 --- 行的结束位置
      const firstLineEnd = trimmed.indexOf('\n');
      if (firstLineEnd === -1) return text; // 没有换行符，不是有效的 frontmatter
      
      // 找到第二个 --- 的位置（在第一个之后）
      const secondDashIndex = trimmed.indexOf('---', firstLineEnd + 1);
      
      if (secondDashIndex !== -1) {
        // 找到第二个 --- 行的结束位置
        const secondLineEnd = trimmed.indexOf('\n', secondDashIndex + 3);
        if (secondLineEnd !== -1) {
          // 移除 frontmatter 部分（包括两个 --- 行和之间的内容）
          return trimmed.substring(secondLineEnd + 1).trim();
        } else {
          // 如果第二个 --- 后面没有换行符，说明 frontmatter 在文件末尾
          return '';
        }
      }
    }
    return text;
  };

  const loadDocument = async (path) => {
    setLoading(true);
    setError(null);
    try {
      const docPath = getDocPath(path);
      const response = await fetch(docPath);
      if (!response.ok) {
        throw new Error('Document not found');
      }
      const text = await response.text();
      // 移除 frontmatter
      const contentWithoutFrontmatter = removeFrontmatter(text);
      setContent(contentWithoutFrontmatter);
    } catch (err) {
      console.error('Error loading document:', err);
      setError(err.message);
      setContent('');
    } finally {
      setLoading(false);
    }
  };

  const handleNavClick = (path) => {
    navigate(`/prompt-tutorial/${path}`);
  };

  const isActive = (path) => {
    const pathMatch = location.pathname.match(/\/prompt-tutorial\/(.*)/);
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

  return (
    <>
      <Helmet>
        <title>Prompt 教程 | CUTool</title>
        <meta name="description" content="提示工程教程，学习如何与AI交流并得到你想要的结果" />
        <meta name="keywords" content="Prompt工程,提示词,AI教程,Prompt Engineering" />
      </Helmet>
      <div className="prompt-tutorial-container">
        <div className={`prompt-tutorial-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
          <div className="sidebar-header">
            <h2>Prompt 教程</h2>
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
        <div className="prompt-tutorial-main">
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
            <div className="loading">加载中...</div>
          ) : error ? (
            <div className="error">
              <h2>加载失败</h2>
              <p>{error}</p>
              <button onClick={() => navigate('/prompt-tutorial/intro')} className="back-button">
                返回首页
              </button>
            </div>
          ) : (
            <div className="markdown-content">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw, rehypeSanitize]}
                components={{
                  img: ({ node, ...props }) => {
                    // 处理相对路径的图片
                    let src = props.src || '';
                    if (src && !src.startsWith('http') && !src.startsWith('/')) {
                      const lang = getLanguageCode();
                      const currentPath = location.pathname.match(/\/prompt-tutorial\/(.*)/)?.[1] || 'intro';
                      const pathParts = currentPath.split('/');
                      pathParts.pop(); // 移除文件名部分
                      const basePath = pathParts.length > 0 ? pathParts.join('/') : '';
                      src = `/docs/prompts-learning/${lang}/current/${basePath ? basePath + '/' : ''}${src}`;
                    } else if (src && src.startsWith('./')) {
                      const lang = getLanguageCode();
                      const currentPath = location.pathname.match(/\/prompt-tutorial\/(.*)/)?.[1] || 'intro';
                      const pathParts = currentPath.split('/');
                      pathParts.pop();
                      const basePath = pathParts.length > 0 ? pathParts.join('/') : '';
                      src = `/docs/prompts-learning/${lang}/current/${basePath ? basePath + '/' : ''}${src.replace('./', '')}`;
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
                    // 处理内部链接
                    if (props.href && props.href.startsWith('/prompt-tutorial/')) {
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

export default PromptTutorial;

