import { redirect, notFound } from 'next/navigation';
import { getSession, isSessionValid } from '@/lib/session';
import { CustomerForm } from '../../CustomerForm';
import type { CustomerDetailResponse } from '@/types/customer';

/**
 * 顧客マスタ編集画面（S07-編集）
 *
 * 営業担当者・管理者がアクセス可能
 * 既存の顧客情報を編集・削除する
 *
 * 機能:
 * - 既存データの取得と表示（顧客コードは変更不可）
 * - 顧客名、業種、郵便番号、住所、電話番号、担当営業、備考の編集
 * - クライアントサイドバリデーション
 * - API連携（PUT /api/customers/:id、DELETE /api/customers/:id）
 * - エラーハンドリング
 */
export default async function CustomerEditPage({ params }: { params: Promise<{ id: string }> }) {
  // セッション検証
  const session = await getSession();

  if (!isSessionValid(session)) {
    redirect('/login');
  }

  const { id } = await params;

  // 顧客IDのバリデーション（MongoDB ObjectId）
  if (!/^[0-9a-fA-F]{24}$/.test(id)) {
    redirect('/customers');
  }

  // 顧客データの取得（サーバーサイドで直接Prismaを使用）
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();

  let customer;
  try {
    customer = await prisma.customer.findUnique({
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
  } catch (error) {
    console.error('Failed to fetch customer data:', error);
    await prisma.$disconnect();
    // エラー時はリダイレクト
    redirect('/customers');
  }

  await prisma.$disconnect();

  if (!customer) {
    notFound();
  }

  // レスポンスの構築
  const customerData: CustomerDetailResponse = {
    customer_id: customer.id,
    customer_code: customer.customerCode,
    customer_name: customer.customerName,
    industry: customer.industry || undefined,
    postal_code: customer.postalCode || undefined,
    address: customer.address || undefined,
    phone: customer.phone || undefined,
    sales: {
      sales_id: customer.sales.id,
      sales_name: customer.sales.salesName,
      department: customer.sales.department.departmentName,
    },
    notes: customer.notes || undefined,
    created_at: customer.createdAt.toISOString(),
    updated_at: customer.updatedAt.toISOString(),
  };

  return (
    <div className="space-y-6">
      {/* パンくずリスト */}
      <nav className="text-sm text-gray-600">
        <ol className="flex items-center space-x-2">
          <li>
            <a href="/customers" className="hover:text-blue-600">
              顧客マスタ一覧
            </a>
          </li>
          <li>/</li>
          <li className="text-gray-900 font-medium">
            {customerData.customer_name}（{customerData.customer_code}）の編集
          </li>
        </ol>
      </nav>

      {/* フォーム */}
      <CustomerForm customerData={customerData} isEditMode={true} />
    </div>
  );
}
