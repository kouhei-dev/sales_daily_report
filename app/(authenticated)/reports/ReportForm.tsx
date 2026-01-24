'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Dialog } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import type { ReportDetailResponse } from '@/types/report';
import type { ApiSuccessResponse, ApiErrorResponse } from '@/types/session';
import type { CustomerListResponse } from '@/types/customer';

export interface ReportFormProps {
  /** 編集モード時の日報情報 */
  reportData?: ReportDetailResponse;
  /** 編集モードかどうか */
  isEditMode?: boolean;
  /** ログインユーザーの営業担当者名 */
  salesName: string;
}

interface VisitRecordFormData {
  visit_id?: string;
  customer_id: string;
  visit_datetime: string;
  visit_content: string;
  visit_result?: string;
}

interface FormData {
  report_date: string;
  problem?: string;
  plan?: string;
  visit_records: VisitRecordFormData[];
}

interface FieldError {
  field: string;
  message: string;
}

/**
 * 日報作成・編集フォームコンポーネント
 *
 * 新規作成と編集で共通利用するフォームコンポーネント
 * React Hook FormのuseFieldArrayで訪問記録の動的追加・削除を実装
 * バリデーション、API連携、エラーハンドリングを実装
 */
export function ReportForm({ reportData, isEditMode = false, salesName }: ReportFormProps) {
  const router = useRouter();
  const [apiError, setApiError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteVisitDialog, setShowDeleteVisitDialog] = useState(false);
  const [deleteVisitIndex, setDeleteVisitIndex] = useState<number | null>(null);
  const [customerList, setCustomerList] = useState<
    Array<{ customer_id: string; customer_name: string }>
  >([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  // デフォルト値の設定
  const getDefaultDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getDefaultDatetime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const defaultValues: FormData = {
    report_date: reportData?.report_date || getDefaultDate(),
    problem: reportData?.problem || '',
    plan: reportData?.plan || '',
    visit_records: reportData?.visit_records?.length
      ? reportData.visit_records.map((record) => ({
          visit_id: record.visit_id,
          customer_id: record.customer.customer_id,
          visit_datetime: record.visit_datetime.slice(0, 16), // YYYY-MM-DDTHH:MM形式
          visit_content: record.visit_content,
          visit_result: record.visit_result || '',
        }))
      : [
          {
            customer_id: '',
            visit_datetime: getDefaultDatetime(),
            visit_content: '',
            visit_result: '',
          },
        ],
  };

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<FormData>({
    defaultValues,
    mode: 'onBlur',
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'visit_records',
  });

  // 顧客一覧の取得
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoadingCustomers(true);
        const response = await fetch('/api/customers?limit=1000', {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('顧客一覧の取得に失敗しました');
        }

        const result: ApiSuccessResponse<CustomerListResponse> = await response.json();
        const customers = result.data.items.map((c) => ({
          customer_id: c.customer_id,
          customer_name: c.customer_name,
        }));
        setCustomerList(customers);
      } catch (error) {
        console.error('Failed to fetch customers:', error);
      } finally {
        setLoadingCustomers(false);
      }
    };

    fetchCustomers();
  }, []);

  const handleAddVisitRecord = () => {
    if (fields.length >= 10) {
      setApiError('訪問記録は最大10件までです');
      return;
    }
    append({
      customer_id: '',
      visit_datetime: getDefaultDatetime(),
      visit_content: '',
      visit_result: '',
    });
    setApiError('');
  };

  const handleDeleteVisitRecord = (index: number) => {
    setDeleteVisitIndex(index);
    setShowDeleteVisitDialog(true);
  };

  const confirmDeleteVisitRecord = () => {
    if (deleteVisitIndex !== null) {
      remove(deleteVisitIndex);
      setDeleteVisitIndex(null);
    }
    setShowDeleteVisitDialog(false);
  };

  const onSubmit = async (data: FormData, isDraft: boolean) => {
    setApiError('');

    // 下書き保存の場合はバリデーションをスキップ
    if (!isDraft) {
      // 訪問記録が1件以上あるかチェック
      if (data.visit_records.length === 0) {
        setApiError('訪問記録は1件以上必要です');
        return;
      }

      // 各訪問記録の必須項目チェック
      let hasError = false;
      data.visit_records.forEach((record, index) => {
        if (!record.customer_id) {
          setError(`visit_records.${index}.customer_id`, {
            type: 'manual',
            message: '顧客を選択してください',
          });
          hasError = true;
        }
        if (!record.visit_datetime) {
          setError(`visit_records.${index}.visit_datetime`, {
            type: 'manual',
            message: '訪問日時は必須です',
          });
          hasError = true;
        }
        if (!record.visit_content || record.visit_content.trim() === '') {
          setError(`visit_records.${index}.visit_content`, {
            type: 'manual',
            message: '訪問内容は必須です',
          });
          hasError = true;
        }
      });

      if (hasError) {
        setApiError('入力内容に誤りがあります');
        return;
      }
    }

    try {
      setIsSubmitting(true);

      const requestBody = {
        ...(isEditMode ? {} : { report_date: data.report_date }),
        problem: data.problem || undefined,
        plan: data.plan || undefined,
        status: isDraft ? 'draft' : 'submitted',
        visit_records: data.visit_records.map((record, index) => ({
          ...(record.visit_id ? { visit_id: record.visit_id } : {}),
          customer_id: record.customer_id,
          visit_datetime: new Date(record.visit_datetime).toISOString(),
          visit_content: record.visit_content,
          visit_result: record.visit_result || undefined,
          display_order: index + 1,
        })),
      };

      const url = isEditMode ? `/api/reports/${reportData?.report_id}` : '/api/reports';
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
          errorData.error.details.forEach((err: FieldError) => {
            const fieldPath = err.field as keyof FormData;
            setError(fieldPath, {
              type: 'manual',
              message: err.message,
            });
          });
        }

        setApiError(errorData.error.message || '保存に失敗しました');
        return;
      }

      // 成功時は一覧画面に戻る
      router.push('/reports');
      router.refresh();
    } catch (error) {
      console.error('Save error:', error);
      setApiError('サーバーエラーが発生しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDraftSave = handleSubmit((data) => onSubmit(data, true));
  const handleFinalSubmit = handleSubmit((data) => onSubmit(data, false));

  return (
    <>
      <form>
        <div className="space-y-6">
          {/* APIエラー表示 */}
          {apiError && (
            <Alert variant="danger">
              <AlertDescription>{apiError}</AlertDescription>
            </Alert>
          )}

          {/* 基本情報カード */}
          <Card>
            <CardHeader>
              <CardTitle>基本情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 日報日付 */}
              <div className="space-y-2">
                <Label htmlFor="report_date" required>
                  日報日付
                </Label>
                <Input
                  id="report_date"
                  type="date"
                  {...register('report_date', {
                    required: '日報日付は必須です',
                  })}
                  error={!!errors.report_date}
                  disabled={isEditMode}
                />
                {errors.report_date && (
                  <p className="text-sm text-red-600">{errors.report_date.message}</p>
                )}
              </div>

              {/* 営業担当者 */}
              <div className="space-y-2">
                <Label>営業担当者</Label>
                <div className="py-2 px-3 bg-gray-50 rounded-md text-gray-900">{salesName}</div>
              </div>
            </CardContent>
          </Card>

          {/* 訪問記録セクション */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>訪問記録</CardTitle>
              <Button
                type="button"
                variant="secondary"
                onClick={handleAddVisitRecord}
                disabled={fields.length >= 10 || loadingCustomers}
              >
                訪問記録を追加
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {fields.map((field, index) => (
                <div key={field.id}>
                  {index > 0 && <Separator className="mb-6" />}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">訪問記録 {index + 1}</h3>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="danger"
                          onClick={() => handleDeleteVisitRecord(index)}
                        >
                          削除
                        </Button>
                      )}
                    </div>

                    {/* 顧客 */}
                    <div className="space-y-2">
                      <Label htmlFor={`visit_records.${index}.customer_id`} required>
                        顧客
                      </Label>
                      <Controller
                        name={`visit_records.${index}.customer_id`}
                        control={control}
                        render={({ field: controllerField }) => (
                          <Select
                            id={`visit_records.${index}.customer_id`}
                            {...controllerField}
                            error={!!errors.visit_records?.[index]?.customer_id}
                            disabled={loadingCustomers}
                          >
                            <option value="">選択してください</option>
                            {customerList.map((customer) => (
                              <option key={customer.customer_id} value={customer.customer_id}>
                                {customer.customer_name}
                              </option>
                            ))}
                          </Select>
                        )}
                      />
                      {errors.visit_records?.[index]?.customer_id && (
                        <p className="text-sm text-red-600">
                          {errors.visit_records[index].customer_id?.message}
                        </p>
                      )}
                    </div>

                    {/* 訪問日時 */}
                    <div className="space-y-2">
                      <Label htmlFor={`visit_records.${index}.visit_datetime`} required>
                        訪問日時
                      </Label>
                      <Input
                        id={`visit_records.${index}.visit_datetime`}
                        type="datetime-local"
                        {...register(`visit_records.${index}.visit_datetime`)}
                        error={!!errors.visit_records?.[index]?.visit_datetime}
                      />
                      {errors.visit_records?.[index]?.visit_datetime && (
                        <p className="text-sm text-red-600">
                          {errors.visit_records[index].visit_datetime?.message}
                        </p>
                      )}
                    </div>

                    {/* 訪問内容 */}
                    <div className="space-y-2">
                      <Label htmlFor={`visit_records.${index}.visit_content`} required>
                        訪問内容（最大500文字）
                      </Label>
                      <Textarea
                        id={`visit_records.${index}.visit_content`}
                        {...register(`visit_records.${index}.visit_content`, {
                          maxLength: {
                            value: 500,
                            message: '訪問内容は500文字以内で入力してください',
                          },
                        })}
                        error={!!errors.visit_records?.[index]?.visit_content}
                        rows={4}
                        placeholder="訪問内容を入力してください"
                      />
                      {errors.visit_records?.[index]?.visit_content && (
                        <p className="text-sm text-red-600">
                          {errors.visit_records[index].visit_content?.message}
                        </p>
                      )}
                    </div>

                    {/* 訪問結果 */}
                    <div className="space-y-2">
                      <Label htmlFor={`visit_records.${index}.visit_result`}>
                        訪問結果（最大500文字）
                      </Label>
                      <Textarea
                        id={`visit_records.${index}.visit_result`}
                        {...register(`visit_records.${index}.visit_result`, {
                          maxLength: {
                            value: 500,
                            message: '訪問結果は500文字以内で入力してください',
                          },
                        })}
                        error={!!errors.visit_records?.[index]?.visit_result}
                        rows={4}
                        placeholder="訪問結果を入力してください（任意）"
                      />
                      {errors.visit_records?.[index]?.visit_result && (
                        <p className="text-sm text-red-600">
                          {errors.visit_records[index].visit_result?.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Problem（課題・相談）セクション */}
          <Card>
            <CardHeader>
              <CardTitle>Problem（課題・相談）</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="problem">課題・相談（最大1000文字）</Label>
                <Textarea
                  id="problem"
                  {...register('problem', {
                    maxLength: {
                      value: 1000,
                      message: '課題・相談は1000文字以内で入力してください',
                    },
                  })}
                  error={!!errors.problem}
                  rows={6}
                  placeholder="課題や相談事項があれば入力してください（任意）"
                />
                {errors.problem && <p className="text-sm text-red-600">{errors.problem.message}</p>}
              </div>
            </CardContent>
          </Card>

          {/* Plan（明日の予定）セクション */}
          <Card>
            <CardHeader>
              <CardTitle>Plan（明日の予定）</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="plan">明日の予定（最大1000文字）</Label>
                <Textarea
                  id="plan"
                  {...register('plan', {
                    maxLength: {
                      value: 1000,
                      message: '明日の予定は1000文字以内で入力してください',
                    },
                  })}
                  error={!!errors.plan}
                  rows={6}
                  placeholder="明日の予定を入力してください（任意）"
                />
                {errors.plan && <p className="text-sm text-red-600">{errors.plan.message}</p>}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* フッターボタン */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-between">
          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={handleDraftSave}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  保存中...
                </>
              ) : (
                '下書き保存'
              )}
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleFinalSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  提出中...
                </>
              ) : (
                '提出'
              )}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push('/reports')}
              disabled={isSubmitting}
            >
              キャンセル
            </Button>
          </div>
        </div>
      </form>

      {/* 訪問記録削除確認ダイアログ */}
      <Dialog
        open={showDeleteVisitDialog}
        onClose={() => setShowDeleteVisitDialog(false)}
        title="訪問記録の削除"
        description="この訪問記録を削除してもよろしいですか？"
        variant="danger"
        confirmLabel="削除"
        cancelLabel="キャンセル"
        onConfirm={confirmDeleteVisitRecord}
      />
    </>
  );
}
