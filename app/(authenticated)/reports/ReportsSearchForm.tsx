'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';

interface ReportsSearchFormProps {
  salesList: Array<{ sales_id: string; sales_name: string }>;
  currentUserSalesId: string;
  isManager: boolean;
}

/**
 * 日報検索フォームコンポーネント
 *
 * 検索条件:
 * - 対象期間（開始）: デフォルト当月1日
 * - 対象期間（終了）: デフォルト当日
 * - 営業担当者（プルダウン）: 管理者は全員表示可、営業は自分のみ
 * - ステータス（プルダウン）: 全て/下書き/提出済み/コメント済み
 * - 未確認コメント（チェックボックス）: ONで未確認コメントがある日報のみ表示
 */
export function ReportsSearchForm({
  salesList,
  currentUserSalesId,
  isManager,
}: ReportsSearchFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 当月1日と当日をデフォルト値として計算
  const getDefaultStartDate = () => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    return firstDay.toISOString().split('T')[0];
  };

  const getDefaultEndDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const [startDate, setStartDate] = useState(
    searchParams.get('start_date') || getDefaultStartDate()
  );
  const [endDate, setEndDate] = useState(searchParams.get('end_date') || getDefaultEndDate());
  const [salesId, setSalesId] = useState(searchParams.get('sales_id') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [hasUnreadComments, setHasUnreadComments] = useState(
    searchParams.get('has_unread_comments') === 'true'
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    // URLSearchParamsの構築
    const params = new URLSearchParams();

    if (startDate) {
      params.set('start_date', startDate);
    }
    if (endDate) {
      params.set('end_date', endDate);
    }
    if (salesId) {
      params.set('sales_id', salesId);
    }
    if (status) {
      params.set('status', status);
    }
    if (hasUnreadComments) {
      params.set('has_unread_comments', 'true');
    }

    // ページは1に戻す
    params.set('page', '1');

    router.push(`/reports?${params.toString()}`);
  };

  const handleReset = () => {
    setStartDate(getDefaultStartDate());
    setEndDate(getDefaultEndDate());
    setSalesId('');
    setStatus('');
    setHasUnreadComments(false);
    router.push('/reports');
  };

  // 営業担当者の選択肢を生成
  // 営業担当者の場合は自分のみ、管理者の場合は全員
  const salesOptions = isManager
    ? salesList
    : salesList.filter((sales) => sales.sales_id === currentUserSalesId);

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* 対象期間（開始） */}
            <div className="space-y-2">
              <Label htmlFor="startDate">対象期間（開始）</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            {/* 対象期間（終了） */}
            <div className="space-y-2">
              <Label htmlFor="endDate">対象期間（終了）</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            {/* 営業担当者 */}
            <div className="space-y-2">
              <Label htmlFor="salesId">営業担当者</Label>
              <Select
                id="salesId"
                value={salesId}
                onChange={(e) => setSalesId(e.target.value)}
                disabled={!isManager}
              >
                <option value="">全て</option>
                {salesOptions.map((sales) => (
                  <option key={sales.sales_id} value={sales.sales_id}>
                    {sales.sales_name}
                  </option>
                ))}
              </Select>
            </div>

            {/* ステータス */}
            <div className="space-y-2">
              <Label htmlFor="status">ステータス</Label>
              <Select id="status" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">全て</option>
                <option value="draft">下書き</option>
                <option value="submitted">提出済み</option>
                <option value="commented">コメント済み</option>
              </Select>
            </div>

            {/* 未確認コメント */}
            <div className="space-y-2">
              <Label htmlFor="hasUnreadComments">表示フィルタ</Label>
              <div className="pt-2">
                <Checkbox
                  id="hasUnreadComments"
                  label="未確認コメントのみ表示"
                  checked={hasUnreadComments}
                  onChange={(e) => setHasUnreadComments(e.target.checked)}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit" variant="primary">
              検索
            </Button>
            <Button type="button" variant="outline" onClick={handleReset}>
              クリア
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
