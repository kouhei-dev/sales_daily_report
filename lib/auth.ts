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
 * バリデーションルール:
 * - 8文字以上
 * - 英字と数字を含む
 *
 * @param password - 検証するパスワード
 * @returns バリデーション結果
 */
export function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!password || password.length < 8) {
    errors.push('パスワードは8文字以上である必要があります');
  }

  if (!/[a-zA-Z]/.test(password)) {
    errors.push('パスワードには英字を含める必要があります');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('パスワードには数字を含める必要があります');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
