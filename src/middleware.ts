/**
 * Astro Middleware — 管理后台认证守卫
 *
 * 每个请求到达 /admin/* 时，先经过这里。
 * 从 cookie 中解析 session，检查用户是否有 admin 权限。
 *
 * 公开路由直接放行，不改动请求数据。
 *
 * 类比：这就像 Python Flask 的 @login_required 装饰器，
 * 但是运行在框架层，不需要在每个路由上重复写。
 */
import { defineMiddleware } from 'astro:middleware';
import { decodeSession, hasRole } from './lib/auth';

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, cookies } = context;

  // 只拦截 /admin 路由（公开页面不做任何处理）
  if (!url.pathname.startsWith('/admin')) {
    return next();
  }

  // 登录页不需要检查 session（否则无限循环）
  if (url.pathname === '/admin/login') {
    return next();
  }

  // API 端点：从 cookie 解析 session，注入 context.locals
  if (url.pathname.startsWith('/api/')) {
    const sessionCookie = cookies.get('session')?.value;
    const user = decodeSession(sessionCookie);

    // 只有 admin 可以访问 API
    if (!user || !hasRole(user.role, 'admin')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 将用户信息注入 context.locals，API 路由可以读取
    context.locals.user = user;
    return next();
  }

  // 后台页面：检查 session
  const sessionCookie = cookies.get('session')?.value;
  const user = decodeSession(sessionCookie);

  if (!user || !hasRole(user.role, 'admin')) {
    // 没登录或权限不够 → 重定向到登录页
    return context.redirect(`/admin/login?redirect=${encodeURIComponent(url.pathname)}`);
  }

  // 已登录 → 注入用户信息，继续
  context.locals.user = user;
  return next();
});
