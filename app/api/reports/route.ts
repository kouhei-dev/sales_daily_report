import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';
import { requireAuth } from '@/lib/middleware/auth';
import {
  reportListQuerySchema,
  createReportSchema,
  formatZodErrors,
} from '@/lib/validations/report';
import type { ApiSuccessResponse, ApiErrorResponse } from '@/types/session';
import type { ReportListResponse, ReportCreateResponse } from '@/types/report';

const prisma = new PrismaClient();

/**
 * 日報一覧取得API
 *
 * GET /api/reports
 *
 * 認証済みユーザーのみアクセス可能
 * 管理者は全員分、営業担当者は自分の日報のみ取得可能
 * クエリパラメータでフィルタリング・ページネーション可能
 *
 * @param request - Next.js Request オブジェクト
 * @returns 日報一覧とページネーション情報
 */
export async function GET(request: NextRequest) {
  try {
    // 認証チェック
    const authResult = await requireAuth();
    if (authResult.error) {
      return authResult.response;
    }
    const session = authResult.session;

    // クエリパラメータの取得とバリデーション
    const { searchParams } = new URL(request.url);
    const queryParams = {
      start_date: searchParams.get('start_date') || undefined,
      end_date: searchParams.get('end_date') || undefined,
      sales_id: searchParams.get('sales_id') || undefined,
      status: searchParams.get('status') || undefined,
      has_unread_comments: searchParams.get('has_unread_comments') || undefined,
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
    };

    const validationResult = reportListQuerySchema.safeParse(queryParams);
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

    const { start_date, end_date, sales_id, status, has_unread_comments, page, limit } =
      validationResult.data;

    // 権限チェック: 営業担当者は自分の日報のみ、管理者は全員分または指定された営業の日報
    let targetSalesId: string;
    if (session.isManager) {
      // 管理者の場合、sales_idが指定されていればそれを使用、なければ全員分
      if (sales_id) {
        targetSalesId = sales_id;
      } else {
        targetSalesId = ''; // 全員分を取得するための空文字
      }
    } else {
      // 営業担当者の場合、自分の日報のみ
      if (sales_id && sales_id !== session.salesId) {
        const errorResponse: ApiErrorResponse = {
          status: 'error',
          error: {
            code: 'AUTH_FORBIDDEN',
            message: '権限がありません',
          },
        };
        return NextResponse.json(errorResponse, { status: 403 });
      }
      targetSalesId = session.salesId;
    }

    // フィルタ条件の構築
    const where: Prisma.DailyReportWhereInput = {};

    // 営業IDフィルタ
    if (targetSalesId) {
      where.salesId = targetSalesId;
    }

    // 日付範囲フィルタ
    if (start_date || end_date) {
      where.reportDate = {};
      if (start_date) {
        where.reportDate.gte = new Date(start_date);
      }
      if (end_date) {
        // end_dateは当日の23:59:59まで含める
        const endDateTime = new Date(end_date);
        endDateTime.setHours(23, 59, 59, 999);
        where.reportDate.lte = endDateTime;
      }
    }

    // ステータスフィルタ
    if (status) {
      const statusMap: Record<string, 'DRAFT' | 'SUBMITTED' | 'COMMENTED'> = {
        draft: 'DRAFT',
        submitted: 'SUBMITTED',
        commented: 'COMMENTED',
      };
      where.status = statusMap[status];
    }

    // 総件数の取得
    const totalItems = await prisma.dailyReport.count({ where });

    // ページネーション計算
    const totalPages = Math.ceil(totalItems / limit);
    const skip = (page - 1) * limit;

    // データ取得
    let reportList = await prisma.dailyReport.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        reportDate: 'desc',
      },
      include: {
        sales: {
          select: {
            id: true,
            salesName: true,
          },
        },
        visitRecords: {
          select: {
            id: true,
          },
        },
        comments: {
          select: {
            id: true,
            isRead: true,
            dailyReport: {
              select: {
                salesId: true,
              },
            },
          },
        },
      },
    });

    // 未読コメントフィルタを適用（データ取得後にフィルタ）
    if (has_unread_comments !== undefined) {
      reportList = reportList.filter((report) => {
        const unreadCount = report.comments.filter(
          (comment) => !comment.isRead && comment.dailyReport.salesId === report.salesId
        ).length;
        return has_unread_comments ? unreadCount > 0 : unreadCount === 0;
      });
    }

    // レスポンスの構築
    const responseData: ReportListResponse = {
      items: reportList.map((report) => {
        const hasComments = report.comments.length > 0;
        const unreadCommentCount = report.comments.filter(
          (comment) => !comment.isRead && comment.dailyReport.salesId === report.salesId
        ).length;

        const statusMap: Record<string, 'draft' | 'submitted' | 'commented'> = {
          DRAFT: 'draft',
          SUBMITTED: 'submitted',
          COMMENTED: 'commented',
        };

        return {
          report_id: report.id,
          report_date: report.reportDate.toISOString().split('T')[0],
          sales: {
            sales_id: report.sales.id,
            sales_name: report.sales.salesName,
          },
          visit_count: report.visitRecords.length,
          status: statusMap[report.status] || 'draft',
          has_comments: hasComments,
          unread_comment_count: unreadCommentCount,
          submitted_at: report.submittedAt?.toISOString(),
          created_at: report.createdAt.toISOString(),
          updated_at: report.updatedAt.toISOString(),
        };
      }),
      pagination: {
        current_page: page,
        total_pages: totalPages,
        total_items: totalItems,
        limit,
      },
    };

    const successResponse: ApiSuccessResponse<ReportListResponse> = {
      status: 'success',
      data: responseData,
    };

    return NextResponse.json(successResponse, { status: 200 });
  } catch (error) {
    console.error('Report list retrieval error:', error);
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
 * 日報作成API
 *
 * POST /api/reports
 *
 * 認証済みユーザーのみアクセス可能
 * 営業ID×日付でユニークチェックを実施
 * 訪問記録も同時に作成
 *
 * @param request - Next.js Request オブジェクト
 * @returns 作成された日報情報
 */
export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const authResult = await requireAuth();
    if (authResult.error) {
      return authResult.response;
    }
    const session = authResult.session;

    // リクエストボディの取得
    const body = await request.json();

    // バリデーション
    const validationResult = createReportSchema.safeParse(body);
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

    const { report_date, problem, plan, status, visit_records } = validationResult.data;

    // 日付の重複チェック（営業ID×日付でユニーク）
    const reportDate = new Date(report_date);
    const existingReport = await prisma.dailyReport.findFirst({
      where: {
        salesId: session.salesId,
        reportDate: reportDate,
      },
    });

    if (existingReport) {
      const errorResponse: ApiErrorResponse = {
        status: 'error',
        error: {
          code: 'RESOURCE_CONFLICT',
          message: 'この日付の日報は既に存在します',
        },
      };
      return NextResponse.json(errorResponse, { status: 409 });
    }

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

    // ステータスマップ
    const statusMap: Record<string, string> = {
      draft: 'DRAFT',
      submitted: 'SUBMITTED',
    };

    // 日報と訪問記録の作成（トランザクション）
    const newReport = await prisma.$transaction(async (tx) => {
      // 日報作成
      const report = await tx.dailyReport.create({
        data: {
          salesId: session.salesId,
          reportDate: reportDate,
          problem: problem ?? null,
          plan: plan ?? null,
          status: (statusMap[status] as 'DRAFT' | 'SUBMITTED') || 'DRAFT',
          submittedAt: status === 'submitted' ? new Date() : null,
        },
      });

      // 訪問記録作成
      await tx.visitRecord.createMany({
        data: visit_records.map((record) => ({
          reportId: report.id,
          customerId: record.customer_id,
          visitDatetime: new Date(record.visit_datetime),
          visitContent: record.visit_content,
          visitResult: record.visit_result ?? null,
          displayOrder: record.display_order,
        })),
      });

      return report;
    });

    // レスポンスの構築
    const responseData: ReportCreateResponse = {
      report_id: newReport.id,
      report_date: newReport.reportDate.toISOString().split('T')[0],
      status: status,
      created_at: newReport.createdAt.toISOString(),
    };

    const successResponse: ApiSuccessResponse<ReportCreateResponse> = {
      status: 'success',
      data: responseData,
    };

    return NextResponse.json(successResponse, { status: 201 });
  } catch (error) {
    console.error('Report creation error:', error);
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
