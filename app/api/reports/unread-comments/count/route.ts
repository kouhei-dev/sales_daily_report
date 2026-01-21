import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '@/lib/middleware/auth';
import type { ApiSuccessResponse, ApiErrorResponse } from '@/types/session';
import type { UnreadCommentsCountResponse } from '@/types/report';

const prisma = new PrismaClient();

/**
 * 未読コメント数取得API
 *
 * GET /api/reports/unread-comments/count
 *
 * 認証済みユーザーのみアクセス可能
 * 自分の日報に対する未読コメント数を取得
 *
 * @param request - Next.js Request オブジェクト
 * @returns 未読コメント数
 */
export async function GET(_request: NextRequest) {
  try {
    // 認証チェック
    const authResult = await requireAuth();
    if (authResult.error) {
      return authResult.response;
    }
    const session = authResult.session;

    // 自分の日報に対する未読コメント数を取得
    const unreadCount = await prisma.comment.count({
      where: {
        dailyReport: {
          salesId: session.salesId,
        },
        isRead: false,
      },
    });

    // レスポンスの構築
    const responseData: UnreadCommentsCountResponse = {
      unread_count: unreadCount,
    };

    const successResponse: ApiSuccessResponse<UnreadCommentsCountResponse> = {
      status: 'success',
      data: responseData,
    };

    return NextResponse.json(successResponse, { status: 200 });
  } catch (error) {
    console.error('Unread comments count retrieval error:', error);
    const errorResponse: ApiErrorResponse = {
      status: 'error',
      error: {
        code: 'SERVER_ERROR',
        message: 'サーバーエラーが発生しました',
      },
    };
    return NextResponse.json(errorResponse, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
