import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '@/lib/middleware/auth';
import type { ApiSuccessResponse, ApiErrorResponse } from '@/types/session';
import type { DepartmentListResponse } from '@/types/department';

const prisma = new PrismaClient();

/**
 * 所属部署一覧取得API
 *
 * GET /api/departments
 *
 * セッション認証必須
 * 一般営業でもアクセス可能
 *
 * @param request - Next.js Request オブジェクト
 * @returns 所属部署一覧
 */
export async function GET(_request: NextRequest) {
  try {
    // 認証チェック（一般営業でもアクセス可能）
    const authResult = await requireAuth();
    if (authResult.error) {
      return authResult.response;
    }

    // 所属部署の取得（表示順でソート）
    const departments = await prisma.department.findMany({
      orderBy: {
        displayOrder: 'asc',
      },
    });

    // レスポンスの構築
    const responseData: DepartmentListResponse = {
      departments: departments.map((dept) => ({
        department_id: dept.id,
        department_name: dept.departmentName,
        display_order: dept.displayOrder,
      })),
    };

    const successResponse: ApiSuccessResponse<DepartmentListResponse> = {
      status: 'success',
      data: responseData,
    };

    return NextResponse.json(successResponse, { status: 200 });
  } catch (error) {
    console.error('Department list retrieval error:', error);
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
