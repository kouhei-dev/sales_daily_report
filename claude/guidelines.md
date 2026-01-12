# 開発ガイドライン

本プロジェクトの開発における規約とベストプラクティスを記載します。

## プロジェクト構成

```
sales_daily_report/
├── app/                        # Next.js App Router
│   ├── (auth)/                # 認証関連ページグループ（レイアウト共有）
│   │   ├── login/
│   │   │   └── page.tsx       # ログインページ
│   │   └── layout.tsx         # 認証レイアウト
│   │
│   ├── (dashboard)/            # ダッシュボードページグループ
│   │   ├── layout.tsx         # ダッシュボードレイアウト（ヘッダー、サイドメニュー）
│   │   ├── page.tsx           # ホーム画面 (S02)
│   │   │
│   │   ├── reports/           # 日報関連
│   │   │   ├── page.tsx       # 日報一覧 (S03)
│   │   │   ├── new/
│   │   │   │   └── page.tsx   # 日報作成 (S04)
│   │   │   └── [id]/
│   │   │       ├── page.tsx   # 日報詳細 (S05)
│   │   │       └── edit/
│   │   │           └── page.tsx # 日報編集 (S04)
│   │   │
│   │   ├── customers/         # 顧客マスタ
│   │   │   ├── page.tsx       # 顧客一覧 (S06)
│   │   │   ├── new/
│   │   │   │   └── page.tsx   # 顧客登録 (S07)
│   │   │   └── [id]/
│   │   │       └── page.tsx   # 顧客編集 (S07)
│   │   │
│   │   └── sales/             # 営業マスタ（管理者のみ）
│   │       ├── page.tsx       # 営業一覧 (S08)
│   │       ├── new/
│   │       │   └── page.tsx   # 営業登録 (S09)
│   │       └── [id]/
│   │           └── page.tsx   # 営業編集 (S09)
│   │
│   ├── api/                    # API Routes (Hono)
│   │   └── v1/
│   │       ├── auth/          # 認証API
│   │       │   ├── login/
│   │       │   ├── logout/
│   │       │   └── session/
│   │       ├── reports/       # 日報API
│   │       ├── comments/      # コメントAPI
│   │       ├── customers/     # 顧客API
│   │       └── sales/         # 営業API
│   │
│   ├── layout.tsx              # ルートレイアウト
│   └── globals.css             # グローバルスタイル
│
├── components/                 # Reactコンポーネント
│   ├── ui/                    # shadcn/uiコンポーネント
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   └── ...
│   │
│   └── features/              # 機能別コンポーネント
│       ├── reports/
│       │   ├── report-list.tsx
│       │   ├── report-form.tsx
│       │   └── report-detail.tsx
│       ├── comments/
│       │   ├── comment-list.tsx
│       │   └── comment-form.tsx
│       └── customers/
│           └── customer-form.tsx
│
├── lib/                        # ユーティリティ・ヘルパー
│   ├── prisma.ts              # Prismaクライアントシングルトン
│   ├── auth.ts                # 認証ヘルパー
│   ├── session.ts             # セッション管理
│   ├── schemas/               # Zodスキーマ定義
│   │   ├── report.ts
│   │   ├── comment.ts
│   │   ├── customer.ts
│   │   └── sales.ts
│   ├── validations/           # バリデーションロジック
│   └── utils.ts               # 汎用ユーティリティ
│
├── prisma/                     # Prisma関連
│   ├── schema.prisma          # データベーススキーマ
│   └── seed.ts                # シードデータ
│
├── public/                     # 静的ファイル
│   ├── images/
│   └── icons/
│
├── __tests__/                  # テスト
│   ├── unit/                  # ユニットテスト
│   ├── integration/           # 統合テスト
│   └── e2e/                   # E2Eテスト（オプション）
│
├── .env.local                  # 環境変数（Gitにコミットしない）
├── .env.example                # 環境変数のテンプレート
├── .eslintrc.json              # ESLint設定
├── .prettierrc                 # Prettier設定
├── next.config.js              # Next.js設定
├── tailwind.config.ts          # Tailwind CSS設定
├── tsconfig.json               # TypeScript設定
├── vitest.config.ts            # Vitest設定
└── package.json                # 依存関係
```

## コーディング規約

### TypeScript

#### 型定義

- **型安全性を最優先**: `any` の使用は極力避ける
- **型推論を活用**: 明らかな場合は型注釈を省略可能
- **明示的な型注釈**: 関数の引数と戻り値には型を明示

```typescript
// Good: 型を明示
function createReport(data: CreateReportInput): Promise<DailyReport> {
  // ...
}

// Bad: anyを使用
function createReport(data: any): any {
  // ...
}
```

