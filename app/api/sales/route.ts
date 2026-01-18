import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireManager } from '@/lib/middleware/auth';
import { salesListQuerySchema, createSalesSchema, formatZodErrors } from '@/lib/validations/sales';
import { hashPassword } from '@/lib/auth';
import type { ApiSuccessResponse, ApiErrorResponse } from '@/types/session';
import type { SalesListResponse, SalesCreateResponse } from '@/types/sales';

const prisma = new PrismaClient();

/**
 * 営業一覧取得API
 *
 * GET /api/sales
 *
 * 管理者のみアクセス可能
 * クエリパラメータでフィルタリング・ページネーション可能
 *
 * @param request - Next.js Request オブジェクト
 * @returns 営業一覧とページネーション情報
 */
export async function GET(request: NextRequest) {
  try {
    // 管理者権限チェック
    const authResult = await requireManager();
    if (authResult.error) {
      return authResult.response;
    }

    // クエリパラメータの取得とバリデーション
    const { searchParams } = new URL(request.url);
    const queryParams = {
      sales_name: searchParams.get('sales_name') || undefined,
      sales_code: searchParams.get('sales_code') || undefined,
      department: searchParams.get('department') || undefined,
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
    };

    const validationResult = salesListQuerySchema.safeParse(queryParams);
    if (!validationResult.success) {
      const errorResponse: ApiErrorResponse = {
        status: 'error',
        error: {
          code: 'VALIDATION_ERROR',
          message: '入力内容に誤りがあります',
          details: formatZodErrors(validationResult.error),
        },
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const { sales_name, sales_code, department, page, limit } = validationResult.data;

    // フィルタ条件の構築
    const where: {
      salesName?: { contains: string; mode: 'insensitive' };
      salesCode?: { contains: string; mode: 'insensitive' };
      department?: string;
    } = {};

    if (sales_name) {
      where.salesName = { contains: sales_name, mode: 'insensitive' };
    }
    if (sales_code) {
      where.salesCode = { contains: sales_code, mode: 'insensitive' };
    }
    if (department) {
      where.department = department;
    }

    // 総件数の取得
    const totalItems = await prisma.sales.count({ where });

    // ページネーション計算
    const totalPages = Math.ceil(totalItems / limit);
    const skip = (page - 1) * limit;

    // データ取得
    const salesList = await prisma.sales.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        manager: {
          select: {
            id: true,
            salesName: true,
          },
        },
      },
    });

    // レスポンスの構築
    const responseData: SalesListResponse = {
      items: salesList.map((sales) => ({
        sales_id: sales.id,
        sales_code: sales.salesCode,
        sales_name: sales.salesName,
        email: sales.email,
        department: sales.department,
        is_manager: sales.isManager,
        ...(sales.manager && {
          manager: {
            sales_id: sales.manager.id,
            sales_name: sales.manager.salesName,
          },
        }),
        created_at: sales.createdAt.toISOString(),
        updated_at: sales.updatedAt.toISOString(),
      })),
      pagination: {
        current_page: page,
        total_pages: totalPages,
        total_items: totalItems,
        limit,
      },
    };

    const successResponse: ApiSuccessResponse<SalesListResponse> = {
      status: 'success',
      data: responseData,
    };

    return NextResponse.json(successResponse, { status: 200 });
  } catch (error) {
    console.error('Sales list retrieval error:', error);
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

/**
 * 営業作成API
 *
 * POST /api/sales
 *
 * 管理者のみアクセス可能
 * 営業コードとメールアドレスのユニークチェックを実施
 *
 * @param request - Next.js Request オブジェクト
 * @returns 作成された営業情報
 */
export async function POST(request: NextRequest) {
  try {
    // 管理者権限チェック
    const authResult = await requireManager();
    if (authResult.error) {
      return authResult.response;
    }

    // リクエストボディの取得
    const body = await request.json();

    // バリデーション
    const validationResult = createSalesSchema.safeParse(body);
    if (!validationResult.success) {
      const errorResponse: ApiErrorResponse = {
        status: 'error',
        error: {
          code: 'VALIDATION_ERROR',
          message: '入力内容に誤りがあります',
          details: formatZodErrors(validationResult.error),
        },
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const { sales_code, sales_name, email, password, department, manager_id, is_manager } =
      validationResult.data;

    // 営業コードの重複チェック
    const existingSalesByCode = await prisma.sales.findUnique({
      where: { salesCode: sales_code },
    });

    if (existingSalesByCode) {
      const errorResponse: ApiErrorResponse = {
        status: 'error',
        error: {
          code: 'RESOURCE_CONFLICT',
          message: 'この営業コードは既に使用されています',
        },
      };
      return NextResponse.json(errorResponse, { status: 409 });
    }

    // メールアドレスの重複チェック
    const existingSalesByEmail = await prisma.sales.findUnique({
      where: { email },
    });

    if (existingSalesByEmail) {
      const errorResponse: ApiErrorResponse = {
        status: 'error',
        error: {
          code: 'RESOURCE_CONFLICT',
          message: 'このメールアドレスは既に使用されています',
        },
      };
      return NextResponse.json(errorResponse, { status: 409 });
    }

    // 上司IDが指定されている場合、存在確認と管理者権限チェック
    if (manager_id) {
      const managerExists = await prisma.sales.findUnique({
        where: { id: manager_id },
      });

      if (!managerExists) {
        const errorResponse: ApiErrorResponse = {
          status: 'error',
          error: {
            code: 'VALIDATION_ERROR',
            message: '入力内容に誤りがあります',
            details: [{ field: 'manager_id', message: '指定された上司が見つかりません' }],
          },
        };
        return NextResponse.json(errorResponse, { status: 400 });
      }

      if (!managerExists.isManager) {
        const errorResponse: ApiErrorResponse = {
          status: 'error',
          error: {
            code: 'VALIDATION_ERROR',
            message: '入力内容に誤りがあります',
            details: [{ field: 'manager_id', message: '指定された営業は管理者ではありません' }],
          },
        };
        return NextResponse.json(errorResponse, { status: 400 });
      }
    }

    // パスワードのハッシュ化
    const passwordHash = await hashPassword(password);

    // 営業の作成
    const newSales = await prisma.sales.create({
      data: {
        salesCode: sales_code,
        salesName: sales_name,
        email,
        passwordHash,
        department,
        managerId: manager_id,
        isManager: is_manager,
      },
    });

    // レスポンスの構築
    const responseData: SalesCreateResponse = {
      sales_id: newSales.id,
      sales_code: newSales.salesCode,
      sales_name: newSales.salesName,
      created_at: newSales.createdAt.toISOString(),
    };

    const successResponse: ApiSuccessResponse<SalesCreateResponse> = {
      status: 'success',
      data: responseData,
    };

    return NextResponse.json(successResponse, { status: 201 });
  } catch (error) {
    console.error('Sales creation error:', error);
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
