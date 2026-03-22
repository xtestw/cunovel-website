/**
 * 后端 API 基址（`API_BASE_URL`）
 *
 * 解析顺序：环境变量 `NEXT_PUBLIC_API_BASE_URL` / `REACT_APP_API_BASE_URL` →
 * 服务端或无 window 时按 NODE_ENV 选默认 → 浏览器内按 hostname 选默认。
 * 预发 / 自建域名 / CI 若需指向非生产 API，务必在构建与运行环境注入上述变量。
 *
 * --- 使用本模块请求后端的页面 / 组件（均在客户端 useEffect 或用户交互里发请求，无构建期枚举）---
 * - 登录与鉴权：LoginButton（/auth/me、/auth/login/*、/auth/logout）
 * - 积分：UserCredits、UserCreditsRecharge（/auth/me、/credits/recharge）
 * - 核验与订单：PhoneVerify、VehicleVerify、BankCardVerify、VehicleVerifyOrders、VerifyResult
 *   （vehicle-verify/*；需 Authorization 的订单列表等）
 * - AI 日报：Home、AIDaily、AIDailyHistory、AIDailyDetail、NewsDetail（/ai-daily/*）
 * - 教程列表：AITutorial（/ai-tutorial）
 *
 * 另：首页天气请求 Open-Meteo 公网 API，不走 `API_BASE_URL`。
 *
 * 静态导出（NEXT_STATIC_EXPORT）：上述数据不在 `generateStaticParams` 中预取；导出目录仅为壳页面，
 * 真实数据依赖浏览器访问时的接口。勿为「用户相关 / 列表无限增长」类数据增加构建期全量静态页。
 */

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
