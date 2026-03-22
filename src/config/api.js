// API 配置
// 根据环境自动选择 API 基础 URL（须 SSR 安全：Client 组件也会在服务端先渲染一遍）

const getApiBaseUrl = () => {
  const fromEnv =
    process.env.NEXT_PUBLIC_API_BASE_URL || process.env.REACT_APP_API_BASE_URL;
  if (fromEnv) {
    return fromEnv;
  }

  if (typeof window === 'undefined') {
    return process.env.NODE_ENV === 'development'
      ? 'http://localhost:3003/api'
      : 'https://api.cutool.online/api';
  }

  const hostname = window.location.hostname;

  if (
    hostname === 'cutool.online' ||
    hostname === 'www.cutool.online' ||
    hostname === 'cutool.cunovel.com'
  ) {
    return 'https://api.cutool.online/api';
  }

  return 'http://localhost:3003/api';
};

export const API_BASE_URL = getApiBaseUrl();
