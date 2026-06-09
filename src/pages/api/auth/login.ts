/**
 * POST /api/auth/login
 *
 * 接收 { username, password }，验证后设置 session cookie。
 */
import type { APIRoute } from 'astro';
import { prisma } from '../../../lib/prisma';
import { verifyPassword, encodeSession } from '../../../lib/auth';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return new Response(JSON.stringify({ error: '请输入用户名和密码' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 查找用户
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return new Response(JSON.stringify({ error: '用户名或密码错误' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 验证密码
    const valid = await verifyPassword(password, user.password);
    if (!valid) {
      return new Response(JSON.stringify({ error: '用户名或密码错误' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 生成 session
    const session = encodeSession({
      userId: user.id,
      username: user.username,
      role: user.role as 'admin' | 'author' | 'reader',
    });

    // 设置 cookie (httpOnly, 7天过期)
    cookies.set('session', session, {
      path: '/',
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,  // 7天
    });

    return new Response(JSON.stringify({
      success: true,
      user: { username: user.username, role: user.role },
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: '请求格式错误' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
