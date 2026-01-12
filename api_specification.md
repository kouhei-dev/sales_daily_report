# 営業日報システム API仕様書

## 目次
1. [API概要](#api概要)
2. [共通仕様](#共通仕様)
3. [認証API](#認証api)
4. [日報API](#日報api)
5. [訪問記録API](#訪問記録api)
6. [コメントAPI](#コメントapi)
7. [顧客マスタAPI](#顧客マスタapi)
8. [営業マスタAPI](#営業マスタapi)
9. [エラーコード一覧](#エラーコード一覧)

---

## API概要

### ベースURL
```
https://api.example.com/v1
```

### プロトコル
- HTTPS通信のみ対応

### データフォーマット
- リクエスト: JSON (Content-Type: application/json)
- レスポンス: JSON

### 文字コード
- UTF-8

---

## 共通仕様

### 認証方式
- セッションベース認証（Cookie使用）
- ログインAPIでセッションIDを発行
- 以降のAPIリクエストでセッションIDを含むCookieを送信

### リクエストヘッダー（共通）
```
Content-Type: application/json
Cookie: session_id={session_id}
```

### レスポンス形式（共通）

#### 成功時
```json
{
  "status": "success",
  "data": {
    // レスポンスデータ
  }
}
```

#### エラー時
```json
{
  "status": "error",
  "error": {
    "code": "ERROR_CODE",
    "message": "エラーメッセージ",
    "details": [
      {
        "field": "フィールド名",
        "message": "詳細なエラーメッセージ"
      }
    ]
  }
}
```

### HTTPステータスコード
| コード | 説明 |
|--------|------|
| 200 | 成功 |
| 201 | 作成成功 |
| 204 | 削除成功（レスポンスボディなし） |
| 400 | リクエストエラー（バリデーションエラー等） |
| 401 | 認証エラー |
| 403 | 権限エラー |
| 404 | リソースが見つからない |
| 409 | リソースの競合（重複等） |
| 500 | サーバーエラー |

### ページネーション
リスト取得APIで使用するパラメータ：
```
page: ページ番号（1から開始）
limit: 1ページあたりの件数（デフォルト: 20、最大: 100）
```

レスポンス例：
```json
{
  "status": "success",
  "data": {
    "items": [...],
    "pagination": {
      "current_page": 1,
      "total_pages": 5,
      "total_items": 95,
      "limit": 20
    }
  }
}
```

### 日時フォーマット
- ISO 8601形式: `YYYY-MM-DDTHH:MM:SS+09:00`
- 例: `2026-01-12T15:30:00+09:00`

---

## 認証API

### 1. ログイン

#### エンドポイント
```
POST /auth/login
```

#### リクエスト
```json
{
  "sales_code": "S001",
  "password": "password123"
}
```

#### レスポンス（成功時）
```json
{
  "status": "success",
  "data": {
    "user": {
      "sales_id": 2,
      "sales_code": "S001",
      "sales_name": "佐藤花子",
      "email": "sato@example.com",
      "department": "営業1課",
      "is_manager": false,
      "manager": {
        "sales_id": 1,
        "sales_name": "山田太郎"
      }
    },
    "session_id": "abc123xyz..."
  }
}
```

#### エラー
- `401`: 営業コードまたはパスワードが正しくない

---

### 2. ログアウト

#### エンドポイント
```
POST /auth/logout
```

#### リクエスト
リクエストボディなし

#### レスポンス（成功時）
```json
{
  "status": "success",
  "data": {
    "message": "ログアウトしました"
  }
}
```

---

### 3. セッション確認

#### エンドポイント
```
GET /auth/session
```

#### リクエスト
リクエストボディなし

#### レスポンス（成功時）
```json
{
  "status": "success",
  "data": {
    "user": {
      "sales_id": 2,
      "sales_code": "S001",
      "sales_name": "佐藤花子",
      "email": "sato@example.com",
      "department": "営業1課",
      "is_manager": false
    },
    "session_expires_at": "2026-01-12T16:30:00+09:00"
  }
}
```

#### エラー
- `401`: セッションが無効または期限切れ

---

## 日報API

### 1. 日報一覧取得

#### エンドポイント
```
GET /reports
```

#### クエリパラメータ
| パラメータ | 型 | 必須 | 説明 |
|-----------|----|----|------|
| start_date | string | No | 対象期間開始日 (YYYY-MM-DD) |
| end_date | string | No | 対象期間終了日 (YYYY-MM-DD) |
| sales_id | integer | No | 営業ID（管理者のみ指定可能） |
| status | string | No | ステータス (draft/submitted/commented) |
| has_unread_comments | boolean | No | 未読コメントあり (true/false) |
| page | integer | No | ページ番号（デフォルト: 1） |
| limit | integer | No | 1ページあたりの件数（デフォルト: 20） |

#### リクエスト例
```
GET /reports?start_date=2026-01-01&end_date=2026-01-31&status=submitted&page=1&limit=20
```

#### レスポンス（成功時）
```json
{
  "status": "success",
  "data": {
    "items": [
      {
        "report_id": 123,
        "report_date": "2026-01-12",
        "sales": {
          "sales_id": 2,
          "sales_name": "佐藤花子"
        },
        "visit_count": 3,
        "status": "submitted",
        "has_comments": true,
        "unread_comment_count": 2,
        "submitted_at": "2026-01-12T18:00:00+09:00",
        "created_at": "2026-01-12T17:30:00+09:00",
        "updated_at": "2026-01-12T18:00:00+09:00"
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 3,
      "total_items": 55,
      "limit": 20
    }
  }
}
```

#### エラー
- `401`: 未認証
- `403`: 権限なし（他人の日報を取得しようとした場合）

---

### 2. 日報詳細取得

#### エンドポイント
```
GET /reports/{report_id}
```

#### パスパラメータ
| パラメータ | 型 | 説明 |
|-----------|----|----|
| report_id | integer | 日報ID |

#### リクエスト例
```
GET /reports/123
```

#### レスポンス（成功時）
```json
{
  "status": "success",
  "data": {
    "report_id": 123,
    "report_date": "2026-01-12",
    "sales": {
      "sales_id": 2,
      "sales_name": "佐藤花子",
      "department": "営業1課"
    },
    "problem": "今月の売上目標達成が厳しい状況です。追加施策について相談したいです。",
    "plan": "明日、A社に追加提案を実施。見積書を準備する。",
    "status": "commented",
    "submitted_at": "2026-01-12T18:00:00+09:00",
    "visit_records": [
      {
        "visit_id": 456,
        "customer": {
          "customer_id": 1,
          "customer_code": "C001",
          "customer_name": "A株式会社"
        },
        "visit_datetime": "2026-01-12T10:00:00+09:00",
        "visit_content": "新商品の紹介を実施。好反応を得た。",
        "visit_result": "次回、詳細な見積もりを提出することで合意。",
        "display_order": 1
      }
    ],
    "comments": {
      "problem": [
        {
          "comment_id": 789,
          "commenter": {
            "sales_id": 1,
            "sales_name": "山田太郎"
          },
          "comment_text": "来週、追加商談の機会を設定しましょう。明日のミーティングで詳細を話しましょう。",
          "is_read": false,
          "read_at": null,
          "created_at": "2026-01-12T19:00:00+09:00"
        }
      ],
      "plan": [
        {
          "comment_id": 790,
          "commenter": {
            "sales_id": 1,
            "sales_name": "山田太郎"
          },
          "comment_text": "見積書の内容は事前に共有してください。",
          "is_read": true,
          "read_at": "2026-01-12T20:00:00+09:00",
          "created_at": "2026-01-12T19:05:00+09:00"
        }
      ]
    },
    "created_at": "2026-01-12T17:30:00+09:00",
    "updated_at": "2026-01-12T19:05:00+09:00"
  }
}
```

#### エラー
- `401`: 未認証
- `403`: 権限なし
- `404`: 日報が見つからない

---

### 3. 日報作成

#### エンドポイント
```
POST /reports
```

#### リクエスト
```json
{
  "report_date": "2026-01-12",
  "problem": "今月の売上目標達成が厳しい状況です。",
  "plan": "明日、A社に追加提案を実施。",
  "status": "submitted",
  "visit_records": [
    {
      "customer_id": 1,
      "visit_datetime": "2026-01-12T10:00:00+09:00",
      "visit_content": "新商品の紹介を実施。",
      "visit_result": "次回、詳細な見積もりを提出することで合意。",
      "display_order": 1
    },
    {
      "customer_id": 2,
      "visit_datetime": "2026-01-12T14:00:00+09:00",
      "visit_content": "定期訪問。進捗確認。",
      "visit_result": "順調に進んでいる。",
      "display_order": 2
    }
  ]
}
```

#### バリデーション
| フィールド | ルール |
|-----------|--------|
| report_date | 必須、日付形式、営業ID×日付でユニーク |
| problem | 1000文字以内 |
| plan | 1000文字以内 |
| status | 必須、draft/submitted のいずれか |
| visit_records | 必須（1件以上）、最大10件 |
| visit_records.customer_id | 必須 |
| visit_records.visit_datetime | 必須、日時形式 |
| visit_records.visit_content | 必須、500文字以内 |
| visit_records.visit_result | 500文字以内 |

#### レスポンス（成功時）
```json
{
  "status": "success",
  "data": {
    "report_id": 123,
    "report_date": "2026-01-12",
    "status": "submitted",
    "created_at": "2026-01-12T17:30:00+09:00"
  }
}
```

#### エラー
- `400`: バリデーションエラー
- `401`: 未認証
- `409`: 同一日付の日報が既に存在

---

### 4. 日報更新

#### エンドポイント
```
PUT /reports/{report_id}
```

#### パスパラメータ
| パラメータ | 型 | 説明 |
|-----------|----|----|
| report_id | integer | 日報ID |

#### リクエスト
```json
{
  "problem": "今月の売上目標達成が厳しい状況です。追加施策について相談したいです。",
  "plan": "明日、A社とB社に追加提案を実施。",
  "status": "submitted",
  "visit_records": [
    {
      "visit_id": 456,
      "customer_id": 1,
      "visit_datetime": "2026-01-12T10:00:00+09:00",
      "visit_content": "新商品の紹介を実施。好反応を得た。",
      "visit_result": "次回、詳細な見積もりを提出することで合意。",
      "display_order": 1
    },
    {
      "customer_id": 3,
      "visit_datetime": "2026-01-12T16:00:00+09:00",
      "visit_content": "新規訪問。",
      "visit_result": "興味を示している。",
      "display_order": 2
    }
  ]
}
```

#### 備考
- 既存の訪問記録を更新する場合は`visit_id`を含める
- 新規の訪問記録を追加する場合は`visit_id`を含めない
- リクエストに含まれない既存の訪問記録は削除される

#### レスポンス（成功時）
```json
{
  "status": "success",
  "data": {
    "report_id": 123,
    "updated_at": "2026-01-12T18:30:00+09:00"
  }
}
```

#### エラー
- `400`: バリデーションエラー
- `401`: 未認証
- `403`: 権限なし（自分の日報以外を更新しようとした場合）
- `404`: 日報が見つからない

---

### 5. 日報削除

#### エンドポイント
```
DELETE /reports/{report_id}
```

#### パスパラメータ
| パラメータ | 型 | 説明 |
|-----------|----|----|
| report_id | integer | 日報ID |

#### リクエスト
リクエストボディなし

#### レスポンス（成功時）
HTTPステータス: 204 No Content

#### エラー
- `401`: 未認証
- `403`: 権限なし
- `404`: 日報が見つからない

---

### 6. 未読コメント数取得

#### エンドポイント
```
GET /reports/unread-comments/count
```

#### リクエスト
リクエストボディなし

#### レスポンス（成功時）
```json
{
  "status": "success",
  "data": {
    "unread_count": 5
  }
}
```

#### エラー
- `401`: 未認証

---

## 訪問記録API

### 1. 訪問記録作成

日報作成・更新APIに含まれるため、個別のAPIは提供しない

---

## コメントAPI

### 1. コメント追加

#### エンドポイント
```
POST /reports/{report_id}/comments
```

#### パスパラメータ
| パラメータ | 型 | 説明 |
|-----------|----|----|
| report_id | integer | 日報ID |

#### リクエスト
```json
{
  "comment_type": "problem",
  "comment_text": "来週、追加商談の機会を設定しましょう。明日のミーティングで詳細を話しましょう。"
}
```

#### バリデーション
| フィールド | ルール |
|-----------|--------|
| comment_type | 必須、problem/plan のいずれか |
| comment_text | 必須、500文字以内 |

#### レスポンス（成功時）
```json
{
  "status": "success",
  "data": {
    "comment_id": 789,
    "report_id": 123,
    "commenter": {
      "sales_id": 1,
      "sales_name": "山田太郎"
    },
    "comment_type": "problem",
    "comment_text": "来週、追加商談の機会を設定しましょう。明日のミーティングで詳細を話しましょう。",
    "is_read": false,
    "created_at": "2026-01-12T19:00:00+09:00"
  }
}
```

#### 備考
- コメント追加時、日報のステータスが自動的に`commented`に更新される

#### エラー
- `400`: バリデーションエラー
- `401`: 未認証
- `403`: 権限なし（管理者以外がコメントしようとした場合）
- `404`: 日報が見つからない

---

### 2. コメント確認済み処理

#### エンドポイント
```
PUT /comments/{comment_id}/read
```

#### パスパラメータ
| パラメータ | 型 | 説明 |
|-----------|----|----|
| comment_id | integer | コメントID |

#### リクエスト
リクエストボディなし

#### レスポンス（成功時）
```json
{
  "status": "success",
  "data": {
    "comment_id": 789,
    "is_read": true,
    "read_at": "2026-01-12T20:00:00+09:00"
  }
}
```

#### エラー
- `401`: 未認証
- `403`: 権限なし（自分の日報に対するコメント以外を確認済みにしようとした場合）
- `404`: コメントが見つからない

---

### 3. コメント削除

#### エンドポイント
```
DELETE /comments/{comment_id}
```

#### パスパラメータ
| パラメータ | 型 | 説明 |
|-----------|----|----|
| comment_id | integer | コメントID |

#### リクエスト
リクエストボディなし

#### レスポンス（成功時）
HTTPステータス: 204 No Content

#### エラー
- `401`: 未認証
- `403`: 権限なし（自分が追加したコメント以外を削除しようとした場合）
- `404`: コメントが見つからない

---

## 顧客マスタAPI

### 1. 顧客一覧取得

#### エンドポイント
```
GET /customers
```

#### クエリパラメータ
| パラメータ | 型 | 必須 | 説明 |
|-----------|----|----|------|
| customer_name | string | No | 顧客名（部分一致） |
| customer_code | string | No | 顧客コード（部分一致） |
| sales_id | integer | No | 担当営業ID |
| page | integer | No | ページ番号（デフォルト: 1） |
| limit | integer | No | 1ページあたりの件数（デフォルト: 20） |

#### リクエスト例
```
GET /customers?customer_name=株式会社&page=1&limit=20
```

#### レスポンス（成功時）
```json
{
  "status": "success",
  "data": {
    "items": [
      {
        "customer_id": 1,
        "customer_code": "C001",
        "customer_name": "A株式会社",
        "industry": "製造業",
        "address": "東京都千代田区...",
        "phone": "03-1234-5678",
        "sales": {
          "sales_id": 2,
          "sales_name": "佐藤花子"
        },
        "created_at": "2025-12-01T10:00:00+09:00",
        "updated_at": "2026-01-10T15:00:00+09:00"
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 5,
      "total_items": 95,
      "limit": 20
    }
  }
}
```

#### エラー
- `401`: 未認証

---

### 2. 顧客詳細取得

#### エンドポイント
```
GET /customers/{customer_id}
```

#### パスパラメータ
| パラメータ | 型 | 説明 |
|-----------|----|----|
| customer_id | integer | 顧客ID |

#### リクエスト例
```
GET /customers/1
```

#### レスポンス（成功時）
```json
{
  "status": "success",
  "data": {
    "customer_id": 1,
    "customer_code": "C001",
    "customer_name": "A株式会社",
    "industry": "製造業",
    "postal_code": "100-0001",
    "address": "東京都千代田区千代田1-1-1",
    "phone": "03-1234-5678",
    "sales": {
      "sales_id": 2,
      "sales_name": "佐藤花子",
      "department": "営業1課"
    },
    "notes": "重要顧客。定期的なフォローが必要。",
    "created_at": "2025-12-01T10:00:00+09:00",
    "updated_at": "2026-01-10T15:00:00+09:00"
  }
}
```

#### エラー
- `401`: 未認証
- `404`: 顧客が見つからない

---

### 3. 顧客作成

#### エンドポイント
```
POST /customers
```

#### リクエスト
```json
{
  "customer_code": "C999",
  "customer_name": "テスト株式会社",
  "industry": "IT",
  "postal_code": "100-0001",
  "address": "東京都千代田区千代田1-1-1",
  "phone": "03-1234-5678",
  "sales_id": 2,
  "notes": "新規顧客"
}
```

#### バリデーション
| フィールド | ルール |
|-----------|--------|
| customer_code | 必須、半角英数字、ユニーク、最大20文字 |
| customer_name | 必須、最大100文字 |
| industry | 最大50文字 |
| postal_code | 郵便番号形式（XXX-XXXX） |
| address | 最大200文字 |
| phone | 電話番号形式 |
| sales_id | 必須、有効な営業ID |
| notes | 最大500文字 |

#### レスポンス（成功時）
```json
{
  "status": "success",
  "data": {
    "customer_id": 99,
    "customer_code": "C999",
    "customer_name": "テスト株式会社",
    "created_at": "2026-01-12T10:00:00+09:00"
  }
}
```

#### エラー
- `400`: バリデーションエラー
- `401`: 未認証
- `409`: 顧客コードが既に存在

---

### 4. 顧客更新

#### エンドポイント
```
PUT /customers/{customer_id}
```

#### パスパラメータ
| パラメータ | 型 | 説明 |
|-----------|----|----|
| customer_id | integer | 顧客ID |

#### リクエスト
```json
{
  "customer_name": "A株式会社（更新）",
  "industry": "製造業",
  "postal_code": "100-0002",
  "address": "東京都千代田区千代田2-2-2",
  "phone": "03-9876-5432",
  "sales_id": 2,
  "notes": "住所変更あり"
}
```

#### 備考
- 顧客コードは変更不可

#### レスポンス（成功時）
```json
{
  "status": "success",
  "data": {
    "customer_id": 1,
    "updated_at": "2026-01-12T11:00:00+09:00"
  }
}
```

#### エラー
- `400`: バリデーションエラー
- `401`: 未認証
- `404`: 顧客が見つからない

---

### 5. 顧客削除

#### エンドポイント
```
DELETE /customers/{customer_id}
```

#### パスパラメータ
| パラメータ | 型 | 説明 |
|-----------|----|----|
| customer_id | integer | 顧客ID |

#### リクエスト
リクエストボディなし

#### レスポンス（成功時）
HTTPステータス: 204 No Content

#### エラー
- `400`: 顧客が日報で使用されているため削除不可
- `401`: 未認証
- `404`: 顧客が見つからない

---

## 営業マスタAPI

### 1. 営業一覧取得

#### エンドポイント
```
GET /sales
```

#### クエリパラメータ
| パラメータ | 型 | 必須 | 説明 |
|-----------|----|----|------|
| sales_name | string | No | 営業担当者名（部分一致） |
| sales_code | string | No | 営業コード（部分一致） |
| department | string | No | 所属部署 |
| page | integer | No | ページ番号（デフォルト: 1） |
| limit | integer | No | 1ページあたりの件数（デフォルト: 20） |

#### リクエスト例
```
GET /sales?department=営業1課&page=1&limit=20
```

#### レスポンス（成功時）
```json
{
  "status": "success",
  "data": {
    "items": [
      {
        "sales_id": 2,
        "sales_code": "S001",
        "sales_name": "佐藤花子",
        "email": "sato@example.com",
        "department": "営業1課",
        "manager": {
          "sales_id": 1,
          "sales_name": "山田太郎"
        },
        "is_manager": false,
        "created_at": "2025-12-01T10:00:00+09:00",
        "updated_at": "2026-01-10T15:00:00+09:00"
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 1,
      "total_items": 5,
      "limit": 20
    }
  }
}
```

#### エラー
- `401`: 未認証
- `403`: 権限なし（管理者以外がアクセスした場合）

---

### 2. 営業詳細取得

#### エンドポイント
```
GET /sales/{sales_id}
```

#### パスパラメータ
| パラメータ | 型 | 説明 |
|-----------|----|----|
| sales_id | integer | 営業ID |

#### リクエスト例
```
GET /sales/2
```

#### レスポンス（成功時）
```json
{
  "status": "success",
  "data": {
    "sales_id": 2,
    "sales_code": "S001",
    "sales_name": "佐藤花子",
    "email": "sato@example.com",
    "department": "営業1課",
    "manager": {
      "sales_id": 1,
      "sales_name": "山田太郎"
    },
    "is_manager": false,
    "created_at": "2025-12-01T10:00:00+09:00",
    "updated_at": "2026-01-10T15:00:00+09:00"
  }
}
```

#### エラー
- `401`: 未認証
- `403`: 権限なし
- `404`: 営業が見つからない

---

### 3. 営業作成

#### エンドポイント
```
POST /sales
```

#### リクエスト
```json
{
  "sales_code": "S999",
  "sales_name": "テスト太郎",
  "email": "test@example.com",
  "password": "Test1234",
  "department": "営業1課",
  "manager_id": 1,
  "is_manager": false
}
```

#### バリデーション
| フィールド | ルール |
|-----------|--------|
| sales_code | 必須、半角英数字、ユニーク、最大20文字 |
| sales_name | 必須、最大100文字 |
| email | 必須、メールアドレス形式、ユニーク |
| password | 必須、8文字以上、英数字混在 |
| department | 必須、最大50文字 |
| manager_id | 有効な営業ID |
| is_manager | boolean |

#### レスポンス（成功時）
```json
{
  "status": "success",
  "data": {
    "sales_id": 99,
    "sales_code": "S999",
    "sales_name": "テスト太郎",
    "created_at": "2026-01-12T10:00:00+09:00"
  }
}
```

#### エラー
- `400`: バリデーションエラー
- `401`: 未認証
- `403`: 権限なし
- `409`: 営業コードまたはメールアドレスが既に存在

---

### 4. 営業更新

#### エンドポイント
```
PUT /sales/{sales_id}
```

#### パスパラメータ
| パラメータ | 型 | 説明 |
|-----------|----|----|
| sales_id | integer | 営業ID |

#### リクエスト
```json
{
  "sales_name": "佐藤花子（更新）",
  "email": "sato_new@example.com",
  "password": "NewPass1234",
  "department": "営業2課",
  "manager_id": 4,
  "is_manager": false
}
```

#### 備考
- 営業コードは変更不可
- パスワードは変更する場合のみ含める（省略可能）

#### レスポンス（成功時）
```json
{
  "status": "success",
  "data": {
    "sales_id": 2,
    "updated_at": "2026-01-12T11:00:00+09:00"
  }
}
```

#### エラー
- `400`: バリデーションエラー
- `401`: 未認証
- `403`: 権限なし
- `404`: 営業が見つからない
- `409`: メールアドレスが既に存在

---

### 5. 営業削除

#### エンドポイント
```
DELETE /sales/{sales_id}
```

#### パスパラメータ
| パラメータ | 型 | 説明 |
|-----------|----|----|
| sales_id | integer | 営業ID |

#### リクエスト
リクエストボディなし

#### レスポンス（成功時）
HTTPステータス: 204 No Content

#### エラー
- `400`: 営業が日報または顧客で使用されているため削除不可
- `401`: 未認証
- `403`: 権限なし
- `404`: 営業が見つからない

---

## エラーコード一覧

| エラーコード | HTTPステータス | 説明 |
|------------|--------------|------|
| AUTH_INVALID_CREDENTIALS | 401 | 営業コードまたはパスワードが正しくない |
| AUTH_SESSION_EXPIRED | 401 | セッションが期限切れ |
| AUTH_UNAUTHORIZED | 401 | 認証が必要 |
| AUTH_FORBIDDEN | 403 | 権限がない |
| VALIDATION_ERROR | 400 | 入力値が不正 |
| RESOURCE_NOT_FOUND | 404 | リソースが見つからない |
| RESOURCE_CONFLICT | 409 | リソースの競合（重複等） |
| RESOURCE_IN_USE | 400 | リソースが使用されているため削除不可 |
| SERVER_ERROR | 500 | サーバー内部エラー |

### エラーレスポンス例

#### バリデーションエラー
```json
{
  "status": "error",
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "入力内容に誤りがあります",
    "details": [
      {
        "field": "customer_code",
        "message": "顧客コードは必須です"
      },
      {
        "field": "email",
        "message": "メールアドレスの形式が正しくありません"
      }
    ]
  }
}
```

#### 認証エラー
```json
{
  "status": "error",
  "error": {
    "code": "AUTH_INVALID_CREDENTIALS",
    "message": "営業コードまたはパスワードが正しくありません"
  }
}
```

#### リソース競合エラー
```json
{
  "status": "error",
  "error": {
    "code": "RESOURCE_CONFLICT",
    "message": "この顧客コードは既に使用されています"
  }
}
```

---

## セキュリティ仕様

### 1. 認証・認可
- セッションベース認証
- セッションタイムアウト: 30分
- ログイン失敗時のレート制限: 5回/5分

### 2. データ保護
- HTTPS通信のみ
- パスワードはbcryptでハッシュ化
- 個人情報は適切にマスキング

### 3. セキュリティヘッダー
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'
```

### 4. CORS設定
許可されたオリジンからのリクエストのみ受付

### 5. SQLインジェクション対策
プリペアドステートメントの使用

### 6. XSS対策
出力時のエスケープ処理

### 7. CSRF対策
CSRFトークンの検証

---

## レート制限

### 一般API
- 100リクエスト/分/ユーザー

### ログインAPI
- 5リクエスト/5分/IPアドレス

### レート制限超過時のレスポンス
```
HTTP/1.1 429 Too Many Requests
```

```json
{
  "status": "error",
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "リクエスト数の上限を超えました。しばらくしてから再度お試しください。"
  }
}
```

---

## 変更履歴

| 版 | 改訂日 | 改訂内容 |
|----|--------|----------|
| 1.0 | 2026-01-12 | 初版作成 |

---

以上
