import React from 'react';
import './ImageNav.css';

const ImageNav = () => {
  const imageTools = [
    {
      title: '图片压缩',
      description: '压缩图片文件大小，保持图片质量',
      icon: '🗜️',
      link: 'https://www.iloveimg.com/compress-image'
    },
    {
      title: '调整大小',
      description: '调整图片尺寸和分辨率',
      icon: '📐',
      link: 'https://www.iloveimg.com/resize-image'
    },
    {
      title: '裁剪图片',
      description: '裁剪和调整图片区域',
      icon: '✂️',
      link: 'https://www.iloveimg.com/crop-image'
    },
    {
      title: '转换为JPG',
      description: '将其他格式图片转换为JPG格式',
      icon: '🔄',
      link: 'https://www.iloveimg.com/convert-to-jpg'
    },
    {
      title: 'JPG转换',
      description: '将JPG转换为其他图片格式',
      icon: '🔄',
      link: 'https://www.iloveimg.com/convert-from-jpg'
    },
    {
      title: '图片编辑',
      description: '在线编辑和美化图片',
      icon: '🎨',
      link: 'https://www.iloveimg.com/photo-editor'
    },
    {
      title: '图片放大',
      description: '无损放大图片尺寸',
      icon: '🔍',
      link: 'https://www.iloveimg.com/upscale-image'
    },
    {
      title: '移除背景',
      description: '自动移除图片背景',
      icon: '🎭',
      link: 'https://www.iloveimg.com/remove-background'
    },
    {
      title: '添加水印',
      description: '为图片添加文字或图片水印',
      icon: '💧',
      link: 'https://www.iloveimg.com/watermark-image'
    },
    {
      title: '表情包制作',
      description: '制作和编辑表情包图片',
      icon: '😄',
      link: 'https://www.iloveimg.com/meme-generator'
    },
    {
      title: '旋转图片',
      description: '旋转和翻转图片',
      icon: '🔄',
      link: 'https://www.iloveimg.com/rotate-image'
    },
    {
      title: '人脸模糊',
      description: '自动检测并模糊图片中的人脸',
      icon: '👤',
      link: 'https://www.iloveimg.com/blur-face'
    }
  ];

  return (
    <div className="image-nav-container">
      <div className="image-nav-header">
        <h2>图像工具导航</h2>
        <p>选择需要使用的图像处理工具</p>
      </div>
      <div className="image-nav-grid">
        {imageTools.map((tool, index) => (
          <a 
            key={index}
            href={tool.link}
            target="_blank"
            rel="noopener noreferrer"
            className="tool-card"
          >
            <div className="tool-icon">{tool.icon}</div>
            <h3>{tool.title}</h3>
            <p>{tool.description}</p>
            <span className="external-link">↗</span>
          </a>
        ))}
      </div>
    </div>
  );
};

export default ImageNav; 