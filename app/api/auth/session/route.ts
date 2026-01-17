import { NextResponse } from 'next/server';
import { getSession, isSessionValid, refreshSession } from '@/lib/session';
import type { ApiSuccessResponse, ApiErrorResponse, SessionResponse } from '@/types/session';

/**
 * セッション確認API
 *
 * GET /api/auth/session
 *
 * 現在のセッション情報を取得する
 * セッションが有効な場合は、有効期限を延長する
 *
 * @returns セッション情報
 */
export async function GET() {
  try {
    // セッションの取得
    const session = await getSession();

    // セッションが無効または期限切れの場合
    if (!isSessionValid(session)) {
      const errorResponse: ApiErrorResponse = {
        status: 'error',
        error: {
          code: 'AUTH_SESSION_EXPIRED',
          message: 'セッションが無効または期限切れです',
        },
      };
      return NextResponse.json(errorResponse, { status: 401 });
    }

    // セッションの有効期限を延長
    await refreshSession(session);

    // レスポンスの作成
    const responseData: SessionResponse = {
      user: {
        sales_id: session.salesId!,
        sales_code: session.salesCode!,
        sales_name: session.salesName!,
        email: session.email!,
        department: session.department!,
        is_manager: session.isManager!,
      },
      session_expires_at: new Date(session.expiresAt!).toISOString(),
    };

    const successResponse: ApiSuccessResponse<SessionResponse> = {
      status: 'success',
      data: responseData,
    };

    return NextResponse.json(successResponse, { status: 200 });
  } catch (error) {
    console.error('Session check error:', error);
    const errorResponse: ApiErrorResponse = {
      status: 'error',
      error: {
        code: 'SERVER_ERROR',
        message: 'サーバーエラーが発生しました',
      },
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
