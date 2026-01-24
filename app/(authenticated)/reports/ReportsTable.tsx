'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { ReportListItem } from '@/types/report';
import { MessageSquare } from 'lucide-react';

interface ReportsTableProps {
  reportsList: ReportListItem[];
  currentUserSalesId: string;
}

/**
 * 日報一覧テーブルコンポーネント
 *
 * 表示項目:
 * - 日報日付（YYYY/MM/DD形式）
 * - 営業担当者
 * - 訪問件数
 * - ステータス（下書き/提出済み/コメント済み）
 * - コメント（アイコン表示）
 * - 未確認（未確認コメントがある場合、バッジで件数表示）
 * - 操作（詳細ボタン、編集ボタン（自分の日報のみ））
 */
export function ReportsTable({ reportsList, currentUserSalesId }: ReportsTableProps) {
  if (reportsList.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <p className="text-gray-500">該当する日報が見つかりませんでした。</p>
      </div>
    );
  }

  // ステータスの日本語表記とバッジvariantのマッピング
  const statusConfig: Record<
    'draft' | 'submitted' | 'commented',
    { label: string; variant: 'default' | 'primary' | 'success' }
  > = {
    draft: { label: '下書き', variant: 'default' },
    submitted: { label: '提出済み', variant: 'primary' },
    commented: { label: 'コメント済み', variant: 'success' },
  };

  // 日付を YYYY/MM/DD 形式にフォーマット
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* デスクトップ表示 */}
      <div className="hidden md:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">日報日付</TableHead>
              <TableHead className="w-[150px]">営業担当者</TableHead>
              <TableHead className="w-[100px] text-center">訪問件数</TableHead>
              <TableHead className="w-[120px]">ステータス</TableHead>
              <TableHead className="w-[80px] text-center">コメント</TableHead>
              <TableHead className="w-[120px] text-center">未確認</TableHead>
              <TableHead className="w-[180px] text-center">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reportsList.map((report) => {
              const isOwnReport = report.sales.sales_id === currentUserSalesId;
              const config = statusConfig[report.status];

              return (
                <TableRow key={report.report_id}>
                  {/* 日報日付 */}
                  <TableCell className="font-medium">{formatDate(report.report_date)}</TableCell>

                  {/* 営業担当者 */}
                  <TableCell>{report.sales.sales_name}</TableCell>

                  {/* 訪問件数 */}
                  <TableCell className="text-center">{report.visit_count}件</TableCell>

                  {/* ステータス */}
                  <TableCell>
                    <Badge variant={config.variant}>{config.label}</Badge>
                  </TableCell>

                  {/* コメント */}
                  <TableCell className="text-center">
                    {report.has_comments && (
                      <MessageSquare className="inline-block h-5 w-5 text-blue-600" />
                    )}
                  </TableCell>

                  {/* 未確認 */}
                  <TableCell className="text-center">
                    {report.unread_comment_count > 0 && (
                      <Badge variant="warning">NEW {report.unread_comment_count}件</Badge>
                    )}
                  </TableCell>

                  {/* 操作 */}
                  <TableCell>
                    <div className="flex justify-center gap-2">
                      <Link href={`/reports/${report.report_id}`}>
                        <Button variant="outline" size="sm">
                          詳細
                        </Button>
                      </Link>
                      {isOwnReport && (
                        <Link href={`/reports/${report.report_id}/edit`}>
                          <Button variant="primary" size="sm">
                            編集
                          </Button>
                        </Link>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* モバイル表示 */}
      <div className="md:hidden divide-y divide-gray-200">
        {reportsList.map((report) => {
          const isOwnReport = report.sales.sales_id === currentUserSalesId;
          const config = statusConfig[report.status];

          return (
            <div key={report.report_id} className="p-4 space-y-3">
              {/* 日付とステータス */}
              <div className="flex items-center justify-between">
                <div className="font-medium text-gray-900">{formatDate(report.report_date)}</div>
                <Badge variant={config.variant}>{config.label}</Badge>
              </div>

              {/* 営業担当者 */}
              <div className="text-sm text-gray-600">
                <span className="font-medium">担当:</span> {report.sales.sales_name}
              </div>

              {/* 訪問件数 */}
              <div className="text-sm text-gray-600">
                <span className="font-medium">訪問件数:</span> {report.visit_count}件
              </div>

              {/* コメントと未確認 */}
              <div className="flex items-center gap-3 text-sm">
                {report.has_comments && (
                  <div className="flex items-center gap-1 text-blue-600">
                    <MessageSquare className="h-4 w-4" />
                    <span>コメントあり</span>
                  </div>
                )}
                {report.unread_comment_count > 0 && (
                  <Badge variant="warning">NEW {report.unread_comment_count}件</Badge>
                )}
              </div>

              {/* 操作ボタン */}
              <div className="flex gap-2 pt-2">
                <Link href={`/reports/${report.report_id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    詳細
                  </Button>
                </Link>
                {isOwnReport && (
                  <Link href={`/reports/${report.report_id}/edit`} className="flex-1">
                    <Button variant="primary" size="sm" className="w-full">
                      編集
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
