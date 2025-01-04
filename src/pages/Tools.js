import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Base64Converter from './tools/Base64Converter';
import UrlConverter from './tools/UrlConverter/UrlConverter';
import TimeStamp from './tools/TimeStamp/TimeStamp';
import TextCounter from './tools/TextCounter';
import ImageNav from './tools/ImageNav/ImageNav';
import JsonFormatter from './tools/JsonFormatter/JsonFormatter';
import TextCompare from './tools/TextCompare';
import JsonCompare from './tools/JsonCompare/JsonCompare';
import TextProcessor from './tools/TextProcessor';
import RegexMatcher from './tools/RegexMatcher';
import CodeFormatter from './tools/CodeFormatter/CodeFormatter';
import '../styles/tools.css';
import styled from 'styled-components';

const ToolCard = styled.div`
  background-color: #ffffff;
  border: 1px solid #e0e0e0;
  color: #333333;
`;

const ToolTitle = styled.h3`
  color: #2c3e50;
`;

const ToolDescription = styled.p`
  color: #666666;
`;

function Tools() {
  const { t } = useTranslation();
  const { category, tool } = useParams();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState(category || 'json');

  // 定义工具菜单配置
  const toolsMenu = [
    {
      key: 'json',
      label: t('nav.categories.json'),
      tools: [
        { key: 'formatter', label: t('nav.tools.json.formatter'), component: JsonFormatter },
        { key: 'compare', label: t('nav.tools.json.compare'), component: JsonCompare }
      ]
    },
    {
      key: 'time',
      label: t('nav.categories.time'),
      tools: [
        { key: 'timestamp', label: t('nav.tools.time.timestamp'), component: TimeStamp }
      ]
    },
    {
      key: 'text',
      label: t('nav.categories.text'),
      tools: [
        { key: 'compare', label: t('nav.tools.text.compare'), component: TextCompare },
        { key: 'process', label: t('nav.tools.text.process'), component: TextProcessor },
        { key: 'counter', label: t('nav.tools.text.counter'), component: TextCounter },
        { key: 'regex', label: t('nav.tools.text.regex'), component: RegexMatcher }
      ]
    },
    {
      key: 'encode',
      label: t('nav.categories.encode'),
      tools: [
        { key: 'base64', label: t('nav.tools.encode.base64'), component: Base64Converter },
        { key: 'url', label: t('nav.tools.encode.url'), component: UrlConverter }
      ]
    },
    {
      key: 'image',
      label: t('nav.categories.image'),
      tools: [
        { key: 'imageNav', label: t('nav.tools.image.nav'), component: ImageNav },
        { 
          key: 'compress', 
          label: t('nav.tools.image.compress'), 
          externalLink: 'https://www.iloveimg.com/compress-image'
        },
        { 
          key: 'resize', 
          label: t('nav.tools.image.resize'),
          externalLink: 'https://www.iloveimg.com/resize-image'
        },
        { 
          key: 'crop', 
          label: t('nav.tools.image.crop'),
          externalLink: 'https://www.iloveimg.com/crop-image'
        },
        { 
          key: 'convert-jpg', 
          label: t('nav.tools.image.convertJpg'),
          externalLink: 'https://www.iloveimg.com/convert-to-jpg'
        },
        { 
          key: 'convert-from-jpg', 
          label: t('nav.tools.image.convertFromJpg'),
          externalLink: 'https://www.iloveimg.com/convert-from-jpg'
        },
        { 
          key: 'edit', 
          label: t('nav.tools.image.edit'),
          externalLink: 'https://www.iloveimg.com/photo-editor'
        },
        { 
          key: 'upscale', 
          label: t('nav.tools.image.upscale'),
          externalLink: 'https://www.iloveimg.com/upscale-image'
        },
        { 
          key: 'remove-bg', 
          label: t('nav.tools.image.removeBg'),
          externalLink: 'https://www.iloveimg.com/remove-background'
        },
        { 
          key: 'watermark', 
          label: t('nav.tools.image.watermark'),
          externalLink: 'https://www.iloveimg.com/watermark-image'
        },
        { 
          key: 'meme', 
          label: '表情包制作',
          externalLink: 'https://www.iloveimg.com/meme-generator'
        },
        { 
          key: 'rotate', 
          label: '旋转图片',
          externalLink: 'https://www.iloveimg.com/rotate-image'
        },
        { 
          key: 'blur-face', 
          label: '人脸模糊',
          externalLink: 'https://www.iloveimg.com/blur-face'
        }
      ]
    },
    {
      key: 'code',
      label: t('nav.categories.code'),
      tools: [
        { key: 'formatter', label: t('nav.tools.code.formatter'), component: CodeFormatter },
        { 
          key: 'minifier', 
          label: t('nav.tools.code.minifier'),
          externalLink: 'https://www.toptal.com/developers/javascript-minifier'
        },
        { 
          key: 'babel', 
          label: t('nav.tools.code.babel'),
          externalLink: 'https://babeljs.io/repl'
        },
        { 
          key: 'typescript', 
          label: t('nav.tools.code.typescript'),
          externalLink: 'https://www.typescriptlang.org/play'
        },
        { 
          key: 'sass', 
          label: t('nav.tools.code.sass'),
          externalLink: 'https://www.sassmeister.com/'
        },
        { 
          key: 'less', 
          label: t('nav.tools.code.less'),
          externalLink: 'https://lesstester.com/'
        },
        { 
          key: 'svgomg', 
          label: t('nav.tools.code.svgomg'),
          externalLink: 'https://jakearchibald.github.io/svgomg/'
        },
        { 
          key: 'caniuse', 
          label: t('nav.tools.code.caniuse'),
          externalLink: 'https://caniuse.com/'
        },
        { 
          key: 'regex101', 
          label: t('nav.tools.code.regex101'),
          externalLink: 'https://regex101.com/'
        },
        { 
          key: 'bundlephobia', 
          label: t('nav.tools.code.bundlephobia'),
          externalLink: 'https://bundlephobia.com/'
        }
      ]
    }
  ];

  useEffect(() => {
    if (category) {
      setActiveCategory(category);
    }
  }, [category]);

  const handleCategoryClick = (selectedCategory) => {
    setActiveCategory(selectedCategory);
    // 获取该类别下的第一个工具
    const categoryTools = toolsMenu.find(item => item.key === selectedCategory)?.tools;
    if (categoryTools && categoryTools.length > 0) {
      navigate(`/tools/${selectedCategory}/${categoryTools[0].key}`);
    }
  };

  // 获取当前选中的类别和工具
  const currentCategory = toolsMenu.find(item => item.key === activeCategory);
  const currentTool = currentCategory?.tools.find(t => t.key === tool);

  return (
    <div className="tools-container">
      <div className="tools-nav">
        <div className="category-nav">
          {toolsMenu.map(category => (
            <div
              key={category.key}
              className={`category-item has-dropdown ${activeCategory === category.key ? 'active' : ''}`}
              onClick={() => handleCategoryClick(category.key)}
            >
              {category.label}
              <div className="dropdown-menu">
                {category.tools.map(tool => (
                  <div
                    key={tool.key}
                    className={`dropdown-item ${tool.key === currentTool?.key ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (tool.externalLink) {
                        window.open(tool.externalLink, '_blank');
                      } else {
                        navigate(`/tools/${category.key}/${tool.key}`);
                      }
                    }}
                  >
                    {tool.label}
                    {tool.externalLink && <span className="external-link-icon">↗</span>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="tool-content">
        {currentTool?.component && <currentTool.component />}
      </div>
    </div>
  );
}

export default Tools; 