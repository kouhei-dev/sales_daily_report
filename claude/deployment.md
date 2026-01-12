# デプロイ手順

Google Cloud Runへのデプロイ手順を記載します。

## 前提条件

### 必要なアカウント・ツール

1. **Google Cloud Platform (GCP) アカウント**
   - [GCP Console](https://console.cloud.google.com/)でアカウント作成
   - プロジェクトを作成（例: `sales-daily-report`）
   - 請求先アカウントを設定

2. **gcloud CLI のインストール**
   ```bash
   # macOS (Homebrew)
   brew install google-cloud-sdk

   # Windows
   # https://cloud.google.com/sdk/docs/install からインストーラーをダウンロード

   # Linux
   curl https://sdk.cloud.google.com | bash
   ```

   バージョン確認:
   ```bash
   gcloud --version
   ```

3. **MongoDB Atlas アカウント**
   - [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)でアカウント作成
   - 本番用クラスターを作成（M10以上推奨）
   - 接続文字列を取得

4. **Docker のインストール**
   ```bash
   # macOS
   brew install docker

   # Dockerデスクトップをインストール
   # https://www.docker.com/products/docker-desktop
   ```

## 初期設定

### 1. gcloud CLI の認証と初期化

```bash
# Google アカウントでログイン
gcloud auth login

# アプリケーションのデフォルト認証情報を設定
gcloud auth application-default login

# プロジェクトを設定
gcloud config set project [PROJECT-ID]

# デフォルトリージョンを設定
gcloud config set run/region asia-northeast1
```

### 2. 必要なAPIの有効化

```bash
# Cloud Run API
gcloud services enable run.googleapis.com

# Container Registry API（またはArtifact Registry）
gcloud services enable containerregistry.googleapis.com

# Cloud Build API
gcloud services enable cloudbuild.googleapis.com

# Artifact Registry API（推奨）
gcloud services enable artifactregistry.googleapis.com
```

### 3. Artifact Registryリポジトリの作成

```bash
# Dockerリポジトリを作成
gcloud artifacts repositories create sales-daily-report \
  --repository-format=docker \
  --location=asia-northeast1 \
  --description="Sales Daily Report Application"

# 認証設定
gcloud auth configure-docker asia-northeast1-docker.pkg.dev
```

## Dockerイメージの作成

### 1. Dockerfile の作成

プロジェクトルートに `Dockerfile` を作成：

```dockerfile
# ベースイメージ
FROM node:18-alpine AS base

# 依存関係のインストール
FROM base AS deps
WORKDIR /app

# 依存関係ファイルをコピー
COPY package.json package-lock.json ./

# 本番依存関係のみインストール
RUN npm ci --only=production

# ビルドステージ
FROM base AS builder
WORKDIR /app

# 依存関係ファイルをコピー
COPY package.json package-lock.json ./

# 全ての依存関係をインストール
RUN npm ci

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
ENV NODE_ENV production

# 非rootユーザーを作成
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 必要なファイルをコピー
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

# Prismaクライアントを再生成（バイナリの互換性のため）
RUN npx prisma generate

# 非rootユーザーに切り替え
USER nextjs

# ポートを公開
EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# アプリケーションを起動
CMD ["node", "server.js"]
```

### 2. .dockerignore の作成

```
.next
.git
node_modules
npm-debug.log
.env.local
.env*.local
.DS_Store
coverage
__tests__
*.md
.vscode
.idea
```

### 3. next.config.js の設定

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Dockerビルドに必要
  // その他の設定...
};

module.exports = nextConfig;
```

## ビルドとデプロイ

### 方法1: Cloud Buildを使用（推奨）

#### cloudbuild.yaml の作成

```yaml
steps:
  # Dockerイメージをビルド
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'build'
      - '-t'
      - 'asia-northeast1-docker.pkg.dev/$PROJECT_ID/sales-daily-report/app:$COMMIT_SHA'
      - '-t'
      - 'asia-northeast1-docker.pkg.dev/$PROJECT_ID/sales-daily-report/app:latest'
      - '.'

  # イメージをArtifact Registryにプッシュ
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'push'
      - 'asia-northeast1-docker.pkg.dev/$PROJECT_ID/sales-daily-report/app:$COMMIT_SHA'

  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'push'
      - 'asia-northeast1-docker.pkg.dev/$PROJECT_ID/sales-daily-report/app:latest'

  # Cloud Runにデプロイ
  - name: 'gcr.io/cloud-builders/gcloud'
    args:
      - 'run'
      - 'deploy'
      - 'sales-daily-report'
      - '--image'
      - 'asia-northeast1-docker.pkg.dev/$PROJECT_ID/sales-daily-report/app:$COMMIT_SHA'
      - '--region'
      - 'asia-northeast1'
      - '--platform'
      - 'managed'
      - '--allow-unauthenticated'

