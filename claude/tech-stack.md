# 技術スタック

本プロジェクトで使用する技術とその選定理由を記載します。

## フロントエンド

### Next.js 14+ (App Router)

- **バージョン**: 14以上
- **用途**: フルスタックフレームワーク
- **選定理由**:
  - Server ComponentsとClient Componentsの使い分けによるパフォーマンス最適化
  - App Routerによる直感的なルーティング
  - API RoutesでバックエンドAPIも実装可能
  - React Server Actionsによるフォーム処理の簡素化
  - ビルトインの最適化機能（画像最適化、フォント最適化等）

### TypeScript

- **バージョン**: 5.x
- **用途**: 型安全な開発
- **選定理由**:
  - コンパイル時の型チェックによるバグの早期発見
  - IDEの補完機能による開発効率向上
  - 大規模開発での保守性向上

### React 18+

- **バージョン**: 18以上
- **用途**: UIライブラリ
- **選定理由**:
  - Next.jsの基盤
  - Server Componentsのサポート
  - Suspenseによる非同期処理の改善

### shadcn/ui

- **用途**: UIコンポーネントライブラリ
- **選定理由**:
  - Radix UIベースのアクセシブルなコンポーネント
  - カスタマイズ性が高い（コンポーネントをプロジェクトに直接コピー）
  - Tailwind CSSとの相性が良い
  - モダンで洗練されたデザイン

### Tailwind CSS

- **バージョン**: 3.x
- **用途**: CSSフレームワーク
- **選定理由**:
  - ユーティリティファーストで開発速度が速い
  - カスタマイズ性が高い
  - レスポンシブデザインが容易
  - ビルド時に未使用のCSSを削除してファイルサイズを最小化

## バックエンド

### Next.js API Routes (App Router)

- **用途**: APIエンドポイントの実装
- **選定理由**:
  - フロントエンドと同じリポジトリで管理可能
  - TypeScriptで型安全なAPI実装
  - Vercel等へのデプロイが容易

### Hono

- **バージョン**: 4.x
- **用途**: 軽量なWebフレームワーク（API Routes内で使用）
- **選定理由**:
  - 超高速・軽量
  - TypeScript完全対応
  - ミドルウェアのサポート
  - Next.js API Routesと統合可能
  - バリデーションとの統合が容易

### OpenAPI

- **バージョン**: 3.x
- **用途**: APIスキーマ定義
- **選定理由**:
  - API仕様の明確化と標準化
  - ドキュメント自動生成
  - クライアントコード生成が可能
  - 業界標準のAPI仕様フォーマット

### Zod

- **バージョン**: 3.x
- **用途**: スキーマバリデーション
- **選定理由**:
  - TypeScript-firstのバリデーションライブラリ
  - 型推論が強力
  - OpenAPIスキーマとの統合が容易
  - エラーメッセージのカスタマイズが柔軟

## データベース

### MongoDB

- **用途**: NoSQLデータベース
- **選定理由**:
  - スキーマレスで柔軟なデータモデリング
  - JSON形式のデータ格納でJavaScript/TypeScriptとの親和性が高い
  - MongoDB Atlasでマネージドサービスが利用可能
  - スケーラビリティが高い

### Prisma

- **バージョン**: 5.x
- **用途**: ORMとスキーマ管理
- **選定理由**:
  - TypeScript完全対応で型安全なDB操作
  - 直感的なクエリAPI
  - マイグレーション管理
  - MongoDBのサポート
  - Prisma Studioによる視覚的なデータ管理

**注意**: PrismaはMongoDBに対してはリレーショナルなマイグレーション機能を提供しませんが、スキーマ定義と型生成には使用できます。

## 認証

### セッションベース認証

- **用途**: ユーザー認証
- **実装方法**:
  - Cookieを使用したセッション管理
  - セッションIDの安全な保存
  - セッションタイムアウト: 30分
- **選定理由**:
  - サーバーサイドでセッション管理が可能
  - セキュリティが高い
  - ログアウト処理が確実

## テスト

### Vitest

- **バージョン**: 1.x
- **用途**: ユニットテスト、統合テスト
- **選定理由**:
  - Viteベースで高速
  - Jest互換のAPI
  - TypeScript完全対応
  - ESM対応
  - Next.jsとの統合が容易

### Testing Library

- **用途**: Reactコンポーネントのテスト
- **選定理由**:
  - ユーザーの視点でテストを書ける
  - アクセシビリティを意識したテスト
  - React Testing Libraryとの統合

## デプロイ・インフラ

### Google Cloud Run

- **用途**: コンテナベースのサーバーレスプラットフォーム
- **選定理由**:
  - Dockerコンテナのデプロイが容易
  - 自動スケーリング
  - リクエストがない時は0にスケールダウンしてコスト削減
  - HTTPS自動設定
  - Cloud Build等のGCPサービスとの統合が容易

### Docker

- **用途**: コンテナ化
- **選定理由**:
  - 環境の一貫性確保
  - Cloud Runへのデプロイに必要
  - ローカル開発環境の再現性

### MongoDB Atlas

- **用途**: 本番環境のデータベース
- **選定理由**:
  - マネージドサービスで運用が容易
  - 自動バックアップ
  - グローバル展開が可能
  - 無料枠から始められる

## 開発ツール

### ESLint

- **用途**: コードの静的解析
- **選定理由**:
  - コーディング規約の統一
  - バグの早期発見

### Prettier

- **用途**: コードフォーマッター
- **選定理由**:
  - コードスタイルの統一
  - 自動フォーマット

### Git

- **用途**: バージョン管理
- **選定理由**:
  - 業界標準
  - GitHub/GitLabとの統合

## パッケージマネージャー

### npm

- **用途**: パッケージ管理
- **選定理由**:
  - Node.jsのデフォルトパッケージマネージャー
  - 広く使われている

**代替案**: pnpm, yarnも使用可能（チームの判断による）

## 環境変数管理

### .env.local

- **用途**: ローカル開発環境の環境変数
- **選定理由**:
  - Next.jsのデフォルトサポート
  - Gitにコミットしない設定が容易

### Google Cloud Run Environment Variables

- **用途**: 本番環境の環境変数
- **選定理由**:
  - Cloud Runの標準機能
  - シークレット管理との統合

## 技術スタック一覧（まとめ）

| カテゴリ         | 技術                 | バージョン |
| ---------------- | -------------------- | ---------- |
| 言語             | TypeScript           | 5.x        |
| フレームワーク   | Next.js (App Router) | 14+        |
| UI               | React                | 18+        |
| UIコンポーネント | shadcn/ui            | -          |
| CSS              | Tailwind CSS         | 3.x        |
| API              | Hono                 | 4.x        |
| APIスキーマ      | OpenAPI              | 3.x        |
| バリデーション   | Zod                  | 3.x        |
| データベース     | MongoDB              | -          |
| ORM              | Prisma               | 5.x        |
| テスト           | Vitest               | 1.x        |
| デプロイ         | Google Cloud Run     | -          |
| コンテナ         | Docker               | -          |

## 参考リンク

- [Next.js Documentation](https://nextjs.org/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Hono Documentation](https://hono.dev/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Vitest Documentation](https://vitest.dev/)
- [Google Cloud Run Documentation](https://cloud.google.com/run/docs)
