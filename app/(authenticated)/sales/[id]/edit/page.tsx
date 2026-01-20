import { redirect, notFound } from 'next/navigation';
import { getSession, isSessionValid } from '@/lib/session';
import { SalesForm } from '../../SalesForm';
import type { SalesDetailResponse } from '@/types/sales';

/**
 * 営業マスタ編集画面（S09-編集）
 *
 * 管理者のみアクセス可能
 * 既存の営業担当者情報を編集・削除する
 *
 * 機能:
 * - 既存データの取得と表示（営業コードは変更不可）
 * - 営業担当者名、メールアドレス、パスワード（任意）、所属部署、上長、管理者権限の編集
 * - クライアントサイドバリデーション
 * - API連携（PUT /api/sales/:id、DELETE /api/sales/:id）
 * - エラーハンドリング
 */
export default async function SalesEditPage({ params }: { params: Promise<{ id: string }> }) {
  // セッション検証
  const session = await getSession();

  if (!isSessionValid(session)) {
    redirect('/login');
  }

  // 管理者権限チェック
  if (!session.isManager) {
    redirect('/');
  }

  const { id } = await params;

  // 営業IDのバリデーション（MongoDB ObjectId）
  if (!/^[0-9a-fA-F]{24}$/.test(id)) {
    redirect('/sales');
  }

  // 営業データの取得（サーバーサイドで直接Prismaを使用）
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();

  let sales;
  try {
    sales = await prisma.sales.findUnique({
      where: { id },
      include: {
        manager: {
          select: {
            id: true,
            salesName: true,
          },
        },
        department: {
          select: {
            departmentName: true,
          },
        },
      },
    });
  } catch (error) {
    console.error('Failed to fetch sales data:', error);
    await prisma.$disconnect();
    // エラー時はリダイレクト
    redirect('/sales');
  }

  await prisma.$disconnect();

  if (!sales) {
    notFound();
  }

  // レスポンスの構築
  const salesData: SalesDetailResponse = {
    sales_id: sales.id,
    sales_code: sales.salesCode,
    sales_name: sales.salesName,
    email: sales.email,
    department: sales.department.departmentName,
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

  return (
    <div className="space-y-6">
      {/* パンくずリスト */}
      <nav className="text-sm text-gray-600">
        <ol className="flex items-center space-x-2">
          <li>
            <a href="/sales" className="hover:text-blue-600">
              営業マスタ一覧
            </a>
          </li>
          <li>/</li>
          <li className="text-gray-900 font-medium">
            {salesData.sales_name}（{salesData.sales_code}）の編集
          </li>
        </ol>
      </nav>

      {/* フォーム */}
      <SalesForm salesData={salesData} isEditMode={true} />
    </div>
  );
}