#### インターフェース vs Type

- **インターフェース**: オブジェクトの形状を定義する場合
- **Type**: ユニオン型やプリミティブ型の別名の場合

```typescript
// Good: インターフェース
interface User {
  id: string;
  name: string;
  email: string;
}

// Good: Type
type Status = 'draft' | 'submitted' | 'commented';
type Result<T> = { success: true; data: T } | { success: false; error: string };
```

### 命名規則

| 対象 | 命名規則 | 例 |
|-----|---------|-----|
| コンポーネント | PascalCase | `ReportList`, `CommentCard` |
| ファイル（コンポーネント） | kebab-case | `report-list.tsx`, `comment-card.tsx` |
| 関数 | camelCase | `createReport`, `getReportById` |
| 変数 | camelCase | `reportData`, `userId` |
| 定数 | UPPER_SNAKE_CASE | `MAX_VISITS`, `API_BASE_URL` |
| 型・インターフェース | PascalCase | `Report`, `CreateReportInput` |
| プライベート変数 | _camelCase | `_internalState` |
| API Routes | kebab-case | `/api/v1/reports`, `/api/v1/comments` |
| データベーステーブル | PascalCase | `DailyReport`, `VisitRecord` |

#### コンポーネント命名のパターン

- `<Feature><Type>`: 機能+種類（例: `ReportList`, `CommentForm`）
- `<Feature><Action><Type>`: 機能+動作+種類（例: `ReportCreateForm`）

### ファイル構成

#### コンポーネントファイル

```typescript
// report-list.tsx
'use client'; // Client Componentの場合

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// 型定義
interface ReportListProps {
  reports: Report[];
  onReportClick: (id: string) => void;
}

// コンポーネント本体
export function ReportList({ reports, onReportClick }: ReportListProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // ハンドラ関数
  const handleClick = (id: string) => {
    setSelectedId(id);
    onReportClick(id);
  };

  // レンダリング
  return (
    <div className="space-y-4">
      {reports.map((report) => (
        <Card key={report.id} onClick={() => handleClick(report.id)}>
          {/* ... */}
        </Card>
      ))}
    </div>
  );
}
```

#### API Routeファイル

```typescript
// app/api/v1/reports/route.ts
import { NextRequest } from 'next/server';
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { createReportSchema } from '@/lib/schemas/report';
import { getSession } from '@/lib/session';

const app = new Hono();

// POST /api/v1/reports
app.post('/reports', zValidator('json', createReportSchema), async (c) => {
  // セッション確認
  const session = await getSession();
  if (!session) {
    return c.json({ status: 'error', error: { code: 'AUTH_UNAUTHORIZED' } }, 401);
  }

  // バリデーション済みデータ取得
  const data = c.req.valid('json');

  // ビジネスロジック
  const report = await createReport(data, session.userId);

  return c.json({ status: 'success', data: report }, 201);
});

export const POST = app.fetch;
```

## Reactコンポーネント

### Server Components vs Client Components

#### Server Components（デフォルト）

- **使用場面**:
  - データフェッチが必要
  - SEOが重要
  - 秘密鍵やAPIキーを使用
  - 静的なUI

```typescript
// app/reports/[id]/page.tsx
import { getReportById } from '@/lib/reports';
import { ReportDetail } from '@/components/features/reports/report-detail';

// Server Component（デフォルト）
export default async function ReportPage({ params }: { params: { id: string } }) {
  const report = await getReportById(params.id);

  return <ReportDetail report={report} />;
}
```

#### Client Components

- **使用場面**:
  - イベントハンドラが必要
  - state, effectsを使用
  - ブラウザAPIを使用
  - カスタムフックを使用

```typescript
// components/features/reports/report-form.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function ReportForm() {
  const [data, setData] = useState({});

  const handleSubmit = async () => {
    // ...
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* ... */}
    </form>
  );
}
```

### Props

- **分割代入を使用**: `({ prop1, prop2 }: Props)`
- **型定義を明示**: インターフェースまたは型で定義
- **デフォルト値**: 必要に応じて設定

```typescript
interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  onClick?: () => void;
}

export function Button({
  children,
  variant = 'primary',
  disabled = false,
  onClick
}: ButtonProps) {
  // ...
}
```

## スタイリング（Tailwind CSS）

### 基本方針

- **ユーティリティクラス優先**: Tailwindのクラスを使用
- **カスタムCSSは最小限**: どうしても必要な場合のみ
- **レスポンシブ対応**: `sm:`, `md:`, `lg:` プレフィックスを使用

### クラス名の順序

