'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Dialog } from '@/components/ui/dialog';
import {
  customerCodeSchema,
  customerNameSchema,
  industrySchema,
  postalCodeSchema,
  addressSchema,
  phoneSchema,
  notesSchema,
  salesIdSchema,
} from '@/lib/validations/customer';
import type { CustomerDetail } from '@/types/customer';
import type { SalesListResponse } from '@/types/sales';
import type { ApiSuccessResponse, ApiErrorResponse } from '@/types/session';

export interface CustomerFormProps {
  /** 編集モード時の顧客情報 */
  customerData?: CustomerDetail;
  /** 編集モードかどうか */
  isEditMode?: boolean;
}

interface FormData {
  customer_code: string;
  customer_name: string;
  industry: string;
  postal_code: string;
  address: string;
  phone: string;
  sales_id: string;
  notes: string;
}

interface FieldError {
  field: string;
  message: string;
}

// 業種の選択肢
const INDUSTRY_OPTIONS = [
  '製造業',
  'IT',
  'サービス',
  '小売',
  '卸売',
  '建設',
  '不動産',
  '金融',
  '医療',
  '教育',
  'その他',
];

/**
 * 顧客マスタ登録・編集フォームコンポーネント
 *
 * 新規登録と編集で共通利用するフォームコンポーネント
 * バリデーション、API連携、エラーハンドリング、削除機能を実装
 */
