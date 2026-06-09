/**
 * 通用工具函数
 */

/**
 * 格式化日期为中文友好的字符串
 * 例: 2026-06-04T10:30:00Z → "2026年6月4日"
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * 格式化日期+时间为中文友好的字符串
 * 例: 2026-06-04T10:30:00Z → "2026年6月4日 10:30"
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }) + ' ' + d.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * 格式化为 ISO 日期时间
 * 例: 2026-06-04T10:30:00
 */
export function toISODateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().slice(0, 16);
}

/**
 * 格式化为 ISO 日期 (用于 <time datetime="...">)
 * 例: 2026-06-04
 */
export function toISODate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().slice(0, 10);
}

/**
 * 从字符串生成 URL 友好的 slug
 * 例: "Hello World! 你好" → "hello-world-ni-hao"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w一-鿿]+/g, '-')  // 非字母数字中文 → -
    .replace(/^-+|-+$/g, '')               // 去掉首尾的 -
    .replace(/-{2,}/g, '-');               // 多个 - 合并
}

/**
 * 带默认值的取整
 */
export function toInt(value: string | undefined | null, defaultValue: number): number {
  if (!value) return defaultValue;
  const n = parseInt(value, 10);
  return isNaN(n) ? defaultValue : n;
}

/**
 * 站点配置工具: 从 key-value 配置数组获取值
 */
export function getConfig(configs: { key: string; value: string }[], key: string, defaultValue: string = ''): string {
  return configs.find(c => c.key === key)?.value ?? defaultValue;
}
