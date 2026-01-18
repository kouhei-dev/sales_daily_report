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
import { Badge } from '@/components/ui/badge';
import type { SalesDetail } from '@/types/sales';

interface SalesTableProps {
  salesList: SalesDetail[];
}

/**
 * 営業一覧テーブルコンポーネント
 *
 * 表示項目:
 * - 営業コード
 * - 営業担当者名
 * - 所属部署
 * - 上長
 * - 管理者フラグ
 * - 操作ボタン（詳細・編集）
 */
export function SalesTable({ salesList }: SalesTableProps) {
  if (salesList.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <p className="text-gray-500">検索条件に一致する営業担当者が見つかりませんでした。</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>営業コード</TableHead>
            <TableHead>営業担当者名</TableHead>
            <TableHead>所属部署</TableHead>
            <TableHead>上長</TableHead>
            <TableHead className="text-center">管理者</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {salesList.map((sales) => (
            <TableRow key={sales.sales_id}>
              <TableCell className="font-medium">{sales.sales_code}</TableCell>
              <TableCell>{sales.sales_name}</TableCell>
              <TableCell>{sales.department}</TableCell>
              <TableCell>{sales.manager ? sales.manager.sales_name : '-'}</TableCell>
              <TableCell className="text-center">
                {sales.is_manager ? (
                  <Badge variant="default">○</Badge>
                ) : (
                  <span className="text-gray-400">－</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Link href={`/sales/${sales.sales_id}`}>
                    <Button variant="outline" size="sm">
                      詳細
                    </Button>
                  </Link>
                  <Link href={`/sales/${sales.sales_id}/edit`}>
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
