import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './ChromePlugin.css';

const ChromePlugin = () => {
  const { t } = useTranslation();
  const [previewImage, setPreviewImage] = useState(null);
  
  const handleImageClick = (imageSrc) => {
    setPreviewImage(imageSrc);
  };

  const closePreview = () => {
    setPreviewImage(null);
  };
  
  return (
    <div className="chrome-plugin-container">
      <h1>{t('chromePlugin.title')}</h1>
      
      <section className="install-section">
        <h2>{t('chromePlugin.store.title')}</h2>
        <p>{t('chromePlugin.store.description')}</p>
        <div className="steps">
          <ol>
            <li>{t('chromePlugin.store.step1')}</li>
            <li>{t('chromePlugin.store.step2')}</li>
            <li>{t('chromePlugin.store.step3')}</li>
          </ol>
        </div>
        <a 
          href="https://chromewebstore.google.com/detail/cutool/pnadcjmfdflpblaogepdpeooialeelno?hl=en-US&utm_source=ext_sidebar"
          target="_blank"
          rel="noopener noreferrer"
          className="install-button"
        >
          {t('chromePlugin.store.button')}
        </a>
      </section>

      <section className="install-section">
        <h2>{t('chromePlugin.offline.title')}</h2>
        <p>{t('chromePlugin.offline.description')}</p>
        <div className="steps">
          <ol>
            <li>
              {t('chromePlugin.offline.step1')}
              <div className="step-image">
                <img 
                  src="/images/chrome-plugin/download-button.png" 
                  alt={t('chromePlugin.offline.images.download')}
                  onClick={() => handleImageClick("/images/chrome-plugin/download-button.png")}
                />
                <p className="image-caption">{t('chromePlugin.offline.images.download')}</p>
              </div>
            </li>
            <li>
              {t('chromePlugin.offline.step2')}
              <div className="step-image">
                <img 
                  src="/images/chrome-plugin/unzip.png" 
                  alt={t('chromePlugin.offline.images.unzip')}
                  onClick={() => handleImageClick("/images/chrome-plugin/unzip.png")}
                />
                <p className="image-caption">{t('chromePlugin.offline.images.unzip')}</p>
              </div>
            </li>
            <li>
              {t('chromePlugin.offline.step3')}
              <div className="step-image">
                <img 
                  src="/images/chrome-plugin/extensions-url.png" 
                  alt={t('chromePlugin.offline.images.extensions')}
                  onClick={() => handleImageClick("/images/chrome-plugin/extensions-url.png")}
                />
                <p className="image-caption">{t('chromePlugin.offline.images.extensions')}</p>
              </div>
            </li>
            <li>
              {t('chromePlugin.offline.step4')}
              <div className="step-image">
                <img 
                  src="/images/chrome-plugin/developer-mode.png" 
                  alt={t('chromePlugin.offline.images.developer')}
                  onClick={() => handleImageClick("/images/chrome-plugin/developer-mode.png")}
                />
                <p className="image-caption">{t('chromePlugin.offline.images.developer')}</p>
              </div>
            </li>
            <li>
              {t('chromePlugin.offline.step5')}
              <div className="step-image">
                <img 
                  src="/images/chrome-plugin/load-unpacked.png" 
                  alt={t('chromePlugin.offline.images.load')}
                  onClick={() => handleImageClick("/images/chrome-plugin/load-unpacked.png")}
                />
                <p className="image-caption">{t('chromePlugin.offline.images.load')}</p>
              </div>
            </li>
          </ol>
        </div>
        <a 
          href="https://images.xtestw.com/cutool/cutool-chrome-plugin-v1.0.5.zip"
          className="install-button"
        >
          {t('chromePlugin.offline.button')}
        </a>
      </section>

      {previewImage && (
        <div className="image-preview-overlay" onClick={closePreview}>
          <div className="image-preview-container">
            <img src={previewImage} alt="Preview" />
            <button className="close-preview" onClick={closePreview}>×</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChromePlugin; 