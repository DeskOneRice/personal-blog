/**
 * POST /api/upload — 上传图片
 *
 * 接收 multipart/form-data，保存到 public/uploads/，
 * 返回相对路径如 /uploads/abc123.png
 */
import type { APIRoute } from 'astro';
import { writeFile, mkdir } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { join } from 'node:path';

// 允许的图片类型
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml'];
const MAX_SIZE = 2 * 1024 * 1024; // 2MB

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return new Response(JSON.stringify({ error: '未选择文件' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return new Response(JSON.stringify({ error: '不支持的图片格式，仅支持 PNG/JPG/GIF/WebP/SVG' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    if (file.size > MAX_SIZE) {
      return new Response(JSON.stringify({ error: '图片大小不能超过 2MB，请压缩后上传' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    // 生成唯一文件名（保留原扩展名）
    const ext = file.name.split('.').pop() || 'png';
    const name = randomBytes(16).toString('hex') + '.' + ext;

    // 确保上传目录存在
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });

    // 写入文件
    const buf = Buffer.from(await file.arrayBuffer());
    await writeFile(join(uploadDir, name), buf);

    // 返回相对路径
    const url = `/uploads/${name}`;
    return new Response(JSON.stringify({ url }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: '上传失败' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
};
