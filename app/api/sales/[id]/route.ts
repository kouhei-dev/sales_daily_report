import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireManager } from '@/lib/middleware/auth';
import { updateSalesSchema, formatZodErrors } from '@/lib/validations/sales';
import { hashPassword } from '@/lib/auth';
import type { ApiSuccessResponse, ApiErrorResponse } from '@/types/session';
import type { SalesDetailResponse, SalesUpdateResponse } from '@/types/sales';

const prisma = new PrismaClient();

/**
 * 営業詳細取得API
 *
 * GET /api/sales/:id
 *
 * 管理者のみアクセス可能
 *
 * @param request - Next.js Request オブジェクト
 * @param params - パスパラメータ
 * @returns 営業詳細情報
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // 管理者権限チェック
    const authResult = await requireManager();
    if (authResult.error) {
      return authResult.response;
    }

    const { id } = await params;

    // 営業IDのバリデーション（MongoDB ObjectId）
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      const errorResponse: ApiErrorResponse = {
        status: 'error',
        error: {
          code: 'VALIDATION_ERROR',
          message: '無効な営業IDです',
        },
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // 営業データの取得
    const sales = await prisma.sales.findUnique({
      where: { id },
      include: {
        manager: {
          select: {
            id: true,
            salesName: true,
          },
        },
      },
    });

    if (!sales) {
      const errorResponse: ApiErrorResponse = {
        status: 'error',
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: '営業が見つかりません',
        },
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    // レスポンスの構築
    const responseData: SalesDetailResponse = {
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
    };

    const successResponse: ApiSuccessResponse<SalesDetailResponse> = {
      status: 'success',
      data: responseData,
    };

    return NextResponse.json(successResponse, { status: 200 });
  } catch (error) {
    console.error('Sales detail retrieval error:', error);
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
 * 営業更新API
 *
 * PUT /api/sales/:id
 *
 * 管理者のみアクセス可能
 * 営業コードは変更不可
 * パスワードは変更する場合のみ送信
 *
 * @param request - Next.js Request オブジェクト
 * @param params - パスパラメータ
 * @returns 更新された営業情報
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // 管理者権限チェック
    const authResult = await requireManager();
    if (authResult.error) {
      return authResult.response;
    }

    const { id } = await params;

    // 営業IDのバリデーション（MongoDB ObjectId）
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      const errorResponse: ApiErrorResponse = {
        status: 'error',
        error: {
          code: 'VALIDATION_ERROR',
          message: '無効な営業IDです',
        },
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // 営業の存在確認
    const existingSales = await prisma.sales.findUnique({
      where: { id },
    });

    if (!existingSales) {
      const errorResponse: ApiErrorResponse = {
        status: 'error',
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: '営業が見つかりません',
        },
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    // リクエストボディの取得
    const body = await request.json();

    // バリデーション
    const validationResult = updateSalesSchema.safeParse(body);
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

    const { sales_name, email, password, department, manager_id, is_manager } =
      validationResult.data;

    // メールアドレスの重複チェック（自分以外）
    if (email !== existingSales.email) {
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

    // 更新データの構築
    const updateData: {
      salesName: string;
      email: string;
      passwordHash?: string;
      department: string;
      managerId?: string | null;
      isManager: boolean;
    } = {
      salesName: sales_name,
      email,
      department,
      managerId: manager_id || null,
      isManager: is_manager,
    };

    // パスワードが指定されている場合のみハッシュ化して更新
    if (password) {
      updateData.passwordHash = await hashPassword(password);
    }

    // 営業の更新
    const updatedSales = await prisma.sales.update({
      where: { id },
      data: updateData,
    });

    // レスポンスの構築
    const responseData: SalesUpdateResponse = {
      sales_id: updatedSales.id,
      updated_at: updatedSales.updatedAt.toISOString(),
    };

    const successResponse: ApiSuccessResponse<SalesUpdateResponse> = {
      status: 'success',
      data: responseData,
    };

    return NextResponse.json(successResponse, { status: 200 });
  } catch (error) {
    console.error('Sales update error:', error);
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
 * 営業削除API
 *
 * DELETE /api/sales/:id
 *
 * 管理者のみアクセス可能
 * 日報または顧客で使用中の場合は削除不可
 *
 * @param request - Next.js Request オブジェクト
 * @param params - パスパラメータ
 * @returns 削除成功時は204 No Content
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 管理者権限チェック
    const authResult = await requireManager();
    if (authResult.error) {
      return authResult.response;
    }

    const { id } = await params;

    // 営業IDのバリデーション（MongoDB ObjectId）
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      const errorResponse: ApiErrorResponse = {
        status: 'error',
        error: {
          code: 'VALIDATION_ERROR',
          message: '無効な営業IDです',
        },
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // 営業の存在確認
    const existingSales = await prisma.sales.findUnique({
      where: { id },
    });

    if (!existingSales) {
      const errorResponse: ApiErrorResponse = {
        status: 'error',
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: '営業が見つかりません',
        },
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    // 日報での使用チェック
    const reportsCount = await prisma.dailyReport.count({
      where: { salesId: id },
    });

    if (reportsCount > 0) {
      const errorResponse: ApiErrorResponse = {
        status: 'error',
        error: {
          code: 'RESOURCE_IN_USE',
          message: '営業が日報で使用されているため削除できません',
        },
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // 顧客での使用チェック
    const customersCount = await prisma.customer.count({
      where: { salesId: id },
    });

    if (customersCount > 0) {
      const errorResponse: ApiErrorResponse = {
        status: 'error',
        error: {
          code: 'RESOURCE_IN_USE',
          message: '営業が顧客で使用されているため削除できません',
        },
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // 営業の削除
    await prisma.sales.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Sales deletion error:', error);
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
