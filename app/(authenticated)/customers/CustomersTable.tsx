'use client';

import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import type { CustomerBasic } from '@/types/customer';

interface CustomersTableProps {
  customersList: CustomerBasic[];
}

/**
 * 顧客一覧テーブルコンポーネント
 *
 * 表示項目:
 * - 顧客コード
 * - 顧客名
 * - 業種
 * - 担当営業
 * - 電話番号
 * - 操作ボタン（詳細・編集）
 */
export function CustomersTable({ customersList }: CustomersTableProps) {
  if (customersList.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <p className="text-gray-500">検索条件に一致する顧客が見つかりませんでした。</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>顧客コード</TableHead>
            <TableHead>顧客名</TableHead>
            <TableHead>業種</TableHead>
            <TableHead>担当営業</TableHead>
            <TableHead>電話番号</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customersList.map((customer) => (
            <TableRow key={customer.customer_id}>
              <TableCell className="font-medium">{customer.customer_code}</TableCell>
              <TableCell>{customer.customer_name}</TableCell>
              <TableCell>{customer.industry || '-'}</TableCell>
              <TableCell>{customer.sales.sales_name}</TableCell>
              <TableCell>{customer.phone || '-'}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Link href={`/customers/${customer.customer_id}`}>
                    <Button variant="outline" size="sm">
                      詳細
                    </Button>
                  </Link>
                  <Link href={`/customers/${customer.customer_id}/edit`}>
                    <Button variant="primary" size="sm">
                      編集
                    </Button>
                  </Link>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
