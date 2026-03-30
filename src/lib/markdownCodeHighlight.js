/**
 * 代码块语法高亮（rehype-highlight + lowlight / highlight.js）。
 * 须放在 rehypeSanitize、rehypeKatex 之后，避免 sanitize 去掉 hljs 的 span，且避免破坏数学公式块。
 */
import rehypeHighlight from 'rehype-highlight';

const highlightOptions = {
  plainText: ['math', 'mermaid', 'text', 'txt', 'plaintext', 'markdown'],
};

export const rehypeHighlightPlugin = [rehypeHighlight, highlightOptions];
