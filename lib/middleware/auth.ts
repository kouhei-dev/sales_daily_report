import { NextRequest, NextResponse } from 'next/server';
import { getSession, isSessionValid, refreshSession } from '@/lib/session';
import type { ApiErrorResponse, SessionData } from '@/types/session';

/**
 * 認証が必要なAPIのレスポンス型
 */
export interface AuthenticatedRequest extends NextRequest {
  session: SessionData;
}

/**
 * 認証ミドルウェア
 *
 * APIルートハンドラーで認証が必要な場合に使用する
 *
 * 使用例:
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   const authResult = await requireAuth();
 *   if (authResult.error) {
 *     return authResult.response;
 *   }
 *
 *   const session = authResult.session;
 *   // セッション情報を使った処理
 * }
 * ```
 *
 * @returns 認証結果
 */
export async function requireAuth(): Promise<
  { session: SessionData; error: null } | { session: null; error: true; response: NextResponse }
> {
  try {
    const session = await getSession();

    // セッションが無効または期限切れの場合
    if (!isSessionValid(session)) {
      const errorResponse: ApiErrorResponse = {
        status: 'error',
        error: {
          code: 'AUTH_UNAUTHORIZED',
          message: '認証が必要です',
        },
      };
      return {
        session: null,
        error: true,
        response: NextResponse.json(errorResponse, { status: 401 }),
      };
    }

    // セッションの有効期限を延長
    await refreshSession(session);

    // セッションデータを返す
    const sessionData: SessionData = {
      salesId: session.salesId!,
      salesCode: session.salesCode!,
      salesName: session.salesName!,
      email: session.email!,
      department: session.department!,
      isManager: session.isManager!,
      expiresAt: session.expiresAt!,
    };

    return {
      session: sessionData,
      error: null,
    };
  } catch (error) {
    console.error('Authentication error:', error);
    const errorResponse: ApiErrorResponse = {
      status: 'error',
      error: {
        code: 'SERVER_ERROR',
        message: 'サーバーエラーが発生しました',
      },
    };
    return {
      session: null,
      error: true,
      response: NextResponse.json(errorResponse, { status: 500 }),
    };
  }
}

/**
 * 管理者権限が必要なAPIのミドルウェア
 *
 * 使用例:
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   const authResult = await requireManager();
 *   if (authResult.error) {
 *     return authResult.response;
 *   }
 *
 *   const session = authResult.session;
 *   // 管理者のみの処理
 * }
 * ```
 *
 * @returns 認証結果
 */
export async function requireManager(): Promise<
  { session: SessionData; error: null } | { session: null; error: true; response: NextResponse }
> {
  const authResult = await requireAuth();

  if (authResult.error) {
    return authResult;
  }

  // 管理者でない場合
  if (!authResult.session.isManager) {
    const errorResponse: ApiErrorResponse = {
      status: 'error',
      error: {
        code: 'AUTH_FORBIDDEN',
        message: '権限がありません',
      },
    };
    return {
      session: null,
      error: true,
      response: NextResponse.json(errorResponse, { status: 403 }),
    };
  }

  return authResult;
}
