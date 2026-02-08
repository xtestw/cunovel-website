// API 配置
// 根据环境自动选择 API 基础 URL

const getApiBaseUrl = () => {
  // 如果设置了环境变量，优先使用环境变量
  if (process.env.REACT_APP_API_BASE_URL) {
    return process.env.REACT_APP_API_BASE_URL;
  }

  // 根据当前域名判断环境
  const hostname = window.location.hostname;
  
  // 生产环境
  if (hostname === 'cutool.online' || hostname === 'www.cutool.online' || hostname === 'cutool.cunovel.com') {
    return 'https://api.cutool.online/api';
  }
  
  // 开发环境（localhost）
  return 'http://localhost:3003/api';
};

export const API_BASE_URL = getApiBaseUrl();

