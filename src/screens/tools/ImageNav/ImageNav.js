import React from 'react';
import './ImageNav.css';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';

const ImageNav = () => {
  const { t } = useTranslation();

  const imageTools = [
    {
      title: t('nav.tools.imageNav.tools.compress.title'),
      description: t('nav.tools.imageNav.tools.compress.description'),
      icon: '🗜️',
      link: 'https://www.iloveimg.com/compress-image'
    },
    {
      title: t('nav.tools.imageNav.tools.resize.title'),
      description: t('nav.tools.imageNav.tools.resize.description'),
      icon: '📐',
      link: 'https://www.iloveimg.com/resize-image'
    },
    {
      title: t('nav.tools.imageNav.tools.crop.title'),
      description: t('nav.tools.imageNav.tools.crop.description'),
      icon: '✂️',
      link: 'https://www.iloveimg.com/crop-image'
    },
    {
      title: t('nav.tools.imageNav.tools.convertToJpg.title'),
      description: t('nav.tools.imageNav.tools.convertToJpg.description'),
      icon: '🔄',
      link: 'https://www.iloveimg.com/convert-to-jpg'
    },
    {
      title: t('nav.tools.imageNav.tools.convertFromJpg.title'),
      description: t('nav.tools.imageNav.tools.convertFromJpg.description'),
      icon: '🔄',
      link: 'https://www.iloveimg.com/convert-from-jpg'
    },
    {
      title: t('nav.tools.imageNav.tools.edit.title'),
      description: t('nav.tools.imageNav.tools.edit.description'),
      icon: '🎨',
      link: 'https://www.iloveimg.com/photo-editor'
    },
    {
      title: t('nav.tools.imageNav.tools.upscale.title'),
      description: t('nav.tools.imageNav.tools.upscale.description'),
      icon: '🔍',
      link: 'https://www.iloveimg.com/upscale-image'
    },
    {
      title: t('nav.tools.imageNav.tools.removeBg.title'),
      description: t('nav.tools.imageNav.tools.removeBg.description'),
      icon: '🎭',
      link: 'https://www.iloveimg.com/remove-background'
    },
    {
      title: t('nav.tools.imageNav.tools.watermark.title'),
      description: t('nav.tools.imageNav.tools.watermark.description'),
      icon: '💧',
      link: 'https://www.iloveimg.com/watermark-image'
    },
    {
      title: t('nav.tools.imageNav.tools.meme.title'),
      description: t('nav.tools.imageNav.tools.meme.description'),
      icon: '😄',
      link: 'https://www.iloveimg.com/meme-generator'
    },
    {
      title: t('nav.tools.imageNav.tools.rotate.title'),
      description: t('nav.tools.imageNav.tools.rotate.description'),
      icon: '🔄',
      link: 'https://www.iloveimg.com/rotate-image'
    },
    {
      title: t('nav.tools.imageNav.tools.blurFace.title'),
      description: t('nav.tools.imageNav.tools.blurFace.description'),
      icon: '👤',
      link: 'https://www.iloveimg.com/blur-face'
    }
  ];

  return (
    <>
      <Helmet>
        <title>图像工具导航 | Image Tools Navigation - CUTool</title>
        <meta name="description" content="精选图像处理工具导航，包含图片压缩、格式转换、在线PS等实用工具。Collection of image processing tools including compression, format conversion, online photo editing and more." />
        <meta name="keywords" content="image tools, image processing, image compression, photo editor, 图像处理, 图片压缩, 图片格式转换, 在线PS" />
      </Helmet>
      <div className="image-nav-container">
        <div className="image-nav-header">
          <h2>{t('nav.tools.imageNav.title')}</h2>
          <p>{t('nav.tools.imageNav.description')}</p>
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
    </>
  );
};

export default ImageNav; 