images:
  - 'asia-northeast1-docker.pkg.dev/$PROJECT_ID/sales-daily-report/app:$COMMIT_SHA'
  - 'asia-northeast1-docker.pkg.dev/$PROJECT_ID/sales-daily-report/app:latest'

options:
  logging: CLOUD_LOGGING_ONLY
```

#### Cloud Buildでデプロイ

```bash
# ビルドとデプロイを実行
gcloud builds submit --config cloudbuild.yaml
```

### 方法2: ローカルビルド + gcloud deploy

```bash
# Dockerイメージをビルド
docker build -t asia-northeast1-docker.pkg.dev/[PROJECT-ID]/sales-daily-report/app:latest .

# イメージをプッシュ
docker push asia-northeast1-docker.pkg.dev/[PROJECT-ID]/sales-daily-report/app:latest

# Cloud Runにデプロイ
gcloud run deploy sales-daily-report \
  --image asia-northeast1-docker.pkg.dev/[PROJECT-ID]/sales-daily-report/app:latest \
  --platform managed \
  --region asia-northeast1 \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --timeout 300s
```

## 環境変数の設定

### Cloud Run環境変数の設定

```bash
# 環境変数を設定
gcloud run services update sales-daily-report \
  --region asia-northeast1 \
  --set-env-vars "\
DATABASE_URL=mongodb+srv://user:password@cluster.mongodb.net/sales_daily_report,\
SESSION_SECRET=your-production-session-secret,\
NEXT_PUBLIC_APP_URL=https://sales-daily-report-xxxxx-an.a.run.app,\
NODE_ENV=production"
```

### Secret Managerを使用（推奨）

機密情報は環境変数ではなく、Secret Managerを使用：

```bash
# Secretを作成
echo -n "mongodb+srv://user:password@cluster.mongodb.net/sales_daily_report" | \
  gcloud secrets create database-url --data-file=-

echo -n "your-production-session-secret" | \
  gcloud secrets create session-secret --data-file=-

# Cloud RunサービスにSecretをマウント
gcloud run services update sales-daily-report \
  --region asia-northeast1 \
  --set-secrets=DATABASE_URL=database-url:latest,SESSION_SECRET=session-secret:latest
```

## データベース接続の設定

### MongoDB Atlas の設定

1. **ネットワークアクセス設定**
   - MongoDB Atlasコンソールで「Network Access」を開く
   - 「Add IP Address」をクリック
   - 「Allow Access from Anywhere」を選択（`0.0.0.0/0`）
   - または、Cloud RunのIPアドレス範囲を追加

2. **データベースユーザー作成**
   - 「Database Access」を開く
   - 本番用ユーザーを作成
   - 読み書き権限を付与

3. **接続文字列の取得**
   - 「Connect」をクリック
   - 「Connect your application」を選択
   - 接続文字列をコピー

### Prismaマイグレーション（初回のみ）

```bash
# ローカルから本番DBに接続してマイグレーション実行
DATABASE_URL="mongodb+srv://..." npx prisma db push

# シードデータ投入（必要に応じて）
DATABASE_URL="mongodb+srv://..." npx prisma db seed
```

## デプロイ後の確認

### 1. サービスの確認

```bash
# サービスのURLを取得
gcloud run services describe sales-daily-report \
  --region asia-northeast1 \
  --format 'value(status.url)'

# ログを確認
gcloud run services logs read sales-daily-report \
  --region asia-northeast1 \
  --limit 50
```

### 2. ヘルスチェック

```bash
# アプリケーションの動作確認
curl https://[SERVICE-URL]

# APIヘルスチェック
curl https://[SERVICE-URL]/api/health
```

### 3. 動作テスト

ブラウザでアプリケーションにアクセスし、以下を確認：
- ログイン画面が表示されるか
- ログインできるか
- 日報作成ができるか
- データベースへの接続が正常か

## CI/CDパイプライン（オプション）

### GitHub Actionsの設定

`.github/workflows/deploy.yml` を作成：

```yaml
name: Deploy to Cloud Run

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v1
        with:
          project_id: ${{ secrets.GCP_PROJECT_ID }}
          service_account_key: ${{ secrets.GCP_SA_KEY }}

      - name: Configure Docker
        run: gcloud auth configure-docker asia-northeast1-docker.pkg.dev

      - name: Build and Deploy
        run: gcloud builds submit --config cloudbuild.yaml
