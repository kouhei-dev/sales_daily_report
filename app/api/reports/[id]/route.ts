import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '@/lib/middleware/auth';
import { updateReportSchema, formatZodErrors } from '@/lib/validations/report';
import type { ApiSuccessResponse, ApiErrorResponse } from '@/types/session';
import type { ReportDetailResponse, ReportUpdateResponse } from '@/types/report';

const prisma = new PrismaClient();

/**
 * 日報詳細取得API
 *
 * GET /api/reports/:id
 *
 * 認証済みユーザーのみアクセス可能
 * 管理者は全員分、営業担当者は自分の日報のみ取得可能
 *
 * @param request - Next.js Request オブジェクト
 * @param params - パスパラメータ
 * @returns 日報詳細情報
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // 認証チェック
    const authResult = await requireAuth();
    if (authResult.error) {
      return authResult.response;
    }
    const session = authResult.session;

    const { id } = await params;

    // 日報IDのバリデーション（MongoDB ObjectId）
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      const errorResponse: ApiErrorResponse = {
        status: 'error',
        error: {
          code: 'VALIDATION_ERROR',
          message: '無効な日報IDです',
        },
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // 日報データの取得
    const report = await prisma.dailyReport.findUnique({
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
        visitRecords: {
          include: {
            customer: {
              select: {
                id: true,
                customerCode: true,
                customerName: true,
              },
            },
          },
          orderBy: {
            displayOrder: 'asc',
          },
        },
        comments: {
          include: {
            commenter: {
              select: {
                id: true,
                salesName: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!report) {
      const errorResponse: ApiErrorResponse = {
        status: 'error',
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: '日報が見つかりません',
        },
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    // 権限チェック: 営業担当者は自分の日報のみ、管理者は全員分
    if (!session.isManager && report.salesId !== session.salesId) {
      const errorResponse: ApiErrorResponse = {
        status: 'error',
        error: {
          code: 'AUTH_FORBIDDEN',
          message: '権限がありません',
        },
      };
      return NextResponse.json(errorResponse, { status: 403 });
    }

    // ステータスマップ
    const statusMap: Record<string, 'draft' | 'submitted' | 'commented'> = {
      DRAFT: 'draft',
      SUBMITTED: 'submitted',
      COMMENTED: 'commented',
    };

    // コメントを問題点・翌日の予定別に分類
    const problemComments = report.comments
      .filter((c) => c.commentType === 'PROBLEM')
      .map((c) => ({
        comment_id: c.id,
        commenter: {
          sales_id: c.commenter.id,
          sales_name: c.commenter.salesName,
        },
        comment_text: c.commentText,
        is_read: c.isRead,
        read_at: c.readAt?.toISOString(),
        created_at: c.createdAt.toISOString(),
      }));

    const planComments = report.comments
      .filter((c) => c.commentType === 'PLAN')
      .map((c) => ({
        comment_id: c.id,
        commenter: {
          sales_id: c.commenter.id,
          sales_name: c.commenter.salesName,
        },
        comment_text: c.commentText,
        is_read: c.isRead,
        read_at: c.readAt?.toISOString(),
        created_at: c.createdAt.toISOString(),
      }));

    // レスポンスの構築
    const responseData: ReportDetailResponse = {
      report_id: report.id,
      report_date: report.reportDate.toISOString().split('T')[0],
      sales: {
        sales_id: report.sales.id,
        sales_name: report.sales.salesName,
        department: report.sales.department.departmentName,
      },
      problem: report.problem ?? undefined,
      plan: report.plan ?? undefined,
      status: statusMap[report.status] || 'draft',
      submitted_at: report.submittedAt?.toISOString(),
      visit_records: report.visitRecords.map((record) => ({
        visit_id: record.id,
        customer: {
          customer_id: record.customer.id,
          customer_code: record.customer.customerCode,
          customer_name: record.customer.customerName,
        },
        visit_datetime: record.visitDatetime.toISOString(),
        visit_content: record.visitContent,
        visit_result: record.visitResult ?? undefined,
        display_order: record.displayOrder,
      })),
      comments: {
        problem: problemComments,
        plan: planComments,
      },
      created_at: report.createdAt.toISOString(),
      updated_at: report.updatedAt.toISOString(),
    };

    const successResponse: ApiSuccessResponse<ReportDetailResponse> = {
      status: 'success',
      data: responseData,
    };

    return NextResponse.json(successResponse, { status: 200 });
  } catch (error) {
    console.error('Report detail retrieval error:', error);
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
 * 日報更新API
 *
 * PUT /api/reports/:id
 *
 * 認証済みユーザーのみアクセス可能
 * 営業担当者は自分の日報のみ更新可能
 * 訪問記録の差分更新（visit_idあり: 更新、なし: 新規作成、リクエストに含まれない: 削除）
 *
 * @param request - Next.js Request オブジェクト
 * @param params - パスパラメータ
 * @returns 更新された日報情報
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // 認証チェック
    const authResult = await requireAuth();
    if (authResult.error) {
      return authResult.response;
    }
    const session = authResult.session;

    const { id } = await params;

    // 日報IDのバリデーション（MongoDB ObjectId）
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      const errorResponse: ApiErrorResponse = {
        status: 'error',
        error: {
          code: 'VALIDATION_ERROR',
          message: '無効な日報IDです',
        },
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // 日報の存在確認
    const existingReport = await prisma.dailyReport.findUnique({
      where: { id },
      include: {
        visitRecords: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!existingReport) {
      const errorResponse: ApiErrorResponse = {
        status: 'error',
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: '日報が見つかりません',
        },
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    // 権限チェック: 営業担当者は自分の日報のみ更新可能
    if (existingReport.salesId !== session.salesId) {
      const errorResponse: ApiErrorResponse = {
        status: 'error',
        error: {
          code: 'AUTH_FORBIDDEN',
          message: '権限がありません',
        },
      };
      return NextResponse.json(errorResponse, { status: 403 });
    }

    // リクエストボディの取得
    const body = await request.json();

    // バリデーション
    const validationResult = updateReportSchema.safeParse(body);
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

    const { problem, plan, status, visit_records } = validationResult.data;

    // 顧客IDの存在確認
    const customerIds = visit_records.map((record) => record.customer_id);
    const customers = await prisma.customer.findMany({
      where: {
        id: {
          in: customerIds,
        },
      },
      select: {
        id: true,
      },
    });

    const foundCustomerIds = new Set(customers.map((c) => c.id));
    const invalidCustomerIds = customerIds.filter((id) => !foundCustomerIds.has(id));

    if (invalidCustomerIds.length > 0) {
      const errorResponse: ApiErrorResponse = {
        status: 'error',
        error: {
          code: 'VALIDATION_ERROR',
          message: '入力内容に誤りがあります',
          details: invalidCustomerIds.map((id) => ({
            field: 'visit_records.customer_id',
            message: `指定された顧客が見つかりません: ${id}`,
          })),
        },
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // 訪問記録IDのバリデーション
    const visitIdsToUpdate = visit_records.filter((r) => r.visit_id).map((r) => r.visit_id!);
    if (visitIdsToUpdate.length > 0) {
      const existingVisitRecords = await prisma.visitRecord.findMany({
        where: {
          id: {
            in: visitIdsToUpdate,
          },
          reportId: id,
        },
        select: {
          id: true,
        },
      });

      const foundVisitIds = new Set(existingVisitRecords.map((v) => v.id));
      const invalidVisitIds = visitIdsToUpdate.filter((vid) => !foundVisitIds.has(vid));

      if (invalidVisitIds.length > 0) {
        const errorResponse: ApiErrorResponse = {
          status: 'error',
          error: {
            code: 'VALIDATION_ERROR',
            message: '入力内容に誤りがあります',
            details: invalidVisitIds.map((vid) => ({
              field: 'visit_records.visit_id',
              message: `指定された訪問記録が見つかりません: ${vid}`,
            })),
          },
        };
        return NextResponse.json(errorResponse, { status: 400 });
      }
    }

    // ステータスマップ
    const statusMap: Record<string, string> = {
      draft: 'DRAFT',
      submitted: 'SUBMITTED',
    };

    // 日報と訪問記録の更新（トランザクション）
    const updatedReport = await prisma.$transaction(async (tx) => {
      // 日報更新
      const report = await tx.dailyReport.update({
        where: { id },
        data: {
          problem: problem ?? null,
          plan: plan ?? null,
          status: (statusMap[status] as 'DRAFT' | 'SUBMITTED') || 'DRAFT',
          submittedAt:
            status === 'submitted' && existingReport.status !== 'SUBMITTED'
              ? new Date()
              : existingReport.submittedAt,
        },
      });

      // 既存の訪問記録IDを取得
      const existingVisitIds = new Set(existingReport.visitRecords.map((v) => v.id));
      const requestVisitIds = new Set(
        visit_records.filter((r) => r.visit_id).map((r) => r.visit_id!)
      );

      // 削除する訪問記録（リクエストに含まれない既存の記録）
      const visitIdsToDelete = Array.from(existingVisitIds).filter(
        (vid) => !requestVisitIds.has(vid)
      );
      if (visitIdsToDelete.length > 0) {
        await tx.visitRecord.deleteMany({
          where: {
            id: {
              in: visitIdsToDelete,
            },
          },
        });
      }

      // 訪問記録の更新と作成
      for (const record of visit_records) {
        if (record.visit_id) {
          // 既存レコードの更新
          await tx.visitRecord.update({
            where: { id: record.visit_id },
            data: {
              customerId: record.customer_id,
              visitDatetime: new Date(record.visit_datetime),
              visitContent: record.visit_content,
              visitResult: record.visit_result ?? null,
              displayOrder: record.display_order,
            },
          });
        } else {
          // 新規レコードの作成
          await tx.visitRecord.create({
            data: {
              reportId: id,
              customerId: record.customer_id,
              visitDatetime: new Date(record.visit_datetime),
              visitContent: record.visit_content,
              visitResult: record.visit_result ?? null,
              displayOrder: record.display_order,
            },
          });
        }
      }

      return report;
    });

    // レスポンスの構築
    const responseData: ReportUpdateResponse = {
      report_id: updatedReport.id,
      updated_at: updatedReport.updatedAt.toISOString(),
    };

    const successResponse: ApiSuccessResponse<ReportUpdateResponse> = {
      status: 'success',
      data: responseData,
    };

    return NextResponse.json(successResponse, { status: 200 });
  } catch (error) {
    console.error('Report update error:', error);
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
 * 日報削除API
 *
 * DELETE /api/reports/:id
 *
 * 認証済みユーザーのみアクセス可能
 * 営業担当者は自分の日報のみ削除可能
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
    const session = authResult.session;

    const { id } = await params;

    // 日報IDのバリデーション（MongoDB ObjectId）
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      const errorResponse: ApiErrorResponse = {
        status: 'error',
        error: {
          code: 'VALIDATION_ERROR',
          message: '無効な日報IDです',
        },
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // 日報の存在確認
    const existingReport = await prisma.dailyReport.findUnique({
      where: { id },
    });

    if (!existingReport) {
      const errorResponse: ApiErrorResponse = {
        status: 'error',
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: '日報が見つかりません',
        },
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    // 権限チェック: 営業担当者は自分の日報のみ削除可能
    if (existingReport.salesId !== session.salesId) {
      const errorResponse: ApiErrorResponse = {
        status: 'error',
        error: {
          code: 'AUTH_FORBIDDEN',
          message: '権限がありません',
        },
      };
      return NextResponse.json(errorResponse, { status: 403 });
    }

    // 日報の削除（訪問記録とコメントはCascade削除される）
    await prisma.dailyReport.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Report deletion error:', error);
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