```typescript
// 推奨: グループ化して記述
<div className="
  flex items-center justify-between  // Layout
  px-4 py-2                          // Spacing
  bg-white border border-gray-200    // Background & Border
  rounded-lg shadow-sm               // Border & Effects
  hover:bg-gray-50                   // Hover
  transition-colors                  // Transitions
">
```

### shadcn/uiコンポーネントのカスタマイズ

```typescript
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

<Button
  className={cn(
    "w-full",              // 追加スタイル
    isActive && "bg-blue-600"  // 条件付きスタイル
  )}
>
  Submit
</Button>
```

## API実装

### スキーマ定義（Zod）

```typescript
// lib/schemas/report.ts
import { z } from 'zod';

export const createReportSchema = z.object({
  reportDate: z.string().date(),
  problem: z.string().max(1000).optional(),
  plan: z.string().max(1000).optional(),
  status: z.enum(['draft', 'submitted']),
  visitRecords: z.array(
    z.object({
      customerId: z.string(),
      visitDatetime: z.string().datetime(),
      visitContent: z.string().max(500),
      visitResult: z.string().max(500).optional(),
      displayOrder: z.number().int().positive()
    })
  ).min(1).max(10)
});

export type CreateReportInput = z.infer<typeof createReportSchema>;
```

### エラーハンドリング

```typescript
// 統一されたエラーレスポンス
return c.json(
  {
    status: 'error',
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Invalid input',
      details: [
        { field: 'reportDate', message: 'Date is required' }
      ]
    }
  },
  400
);
```

## データベース（Prisma）

### クエリの基本

```typescript
// 取得
const report = await prisma.dailyReport.findUnique({
  where: { id: reportId },
  include: {
    visitRecords: true,
    comments: true
  }
});

// 作成
const report = await prisma.dailyReport.create({
  data: {
    reportDate: new Date(),
    salesId: userId,
    status: 'draft',
    visitRecords: {
      create: [
        { customerId, visitDatetime, visitContent }
      ]
    }
  }
});

// 更新
await prisma.dailyReport.update({
  where: { id: reportId },
  data: { status: 'submitted' }
});

// 削除
await prisma.dailyReport.delete({
  where: { id: reportId }
});
```

### トランザクション

```typescript
await prisma.$transaction(async (tx) => {
  const report = await tx.dailyReport.create({ data: reportData });
  await tx.visitRecord.createMany({ data: visitRecords });
});
```

## テスト

### テスト作成の厳守事項

**絶対に守ってください！**

#### 1. テストコードの品質

- テストは**必ず実際の機能を検証**すること
- `expect(true).toBe(true)` のような**意味のないアサーションは絶対に書かない**
- 各テストケースは**具体的な入力と期待される出力を検証**すること
- モックは**必要最小限**に留め、実際の動作に近い形でテストすること

```typescript
// Bad: 意味のないテスト
test('report exists', () => {
  expect(true).toBe(true);
});

// Good: 実際の機能を検証
test('creates a new report with visit records', async () => {
  const input = {
    reportDate: '2026-01-12',
    status: 'submitted',
    visitRecords: [
      { customerId: 'C001', visitDatetime: '2026-01-12T10:00:00Z', visitContent: 'Meeting' }
    ]
  };

  const report = await createReport(input, 'S001');

  expect(report.id).toBeDefined();
  expect(report.status).toBe('submitted');
  expect(report.visitRecords).toHaveLength(1);
});
```

#### 2. ハードコーディングの禁止

- **テストを通すためだけのハードコードは絶対に禁止**
- 本番コードに `if (testMode)` のような条件分岐を入れない
- テスト用の特別な値（マジックナンバー）を本番コードに埋め込まない
- 環境変数や設定ファイルを使用して、テスト環境と本番環境を適切に分離すること

```typescript
// Bad: テスト用のハードコード
export function calculateTotal(items: Item[]) {
  if (process.env.NODE_ENV === 'test') {
    return 1000; // テストを通すためだけの値
  }
  return items.reduce((sum, item) => sum + item.price, 0);
}

// Good: 正しいロジック
export function calculateTotal(items: Item[]) {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// テストでは実際のデータを使用
test('calculates total correctly', () => {
  const items = [
    { price: 100 },
    { price: 200 },
    { price: 300 }
  ];
  expect(calculateTotal(items)).toBe(600);
});
```

#### 3. テスト実装の原則

- **テストが失敗する状態から始めること**（Red-Green-Refactor）
- **境界値、異常系、エラーケースも必ずテスト**すること
- カバレッジだけでなく、**実際の品質を重視**すること
- **テストケース名は何をテストしているか明確に記述**すること

