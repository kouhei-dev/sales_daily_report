'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Dialog } from '@/components/ui/dialog';
import {
  salesCodeSchema,
  salesNameSchema,
  emailSchema,
  passwordSchema,
  departmentSchema,
  salesIdSchema,
} from '@/lib/validations/sales';
import type { SalesDetail } from '@/types/sales';
import type { ApiSuccessResponse, ApiErrorResponse } from '@/types/session';

// 所属部署の定数（将来的には部署マスタAPIから取得予定）
const DEPARTMENTS = ['営業1課', '営業2課', '営業3課', '営業4課'];

export interface SalesFormProps {
  /** 編集モード時の営業情報 */
  salesData?: SalesDetail;
  /** 編集モードかどうか */
  isEditMode?: boolean;
}

interface FormData {
  sales_code: string;
  sales_name: string;
  email: string;
  password: string;
  password_confirm: string;
  department: string;
  manager_id: string;
  is_manager: boolean;
}

interface FieldError {
  field: string;
  message: string;
}

/**
 * 営業マスタ登録・編集フォームコンポーネント
 *
 * 新規登録と編集で共通利用するフォームコンポーネント
 * バリデーション、API連携、エラーハンドリングを実装
 */
export function SalesForm({ salesData, isEditMode = false }: SalesFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    sales_code: salesData?.sales_code || '',
    sales_name: salesData?.sales_name || '',
    email: salesData?.email || '',
    password: '',
    password_confirm: '',
    department: salesData?.department || '',
    manager_id: salesData?.manager?.sales_id || '',
    is_manager: salesData?.is_manager || false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [managerList, setManagerList] = useState<Array<{ sales_id: string; sales_name: string }>>(
    []
  );
  const [loadingManagers, setLoadingManagers] = useState(false);

  // 管理者一覧の取得
  useEffect(() => {
    const fetchManagers = async () => {
      try {
        setLoadingManagers(true);
        // 管理者のみを取得（簡易的にページサイズを大きくして取得）
        const response = await fetch('/api/sales?limit=100', {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('管理者一覧の取得に失敗しました');
        }

        const result: ApiSuccessResponse<{ items: SalesDetail[] }> = await response.json();
        // 管理者のみフィルタリング
        const managers = result.data.items
          .filter((s) => s.is_manager)
          .map((s) => ({
            sales_id: s.sales_id,
            sales_name: s.sales_name,
          }));
        setManagerList(managers);
      } catch (error) {
        console.error('Failed to fetch managers:', error);
      } finally {
        setLoadingManagers(false);
      }
    };

    fetchManagers();
  }, []);

  const handleChange = (field: keyof FormData, value: string | boolean) => {
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

    // 営業コード（新規登録時のみ）
    if (!isEditMode) {
      const codeResult = salesCodeSchema.safeParse(formData.sales_code);
      if (!codeResult.success) {
        newErrors.sales_code = codeResult.error.issues[0].message;
      }
    }

    // 営業担当者名
    const nameResult = salesNameSchema.safeParse(formData.sales_name);
    if (!nameResult.success) {
      newErrors.sales_name = nameResult.error.issues[0].message;
    }

    // メールアドレス
    const emailResult = emailSchema.safeParse(formData.email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.issues[0].message;
    }

    // パスワード（新規登録時は必須、編集時は入力された場合のみ）
    if (!isEditMode) {
      if (!formData.password) {
        newErrors.password = 'パスワードは必須です';
      } else {
        const passwordResult = passwordSchema.safeParse(formData.password);
        if (!passwordResult.success) {
          newErrors.password = passwordResult.error.issues[0].message;
        }
      }
    } else if (formData.password) {
      const passwordResult = passwordSchema.safeParse(formData.password);
      if (!passwordResult.success) {
        newErrors.password = passwordResult.error.issues[0].message;
      }
    }

    // パスワード確認
    if (formData.password || formData.password_confirm) {
      if (formData.password !== formData.password_confirm) {
        newErrors.password_confirm = 'パスワードが一致しません';
      }
    }

    // 所属部署
    const deptResult = departmentSchema.safeParse(formData.department);
    if (!deptResult.success) {
      newErrors.department = deptResult.error.issues[0].message;
    }

    // 上長ID（任意だが、指定された場合はバリデーション）
    if (formData.manager_id) {
      const managerResult = salesIdSchema.safeParse(formData.manager_id);
      if (!managerResult.success) {
        newErrors.manager_id = managerResult.error.issues[0].message;
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
        sales_name: formData.sales_name,
        email: formData.email,
        department: formData.department,
        manager_id: formData.manager_id || undefined,
        is_manager: formData.is_manager,
      };

      if (!isEditMode) {
        requestBody.sales_code = formData.sales_code;
        requestBody.password = formData.password;
      } else if (formData.password) {
        requestBody.password = formData.password;
      }

      const url = isEditMode ? `/api/sales/${salesData?.sales_id}` : '/api/sales';
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
      router.push('/sales');
      router.refresh();
    } catch (error) {
      console.error('Save error:', error);
      setApiError('サーバーエラーが発生しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!salesData?.sales_id) return;

    try {
      setIsDeleting(true);
      setApiError('');

      const response = await fetch(`/api/sales/${salesData.sales_id}`, {
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
      router.push('/sales');
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
            <CardTitle>{isEditMode ? '営業マスタ編集' : '営業マスタ新規登録'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* APIエラー表示 */}
            {apiError && (
              <Alert variant="danger">
                <AlertDescription>{apiError}</AlertDescription>
              </Alert>
            )}

            {/* 営業コード（新規登録時のみ入力可） */}
            <div className="space-y-2">
              <Label htmlFor="sales_code" required>
                営業コード
              </Label>
              <Input
                id="sales_code"
                type="text"
                value={formData.sales_code}
                onChange={(e) => handleChange('sales_code', e.target.value)}
                error={!!errors.sales_code}
                disabled={isEditMode}
                placeholder="半角英数字で入力"
              />
              {errors.sales_code && <p className="text-sm text-red-600">{errors.sales_code}</p>}
            </div>

            {/* 営業担当者名 */}
            <div className="space-y-2">
              <Label htmlFor="sales_name" required>
                営業担当者名
              </Label>
              <Input
                id="sales_name"
                type="text"
                value={formData.sales_name}
                onChange={(e) => handleChange('sales_name', e.target.value)}
                error={!!errors.sales_name}
                placeholder="最大100文字"
              />
              {errors.sales_name && <p className="text-sm text-red-600">{errors.sales_name}</p>}
            </div>

            {/* メールアドレス */}
            <div className="space-y-2">
              <Label htmlFor="email" required>
                メールアドレス
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                error={!!errors.email}
                placeholder="example@company.com"
              />
              {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
            </div>

            {/* パスワード */}
            <div className="space-y-2">
              <Label htmlFor="password" required={!isEditMode}>
                パスワード{isEditMode && '（変更する場合のみ入力）'}
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                error={!!errors.password}
                placeholder={
                  isEditMode
                    ? '変更しない場合は空欄のままにしてください'
                    : '10文字以上、大小英数字・特殊文字を含む'
                }
              />
              {errors.password && <p className="text-sm text-red-600">{errors.password}</p>}
            </div>

            {/* パスワード確認 */}
            {(formData.password || !isEditMode) && (
              <div className="space-y-2">
                <Label htmlFor="password_confirm" required={!isEditMode || !!formData.password}>
                  パスワード確認
                </Label>
                <Input
                  id="password_confirm"
                  type="password"
                  value={formData.password_confirm}
                  onChange={(e) => handleChange('password_confirm', e.target.value)}
                  error={!!errors.password_confirm}
                  placeholder="パスワードを再入力してください"
                />
                {errors.password_confirm && (
                  <p className="text-sm text-red-600">{errors.password_confirm}</p>
                )}
              </div>
            )}

            {/* 所属部署 */}
            <div className="space-y-2">
              <Label htmlFor="department" required>
                所属部署
              </Label>
              <Select
                id="department"
                value={formData.department}
                onChange={(e) => handleChange('department', e.target.value)}
                error={!!errors.department}
              >
                <option value="">選択してください</option>
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </Select>
              {errors.department && <p className="text-sm text-red-600">{errors.department}</p>}
            </div>

            {/* 上長 */}
            <div className="space-y-2">
              <Label htmlFor="manager_id">上長</Label>
              <Select
                id="manager_id"
                value={formData.manager_id}
                onChange={(e) => handleChange('manager_id', e.target.value)}
                error={!!errors.manager_id}
                disabled={loadingManagers}
              >
                <option value="">選択してください（任意）</option>
                {managerList.map((manager) => (
                  <option key={manager.sales_id} value={manager.sales_id}>
                    {manager.sales_name}
                  </option>
                ))}
              </Select>
              {errors.manager_id && <p className="text-sm text-red-600">{errors.manager_id}</p>}
            </div>

            {/* 管理者権限 */}
            <div className="space-y-2">
              <Checkbox
                id="is_manager"
                checked={formData.is_manager}
                onChange={(e) => handleChange('is_manager', e.target.checked)}
                label="管理者権限を付与する"
              />
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
              onClick={() => router.push('/sales')}
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
        title="営業担当者の削除"
        description={`${salesData?.sales_name}（${salesData?.sales_code}）を削除してもよろしいですか？この操作は取り消せません。`}
        variant="danger"
        confirmLabel="削除"
        cancelLabel="キャンセル"
        onConfirm={handleDelete}
        confirmDisabled={isDeleting}
      />
    </>
  );
}
