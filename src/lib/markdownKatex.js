/**
 * Markdown 内联/块级 LaTeX（$...$、$$...$$）由 remark-math 解析，rehype-katex 渲染。
 * rehype-katex 必须放在 rehype-sanitize 之后，否则 KaTeX 输出的 class/style 会被默认 schema 清掉。
 */
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export { remarkMath, rehypeKatex };
