import { RateLimiterMemory } from 'rate-limiter-flexible';

/**
 * ログインAPIのレート制限設定
 *
 * 要件:
 * - 5回連続失敗で5分間ブロック
 * - IPアドレス単位で制限
 *
 * セキュリティ考慮事項:
 * - ブルートフォース攻撃を防ぐ
 * - DDoS攻撃の軽減
 */
const loginRateLimiter = new RateLimiterMemory({
  points: 5, // 5回のリクエスト
  duration: 5 * 60, // 5分間（秒単位）
  blockDuration: 5 * 60, // 5分間ブロック（秒単位）
});

/**
 * IPアドレスを取得する
 *
 * 優先順位:
 * 1. X-Forwarded-For ヘッダー（プロキシ経由の場合）
 * 2. X-Real-IP ヘッダー
 * 3. 'unknown'（取得できない場合）
 *
 * @param request - Next.js Request オブジェクト
 * @returns IPアドレス
 */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // X-Forwarded-Forには複数のIPが含まれる可能性があるため、最初のIPを取得
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // IPが取得できない場合はunknownを返す
  return 'unknown';
}

/**
 * ログイン試行のレート制限をチェックする
 *
 * @param ip - クライアントのIPアドレス
 * @returns レート制限に引っかかった場合はエラー情報を返す
 */
export async function checkLoginRateLimit(ip: string): Promise<{
  success: boolean;
  remainingPoints?: number;
  retryAfter?: number;
}> {
  try {
    const result = await loginRateLimiter.consume(ip);
    return {
      success: true,
      remainingPoints: result.remainingPoints,
    };
  } catch (error) {
    // レート制限に引っかかった場合
    // rate-limiter-flexibleは Error インスタンスではなくオブジェクトをthrowする
    if (error && typeof error === 'object' && 'msBeforeNext' in error) {
      const rateLimitError = error as { msBeforeNext: number };
      return {
        success: false,
        retryAfter: Math.ceil(rateLimitError.msBeforeNext / 1000),
      };
    }
    // 予期しないエラーの場合
    throw error;
  }
}

/**
 * ログイン成功時にレート制限をリセットする
 *
 * @param ip - クライアントのIPアドレス
 */
export async function resetLoginRateLimit(ip: string): Promise<void> {
  try {
    await loginRateLimiter.delete(ip);
  } catch (error) {
    // エラーが発生してもログイン処理は継続する
    console.error('Failed to reset rate limit:', error);
  }
}
