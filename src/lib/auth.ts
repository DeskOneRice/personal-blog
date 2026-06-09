/**
 * 认证工具
 *
 * Session-based auth: 登录后把用户信息加密存到 cookie 里。
 * 每次请求 Astro 从 cookie 解密出 user，做权限判断。
 *
 * 类比 CV：这就像 API 鉴权 token，只不过这里用 cookie 携带。
 */
import bcrypt from 'bcryptjs';

/** Session 中存储的用户信息 */
export interface SessionUser {
  userId: number;
  username: string;
  role: 'admin' | 'author' | 'reader';
}

/** 哈希密码 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/** 验证密码 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * 序列化 session 为 cookie 值
 * 简单实现：JSON + base64（生产环境建议用 jose 库做 JWE 加密）
 */
export function encodeSession(user: SessionUser): string {
  const json = JSON.stringify(user);
  return Buffer.from(json).toString('base64');
}

/**
 * 从 cookie 值反序列化 session
 * 返回 null 表示 cookie 无效或过期
 */
export function decodeSession(cookieValue: string | undefined): SessionUser | null {
  if (!cookieValue) return null;
  try {
    const json = Buffer.from(cookieValue, 'base64').toString('utf-8');
    const user = JSON.parse(json) as SessionUser;
    // 基本校验
    if (!user.userId || !user.username || !user.role) return null;
    return user;
  } catch {
    return null;
  }
}

/** 角色等级映射：数字越大权限越高 */
const ROLE_LEVEL: Record<string, number> = {
  reader: 0,
  author: 1,
  admin: 2,
};

/**
 * 检查是否有足够权限
 * @param userRole 用户角色
 * @param requiredRole 需要的角色
 */
export function hasRole(userRole: string | undefined, requiredRole: string): boolean {
  if (!userRole) return false;
  return (ROLE_LEVEL[userRole] ?? -1) >= (ROLE_LEVEL[requiredRole] ?? 0);
}
