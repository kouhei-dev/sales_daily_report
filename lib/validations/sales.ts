import { z } from 'zod';

/**
 * 営業コードのバリデーション
 * - 必須
 * - 半角英数字のみ
 * - 最大20文字
 */
export const salesCodeSchema = z
  .string()
  .min(1, '営業コードは必須です')
  .max(20, '営業コードは20文字以内で入力してください')
  .regex(/^[a-zA-Z0-9]+$/, '営業コードは半角英数字で入力してください');

/**
 * 営業担当者名のバリデーション
 * - 必須
 * - 最大100文字
 */
export const salesNameSchema = z
  .string()
  .min(1, '営業担当者名は必須です')
  .max(100, '営業担当者名は100文字以内で入力してください');

/**
 * メールアドレスのバリデーション
 * - 必須
 * - メールアドレス形式
 */
export const emailSchema = z
  .string()
  .min(1, 'メールアドレスは必須です')
  .email('メールアドレスの形式が正しくありません');

/**
 * パスワードのバリデーション
 * lib/auth.tsのvalidatePasswordと同じルール:
 * - 10文字以上
 * - 大文字(A-Z)を含む
 * - 小文字(a-z)を含む
 * - 数字(0-9)を含む
 * - 特殊文字(!@#$%^&*()_+-=[]{}|;:,.<>?)を含む
 */
export const passwordSchema = z
  .string()
  .min(10, 'パスワードは10文字以上である必要があります')
  .regex(/[A-Z]/, 'パスワードには大文字(A-Z)を含める必要があります')
  .regex(/[a-z]/, 'パスワードには小文字(a-z)を含める必要があります')
  .regex(/[0-9]/, 'パスワードには数字(0-9)を含める必要があります')
  .regex(
    /[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/,
    'パスワードには特殊文字(!@#$%^&*など)を含める必要があります'
  );

/**
 * 所属部署のバリデーション
 * - 必須
 * - 最大50文字
 */
export const departmentSchema = z
  .string()
  .min(1, '所属部署は必須です')
  .max(50, '所属部署は50文字以内で入力してください');

/**
 * 営業IDのバリデーション（MongoDB ObjectId）
 * - 24文字の16進数文字列
 */
export const salesIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, '無効な営業IDです');

/**
 * 管理者フラグのバリデーション
 */
export const isManagerSchema = z.boolean();

/**
 * 営業作成リクエストのスキーマ
 */
export const createSalesSchema = z.object({
  sales_code: salesCodeSchema,
  sales_name: salesNameSchema,
  email: emailSchema,
  password: passwordSchema,
  department: departmentSchema,
  manager_id: salesIdSchema.optional(),
  is_manager: isManagerSchema.default(false),
});

/**
 * 営業更新リクエストのスキーマ
 * パスワードは任意（変更する場合のみ）
 */
export const updateSalesSchema = z.object({
  sales_name: salesNameSchema,
  email: emailSchema,
  password: passwordSchema.optional(),
  department: departmentSchema,
  manager_id: salesIdSchema.optional(),
  is_manager: isManagerSchema.default(false),
});

/**
 * 営業一覧取得クエリパラメータのスキーマ
 */
export const salesListQuerySchema = z.object({
  sales_name: z.string().optional(),
  sales_code: z.string().optional(),
  department: z.string().optional(),
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
