import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyPassword } from '@/lib/auth';
import { getSession, setSessionData } from '@/lib/session';
import { checkLoginRateLimit, resetLoginRateLimit, getClientIp } from '@/lib/rate-limiter';
import type { ApiSuccessResponse, ApiErrorResponse, LoginResponse } from '@/types/session';

const prisma = new PrismaClient();

/**
 * ログインAPI
 *
 * POST /api/auth/login
 *
 * セキュリティ考慮事項:
 * - レート制限（5回/5分）でブルートフォース攻撃を防ぐ
 * - bcryptによるパスワード検証でタイミング攻撃を防ぐ
 * - エラーメッセージは詳細を出さず、一般的なメッセージを返す
 * - セッションCookieはHttpOnly, Secure, SameSiteを設定
 *
 * @param request - Next.js Request オブジェクト
 * @returns ユーザー情報とセッションID
 */
export async function POST(request: NextRequest) {
  try {
    // リクエストボディの取得
    const body = await request.json();
    const { sales_code, password } = body;

    // バリデーション
    if (!sales_code || !password) {
      const errorResponse: ApiErrorResponse = {
        status: 'error',
        error: {
          code: 'VALIDATION_ERROR',
          message: '営業コードとパスワードを入力してください',
          details: [
            ...((!sales_code && [{ field: 'sales_code', message: '営業コードは必須です' }]) || []),
            ...((!password && [{ field: 'password', message: 'パスワードは必須です' }]) || []),
          ],
        },
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // レート制限のチェック
    const clientIp = getClientIp(request);
    const rateLimitResult = await checkLoginRateLimit(clientIp);

    if (!rateLimitResult.success) {
      const errorResponse: ApiErrorResponse = {
        status: 'error',
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: `ログイン試行回数が上限に達しました。${rateLimitResult.retryAfter}秒後に再試行してください。`,
        },
      };
      return NextResponse.json(errorResponse, { status: 429 });
    }

    // ユーザーの検索
    const user = await prisma.sales.findUnique({
      where: { salesCode: sales_code },
      include: {
        manager: {
          select: {
            id: true,
            salesName: true,
          },
        },
      },
    });

    // ユーザーが存在しない、またはパスワードが一致しない場合
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      const errorResponse: ApiErrorResponse = {
        status: 'error',
        error: {
          code: 'AUTH_INVALID_CREDENTIALS',
          message: '営業コードまたはパスワードが正しくありません',
        },
      };
      return NextResponse.json(errorResponse, { status: 401 });
    }

    // ログイン成功: レート制限をリセット
    await resetLoginRateLimit(clientIp);

    // セッションの作成
    const session = await getSession();
    await setSessionData(session, {
      salesId: user.id,
      salesCode: user.salesCode,
      salesName: user.salesName,
      email: user.email,
      department: user.department,
      isManager: user.isManager,
    });

    // レスポンスの作成
    const responseData: LoginResponse = {
      user: {
        sales_id: user.id,
        sales_code: user.salesCode,
        sales_name: user.salesName,
        email: user.email,
        department: user.department,
        is_manager: user.isManager,
        ...(user.manager && {
          manager: {
            sales_id: user.manager.id,
            sales_name: user.manager.salesName,
          },
        }),
      },
      session_id: session.salesId || '',
    };

    const successResponse: ApiSuccessResponse<LoginResponse> = {
      status: 'success',
      data: responseData,
    };

    return NextResponse.json(successResponse, { status: 200 });
  } catch (error) {
    console.error('Login error:', error);
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
