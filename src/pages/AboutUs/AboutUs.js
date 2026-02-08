import React from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import './AboutUs.css';

const AboutUs = () => {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language.startsWith('zh');

  const content = isZh ? {
    title: '关于我们',
    subtitle: '专业的在线开发者工具箱',
    sections: [
      {
        title: '我们的使命',
        content: 'CuTool致力于为全球开发者提供免费、高效、易用的在线工具。我们相信，优秀的工具应该让每个人都能轻松使用，无需复杂的安装和配置。'
      },
      {
        title: '我们的服务',
        content: 'CuTool提供丰富的开发者工具，包括：JSON格式化与对比、代码格式化、时间戳转换、文本处理、正则表达式匹配、Base64/URL编码解码、AI Token计算器等。我们还提供AI日报、Prompt教程、Agent技能等AI相关内容，帮助开发者更好地学习和使用AI技术。'
      },
      {
        title: '我们的特色',
        items: [
          '完全免费 - 所有工具免费使用，无需注册',
          '多语言支持 - 支持中文和英文',
          '持续更新 - 定期添加新工具和功能',
          '高质量内容 - 提供原创的AI教程和日报',
          '用户友好 - 简洁直观的界面设计',
          '快速响应 - 优化的性能，快速加载'
        ]
      },
      {
        title: '技术栈',
        content: 'CuTool采用现代化的技术栈构建：前端使用React，后端使用Python Flask，确保高性能和良好的用户体验。'
      },
      {
        title: '联系我们',
        content: '如果您有任何问题、建议或反馈，欢迎通过以下方式联系我们：',
        contact: {
          email: 'xuwei8091@gmail.com',
          website: 'https://cutool.online'
        }
      }
    ]
  } : {
    title: 'About Us',
    subtitle: 'Professional Online Developer Toolbox',
    sections: [
      {
        title: 'Our Mission',
        content: 'CuTool is committed to providing free, efficient, and easy-to-use online tools for developers worldwide. We believe that excellent tools should be accessible to everyone without complex installation and configuration.'
      },
      {
        title: 'Our Services',
        content: 'CuTool offers a rich set of developer tools, including: JSON formatting and comparison, code formatting, timestamp conversion, text processing, regular expression matching, Base64/URL encoding and decoding, AI Token calculator, and more. We also provide AI Daily, Prompt tutorials, Agent skills, and other AI-related content to help developers better learn and use AI technology.'
      },
      {
        title: 'Our Features',
        items: [
          'Completely Free - All tools are free to use, no registration required',
          'Multi-language Support - Supports Chinese and English',
          'Regular Updates - Regularly add new tools and features',
          'High-Quality Content - Original AI tutorials and daily reports',
          'User-Friendly - Simple and intuitive interface design',
          'Fast Response - Optimized performance, fast loading'
        ]
      },
      {
        title: 'Technology Stack',
        content: 'CuTool is built with modern technology stack: React for frontend, Python Flask for backend, ensuring high performance and excellent user experience.'
      },
      {
        title: 'Contact Us',
        content: 'If you have any questions, suggestions, or feedback, please feel free to contact us:',
        contact: {
          email: 'xuwei8091@gmail.com',
          website: 'https://cutool.online'
        }
      }
    ]
  };

  return (
    <div className="about-us-container">
      <Helmet>
        <title>{content.title} - CuTool</title>
        <meta name="description" content={isZh ? '了解CuTool - 专业的在线开发者工具箱，提供免费、高效的开发工具和AI相关内容。' : 'Learn about CuTool - Professional online developer toolbox, providing free and efficient development tools and AI-related content.'} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={`https://cutool.online/about-us`} />
      </Helmet>
      
      <div className="about-us-content">
        <h1>{content.title}</h1>
        <p className="subtitle">{content.subtitle}</p>
        
        <div className="about-sections">
          {content.sections.map((section, index) => (
            <div key={index} className="about-section">
              <h2>{section.title}</h2>
              {section.content && <p>{section.content}</p>}
              {section.items && (
                <ul className="feature-list">
                  {section.items.map((item, itemIndex) => (
                    <li key={itemIndex}>{item}</li>
                  ))}
                </ul>
              )}
              {section.contact && (
                <div className="contact-info">
                  <p><strong>{isZh ? '邮箱' : 'Email'}:</strong> <a href={`mailto:${section.contact.email}`}>{section.contact.email}</a></p>
                  <p><strong>{isZh ? '网站' : 'Website'}:</strong> <a href={section.contact.website} target="_blank" rel="noopener noreferrer">{section.contact.website}</a></p>
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="legal-links">
          <Link to="/privacy-policy">{isZh ? '隐私政策' : 'Privacy Policy'}</Link>
          <span> | </span>
          <Link to="/terms-of-service">{isZh ? '使用条款' : 'Terms of Service'}</Link>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;

