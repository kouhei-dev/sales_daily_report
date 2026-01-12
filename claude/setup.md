# 開発環境セットアップガイド

本プロジェクトの開発環境をセットアップする手順を記載します。

## 前提条件

### 必須

- **Node.js**: v18.17.0以上（v20推奨）
  - [公式サイト](https://nodejs.org/)からインストール
  - バージョン確認: `node --version`

- **npm**: v9以上（Node.jsに付属）
  - バージョン確認: `npm --version`
  - 代替案: pnpm, yarn も使用可能

- **Git**: v2.30以上
  - [公式サイト](https://git-scm.com/)からインストール
  - バージョン確認: `git --version`

### データベース

以下のいずれかを用意してください：

- **MongoDB Atlas**（推奨）
  - [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)でアカウント作成
  - 無料のM0クラスターを作成
  - 接続文字列を取得

- **ローカルMongoDB**
  - [公式サイト](https://www.mongodb.com/try/download/community)からインストール
  - デフォルトで `mongodb://localhost:27017` で起動

### 推奨ツール

- **Visual Studio Code**（エディタ）
  - 拡張機能:
    - ESLint
    - Prettier
    - Tailwind CSS IntelliSense
    - Prisma

- **MongoDB Compass**（データベースGUI）
  - MongoDBの視覚的な管理ツール

## セットアップ手順

### 1. リポジトリのクローン

```bash
# HTTPSの場合
git clone https://github.com/your-org/sales_daily_report.git

# SSHの場合
git clone git@github.com:your-org/sales_daily_report.git

# ディレクトリに移動
cd sales_daily_report
```

### 2. 依存パッケージのインストール

```bash
npm install
```

**注意**: 初回インストール時は時間がかかる場合があります。

### 3. 環境変数の設定

#### .env.local ファイルの作成

```bash
# .env.exampleをコピー
cp .env.example .env.local
```

#### 環境変数の設定

`.env.local` ファイルを編集して、以下の環境変数を設定します：

```bash
# データベース接続文字列
# MongoDB Atlasの場合
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/sales_daily_report?retryWrites=true&w=majority"

# ローカルMongoDBの場合
# DATABASE_URL="mongodb://localhost:27017/sales_daily_report"

# セッション秘密鍵（ランダムな文字列を生成）
SESSION_SECRET="your-super-secret-session-key-change-this"

# Next.js設定
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Node環境
NODE_ENV="development"
```

**セッション秘密鍵の生成方法**:
```bash
# ランダムな文字列を生成
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Prismaのセットアップ

#### Prismaクライアントの生成

```bash
npx prisma generate
```

これにより、`prisma/schema.prisma` に基づいてTypeScript型定義が生成されます。

#### データベースの初期化

MongoDBの場合、マイグレーションの概念はありませんが、スキーマをデータベースに反映します：

```bash
# スキーマをデータベースにプッシュ
npx prisma db push
```

#### 初期データの投入（オプション）

テスト用のマスタデータを投入する場合：

```bash
npx prisma db seed
```

**注意**: `prisma/seed.ts` ファイルが必要です。まだ作成されていない場合は、このステップをスキップしてください。

### 5. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで以下のURLにアクセス：
- **アプリケーション**: http://localhost:3000
- **API**: http://localhost:3000/api/v1

**成功時の表示**:
```
▲ Next.js 14.x.x
- Local:        http://localhost:3000
- Network:      http://192.168.x.x:3000

✓ Ready in 2.5s
```

### 6. Prisma Studioの起動（オプション）

データベースを視覚的に管理するために、Prisma Studioを起動できます：

```bash
npx prisma studio
```

ブラウザで http://localhost:5555 にアクセスします。

## 開発フロー

### コードの編集

1. ファイルを編集
2. 保存すると自動的にホットリロード（変更が即座に反映）

### 型チェック

```bash
# TypeScriptの型チェック
npm run type-check
```

### リンター・フォーマッター

```bash
# ESLintでコードチェック
npm run lint

# Prettierでコード整形
npm run format
```

### テストの実行

```bash
# 全テストを実行
npm test

# ウォッチモードでテスト実行
npm run test:watch

# カバレッジレポート生成
npm run test:coverage
```

## トラブルシューティング

### 依存パッケージのインストールエラー

**症状**: `npm install` が失敗する

**解決策**:
```bash
# node_modulesとpackage-lock.jsonを削除
rm -rf node_modules package-lock.json

# キャッシュをクリア
npm cache clean --force

# 再インストール
npm install
```

### Prismaクライアントが見つからない

**症状**: `@prisma/client` が見つからないエラー

**解決策**:
```bash
# Prismaクライアントを再生成
npx prisma generate
```

### データベース接続エラー

**症状**: `MongoServerError: Authentication failed` 等

**解決策**:
1. `.env.local` の `DATABASE_URL` を確認
2. MongoDB Atlasの場合、IPアドレスがホワイトリストに登録されているか確認
3. ユーザー名・パスワードが正しいか確認
4. 接続文字列の特殊文字がURLエンコードされているか確認

### ポート3000が既に使用されている

**症状**: `Port 3000 is already in use`

**解決策**:
```bash
# 別のポートを使用
PORT=3001 npm run dev

# または、3000番ポートを使用しているプロセスを終了
# macOS/Linux
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### ホットリロードが動作しない

**症状**: ファイルを変更しても反映されない

**解決策**:
1. ブラウザのキャッシュをクリア
2. 開発サーバーを再起動
3. `.next` ディレクトリを削除して再ビルド:
   ```bash
   rm -rf .next
   npm run dev
   ```

### TypeScriptのエラー

**症状**: 型エラーが発生する

**解決策**:
```bash
# 型定義を再生成
npx prisma generate

# TypeScriptサーバーをVS Codeで再起動
# Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server"
```

## 便利なコマンド一覧

| コマンド | 説明 |
|---------|------|
| `npm run dev` | 開発サーバー起動 |
| `npm run build` | 本番ビルド |
| `npm run start` | 本番サーバー起動 |
| `npm run lint` | ESLint実行 |
| `npm run format` | Prettier実行 |
| `npm test` | テスト実行 |
| `npm run type-check` | 型チェック |
| `npx prisma studio` | Prisma Studio起動 |
| `npx prisma generate` | Prismaクライアント生成 |
| `npx prisma db push` | スキーマをDBにプッシュ |
| `npx prisma db seed` | 初期データ投入 |

## VS Code設定（推奨）

プロジェクトルートに `.vscode/settings.json` を作成：

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ]
}
```

## Next Steps

セットアップが完了したら、以下のドキュメントを参照してください：

- [開発ガイドライン](./guidelines.md) - コーディング規約とベストプラクティス
- [アーキテクチャ](./architecture.md) - システム構成の理解
- [API仕様書](../api_specification.md) - API実装の参考

開発を開始する前に、[画面定義書](../screen_definition.md) で実装する機能を確認することをお勧めします。
