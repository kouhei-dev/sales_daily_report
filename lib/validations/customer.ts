import { z } from 'zod';

/**
 * 顧客コードのバリデーション
 * - 必須
 * - 半角英数字のみ
 * - 最大20文字
 */
export const customerCodeSchema = z
  .string()
  .min(1, '顧客コードは必須です')
  .max(20, '顧客コードは20文字以内で入力してください')
  .regex(/^[a-zA-Z0-9]+$/, '顧客コードは半角英数字で入力してください');

/**
 * 顧客名のバリデーション
 * - 必須
 * - 最大100文字
 */
export const customerNameSchema = z
  .string()
  .min(1, '顧客名は必須です')
  .max(100, '顧客名は100文字以内で入力してください');

/**
 * 業種のバリデーション
 * - 最大50文字
 */
export const industrySchema = z.string().max(50, '業種は50文字以内で入力してください').optional();

/**
 * 郵便番号のバリデーション
 * - 郵便番号形式（XXX-XXXX）
 */
export const postalCodeSchema = z
  .string()
  .regex(/^\d{3}-\d{4}$/, '郵便番号はXXX-XXXX形式で入力してください')
  .optional();

/**
 * 住所のバリデーション
 * - 最大200文字
 */
export const addressSchema = z.string().max(200, '住所は200文字以内で入力してください').optional();

/**
 * 電話番号のバリデーション
 * - 電話番号形式
 * - 主な形式: 03-1234-5678, 090-1234-5678, 0120-123-456など
 */
export const phoneSchema = z
  .string()
  .regex(/^0\d{1,4}-\d{1,4}-\d{4}$/, '電話番号は正しい形式で入力してください（例: 03-1234-5678）')
  .optional();

/**
 * 備考のバリデーション
 * - 最大500文字
 */
export const notesSchema = z.string().max(500, '備考は500文字以内で入力してください').optional();

/**
 * 営業IDのバリデーション（MongoDB ObjectId）
 * - 24文字の16進数文字列
 */
export const salesIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, '無効な営業IDです');

/**
 * 顧客作成リクエストのスキーマ
 */
export const createCustomerSchema = z.object({
  customer_code: customerCodeSchema,
  customer_name: customerNameSchema,
  industry: industrySchema,
  postal_code: postalCodeSchema,
  address: addressSchema,
  phone: phoneSchema,
  sales_id: salesIdSchema,
  notes: notesSchema,
});

/**
 * 顧客更新リクエストのスキーマ
 * customer_codeは変更不可なので含めない
 */
export const updateCustomerSchema = z.object({
  customer_name: customerNameSchema,
  industry: industrySchema,
  postal_code: postalCodeSchema,
  address: addressSchema,
  phone: phoneSchema,
  sales_id: salesIdSchema,
  notes: notesSchema,
});

/**
 * 顧客一覧取得クエリパラメータのスキーマ
 */
export const customerListQuerySchema = z.object({
  customer_name: z.string().optional(),
  customer_code: z.string().optional(),
  sales_id: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, '無効な営業IDです')
    .optional(),
  sales_name: z.string().optional(),
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
