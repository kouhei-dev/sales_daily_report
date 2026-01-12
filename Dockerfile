# ベースイメージ
FROM node:20-alpine AS base

# 依存関係のインストール
FROM base AS deps
WORKDIR /app

# 依存関係ファイルをコピー
COPY package.json package-lock.json ./

# 本番依存関係のみインストール
RUN npm ci --only=production && npm cache clean --force

# ビルドステージ
FROM base AS builder
WORKDIR /app

# 依存関係ファイルをコピー
COPY package.json package-lock.json ./

# 全ての依存関係をインストール
RUN npm ci && npm cache clean --force

# ソースコードをコピー
COPY . .

# Prismaクライアントを生成
RUN npx prisma generate

# Next.jsアプリケーションをビルド
RUN npm run build

# 本番実行ステージ
FROM base AS runner
WORKDIR /app

# 本番環境を設定
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 非rootユーザーを作成
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# 必要なファイルをコピー
COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next && chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Prisma関連ファイルをコピー
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/prisma ./prisma

# 非rootユーザーに切り替え
USER nextjs

# ポートを公開
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# アプリケーションを起動
CMD ["node", "server.js"]
