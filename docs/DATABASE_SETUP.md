# データベースセットアップガイド

このドキュメントでは、Sales Daily Reportシステムのデータベース環境構築手順を説明します。

## 目次

- [ローカル開発環境のセットアップ](#ローカル開発環境のセットアップ)
- [本番環境（MongoDB Atlas）のセットアップ](#本番環境mongodb-atlasのセットアップ)
- [データベース管理コマンド](#データベース管理コマンド)
- [トラブルシューティング](#トラブルシューティング)
- [セキュリティベストプラクティス](#セキュリティベストプラクティス)
- [パフォーマンス最適化](#パフォーマンス最適化)

## ローカル開発環境のセットアップ

### 前提条件

- Docker Desktop がインストールされている
- Node.js 20以上がインストールされている
- npm または pnpm がインストールされている

### セットアップ手順

#### 1. 環境変数の設定

```bash
# .env.exampleから.env.localをコピー
cp .env.example .env.local
```

`.env.local`の内容を確認します。

```env
DATABASE_URL="mongodb://localhost:27017/sales_daily_report"
```

#### 2. MongoDBコンテナの起動

```bash
# MongoDBコンテナをバックグラウンドで起動
npm run db:up

# ログを確認
npm run db:logs
```

コンテナが正常に起動したことを確認します。

```
✔ Container sales_daily_report_mongodb  Started
```

#### 3. データベース接続テスト

```bash
# 接続テストを実行
npm run db:test
```

成功すると以下のような出力が表示されます。

```
🔌 データベース接続テストを開始します...

📝 接続先: mongodb://localhost:27017/sales_daily_report

⏳ データベースに接続中...
✅ データベースに接続しました

📊 データベース情報を取得中...
✅ MongoDBバージョン: 7.0.x

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ データベース接続テスト成功！
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

#### 4. Prismaスキーマの適用

```bash
# スキーマをデータベースに反映
npm run db:push
```

成功すると、以下のコレクションが作成されます。

- `sales` - 営業マスタ
- `customers` - 顧客マスタ
- `daily_reports` - 日報
- `visit_records` - 訪問記録
- `comments` - コメント

#### 5. ワンコマンドセットアップ（オプション）

上記の手順2-4を一度に実行できます。

```bash
npm run db:setup
```

### 開発用ツール（オプション）

MongoExpressを使用して、GUIでデータベースを管理できます。

```bash
# Mongo Expressを起動
npm run db:tools

# ブラウザでアクセス
open http://localhost:8081
```

注意: Mongo Expressは開発環境でのみ使用してください。本番環境では絶対に使用しないでください。

## 本番環境（MongoDB Atlas）のセットアップ

### MongoDB Atlasアカウントの作成

1. [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)にアクセス
2. アカウントを作成（無料枠あり）
3. 組織とプロジェクトを作成

### クラスターの作成

#### 推奨構成

| 環境              | クラスターサイズ | 月額コスト（目安） | 推奨リージョン         |
| ----------------- | ---------------- | ------------------ | ---------------------- |
| 開発/ステージング | M0 (Free)        | $0                 | asia-northeast1 (東京) |
| 本番（小規模）    | M10              | $57〜              | asia-northeast1 (東京) |
| 本番（中規模）    | M20              | $140〜             | asia-northeast1 (東京) |

#### クラスター作成手順

1. **Cluster Tierの選択**
   - 開発環境: M0 (Free)
   - 本番環境: M10以上（自動バックアップ有効）

2. **リージョンの選択**
   - Google Cloud Platform
   - asia-northeast1 (Tokyo, Japan)
   - レイテンシを最小化するため、Cloud Runと同一リージョンを選択

3. **クラスター名の設定**
   - 例: `sales-daily-report-prod`

### データベースユーザーの作成

1. Database Access → Add New Database User
2. Authentication Method: Password
3. ユーザー名とパスワードを設定（強力なパスワードを使用）
4. Database User Privileges: **Read and write to any database**
   - 最小権限の原則に従い、必要な権限のみ付与
5. ユーザーを作成

### ネットワークアクセスの設定

1. Network Access → Add IP Address
2. オプション1: 特定のIPアドレス（推奨）
   - Cloud RunのIP範囲を追加
3. オプション2: Anywhere (0.0.0.0/0)
   - すべてのIPからのアクセスを許可
   - 注意: この場合、強力な認証が必須

### 接続文字列の取得

1. Clusters → Connect → Connect your application
2. Driver: Node.js
3. Version: 5.5 or later
4. 接続文字列をコピー

```
mongodb+srv://<username>:<password>@cluster.mongodb.net/sales_daily_report
```

### 環境変数の設定

`.env.production.example`を参考に、本番環境の環境変数を設定します。

```bash
# 本番環境用の環境変数ファイルを作成
cp .env.production.example .env.production
```

`.env.production`を編集し、実際の値を設定します。

```env
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/sales_daily_report?retryWrites=true&w=majority&readPreference=primaryPreferred&maxPoolSize=10&minPoolSize=2&serverSelectionTimeoutMS=5000&connectTimeoutMS=10000&socketTimeoutMS=30000&ssl=true"
```

重要: `.env.production`はGitにコミットしないでください（.gitignoreに含まれています）。

### バックアップの設定

1. Clusters → Backup タブ
2. M10以上のクラスターでは自動バックアップが有効
3. 設定項目:
   - Snapshot Frequency: 1日1回（デフォルト）
   - Retention Period: 7日間（最低）
   - Point-in-Time Restore: 有効化（推奨）

### アラートの設定

1. Alerts → Add Alert
2. 推奨アラート:
   - Connections: 接続数が最大値の80%を超えた場合
   - CPU Usage: CPU使用率が80%を超えた場合
   - Disk Usage: ディスク使用率が80%を超えた場合
   - Replication Lag: レプリケーション遅延が30秒を超えた場合

## データベース管理コマンド

### 基本コマンド

```bash
# MongoDBコンテナを起動
npm run db:up

# MongoDBコンテナを停止
npm run db:down

# MongoDBコンテナを一時停止
npm run db:stop

# MongoDBコンテナを再起動
npm run db:restart

# MongoDBのログを表示
npm run db:logs

# データベース接続テスト
npm run db:test

# Prismaスキーマを適用
npm run db:push

# Prisma Studioを起動（GUI管理ツール）
npm run prisma:studio

# データとコンテナを完全削除（注意: データが失われます）
npm run db:clean
```

### Prismaコマンド

```bash
# Prismaクライアントを生成
npm run prisma:generate

# スキーマをデータベースに反映
npm run prisma:push

# Prisma Studioを起動
npm run prisma:studio

# マイグレーションを作成（MongoDBでは非推奨）
# npx prisma migrate dev
```

## トラブルシューティング

### 接続エラー: ECONNREFUSED

**原因**: MongoDBコンテナが起動していない

**解決方法**:

```bash
# コンテナの状態を確認
docker ps | grep mongodb

# コンテナを起動
npm run db:up

# ログを確認
npm run db:logs
```

### 接続エラー: Authentication failed

**原因**: 認証情報が間違っている

**解決方法**:

1. `.env.local`または`.env.production`のDATABASE_URLを確認
2. MongoDB Atlasの場合、ユーザー名とパスワードが正しいか確認
3. IPアドレスがホワイトリストに追加されているか確認

### 接続エラー: Timeout

**原因**: ネットワーク接続の問題、またはFirewall

**解決方法**:

1. dockerを再起動。 npm run db:down && npm run db:up
2. ネットワーク接続を確認
3. MongoDB Atlasの場合、Network Access設定を確認
4. Firewallでポート27017がブロックされていないか確認

### Prismaクライアントが見つからない

**原因**: Prismaクライアントが生成されていない

**解決方法**:

```bash
# Prismaクライアントを生成
npm run prisma:generate

# または依存関係を再インストール
npm install
```

### コンテナが起動しない

**原因**: ポート27017が既に使用されている

**解決方法**:

```bash
# ポート27017を使用しているプロセスを確認
lsof -i :27017

# または
netstat -an | grep 27017

# 既存のMongoDBプロセスを停止
sudo systemctl stop mongod
```

## セキュリティベストプラクティス

### ローカル開発環境

1. **環境変数の管理**
   - `.env.local`はGitにコミットしない
   - センシティブな情報は環境変数に保存

2. **コンテナのセキュリティ**
   - 開発環境では認証なしで運用可能
   - ローカルネットワーク外からアクセスしない

### 本番環境（MongoDB Atlas）

1. **強力な認証**
   - 複雑なパスワードを使用（最低16文字、英数字記号混在）
   - パスワード管理ツール（1Password、LastPassなど）を使用

2. **ネットワークアクセス制限**
   - 可能な限り特定のIPアドレスのみ許可
   - 0.0.0.0/0は最終手段（強力な認証が必須）

3. **接続文字列のセキュリティ**
   - SSL/TLS暗号化を強制（`ssl=true`）
   - 接続プールサイズを適切に設定

4. **データベースユーザーの権限**
   - 最小権限の原則に従う
   - アプリケーションごとに異なるユーザーを作成

5. **監査ログ**
   - M10以上でDatabase Access Historyを確認
   - 不正アクセスの早期検出

6. **定期的なセキュリティ監査**
   - 四半期ごとにアクセス権限を見直し
   - 不要なユーザーの削除
   - パスワードの定期的な変更

## パフォーマンス最適化

### インデックス戦略

Prismaスキーマで定義されたインデックス:

```prisma
// daily_reports
@@index([reportDate])      // 日付検索
@@index([status])          // ステータス検索

// visit_records
@@index([visitDatetime])   // 訪問日時検索
```

追加のインデックスが必要な場合、Prisma Studioまたはmongoコマンドで作成できます。

### クエリパフォーマンス

1. **適切なインデックスの使用**
   - よく検索されるフィールドにインデックスを作成
   - 複合インデックスを活用

2. **クエリの最適化**
   - 必要なフィールドのみ取得（select）
   - ページネーションの実装（skip/take）
   - リレーションの効率的な読み込み（include）

3. **接続プールの設定**
   - maxPoolSize: Cloud Runの同時実行数に合わせる
   - minPoolSize: レイテンシを削減

### MongoDB Atlasのパフォーマンスモニタリング

1. **Performance Advisor**
   - インデックスの推奨事項を確認
   - スロークエリの特定

2. **Real-Time Performance Panel**
   - CPU、メモリ、ディスク使用率の監視
   - 接続数の監視

3. **Query Profiler**
   - スロークエリの分析
   - クエリパターンの最適化

## コスト最適化

### MongoDB Atlas コスト削減策

1. **適切なクラスターサイズ**
   - 過剰なスペックを避ける
   - 開発環境はM0 (Free)を使用

2. **データ保持ポリシー**
   - 古いデータの定期削除
   - TTLインデックスの活用

3. **バックアップストレージ**
   - 保持期間を必要最小限に設定
   - スナップショット頻度の調整

4. **リージョンの選択**
   - データ転送コストを考慮
   - アプリケーションと同一リージョン

5. **Auto-Scaling**
   - M10以上でAuto-Scalingを有効化
   - トラフィックに応じた自動調整

### 予想コスト（月額）

| 構成           | クラスター | ストレージ       | バックアップ | 合計   |
| -------------- | ---------- | ---------------- | ------------ | ------ |
| 開発環境       | M0 (Free)  | 512MB (含まれる) | なし         | $0     |
| 本番（小規模） | M10        | 10GB (含まれる)  | 7日間        | $57〜  |
| 本番（中規模） | M20        | 20GB (含まれる)  | 7日間        | $140〜 |

注意: 実際のコストはリージョン、データ転送量、追加ストレージにより変動します。

## まとめ

このガイドに従ってデータベース環境を構築することで、以下を達成できます。

- ローカル開発環境での迅速な開発
- 本番環境での高可用性とセキュリティ
- コスト効率の良いインフラ運用
- パフォーマンスの最適化

質問や問題が発生した場合は、[トラブルシューティング](#トラブルシューティング)セクションを参照してください。
