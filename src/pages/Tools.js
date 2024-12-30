import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Base64Converter from './tools/Base64Converter';
import TimestampConverter from './tools/TimestampConverter';
import UrlConverter from './tools/UrlConverter/UrlConverter';
import TimeStamp from './tools/TimeStamp/TimeStamp';
import TextCounter from './tools/TextCounter';
import ImageNav from './tools/ImageNav/ImageNav';
import ColorConverter from './tools/ColorConverter';
import TextTools from './tools/TextTools';
import JsonFormatter from './tools/JsonFormatter';
import XmlFormatter from './tools/XmlFormatter';
import TextCompare from './tools/TextCompare';
import JsonCompare from './tools/JsonCompare/JsonCompare';
import TextProcessor from './tools/TextProcessor';
import RegexMatcher from './tools/RegexMatcher';
import '../styles/tools.css';

function Tools() {
  const { t } = useTranslation();
  const { category, tool } = useParams();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState(category || 'json');

  // 定义工具菜单配置
  const toolsMenu = [
    {
      key: 'json',
      label: 'JSON工具',
      tools: [
        { key: 'formatter', label: 'JSON格式化', component: JsonFormatter },
        { key: 'compare', label: 'JSON对比', component: JsonCompare }
      ]
    },
    {
      key: 'time',
      label: '时间工具',
      tools: [
        { key: 'timestamp', label: '时间戳转换', component: TimeStamp }
      ]
    },
    {
      key: 'text',
      label: '文本工具',
      tools: [
        { key: 'compare', label: '文本对比', component: TextCompare },
        { key: 'process', label: '文本处理', component: TextProcessor },
        { key: 'counter', label: '字数统计', component: TextCounter },
        { key: 'regex', label: '正则匹配', component: RegexMatcher }
      ]
    },
    {
      key: 'encode',
      label: '编码工具',
      tools: [
        { key: 'base64', label: 'Base64转换', component: Base64Converter },
        { key: 'url', label: 'URL编码', component: UrlConverter }
      ]
    },
    {
      key: 'image',
      label: '图像工具',
      tools: [
        { key: 'imageNav', label: '功能导航', component: ImageNav },
        { 
          key: 'compress', 
          label: '图片压缩', 
          externalLink: 'https://www.iloveimg.com/compress-image'
        },
        { 
          key: 'resize', 
          label: '调整大小',
          externalLink: 'https://www.iloveimg.com/resize-image'
        },
        { 
          key: 'crop', 
          label: '裁剪图片',
          externalLink: 'https://www.iloveimg.com/crop-image'
        },
        { 
          key: 'convert-jpg', 
          label: '转换为JPG',
          externalLink: 'https://www.iloveimg.com/convert-to-jpg'
        },
        { 
          key: 'convert-from-jpg', 
          label: 'JPG转换',
          externalLink: 'https://www.iloveimg.com/convert-from-jpg'
        },
        { 
          key: 'edit', 
          label: '图片编辑',
          externalLink: 'https://www.iloveimg.com/photo-editor'
        },
        { 
          key: 'upscale', 
          label: '图片放大',
          externalLink: 'https://www.iloveimg.com/upscale-image'
        },
        { 
          key: 'remove-bg', 
          label: '移除背景',
          externalLink: 'https://www.iloveimg.com/remove-background'
        },
        { 
          key: 'watermark', 
          label: '添加水印',
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