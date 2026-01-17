import { NextResponse } from 'next/server';
import { getSession, destroySession } from '@/lib/session';
import type { ApiSuccessResponse, ApiErrorResponse } from '@/types/session';

/**
 * ログアウトAPI
 *
 * POST /api/auth/logout
 *
 * セッションを無効化し、Cookieを削除する
 *
 * @returns ログアウト完了メッセージ
 */
export async function POST() {
  try {
    // セッションの取得
    const session = await getSession();

    // セッションが存在しない場合でも正常にログアウト処理を行う
    // （既にログアウト済みの場合など）
    await destroySession(session);

    const successResponse: ApiSuccessResponse<{ message: string }> = {
      status: 'success',
      data: {
        message: 'ログアウトしました',
      },
    };

    return NextResponse.json(successResponse, { status: 200 });
  } catch (error) {
    console.error('Logout error:', error);
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