```typescript
describe('createReport', () => {
  // 正常系
  test('creates a report with valid data', async () => {
    // ...
  });

  // 境界値
  test('rejects report with more than 10 visit records', async () => {
    const input = {
      reportDate: '2026-01-12',
      status: 'submitted',
      visitRecords: Array(11).fill({ customerId: 'C001', visitContent: 'test' })
    };

    await expect(createReport(input, 'S001')).rejects.toThrow();
  });

  // 異常系
  test('throws error when user is not authenticated', async () => {
    await expect(createReport(validInput, null)).rejects.toThrow('Unauthorized');
  });

  // エラーケース
  test('handles database connection error gracefully', async () => {
    // DB接続エラーをシミュレート
    await expect(createReport(validInput, 'S001')).rejects.toThrow('Database error');
  });
});
```

#### 4. 実装前の確認

- **機能の仕様を正しく理解してからテストを書く**こと
- 不明な点があれば、**仮の実装ではなく、ユーザーに確認**すること

### テストファイルの構成

```typescript
// __tests__/unit/reports/create-report.test.ts
import { describe, test, expect, beforeEach } from 'vitest';
import { createReport } from '@/lib/reports';

describe('createReport', () => {
  beforeEach(async () => {
    // テストデータのセットアップ
    await setupTestDatabase();
  });

  test('creates a report with valid data', async () => {
    // Arrange
    const input = { /* ... */ };

    // Act
    const result = await createReport(input, 'S001');

    // Assert
    expect(result.id).toBeDefined();
    expect(result.status).toBe('submitted');
  });
});
```

### モックの使用

```typescript
import { vi } from 'vitest';

// 外部APIのモック
vi.mock('@/lib/external-api', () => ({
  fetchData: vi.fn().mockResolvedValue({ data: 'mocked' })
}));

// Prismaのモック（最小限に）
const mockPrisma = {
  dailyReport: {
    create: vi.fn().mockResolvedValue({ id: '1', status: 'submitted' })
  }
};
```

### 詳細なテスト仕様

詳細なテストケースは [テスト仕様書](../test_specification.md) を参照してください。

## Git運用

### ブランチ戦略

**GitHub Flow** を推奨：

```
main
  ├── feature/report-list
  ├── feature/comment-function
  └── fix/validation-error
```

### ブランチ命名規則

- `feature/<機能名>`: 新機能開発
- `fix/<バグ名>`: バグ修正
- `refactor/<対象>`: リファクタリング
- `docs/<ドキュメント>`: ドキュメント更新

### コミットメッセージ

**Conventional Commits** 形式を使用：

**重要**: コミットメッセージは**日本語**で記載してください。
Claude Codeがコミットを行う場合はタイトルに「[AI生成]」と記載してください。

```
<type>(<scope>): [AI生成] <件名（日本語）>

<本文（日本語）>

<フッター>
```

**Type**:
- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメント
- `style`: フォーマット
- `refactor`: リファクタリング
- `test`: テスト追加・修正
- `chore`: ビルド、設定等

**例（人間が作成する場合）**:
```
feat(reports): コメント確認機能を追加

- コメントに「確認済みにする」ボタンを追加
- コメントモデルにis_readフラグを追加
- コメントを既読にするAPIエンドポイントを追加

Closes #123
```

**例（Claude Codeが作成する場合）**:
```
feat(reports): [AI生成] コメント確認機能を追加

- コメントに「確認済みにする」ボタンを追加
- コメントモデルにis_readフラグを追加
- コメントを既読にするAPIエンドポイントを追加

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

### プルリクエスト

1. **タイトル**: わかりやすく簡潔に
2. **説明**: 変更内容、理由、テスト方法を記載
3. **レビュアー**: 最低1名のレビューを必須
4. **CI**: テストとリントが通過していること
5. **コンフリクト**: マージ前に解消

## パフォーマンス

### フロントエンド

- 画像は `next/image` を使用して最適化
- `use client` は必要な場合のみ使用
- 大きなライブラリは動的インポート

```typescript
// 動的インポート
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('./heavy-component'), {
  loading: () => <p>Loading...</p>
});
```

### バックエンド

- N+1問題を避ける（Prismaの `include` を活用）
- ページネーションを実装
- 適切なインデックスを設定

## セキュリティ

- **機密情報**: `.env.local` に保存、Gitにコミットしない
- **入力検証**: Zodで必ず検証
- **認証**: セッションを適切に管理
- **XSS対策**: Reactの自動エスケープを活用
- **CSRF対策**: CSRFトークンを使用

## 参考ドキュメント

- [画面定義書](../screen_definition.md) - 画面仕様の詳細
- [API仕様書](../api_specification.md) - API仕様の詳細
- [テスト仕様書](../test_specification.md) - テストケースの詳細
