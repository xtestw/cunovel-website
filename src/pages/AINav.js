import React from 'react';
import './AINav.css';

function AINav() {
  const aiTools = [
    {
      category: "AI聊天",
      items: [
        { name: "ChatGPT", url: "https://chat.openai.com", desc: "OpenAI开发的AI对话模型" },
        { name: "Claude", url: "https://claude.ai", desc: "Anthropic开发的AI助手" },
        { name: "Gemini", url: "https://gemini.google.com", desc: "Google的AI模型" }
      ]
    },
    {
      category: "AI绘画",
      items: [
        { name: "Midjourney", url: "https://www.midjourney.com", desc: "AI艺术和图像生成" },
        { name: "Stable Diffusion", url: "https://stability.ai", desc: "开源的AI图像生成模型" },
        { name: "DALL·E", url: "https://openai.com/dall-e-3", desc: "OpenAI的图像生成AI" }
      ]
    }
  ];

  return (
    <div className="ai-nav-page">
      <h1>AI导航</h1>
      <div className="ai-categories">
        {aiTools.map((category, index) => (
          <div key={index} className="category-section">
            <h2>{category.category}</h2>
            <div className="tools-grid">
              {category.items.map((tool, toolIndex) => (
                <div key={toolIndex} className="tool-card">
                  <h3>{tool.name}</h3>
                  <p>{tool.desc}</p>
                  <a href={tool.url} target="_blank" rel="noopener noreferrer">
                    访问
                  </a>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AINav; 