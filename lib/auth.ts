import bcrypt from 'bcryptjs';

/**
 * bcryptのソルトラウンド数
 * 推奨値: 10-12（セキュリティと性能のバランス）
 */
const SALT_ROUNDS = 10;

/**
 * パスワードをハッシュ化する
 *
 * セキュリティ考慮事項:
 * - bcryptは自動的にソルトを生成し、レインボーテーブル攻撃を防ぐ
 * - ソルトラウンド数が高いほどセキュアだが処理時間も増加する
 * - タイミング攻撃への対策として、常に一定の処理時間がかかるように設計されている
 *
 * @param password - プレーンテキストのパスワード
 * @returns ハッシュ化されたパスワード
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * パスワードとハッシュを比較検証する
 *
 * セキュリティ考慮事項:
 * - bcrypt.compareは一定時間の処理を保証し、タイミング攻撃を防ぐ
 * - ハッシュにはソルト情報が含まれているため、ソルトを別途保存する必要はない
 *
 * @param password - プレーンテキストのパスワード
 * @param hash - ハッシュ化されたパスワード
 * @returns パスワードが一致する場合はtrue
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * パスワードのバリデーション
 *
 * セキュリティ考慮事項:
 * - 強力なパスワードポリシーを適用し、ブルートフォース攻撃を困難にする
 * - 複数の文字種類を要求することで推測を困難にする
 * - 十分な長さを要求することでエントロピーを確保する
 *
 * バリデーションルール:
 * - 10文字以上
 * - 大文字(A-Z)を含む
 * - 小文字(a-z)を含む
 * - 数字(0-9)を含む
 * - 特殊文字(!@#$%^&*()_+-=[]{}|;:,.<>?)を含む
 *
 * @param password - 検証するパスワード
 * @returns バリデーション結果
 */
export function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!password || password.length < 10) {
    errors.push('パスワードは10文字以上である必要があります');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('パスワードには大文字(A-Z)を含める必要があります');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('パスワードには小文字(a-z)を含める必要があります');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('パスワードには数字(0-9)を含める必要があります');
  }

  if (!/[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.test(password)) {
    errors.push('パスワードには特殊文字(!@#$%^&*など)を含める必要があります');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
