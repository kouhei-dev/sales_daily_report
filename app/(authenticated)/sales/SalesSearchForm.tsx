'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

interface SalesSearchFormProps {
  departments: string[];
}

/**
 * 営業マスタ検索フォームコンポーネント
 *
 * 検索条件:
 * - 営業担当者名（部分一致）
 * - 営業コード（部分一致）
 * - 所属部署（プルダウン）
 */
export function SalesSearchForm({ departments }: SalesSearchFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [salesName, setSalesName] = useState(searchParams.get('sales_name') || '');
  const [salesCode, setSalesCode] = useState(searchParams.get('sales_code') || '');
  const [department, setDepartment] = useState(searchParams.get('department') || '');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    // URLSearchParamsの構築
    const params = new URLSearchParams();
    if (salesName.trim()) {
      params.set('sales_name', salesName.trim());
    }
    if (salesCode.trim()) {
      params.set('sales_code', salesCode.trim());
    }
    if (department) {
      params.set('department', department);
    }

    // ページは1に戻す
    params.set('page', '1');

    router.push(`/sales?${params.toString()}`);
  };

  const handleReset = () => {
    setSalesName('');
    setSalesCode('');
    setDepartment('');
    router.push('/sales');
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="salesName">営業担当者名</Label>
              <Input
                id="salesName"
                type="text"
                placeholder="部分一致で検索"
                value={salesName}
                onChange={(e) => setSalesName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="salesCode">営業コード</Label>
              <Input
                id="salesCode"
                type="text"
                placeholder="部分一致で検索"
                value={salesCode}
                onChange={(e) => setSalesCode(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">所属部署</Label>
              <Select
                id="department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              >
                <option value="">全て</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
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