export function CustomerForm({ customerData, isEditMode = false }: CustomerFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    customer_code: customerData?.customer_code || '',
    customer_name: customerData?.customer_name || '',
    industry: customerData?.industry || '',
    postal_code: customerData?.postal_code || '',
    address: customerData?.address || '',
    phone: customerData?.phone || '',
    sales_id: customerData?.sales.sales_id || '',
    notes: customerData?.notes || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [salesList, setSalesList] = useState<Array<{ sales_id: string; sales_name: string }>>([]);
  const [loadingSales, setLoadingSales] = useState(false);

  // 営業担当者一覧の取得
  useEffect(() => {
    const fetchSalesList = async () => {
      try {
        setLoadingSales(true);
        const response = await fetch('/api/sales?limit=100', {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('営業担当者一覧の取得に失敗しました');
        }

        const result: ApiSuccessResponse<SalesListResponse> = await response.json();
        const sales = result.data.items.map((s) => ({
          sales_id: s.sales_id,
          sales_name: s.sales_name,
        }));
        setSalesList(sales);
      } catch (error) {
        console.error('Failed to fetch sales list:', error);
      } finally {
        setLoadingSales(false);
      }
    };

    fetchSalesList();
  }, []);

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // エラーをクリア
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // 顧客コード（新規登録時のみ）
    if (!isEditMode) {
      const codeResult = customerCodeSchema.safeParse(formData.customer_code);
      if (!codeResult.success) {
        newErrors.customer_code = codeResult.error.issues[0].message;
      }
    }

    // 顧客名
    const nameResult = customerNameSchema.safeParse(formData.customer_name);
    if (!nameResult.success) {
      newErrors.customer_name = nameResult.error.issues[0].message;
    }

    // 業種（任意）
    if (formData.industry) {
      const industryResult = industrySchema.safeParse(formData.industry);
      if (!industryResult.success) {
        newErrors.industry = industryResult.error.issues[0].message;
      }
    }

    // 郵便番号（任意だが、入力された場合は形式チェック）
    if (formData.postal_code) {
      const postalResult = postalCodeSchema.safeParse(formData.postal_code);
      if (!postalResult.success) {
        newErrors.postal_code = postalResult.error.issues[0].message;
      }
    }

    // 住所（任意）
    if (formData.address) {
      const addressResult = addressSchema.safeParse(formData.address);
      if (!addressResult.success) {
        newErrors.address = addressResult.error.issues[0].message;
      }
    }

    // 電話番号（任意だが、入力された場合は形式チェック）
    if (formData.phone) {
      const phoneResult = phoneSchema.safeParse(formData.phone);
      if (!phoneResult.success) {
        newErrors.phone = phoneResult.error.issues[0].message;
      }
    }

    // 担当営業（必須）
    if (!formData.sales_id) {
      newErrors.sales_id = '担当営業は必須です';
    } else {
      const salesIdResult = salesIdSchema.safeParse(formData.sales_id);
      if (!salesIdResult.success) {
        newErrors.sales_id = salesIdResult.error.issues[0].message;
      }
    }

    // 備考（任意）
    if (formData.notes) {
      const notesResult = notesSchema.safeParse(formData.notes);
      if (!notesResult.success) {
        newErrors.notes = notesResult.error.issues[0].message;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setApiError('');

    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);

      const requestBody: Record<string, unknown> = {
        customer_name: formData.customer_name,
        industry: formData.industry || undefined,
        postal_code: formData.postal_code || undefined,
        address: formData.address || undefined,
        phone: formData.phone || undefined,
        sales_id: formData.sales_id,
        notes: formData.notes || undefined,
      };

      if (!isEditMode) {
        requestBody.customer_code = formData.customer_code;
      }

      const url = isEditMode ? `/api/customers/${customerData?.customer_id}` : '/api/customers';
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData: ApiErrorResponse = await response.json();

        // フィールド別のエラーがある場合
        if (errorData.error.details && errorData.error.details.length > 0) {
          const fieldErrors: Record<string, string> = {};
          errorData.error.details.forEach((err: FieldError) => {
            fieldErrors[err.field] = err.message;
          });
          setErrors(fieldErrors);
        }

        setApiError(errorData.error.message || '保存に失敗しました');
        return;
      }

      // 成功時は一覧画面に戻る
      router.push('/customers');
      router.refresh();
    } catch (error) {
      console.error('Save error:', error);
      setApiError('サーバーエラーが発生しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!customerData?.customer_id) return;

    try {
      setIsDeleting(true);
      setApiError('');

      const response = await fetch(`/api/customers/${customerData.customer_id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData: ApiErrorResponse = await response.json();
        setApiError(errorData.error.message || '削除に失敗しました');
        setShowDeleteDialog(false);
        return;
      }

      // 成功時は一覧画面に戻る
      router.push('/customers');
      router.refresh();
    } catch (error) {
      console.error('Delete error:', error);
      setApiError('サーバーエラーが発生しました');
      setShowDeleteDialog(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>{isEditMode ? '顧客マスタ編集' : '顧客マスタ新規登録'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* APIエラー表示 */}
            {apiError && (
              <Alert variant="danger">
                <AlertDescription>{apiError}</AlertDescription>
              </Alert>
            )}

            {/* 顧客コード（新規登録時のみ入力可） */}
            <div className="space-y-2">
              <Label htmlFor="customer_code" required>
                顧客コード
              </Label>
              <Input
                id="customer_code"
                type="text"
                value={formData.customer_code}
                onChange={(e) => handleChange('customer_code', e.target.value)}
                error={!!errors.customer_code}
                disabled={isEditMode}
                placeholder="半角英数字で入力（最大20文字）"
              />
              {errors.customer_code && (
                <p className="text-sm text-red-600">{errors.customer_code}</p>
              )}
            </div>

            {/* 顧客名 */}
            <div className="space-y-2">
              <Label htmlFor="customer_name" required>
                顧客名
              </Label>
              <Input
                id="customer_name"
                type="text"
                value={formData.customer_name}
                onChange={(e) => handleChange('customer_name', e.target.value)}
                error={!!errors.customer_name}
                placeholder="最大100文字"
              />
              {errors.customer_name && (
                <p className="text-sm text-red-600">{errors.customer_name}</p>
              )}
            </div>

            {/* 業種 */}
            <div className="space-y-2">
              <Label htmlFor="industry">業種</Label>
              <Select
                id="industry"
                value={formData.industry}
                onChange={(e) => handleChange('industry', e.target.value)}
                error={!!errors.industry}
              >
                <option value="">選択してください（任意）</option>
                {INDUSTRY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
              {errors.industry && <p className="text-sm text-red-600">{errors.industry}</p>}
            </div>

            {/* 郵便番号 */}
            <div className="space-y-2">
              <Label htmlFor="postal_code">郵便番号</Label>
              <Input
                id="postal_code"
                type="text"
                value={formData.postal_code}
                onChange={(e) => handleChange('postal_code', e.target.value)}
                error={!!errors.postal_code}
                placeholder="XXX-XXXX形式で入力"
              />
              {errors.postal_code && <p className="text-sm text-red-600">{errors.postal_code}</p>}
            </div>

            {/* 住所 */}
            <div className="space-y-2">
              <Label htmlFor="address">住所</Label>
              <Input
                id="address"
                type="text"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                error={!!errors.address}
                placeholder="最大200文字"
              />
              {errors.address && <p className="text-sm text-red-600">{errors.address}</p>}
            </div>

            {/* 電話番号 */}
            <div className="space-y-2">
              <Label htmlFor="phone">電話番号</Label>
              <Input
                id="phone"
                type="text"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                error={!!errors.phone}
                placeholder="03-1234-5678形式で入力"
              />
              {errors.phone && <p className="text-sm text-red-600">{errors.phone}</p>}
            </div>

            {/* 担当営業 */}
            <div className="space-y-2">
              <Label htmlFor="sales_id" required>
                担当営業
              </Label>
              <Select
                id="sales_id"
                value={formData.sales_id}
                onChange={(e) => handleChange('sales_id', e.target.value)}
                error={!!errors.sales_id}
                disabled={loadingSales}
              >
                <option value="">選択してください</option>
                {salesList.map((sales) => (
                  <option key={sales.sales_id} value={sales.sales_id}>
                    {sales.sales_name}
                  </option>
                ))}
              </Select>
              {errors.sales_id && <p className="text-sm text-red-600">{errors.sales_id}</p>}
            </div>

            {/* 備考 */}
            <div className="space-y-2">
              <Label htmlFor="notes">備考</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                error={!!errors.notes}
                placeholder="最大500文字"
                rows={4}
              />
              {errors.notes && <p className="text-sm text-red-600">{errors.notes}</p>}
            </div>
          </CardContent>
        </Card>

        {/* フッターボタン */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-between">
          <div className="flex gap-3">
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  保存中...
                </>
              ) : (
                '保存'
              )}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push('/customers')}
              disabled={isSubmitting || isDeleting}
            >
              キャンセル
            </Button>
          </div>
          {isEditMode && (
            <Button
              type="button"
              variant="danger"
              onClick={() => setShowDeleteDialog(true)}
              disabled={isSubmitting || isDeleting}
            >
              削除
            </Button>
          )}
        </div>
      </form>

      {/* 削除確認ダイアログ */}
      <Dialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        title="顧客の削除"
        description={`${customerData?.customer_name}（${customerData?.customer_code}）を削除してもよろしいですか？この操作は取り消せません。`}
        variant="danger"
        confirmLabel="削除"
        cancelLabel="キャンセル"
        onConfirm={handleDelete}
        confirmDisabled={isDeleting}
      />
    </>
  );
}
