#!/bin/sh
# 容器启动脚本
# 1. 自动执行数据库迁移（确保 schema 最新）
# 2. 检查是否需要 seeding
# 3. 启动 Astro 服务

set -e

echo "📦 Running database migration..."
npx prisma db push --skip-generate --accept-data-loss 2>/dev/null || true

echo "🌱 Checking seed data..."
# 如果 User 表为空，执行 seeding
USER_COUNT=$(npx prisma db execute --stdin <<SQL 2>/dev/null || echo "0")
SELECT COUNT(*) FROM User;
SQL
if [ "$USER_COUNT" = "0" ] || [ -z "$USER_COUNT" ]; then
  echo "  No users found, seeding database..."
  npx tsx prisma/seed.ts 2>/dev/null || echo "  Seed skipped (may already have data)"
fi

echo "🚀 Starting blog server..."
exec node ./dist/server/entry.mjs
