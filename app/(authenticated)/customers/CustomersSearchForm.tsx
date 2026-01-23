'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

interface CustomersSearchFormProps {
  salesList: string[];
}

/**
 * 顧客マスタ検索フォームコンポーネント
 *
 * 検索条件:
 * - 顧客名（部分一致）
 * - 顧客コード（部分一致）
 * - 担当営業（プルダウン）
 */
export function CustomersSearchForm({ salesList }: CustomersSearchFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [customerName, setCustomerName] = useState(searchParams.get('customer_name') || '');
  const [customerCode, setCustomerCode] = useState(searchParams.get('customer_code') || '');
  const [salesName, setSalesName] = useState(searchParams.get('sales_name') || '');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    // URLSearchParamsの構築
    const params = new URLSearchParams();
    if (customerName.trim()) {
      params.set('customer_name', customerName.trim());
    }
    if (customerCode.trim()) {
      params.set('customer_code', customerCode.trim());
    }
    if (salesName) {
      params.set('sales_name', salesName);
    }

    // ページは1に戻す
    params.set('page', '1');

    router.push(`/customers?${params.toString()}`);
  };

  const handleReset = () => {
    setCustomerName('');
    setCustomerCode('');
    setSalesName('');
    router.push('/customers');
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="customerName">顧客名</Label>
              <Input
                id="customerName"
                type="text"
                placeholder="部分一致で検索"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerCode">顧客コード</Label>
              <Input
                id="customerCode"
                type="text"
                placeholder="部分一致で検索"
                value={customerCode}
                onChange={(e) => setCustomerCode(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="salesName">担当営業</Label>
              <Select
                id="salesName"
                value={salesName}
                onChange={(e) => setSalesName(e.target.value)}
              >
                <option value="">全て</option>
                {salesList.map((sales) => (
                  <option key={sales} value={sales}>
                    {sales}
                  </option>
                ))}
              </Select>
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
