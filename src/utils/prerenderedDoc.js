/** 与 scripts/prerender/prerender-docs.mjs 中 article 根节点 id 一致 */
export const PRERENDER_DOC_ROOT_ID = 'cutool-prerendered-doc';

/**
 * 从预渲染的完整 HTML 文档中提取正文 innerHTML；无法解析时返回 null。
 * @param {string} htmlString
 * @returns {string | null}
 */
export function extractPrerenderedBody(htmlString) {
  if (!htmlString || typeof htmlString !== 'string') return null;
  if (typeof DOMParser === 'undefined') return null;
  if (!htmlString.includes(`id="${PRERENDER_DOC_ROOT_ID}"`)) return null;
  const doc = new DOMParser().parseFromString(htmlString, 'text/html');
  const el = doc.getElementById(PRERENDER_DOC_ROOT_ID);
  return el ? el.innerHTML : null;
}
