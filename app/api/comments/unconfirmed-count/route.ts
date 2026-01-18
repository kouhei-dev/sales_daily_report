import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { prisma } from '@/lib/prisma';
import type { ApiSuccessResponse, ApiErrorResponse } from '@/types/session';

/**
 * 未確認コメント数のレスポンス型
 */
export interface UnconfirmedCommentCountResponse {
  count: number;
}

/**
 * GET /api/comments/unconfirmed-count
 *
 * ログインユーザーの未確認コメント数を取得
 *
 * 仕様:
 * - 自分が作成した日報に対するコメントのみカウント
 * - 自分自身が追加したコメントは除外
 * - is_read=falseのコメントのみカウント
 *
 * @returns 未確認コメント数
 */
export async function GET() {
  // 認証チェック
  const authResult = await requireAuth();
  if (authResult.error) {
    return authResult.response;
  }

  const { salesId } = authResult.session;

  try {
    // 未確認コメント数を取得
    const count = await prisma.comment.count({
      where: {
        dailyReport: {
          salesId: salesId,
        },
        commenterId: {
          not: salesId, // 自分自身のコメントは除外
        },
        isRead: false,
      },
    });

    const response: ApiSuccessResponse<UnconfirmedCommentCountResponse> = {
      status: 'success',
      data: {
        count,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Failed to fetch unconfirmed comment count:', error);

    const errorResponse: ApiErrorResponse = {
      status: 'error',
      error: {
        code: 'SERVER_ERROR',
        message: 'コメント数の取得に失敗しました',
      },
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
