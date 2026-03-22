/** 用于 Helmet / JSON-LD；SSR 阶段无 window，与根 layout metadataBase 保持一致 */
export function getPublicOrigin() {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_SITE_ORIGIN || 'https://cutool.online';
}
