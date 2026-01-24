import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '@/lib/middleware/auth';
import {
  customerListQuerySchema,
  createCustomerSchema,
  formatZodErrors,
} from '@/lib/validations/customer';
import type { ApiSuccessResponse, ApiErrorResponse } from '@/types/session';
import type { CustomerListResponse, CustomerCreateResponse } from '@/types/customer';

const prisma = new PrismaClient();

/**
 * 顧客一覧取得API
 *
 * GET /api/customers
 *
 * 認証済みユーザーのみアクセス可能
 * クエリパラメータでフィルタリング・ページネーション可能
 *
 * @param request - Next.js Request オブジェクト
 * @returns 顧客一覧とページネーション情報
 */
export async function GET(request: NextRequest) {
  try {
    // 認証チェック
    const authResult = await requireAuth();
    if (authResult.error) {
      return authResult.response;
    }

    // クエリパラメータの取得とバリデーション
    const { searchParams } = new URL(request.url);
    const queryParams = {
      customer_name: searchParams.get('customer_name') || undefined,
      customer_code: searchParams.get('customer_code') || undefined,
      sales_id: searchParams.get('sales_id') || undefined,
      sales_name: searchParams.get('sales_name') || undefined,
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
    };

    const validationResult = customerListQuerySchema.safeParse(queryParams);
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

    const { customer_name, customer_code, sales_id, sales_name, page, limit } =
      validationResult.data;

    // フィルタ条件の構築
    const where: {
      customerName?: { contains: string; mode: 'insensitive' };
      customerCode?: { contains: string; mode: 'insensitive' };
      salesId?: string;
      sales?: {
        salesName?: { contains: string; mode: 'insensitive' };
      };
    } = {};

    if (customer_name) {
      where.customerName = { contains: customer_name, mode: 'insensitive' };
    }
    if (customer_code) {
      where.customerCode = { contains: customer_code, mode: 'insensitive' };
    }
    if (sales_id) {
      where.salesId = sales_id;
    }
    if (sales_name) {
      where.sales = {
        salesName: { contains: sales_name, mode: 'insensitive' },
      };
    }

    // 総件数の取得
    const totalItems = await prisma.customer.count({ where });

    // ページネーション計算
    const totalPages = Math.ceil(totalItems / limit);
    const skip = (page - 1) * limit;

    // データ取得
    const customerList = await prisma.customer.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        sales: {
          select: {
            id: true,
            salesName: true,
          },
        },
      },
    });

    // レスポンスの構築
    const responseData: CustomerListResponse = {
      items: customerList.map((customer) => ({
        customer_id: customer.id,
        customer_code: customer.customerCode,
        customer_name: customer.customerName,
        industry: customer.industry ?? undefined,
        address: customer.address ?? undefined,
        phone: customer.phone ?? undefined,
        sales: {
          sales_id: customer.sales.id,
          sales_name: customer.sales.salesName,
        },
        created_at: customer.createdAt.toISOString(),
        updated_at: customer.updatedAt.toISOString(),
      })),
      pagination: {
        current_page: page,
        total_pages: totalPages,
        total_items: totalItems,
        limit,
      },
    };

    const successResponse: ApiSuccessResponse<CustomerListResponse> = {
      status: 'success',
      data: responseData,
    };

    return NextResponse.json(successResponse, { status: 200 });
  } catch (error) {
    console.error('Customer list retrieval error:', error);
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
 * 顧客作成API
 *
 * POST /api/customers
 *
 * 認証済みユーザーのみアクセス可能
 * 顧客コードのユニークチェックを実施
 *
 * @param request - Next.js Request オブジェクト
 * @returns 作成された顧客情報
 */
export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const authResult = await requireAuth();
    if (authResult.error) {
      return authResult.response;
    }

    // リクエストボディの取得
    const body = await request.json();

    // バリデーション
    const validationResult = createCustomerSchema.safeParse(body);
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

    const { customer_code, customer_name, industry, postal_code, address, phone, sales_id, notes } =
      validationResult.data;

    // 顧客コードの重複チェック
    const existingCustomer = await prisma.customer.findUnique({
      where: { customerCode: customer_code },
    });

    if (existingCustomer) {
      const errorResponse: ApiErrorResponse = {
        status: 'error',
        error: {
          code: 'RESOURCE_CONFLICT',
          message: 'この顧客コードは既に使用されています',
        },
      };
      return NextResponse.json(errorResponse, { status: 409 });
    }

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

    // 顧客の作成
    const newCustomer = await prisma.customer.create({
      data: {
        customerCode: customer_code,
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
    const responseData: CustomerCreateResponse = {
      customer_id: newCustomer.id,
      customer_code: newCustomer.customerCode,
      customer_name: newCustomer.customerName,
      created_at: newCustomer.createdAt.toISOString(),
    };

    const successResponse: ApiSuccessResponse<CustomerCreateResponse> = {
      status: 'success',
      data: responseData,
    };

    return NextResponse.json(successResponse, { status: 201 });
  } catch (error) {
    console.error('Customer creation error:', error);
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