```

### GitHub Secretsの設定

GitHubリポジトリの Settings > Secrets で以下を設定：
- `GCP_PROJECT_ID`: GCPプロジェクトID
- `GCP_SA_KEY`: サービスアカウントキー（JSON形式）

## カスタムドメインの設定

### 1. ドメインマッピングを作成

```bash
# カスタムドメインをマッピング
gcloud run domain-mappings create \
  --service sales-daily-report \
  --domain app.example.com \
  --region asia-northeast1
```

### 2. DNSレコードを設定

Cloud Consoleに表示されるDNSレコードをドメインレジストラで設定：

```
Type: CNAME
Name: app
Value: ghs.googlehosted.com
```

## スケーリング設定

### オートスケーリングの調整

```bash
# 最小・最大インスタンス数を設定
gcloud run services update sales-daily-report \
  --region asia-northeast1 \
  --min-instances 1 \
  --max-instances 100 \
  --cpu 2 \
  --memory 1Gi
```

### 同時実行数の設定

```bash
# 1インスタンスあたりの同時リクエスト数
gcloud run services update sales-daily-report \
  --region asia-northeast1 \
  --concurrency 80
```

## 監視とログ

### Cloud Loggingでログ確認

```bash
# リアルタイムでログをストリーム
gcloud run services logs tail sales-daily-report \
  --region asia-northeast1

# エラーログのみ表示
gcloud run services logs read sales-daily-report \
  --region asia-northeast1 \
  --filter "severity>=ERROR"
```

### Cloud Monitoringでメトリクス監視

GCP Consoleの「Monitoring」セクションで以下を確認：
- リクエスト数
- レスポンスタイム
- エラー率
- CPU・メモリ使用率

### アラート設定

```bash
# アラートポリシーを作成（例: エラー率が5%を超えた場合）
gcloud alpha monitoring policies create \
  --notification-channels [CHANNEL-ID] \
  --display-name "High Error Rate" \
  --condition-display-name "Error rate > 5%" \
  --condition-threshold-value 0.05 \
  --condition-threshold-duration 300s
```

## トラブルシューティング

### デプロイが失敗する

**症状**: デプロイ時にエラーが発生

**解決策**:
1. ログを確認: `gcloud builds log [BUILD-ID]`
2. Dockerイメージをローカルでビルド・テスト
3. 環境変数が正しく設定されているか確認

### アプリケーションが起動しない

**症状**: デプロイ成功後、アプリケーションが起動しない

**解決策**:
1. ログを確認: `gcloud run services logs read`
2. 環境変数（特に`DATABASE_URL`）を確認
3. Prismaクライアントが正しく生成されているか確認

### データベース接続エラー

**症状**: `MongoServerError: Authentication failed`

**解決策**:
1. MongoDB AtlasのIPホワイトリストを確認
2. 接続文字列の特殊文字がURLエンコードされているか確認
3. データベースユーザーの権限を確認

### パフォーマンスが悪い

**症状**: レスポンスが遅い

**解決策**:
1. CPU・メモリリソースを増やす
2. 最小インスタンス数を1以上に設定（コールドスタート対策）
3. データベースのクエリを最適化
4. MongoDB Atlasのクラスターサイズを確認

## コスト最適化

### 無料枠の活用

Cloud Runの無料枠：
- 月間200万リクエスト
- 36万vCPU秒
- 18万GiB秒のメモリ

### コスト削減のヒント

1. **最小インスタンス数を0に設定**（トラフィックが少ない場合）
2. **リソースを最適化**（必要最小限のCPU・メモリ）
3. **リージョンを適切に選択**（asia-northeast1は比較的安価）
4. **不要なログを削減**（ログの保存期間を調整）

## まとめ

基本的なデプロイフロー：

```bash
# 1. ビルドとデプロイ
gcloud builds submit --config cloudbuild.yaml

# 2. 環境変数設定
gcloud run services update sales-daily-report \
  --set-secrets=DATABASE_URL=database-url:latest,SESSION_SECRET=session-secret:latest

# 3. 動作確認
curl https://[SERVICE-URL]

# 4. ログ確認
gcloud run services logs tail sales-daily-report
```

詳細は [Google Cloud Run ドキュメント](https://cloud.google.com/run/docs) を参照してください。
