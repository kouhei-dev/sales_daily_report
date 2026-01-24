import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { ReportForm } from '../ReportForm';
import type { ReportDetailResponse } from '@/types/report';
import type { ApiSuccessResponse, ApiErrorResponse } from '@/types/session';
import type { CustomerListResponse } from '@/types/customer';

// Next.js navigationのモック
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

// グローバルfetchのモック
global.fetch = vi.fn();

describe('ReportForm', () => {
  const mockPush = vi.fn();
  const mockRefresh = vi.fn();

  const mockCustomerListResponse: ApiSuccessResponse<CustomerListResponse> = {
    status: 'success',
    data: {
      items: [
        {
          customer_id: '507f1f77bcf86cd799439010',
          customer_code: 'C001',
          customer_name: '株式会社テスト',
          sales: {
            sales_id: '507f1f77bcf86cd799439011',
            sales_name: '山田太郎',
          },
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z',
        },
        {
          customer_id: '507f1f77bcf86cd799439020',
          customer_code: 'C002',
          customer_name: 'サンプル商事',
          sales: {
            sales_id: '507f1f77bcf86cd799439011',
            sales_name: '山田太郎',
          },
          created_at: '2024-01-02T00:00:00.000Z',
          updated_at: '2024-01-02T00:00:00.000Z',
        },
      ],
      pagination: {
        current_page: 1,
        total_pages: 1,
        total_items: 2,
        limit: 1000,
      },
    },
  };

  const mockReportData: ReportDetailResponse = {
    report_id: '507f1f77bcf86cd799439030',
    report_date: '2024-01-15',
    sales: {
      sales_id: '507f1f77bcf86cd799439011',
      sales_name: '山田太郎',
      department: '営業1課',
    },
    problem: 'テスト課題',
    plan: 'テスト予定',
    status: 'draft',
    visit_records: [
      {
        visit_id: '507f1f77bcf86cd799439040',
        customer: {
          customer_id: '507f1f77bcf86cd799439010',
          customer_code: 'C001',
          customer_name: '株式会社テスト',
        },
        visit_datetime: '2024-01-15T10:00:00.000Z',
        visit_content: 'テスト訪問内容',
        visit_result: 'テスト訪問結果',
        display_order: 1,
      },
    ],
    comments: {
      problem: [],
      plan: [],
    },
    created_at: '2024-01-15T00:00:00.000Z',
    updated_at: '2024-01-15T00:00:00.000Z',
  };

  /**
   * fetchのモックを設定するヘルパー関数
   * @param customersResponse 顧客一覧のレスポンス (省略時はデフォルト)
   * @param additionalResponses 追加のレスポンス配列
   */
  const setupFetchMock = (
    customersResponse = mockCustomerListResponse,
    additionalResponses: Array<
      unknown | { ok: boolean; status?: number; json: () => Promise<unknown> }
    > = []
  ) => {
    const responses = [
      // 1st call: 顧客一覧取得
      {
        ok: true,
        json: async () => customersResponse,
      },
      // 2nd call以降: 追加のレスポンス
      ...additionalResponses.map((response) => {
        // レスポンスオブジェクト形式の場合はそのまま使用
        if (response && typeof response === 'object' && 'json' in response) {
          return response;
        }
        // それ以外はデフォルトのレスポンスとして扱う
        return {
          ok: true,
          json: async () => response,
        };
      }),
    ];

    responses.forEach((response) => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(response);
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as ReturnType<typeof vi.fn>).mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
    });
  });

  describe('新規作成モード', () => {
    test('全ての入力フィールドが表示される', async () => {
      setupFetchMock();
      render(<ReportForm isEditMode={false} salesName="山田太郎" />);

      await waitFor(() => {
        expect(screen.getByLabelText(/日報日付/)).toBeInTheDocument();
      });

      expect(screen.getByText(/営業担当者/)).toBeInTheDocument();
      expect(screen.getByText('山田太郎')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '訪問記録を追加' })).toBeInTheDocument();
      expect(screen.getByLabelText(/顧客/)).toBeInTheDocument();
      expect(screen.getByLabelText(/訪問日時/)).toBeInTheDocument();
      expect(screen.getByLabelText(/訪問内容/)).toBeInTheDocument();
      expect(screen.getByLabelText(/訪問結果/)).toBeInTheDocument();
      expect(screen.getByLabelText(/課題・相談/)).toBeInTheDocument();
      expect(screen.getByLabelText(/明日の予定/)).toBeInTheDocument();
    });

    test('日報日付フィールドが入力可能', async () => {
      setupFetchMock();
      render(<ReportForm isEditMode={false} salesName="山田太郎" />);

      await waitFor(() => {
        expect(screen.getByLabelText(/日報日付/)).toBeInTheDocument();
      });

      const reportDateInput = screen.getByLabelText(/日報日付/) as HTMLInputElement;
      expect(reportDateInput).not.toBeDisabled();
    });

    test('下書き保存、提出、キャンセルボタンが表示される', async () => {
      setupFetchMock();
      render(<ReportForm isEditMode={false} salesName="山田太郎" />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '下書き保存' })).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: '提出' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'キャンセル' })).toBeInTheDocument();
    });

    test('訪問記録を追加ボタンで訪問記録が追加される', async () => {
      const user = userEvent.setup();
      setupFetchMock();
      render(<ReportForm isEditMode={false} salesName="山田太郎" />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '訪問記録を追加' })).toBeInTheDocument();
      });

      // 初期状態では1件の訪問記録
      expect(screen.getByText('訪問記録 1')).toBeInTheDocument();
      expect(screen.queryByText('訪問記録 2')).not.toBeInTheDocument();

      // 訪問記録を追加
      const addButton = screen.getByRole('button', { name: '訪問記録を追加' });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('訪問記録 2')).toBeInTheDocument();
      });
    });

    test('訪問記録が10件に達したら追加ボタンが無効化される', async () => {
      const user = userEvent.setup();
      setupFetchMock();
      render(<ReportForm isEditMode={false} salesName="山田太郎" />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '訪問記録を追加' })).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: '訪問記録を追加' });

      // 9回追加して合計10件にする
      for (let i = 0; i < 9; i++) {
        await user.click(addButton);
      }

      await waitFor(() => {
        expect(screen.getByText('訪問記録 10')).toBeInTheDocument();
        expect(addButton).toBeDisabled();
      });
    });

    test('訪問記録の削除ボタンで確認ダイアログが表示される', async () => {
      const user = userEvent.setup();
      setupFetchMock();
      render(<ReportForm isEditMode={false} salesName="山田太郎" />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '訪問記録を追加' })).toBeInTheDocument();
      });

      // 訪問記録を追加（2件にする）
      const addButton = screen.getByRole('button', { name: '訪問記録を追加' });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('訪問記録 2')).toBeInTheDocument();
      });

      // 削除ボタンをクリック
      const deleteButtons = screen.getAllByRole('button', { name: '削除' });
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('訪問記録の削除')).toBeInTheDocument();
      });

      expect(screen.getByText('この訪問記録を削除してもよろしいですか？')).toBeInTheDocument();
    });

    test('訪問記録が1件のみの場合は削除ボタンが表示されない', async () => {
      setupFetchMock();
      render(<ReportForm isEditMode={false} salesName="山田太郎" />);

      await waitFor(() => {
        expect(screen.getByText('訪問記録 1')).toBeInTheDocument();
      });

      // 削除ボタンは表示されない
      expect(screen.queryByRole('button', { name: '削除' })).not.toBeInTheDocument();
    });

    test('下書き保存の場合はバリデーションなしで保存できる', async () => {
      const user = userEvent.setup();
      const mockCreateResponse: ApiSuccessResponse<unknown> = {
        status: 'success',
        data: {
          report_id: '507f1f77bcf86cd799439030',
          report_date: '2024-01-15',
          status: 'draft',
          created_at: '2024-01-15T00:00:00.000Z',
        },
      };

      setupFetchMock(undefined, [mockCreateResponse]);

      render(<ReportForm isEditMode={false} salesName="山田太郎" />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '下書き保存' })).toBeInTheDocument();
      });

      // 必須項目を入力せずに下書き保存
      const draftButton = screen.getByRole('button', { name: '下書き保存' });
      await user.click(draftButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/reports',
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          })
        );
      });

      expect(mockPush).toHaveBeenCalledWith('/reports');
      expect(mockRefresh).toHaveBeenCalled();
    });

    test('提出時は必須項目のバリデーションが実行される', async () => {
      const user = userEvent.setup();
      setupFetchMock();
      render(<ReportForm isEditMode={false} salesName="山田太郎" />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '提出' })).toBeInTheDocument();
      });

      // 必須項目を入力せずに提出
      const submitButton = screen.getByRole('button', { name: '提出' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('入力内容に誤りがあります')).toBeInTheDocument();
      });

      // エラーメッセージが表示される
      expect(screen.getByText('顧客を選択してください')).toBeInTheDocument();
      expect(screen.getByText('訪問内容は必須です')).toBeInTheDocument();
    });

    test('有効なデータで提出すると、APIが呼ばれ一覧画面に戻る', async () => {
      const user = userEvent.setup();
      const mockCreateResponse: ApiSuccessResponse<unknown> = {
        status: 'success',
        data: {
          report_id: '507f1f77bcf86cd799439030',
          report_date: '2024-01-15',
          status: 'submitted',
          created_at: '2024-01-15T00:00:00.000Z',
        },
      };

      setupFetchMock(undefined, [mockCreateResponse]);

      render(<ReportForm isEditMode={false} salesName="山田太郎" />);

      await waitFor(() => {
        expect(screen.getByLabelText(/日報日付/)).toBeInTheDocument();
      });

      // フォームに入力
      const dateInput = screen.getByLabelText(/日報日付/) as HTMLInputElement;
      await user.clear(dateInput);
      await user.type(dateInput, '2024-01-15');

      const customerSelect = screen.getByLabelText(/顧客/) as HTMLSelectElement;
      await user.selectOptions(customerSelect, '507f1f77bcf86cd799439010');

      const datetimeInput = screen.getByLabelText(/訪問日時/) as HTMLInputElement;
      await user.clear(datetimeInput);
      await user.type(datetimeInput, '2024-01-15T10:00');

      const contentTextarea = screen.getByLabelText(/訪問内容/);
      await user.type(contentTextarea, 'テスト訪問内容');

      // 提出
      const submitButton = screen.getByRole('button', { name: '提出' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/reports',
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          })
        );
      });

      // リクエストボディの包括的な検証
      const callArgs = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.find(
        (call) => call[0] === '/api/reports' && call[1]?.method === 'POST'
      );
      expect(callArgs).toBeDefined();
      const requestBody = JSON.parse(callArgs![1].body);
      expect(requestBody).toMatchObject({
        report_date: '2024-01-15',
        status: 'submitted',
      });
      expect(requestBody.visit_records).toHaveLength(1);
      expect(requestBody.visit_records[0]).toMatchObject({
        customer_id: '507f1f77bcf86cd799439010',
        visit_content: 'テスト訪問内容',
        display_order: 1,
      });

      expect(mockPush).toHaveBeenCalledWith('/reports');
      expect(mockRefresh).toHaveBeenCalled();
    });

    test('APIエラー時にエラーメッセージが表示される', async () => {
      const user = userEvent.setup();
      const mockErrorResponse: ApiErrorResponse = {
        status: 'error',
        error: {
          code: 'RESOURCE_CONFLICT',
          message: 'この日付の日報は既に存在します',
        },
      };

      setupFetchMock(undefined, [{ ok: false, json: async () => mockErrorResponse }]);

      render(<ReportForm isEditMode={false} salesName="山田太郎" />);

      await waitFor(() => {
        expect(screen.getByLabelText(/日報日付/)).toBeInTheDocument();
      });

      // フォームに入力
      const dateInput = screen.getByLabelText(/日報日付/) as HTMLInputElement;
      await user.clear(dateInput);
      await user.type(dateInput, '2024-01-15');

      const customerSelect = screen.getByLabelText(/顧客/) as HTMLSelectElement;
      await user.selectOptions(customerSelect, '507f1f77bcf86cd799439010');

      const datetimeInput = screen.getByLabelText(/訪問日時/) as HTMLInputElement;
      await user.clear(datetimeInput);
      await user.type(datetimeInput, '2024-01-15T10:00');

      const contentTextarea = screen.getByLabelText(/訪問内容/);
      await user.type(contentTextarea, 'テスト訪問内容');

      // 提出
      const submitButton = screen.getByRole('button', { name: '提出' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('この日付の日報は既に存在します')).toBeInTheDocument();
      });
    });
  });

  describe('編集モード', () => {
    test('既存データがフォームに表示される', async () => {
      setupFetchMock();
      render(<ReportForm reportData={mockReportData} isEditMode={true} salesName="山田太郎" />);

      await waitFor(() => {
        expect(screen.getByLabelText(/日報日付/)).toBeInTheDocument();
      });

      expect((screen.getByLabelText(/日報日付/) as HTMLInputElement).value).toBe('2024-01-15');
      expect(screen.getByText('山田太郎')).toBeInTheDocument();
      expect((screen.getByLabelText(/課題・相談/) as HTMLTextAreaElement).value).toBe('テスト課題');
      expect((screen.getByLabelText(/明日の予定/) as HTMLTextAreaElement).value).toBe('テスト予定');
      expect((screen.getByLabelText(/顧客/) as HTMLSelectElement).value).toBe(
        '507f1f77bcf86cd799439010'
      );
      expect((screen.getByLabelText(/訪問内容/) as HTMLTextAreaElement).value).toBe(
        'テスト訪問内容'
      );
      expect((screen.getByLabelText(/訪問結果/) as HTMLTextAreaElement).value).toBe(
        'テスト訪問結果'
      );
    });

    test('日報日付フィールドが無効化されている', async () => {
      setupFetchMock();
      render(<ReportForm reportData={mockReportData} isEditMode={true} salesName="山田太郎" />);

      await waitFor(() => {
        expect(screen.getByLabelText(/日報日付/)).toBeInTheDocument();
      });

      const reportDateInput = screen.getByLabelText(/日報日付/) as HTMLInputElement;
      expect(reportDateInput).toBeDisabled();
    });

    test('有効なデータで更新を実行すると、APIが呼ばれ一覧画面に戻る', async () => {
      const user = userEvent.setup();
      const mockUpdateResponse: ApiSuccessResponse<unknown> = {
        status: 'success',
        data: {
          report_id: '507f1f77bcf86cd799439030',
          updated_at: '2024-01-15T00:00:00.000Z',
        },
      };

      setupFetchMock(undefined, [mockUpdateResponse]);

      render(<ReportForm reportData={mockReportData} isEditMode={true} salesName="山田太郎" />);

      await waitFor(() => {
        expect(screen.getByLabelText(/課題・相談/)).toBeInTheDocument();
      });

      // 課題・相談を変更
      const problemTextarea = screen.getByLabelText(/課題・相談/) as HTMLTextAreaElement;
      await user.clear(problemTextarea);
      await user.type(problemTextarea, '更新された課題');

      // 提出
      const submitButton = screen.getByRole('button', { name: '提出' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/reports/507f1f77bcf86cd799439030',
          expect.objectContaining({
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
          })
        );
      });

      // リクエストボディの包括的な検証
      const callArgs = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.find(
        (call) => call[0] === '/api/reports/507f1f77bcf86cd799439030' && call[1]?.method === 'PUT'
      );
      expect(callArgs).toBeDefined();
      const requestBody = JSON.parse(callArgs![1].body);
      expect(requestBody).toMatchObject({
        problem: '更新された課題',
        status: 'submitted',
      });
      expect(requestBody.visit_records).toHaveLength(1);
      expect(requestBody.visit_records[0]).toMatchObject({
        visit_id: '507f1f77bcf86cd799439040',
        customer_id: '507f1f77bcf86cd799439010',
        display_order: 1,
      });

      expect(mockPush).toHaveBeenCalledWith('/reports');
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  describe('共通機能', () => {
    test('キャンセルボタンをクリックすると一覧画面に戻る', async () => {
      const user = userEvent.setup();
      setupFetchMock();
      render(<ReportForm isEditMode={false} salesName="山田太郎" />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'キャンセル' })).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: 'キャンセル' });
      await user.click(cancelButton);

      expect(mockPush).toHaveBeenCalledWith('/reports');
    });

    test('顧客一覧が正しくプルダウンに表示される', async () => {
      setupFetchMock();
      render(<ReportForm isEditMode={false} salesName="山田太郎" />);

      await waitFor(() => {
        expect(screen.getByLabelText(/顧客/)).toBeInTheDocument();
      });

      const customerSelect = screen.getByLabelText(/顧客/) as HTMLSelectElement;
      const options = Array.from(customerSelect.options);

      expect(options).toHaveLength(3); // 「選択してください」+ 2件の顧客
      expect(options[0].text).toBe('選択してください');
      expect(options[1].text).toBe('株式会社テスト');
      expect(options[2].text).toBe('サンプル商事');
    });

    test('文字数制限を超えるとエラーメッセージが表示される', async () => {
      const user = userEvent.setup();
      setupFetchMock();
      render(<ReportForm isEditMode={false} salesName="山田太郎" />);

      await waitFor(() => {
        expect(screen.getByLabelText(/訪問内容/)).toBeInTheDocument();
      });

      const contentTextarea = screen.getByLabelText(/訪問内容/);
      // 501文字入力
      await user.type(contentTextarea, 'a'.repeat(501));

      const submitButton = screen.getByRole('button', { name: '提出' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('訪問内容は500文字以内で入力してください')).toBeInTheDocument();
      });
    });
  });
});
