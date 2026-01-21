import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '@/lib/middleware/auth';
import { updateCustomerSchema, formatZodErrors } from '@/lib/validations/customer';
import type { ApiSuccessResponse, ApiErrorResponse } from '@/types/session';
import type { CustomerDetailResponse, CustomerUpdateResponse } from '@/types/customer';

const prisma = new PrismaClient();

/**
 * 顧客詳細取得API
 *
 * GET /api/customers/:id
 *
 * 認証済みユーザーのみアクセス可能
 *
 * @param request - Next.js Request オブジェクト
 * @param params - パスパラメータ
 * @returns 顧客詳細情報
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // 認証チェック
    const authResult = await requireAuth();
    if (authResult.error) {
      return authResult.response;
    }

    const { id } = await params;

    // 顧客IDのバリデーション（MongoDB ObjectId）
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      const errorResponse: ApiErrorResponse = {
        status: 'error',
        error: {
          code: 'VALIDATION_ERROR',
          message: '無効な顧客IDです',
        },
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // 顧客データの取得
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        sales: {
          select: {
            id: true,
            salesName: true,
            department: {
              select: {
                departmentName: true,
              },
            },
          },
        },
      },
    });

    if (!customer) {
      const errorResponse: ApiErrorResponse = {
        status: 'error',
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: '顧客が見つかりません',
        },
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    // レスポンスの構築
    const responseData: CustomerDetailResponse = {
      customer_id: customer.id,
      customer_code: customer.customerCode,
      customer_name: customer.customerName,
      industry: customer.industry ?? undefined,
      postal_code: customer.postalCode ?? undefined,
      address: customer.address ?? undefined,
      phone: customer.phone ?? undefined,
      sales: {
        sales_id: customer.sales.id,
        sales_name: customer.sales.salesName,
        department: customer.sales.department.departmentName,
      },
      notes: customer.notes ?? undefined,
      created_at: customer.createdAt.toISOString(),
      updated_at: customer.updatedAt.toISOString(),
    };

    const successResponse: ApiSuccessResponse<CustomerDetailResponse> = {
      status: 'success',
      data: responseData,
    };

    return NextResponse.json(successResponse, { status: 200 });
  } catch (error) {
    console.error('Customer detail retrieval error:', error);
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
 * 顧客更新API
 *
 * PUT /api/customers/:id
 *
 * 認証済みユーザーのみアクセス可能
 * 顧客コードは変更不可
 *
 * @param request - Next.js Request オブジェクト
 * @param params - パスパラメータ
 * @returns 更新された顧客情報
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // 認証チェック
    const authResult = await requireAuth();
    if (authResult.error) {
      return authResult.response;
    }

    const { id } = await params;

    // 顧客IDのバリデーション（MongoDB ObjectId）
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      const errorResponse: ApiErrorResponse = {
        status: 'error',
        error: {
          code: 'VALIDATION_ERROR',
          message: '無効な顧客IDです',
        },
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // 顧客の存在確認
    const existingCustomer = await prisma.customer.findUnique({
      where: { id },
    });

    if (!existingCustomer) {
      const errorResponse: ApiErrorResponse = {
        status: 'error',
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: '顧客が見つかりません',
        },
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    // リクエストボディの取得
    const body = await request.json();

    // バリデーション
    const validationResult = updateCustomerSchema.safeParse(body);
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

    const { customer_name, industry, postal_code, address, phone, sales_id, notes } =
      validationResult.data;

    // 営業IDの存在確認
    const salesExists = await prisma.sales.findUnique({
      where: { id: sales_id },
    });

    if (!salesExists) {
      const errorResponse: ApiErrorResponse = {
        status: 'error',
        error: {
          code: 'VALIDATION_ERROR',
          message: '入力内容に誤りがあります',
          details: [{ field: 'sales_id', message: '指定された営業が見つかりません' }],
        },
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // 顧客の更新
    const updatedCustomer = await prisma.customer.update({
      where: { id },
      data: {
        customerName: customer_name,
        industry: industry ?? null,
        postalCode: postal_code ?? null,
        address: address ?? null,
        phone: phone ?? null,
        salesId: sales_id,
        notes: notes ?? null,
      },
    });

    // レスポンスの構築
    const responseData: CustomerUpdateResponse = {
      customer_id: updatedCustomer.id,
      updated_at: updatedCustomer.updatedAt.toISOString(),
    };

    const successResponse: ApiSuccessResponse<CustomerUpdateResponse> = {
      status: 'success',
      data: responseData,
    };

    return NextResponse.json(successResponse, { status: 200 });
  } catch (error) {
    console.error('Customer update error:', error);
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
 * 顧客削除API
 *
 * DELETE /api/customers/:id
 *
 * 認証済みユーザーのみアクセス可能
 * 日報（訪問記録）で使用中の場合は削除不可
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
    // 認証チェック
    const authResult = await requireAuth();
    if (authResult.error) {
      return authResult.response;
    }

    const { id } = await params;

    // 顧客IDのバリデーション（MongoDB ObjectId）
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      const errorResponse: ApiErrorResponse = {
        status: 'error',
        error: {
          code: 'VALIDATION_ERROR',
          message: '無効な顧客IDです',
        },
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // 顧客の存在確認
    const existingCustomer = await prisma.customer.findUnique({
      where: { id },
    });

    if (!existingCustomer) {
      const errorResponse: ApiErrorResponse = {
        status: 'error',
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: '顧客が見つかりません',
        },
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    // 訪問記録での使用チェック
    const visitRecordsCount = await prisma.visitRecord.count({
      where: { customerId: id },
    });

    if (visitRecordsCount > 0) {
      const errorResponse: ApiErrorResponse = {
        status: 'error',
        error: {
          code: 'RESOURCE_IN_USE',
          message: '顧客が日報で使用されているため削除できません',
        },
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // 顧客の削除
    await prisma.customer.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Customer deletion error:', error);
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
