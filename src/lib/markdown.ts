/**
 * Markdown 渲染工具
 *
 * 将 Markdown 文本转为 HTML，带代码语法高亮。
 * 在服务端调用 — 文章数据存 Markdown，渲染成 HTML 后返回给浏览器。
 *
 * 类比：Python 的 `markdown.markdown(text, extensions=['fenced_code', 'codehilite'])`
 */
import { marked } from 'marked';
import hljs from 'highlight.js';

// 配置 marked 的代码高亮
marked.setOptions({
  gfm: true,           // GitHub Flavored Markdown (表格、任务列表等)
  breaks: false,       // 不把单个换行转成 <br>
  highlight: (code: string, lang: string): string => {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(code, { language: lang }).value;
      } catch {
        // 高亮失败，返回转义后的纯文本
      }
    }
    // 没有指定语言或语言不支持，自动检测并高亮
    try {
      return hljs.highlightAuto(code).value;
    } catch {
      return code;
    }
  },
});

/**
 * 渲染 Markdown 文本 → HTML 字符串
 */
export function renderMarkdown(content: string): string {
  // marked.parse 可能返回 string | Promise<string>，这里我们只用同步模式
  const result = marked.parse(content);
  if (result instanceof Promise) {
    // SSR 场景下不应该遇到异步，如果遇到就报错
    throw new Error('Unexpected async markdown rendering');
  }
  return result;
}

/**
 * 从 Markdown 内容提取纯文本摘要
 * 用于文章列表的预览文字（当没有手动填写 excerpt 时）
 */
export function extractExcerpt(content: string, maxLength: number = 200): string {
  // 移除 Markdown 语法标记
  let text = content
    .replace(/^#{1,6}\s+/gm, '')        // 标题
    .replace(/\*\*(.+?)\*\*/g, '$1')     // 粗体
    .replace(/\*(.+?)\*/g, '$1')         // 斜体
    .replace(/`{1,3}[^`]*`{1,3}/g, '')  // 代码
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')  // 链接
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1') // 图片
    .replace(/>\s+/gm, '')              // 引用
    .replace(/[-*+]\s+/g, '')           // 列表
    .replace(/\n{2,}/g, '\n')           // 多余空行
    .trim();

  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).replace(/\s+\S*$/, '') + '...';
}
