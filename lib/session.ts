import { getIronSession, IronSession, SessionOptions } from 'iron-session';
import { cookies } from 'next/headers';
import type { SessionData } from '@/types/session';

/**
 * セッションのタイムアウト時間（30分）
 */
const SESSION_TIMEOUT_MINUTES = 30;

/**
 * セッションのタイムアウト時間（秒）
 */
export const SESSION_TIMEOUT_SECONDS = SESSION_TIMEOUT_MINUTES * 60;

/**
 * セッションシークレットを取得・検証する
 *
 * セキュリティ考慮事項:
 * - 本番環境では必ずSESSION_SECRET環境変数を設定すること
 * - シークレットは32文字以上の強力なランダム文字列を使用
 * - 開発環境でのみデフォルト値を許可
 *
 * @returns セッションシークレット
 * @throws 本番環境でSESSION_SECRETが未設定の場合
 * @throws シークレットが32文字未満の場合
 */
function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  const isProduction = process.env.NODE_ENV === 'production';

  // 本番環境でSESSION_SECRETが未設定の場合はエラー
  if (isProduction && !secret) {
    throw new Error(
      'SESSION_SECRET environment variable must be set in production. ' +
        'Generate a strong random string with at least 32 characters.'
    );
  }

  // SESSION_SECRETが設定されている場合は長さをチェック
  if (secret) {
    if (secret.length < 32) {
      throw new Error(
        `SESSION_SECRET must be at least 32 characters long. Current length: ${secret.length}. ` +
          'Generate a strong random string for production use.'
      );
    }
    return secret;
  }

  // 開発環境でのみデフォルト値を返す
  return 'complex_password_at_least_32_characters_long_for_development';
}

/**
 * セッション設定
 *
 * セキュリティ考慮事項:
 * - cookieName: セッションIDを格納するCookie名
 * - password: セッションデータの暗号化に使用（32文字以上必須）
 * - cookieOptions:
 *   - secure: HTTPS通信のみでCookieを送信
 *   - httpOnly: JavaScriptからのアクセスを防止（XSS対策）
 *   - sameSite: CSRF攻撃を防止
 *   - maxAge: セッションの最大有効期間（秒）
 */
export const sessionOptions: SessionOptions = {
  cookieName: 'sales_daily_report_session',
  password: getSessionSecret(),
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: SESSION_TIMEOUT_SECONDS,
  },
};

/**
 * 現在のセッションを取得する
 *
 * @returns セッションオブジェクト
 */
export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

/**
 * セッションが有効かどうかを確認する
 *
 * @param session - セッションオブジェクト
 * @returns セッションが有効な場合はtrue
 */
export function isSessionValid(session: IronSession<SessionData>): boolean {
  // セッションにsalesIdが存在し、有効期限が現在時刻より後であることを確認
  if (!session.salesId || !session.expiresAt) {
    return false;
  }

  const now = Date.now();
  return session.expiresAt > now;
}

/**
 * セッションにユーザー情報を設定する
 *
 * @param session - セッションオブジェクト
 * @param userData - ユーザーデータ
 */
export async function setSessionData(
  session: IronSession<SessionData>,
  userData: Omit<SessionData, 'expiresAt'>
): Promise<void> {
  const expiresAt = Date.now() + SESSION_TIMEOUT_SECONDS * 1000;

  session.salesId = userData.salesId;
  session.salesCode = userData.salesCode;
  session.salesName = userData.salesName;
  session.email = userData.email;
  session.department = userData.department;
  session.isManager = userData.isManager;
  session.expiresAt = expiresAt;

  await session.save();
}

/**
 * セッションを破棄する
 *
 * @param session - セッションオブジェクト
 */
export async function destroySession(session: IronSession<SessionData>): Promise<void> {
  session.destroy();
  await session.save();
}

/**
 * セッションの有効期限を延長する（タイムアウト時刻を更新）
 *
 * @param session - セッションオブジェクト
 */
export async function refreshSession(session: IronSession<SessionData>): Promise<void> {
  if (isSessionValid(session)) {
    session.expiresAt = Date.now() + SESSION_TIMEOUT_SECONDS * 1000;
    await session.save();
  }
}
