# ============================================================
# 个人博客 Docker 镜像 — 多阶段构建
#
# 阶段1: 安装依赖 + 构建
# 阶段2: 仅保留运行时需要的文件，镜像最小化
#
# 构建: docker build -t personal-blog .
# 运行: docker run -p 4321:4321 -v $(pwd)/data:/app/data personal-blog
# ============================================================

# ---- 阶段1: 构建 ----
FROM node:22-alpine AS builder

WORKDIR /app

# 安装依赖（利用 Docker 层缓存：先只复制包文件）
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# 复制 Prisma schema 并生成客户端
COPY prisma/ ./prisma/
RUN npx prisma generate

# 复制源码
COPY astro.config.mjs tsconfig.json tailwind.config.mjs postcss.config.mjs ./
COPY src/ ./src/

# 构建 Astro 项目
RUN npm run build

# ---- 阶段2: 运行 ----
FROM node:22-alpine AS runner

WORKDIR /app

# 只复制运行时需要的文件
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY prisma/ ./prisma/

# 创建数据目录（SQLite 数据库文件存放位置）
RUN mkdir -p /app/data

# 启动脚本
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENV HOST=0.0.0.0
ENV PORT=4321
ENV DATABASE_URL="file:/app/data/blog.db"

EXPOSE 4321

ENTRYPOINT ["/entrypoint.sh"]
