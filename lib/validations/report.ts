import { z } from 'zod';

/**
 * 日付のバリデーション（YYYY-MM-DD形式）
 */
export const reportDateSchema = z
  .string()
  .min(1, '日報日付は必須です')
  .regex(/^\d{4}-\d{2}-\d{2}$/, '日報日付はYYYY-MM-DD形式で入力してください');

/**
 * ISO 8601日時のバリデーション
 */
export const iso8601DatetimeSchema = z
  .string()
  .min(1, '訪問日時は必須です')
  .datetime({ message: '訪問日時は正しい日時形式で入力してください' });

/**
 * 問題点のバリデーション
 * - 最大1000文字
 */
export const problemSchema = z
  .string()
  .max(1000, '問題点は1000文字以内で入力してください')
  .optional();

/**
 * 翌日の予定のバリデーション
 * - 最大1000文字
 */
export const planSchema = z
  .string()
  .max(1000, '翌日の予定は1000文字以内で入力してください')
  .optional();

/**
 * ステータスのバリデーション
 * - draft（下書き）またはsubmitted（提出済み）
 */
export const reportStatusSchema = z.enum(['draft', 'submitted'], {
  message: 'ステータスはdraftまたはsubmittedのいずれかを指定してください',
});

/**
 * 訪問内容のバリデーション
 * - 必須
 * - 最大500文字
 */
export const visitContentSchema = z
  .string()
  .min(1, '訪問内容は必須です')
  .max(500, '訪問内容は500文字以内で入力してください');

/**
 * 訪問結果のバリデーション
 * - 最大500文字
 */
export const visitResultSchema = z
  .string()
  .max(500, '訪問結果は500文字以内で入力してください')
  .optional();

/**
 * MongoDB ObjectIdのバリデーション
 */
export const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, '無効なIDです');

/**
 * 訪問記録のスキーマ（作成時）
 */
export const visitRecordCreateSchema = z.object({
  customer_id: objectIdSchema,
  visit_datetime: iso8601DatetimeSchema,
  visit_content: visitContentSchema,
  visit_result: visitResultSchema,
  display_order: z.number().int().min(1, '表示順は1以上の整数で指定してください'),
});

/**
 * 訪問記録のスキーマ（更新時）
 * visit_idがある場合は既存レコードの更新、ない場合は新規作成
 */
export const visitRecordUpdateSchema = z.object({
  visit_id: objectIdSchema.optional(),
  customer_id: objectIdSchema,
  visit_datetime: iso8601DatetimeSchema,
  visit_content: visitContentSchema,
  visit_result: visitResultSchema,
  display_order: z.number().int().min(1, '表示順は1以上の整数で指定してください'),
});

/**
 * 日報作成リクエストのスキーマ
 */
export const createReportSchema = z
  .object({
    report_date: reportDateSchema,
    problem: problemSchema,
    plan: planSchema,
    status: reportStatusSchema,
    visit_records: z
      .array(visitRecordCreateSchema)
      .min(1, '訪問記録は1件以上必要です')
      .max(10, '訪問記録は最大10件までです'),
  })
  .strict();

/**
 * 日報更新リクエストのスキーマ
 */
export const updateReportSchema = z
  .object({
    problem: problemSchema,
    plan: planSchema,
    status: reportStatusSchema,
    visit_records: z
      .array(visitRecordUpdateSchema)
      .min(1, '訪問記録は1件以上必要です')
      .max(10, '訪問記録は最大10件までです'),
  })
  .strict();

/**
 * 日報一覧取得クエリパラメータのスキーマ
 */
export const reportListQuerySchema = z.object({
  start_date: reportDateSchema.optional(),
  end_date: reportDateSchema.optional(),
  sales_id: objectIdSchema.optional(),
  status: z.enum(['draft', 'submitted', 'commented']).optional(),
  has_unread_comments: z
    .string()
    .transform((val) => val === 'true')
    .pipe(z.boolean())
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

/**
 * Zodエラーから詳細なエラーメッセージを抽出する
 */
export function formatZodErrors(error: z.ZodError): Array<{ field: string; message: string }> {
  if (!error || !error.issues || !Array.isArray(error.issues)) {
    return [];
  }
  return error.issues.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
  }));
}
