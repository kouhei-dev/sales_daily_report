import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { SalesForm } from '../SalesForm';
import type { SalesDetail } from '@/types/sales';
import type { ApiSuccessResponse, ApiErrorResponse } from '@/types/session';

// Next.js navigationのモック
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

// グローバルfetchのモック
global.fetch = vi.fn();

describe('SalesForm', () => {
  const mockPush = vi.fn();
  const mockRefresh = vi.fn();

  const mockManagerListResponse: ApiSuccessResponse<{ items: SalesDetail[] }> = {
    status: 'success',
    data: {
      items: [
        {
          sales_id: '507f1f77bcf86cd799439012',
          sales_code: 'M001',
          sales_name: '管理者太郎',
          email: 'manager1@example.com',
          department: '営業1課',
          is_manager: true,
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z',
        },
        {
          sales_id: '507f1f77bcf86cd799439013',
          sales_code: 'M002',
          sales_name: '管理者花子',
          email: 'manager2@example.com',
          department: '営業2課',
          is_manager: true,
          created_at: '2024-01-02T00:00:00.000Z',
          updated_at: '2024-01-02T00:00:00.000Z',
        },
      ],
    },
  };

  const mockSalesData: SalesDetail = {
    sales_id: '507f1f77bcf86cd799439011',
    sales_code: 'S001',
    sales_name: '山田太郎',
    email: 'yamada@example.com',
    department: '営業1課',
    is_manager: false,
    manager: {
      sales_id: '507f1f77bcf86cd799439012',
      sales_name: '管理者太郎',
    },
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as ReturnType<typeof vi.fn>).mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
    });

    // 管理者一覧取得のデフォルトモック
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => mockManagerListResponse,
    });
  });

  describe('新規登録モード', () => {
    test('全ての入力フィールドが表示される', async () => {
      render(<SalesForm isEditMode={false} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/営業コード/)).toBeInTheDocument();
      });

      expect(screen.getByLabelText(/営業担当者名/)).toBeInTheDocument();
      expect(screen.getByLabelText(/^メールアドレス/)).toBeInTheDocument();
      expect(screen.getByLabelText(/^パスワード(?!確認)/)).toBeInTheDocument();
      expect(screen.getByLabelText(/パスワード確認/)).toBeInTheDocument();
      expect(screen.getByLabelText(/所属部署/)).toBeInTheDocument();
      expect(screen.getByLabelText(/上長/)).toBeInTheDocument();
      expect(screen.getByLabelText(/管理者権限を付与する/)).toBeInTheDocument();
    });

    test('営業コードフィールドが入力可能', async () => {
      render(<SalesForm isEditMode={false} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/営業コード/)).toBeInTheDocument();
      });

      const salesCodeInput = screen.getByLabelText(/営業コード/) as HTMLInputElement;
      expect(salesCodeInput).not.toBeDisabled();
    });

    test('保存ボタンとキャンセルボタンが表示される', async () => {
      render(<SalesForm isEditMode={false} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '保存' })).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: 'キャンセル' })).toBeInTheDocument();
    });

    test('削除ボタンは表示されない', async () => {
      render(<SalesForm isEditMode={false} />);

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: '削除' })).not.toBeInTheDocument();
      });
    });

    test('必須項目が未入力の場合、バリデーションエラーが表示される', async () => {
      const user = userEvent.setup();
      render(<SalesForm isEditMode={false} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '保存' })).toBeInTheDocument();
      });

      const saveButton = screen.getByRole('button', { name: '保存' });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('営業コードは必須です')).toBeInTheDocument();
      });

      expect(screen.getByText('営業担当者名は必須です')).toBeInTheDocument();
      expect(screen.getByText('メールアドレスは必須です')).toBeInTheDocument();
      expect(screen.getByText('パスワードは必須です')).toBeInTheDocument();
      expect(screen.getByText('所属部署は必須です')).toBeInTheDocument();
    });

    test('パスワードと確認用パスワードが一致しない場合、エラーが表示される', async () => {
      const user = userEvent.setup();
      render(<SalesForm isEditMode={false} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/^パスワード(?!確認)/)).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText(/^パスワード(?!確認)/) as HTMLInputElement;
      const confirmInput = screen.getByLabelText(/パスワード確認/) as HTMLInputElement;

      await user.type(passwordInput, 'Password123!');
      await user.type(confirmInput, 'DifferentPassword123!');

      const saveButton = screen.getByRole('button', { name: '保存' });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('パスワードが一致しません')).toBeInTheDocument();
      });
    });

    test('有効なデータで保存を実行すると、APIが呼ばれ一覧画面に戻る', async () => {
      const user = userEvent.setup();
      const mockCreateResponse: ApiSuccessResponse<unknown> = {
        status: 'success',
        data: {
          sales_id: '507f1f77bcf86cd799439011',
          sales_code: 'S100',
          sales_name: '新規営業',
          created_at: '2024-01-01T00:00:00.000Z',
        },
      };

      // 管理者一覧取得のレスポンス（最初）
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockManagerListResponse,
      });

      // 作成APIのレスポンス
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockCreateResponse,
      });

      render(<SalesForm isEditMode={false} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/営業コード/)).toBeInTheDocument();
      });

      // フォームに入力
      await user.type(screen.getByLabelText(/営業コード/), 'S100');
      await user.type(screen.getByLabelText(/営業担当者名/), '新規営業');
      await user.type(screen.getByLabelText(/^メールアドレス/), 'new@example.com');
      await user.type(screen.getByLabelText(/^パスワード(?!確認)/), 'ValidPass123!');
      await user.type(screen.getByLabelText(/パスワード確認/), 'ValidPass123!');
      await user.selectOptions(screen.getByLabelText(/所属部署/), '営業1課');

      // 保存
      const saveButton = screen.getByRole('button', { name: '保存' });
      await user.click(saveButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/sales',
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: expect.stringContaining('"sales_code":"S100"'),
          })
        );
      });

      expect(mockPush).toHaveBeenCalledWith('/sales');
      expect(mockRefresh).toHaveBeenCalled();
    });

    test('API エラー時にエラーメッセージが表示される', async () => {
      const user = userEvent.setup();
      const mockErrorResponse: ApiErrorResponse = {
        status: 'error',
        error: {
          code: 'RESOURCE_CONFLICT',
          message: 'この営業コードは既に使用されています',
        },
      };

      // 管理者一覧取得のレスポンス
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockManagerListResponse,
      });

      // 作成APIのエラーレスポンス
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        json: async () => mockErrorResponse,
      });

      render(<SalesForm isEditMode={false} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/営業コード/)).toBeInTheDocument();
      });

      // フォームに入力
      await user.type(screen.getByLabelText(/営業コード/), 'S001');
      await user.type(screen.getByLabelText(/営業担当者名/), '営業太郎');
      await user.type(screen.getByLabelText(/^メールアドレス/), 'test@example.com');
      await user.type(screen.getByLabelText(/^パスワード(?!確認)/), 'ValidPass123!');
      await user.type(screen.getByLabelText(/パスワード確認/), 'ValidPass123!');
      await user.selectOptions(screen.getByLabelText(/所属部署/), '営業1課');

      // 保存
      const saveButton = screen.getByRole('button', { name: '保存' });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('この営業コードは既に使用されています')).toBeInTheDocument();
      });
    });
  });

  describe('編集モード', () => {
    test('既存データがフォームに表示される', async () => {
      render(<SalesForm salesData={mockSalesData} isEditMode={true} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/営業コード/)).toBeInTheDocument();
      });

      expect((screen.getByLabelText(/営業コード/) as HTMLInputElement).value).toBe('S001');
      expect((screen.getByLabelText(/営業担当者名/) as HTMLInputElement).value).toBe('山田太郎');
      expect((screen.getByLabelText(/^メールアドレス/) as HTMLInputElement).value).toBe(
        'yamada@example.com'
      );
      expect((screen.getByLabelText(/所属部署/) as HTMLSelectElement).value).toBe('営業1課');
    });

    test('営業コードフィールドが無効化されている', async () => {
      render(<SalesForm salesData={mockSalesData} isEditMode={true} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/営業コード/)).toBeInTheDocument();
      });

      const salesCodeInput = screen.getByLabelText(/営業コード/) as HTMLInputElement;
      expect(salesCodeInput).toBeDisabled();
    });

    test('パスワードフィールドが任意になっている', async () => {
      render(<SalesForm salesData={mockSalesData} isEditMode={true} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/パスワード（変更する場合のみ入力）/)).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText(
        /パスワード（変更する場合のみ入力）/
      ) as HTMLInputElement;
      expect(passwordInput.value).toBe('');
    });

    test('削除ボタンが表示される', async () => {
      render(<SalesForm salesData={mockSalesData} isEditMode={true} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '削除' })).toBeInTheDocument();
      });
    });

    test('有効なデータで更新を実行すると、APIが呼ばれ一覧画面に戻る', async () => {
      const user = userEvent.setup();
      const mockUpdateResponse: ApiSuccessResponse<unknown> = {
        status: 'success',
        data: {
          sales_id: '507f1f77bcf86cd799439011',
          updated_at: '2024-01-01T00:00:00.000Z',
        },
      };

      // 管理者一覧取得のレスポンス
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockManagerListResponse,
      });

      // 更新APIのレスポンス
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockUpdateResponse,
      });

      render(<SalesForm salesData={mockSalesData} isEditMode={true} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/営業担当者名/)).toBeInTheDocument();
      });

      // 営業担当者名を変更
      const nameInput = screen.getByLabelText(/営業担当者名/) as HTMLInputElement;
      await user.clear(nameInput);
      await user.type(nameInput, '山田次郎');

      // 保存
      const saveButton = screen.getByRole('button', { name: '保存' });
      await user.click(saveButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/sales/507f1f77bcf86cd799439011',
          expect.objectContaining({
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: expect.stringContaining('"sales_name":"山田次郎"'),
          })
        );
      });

      expect(mockPush).toHaveBeenCalledWith('/sales');
      expect(mockRefresh).toHaveBeenCalled();
    });

    test('削除ボタンをクリックすると確認ダイアログが表示される', async () => {
      const user = userEvent.setup();
      render(<SalesForm salesData={mockSalesData} isEditMode={true} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '削除' })).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: '削除' });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText('営業担当者の削除')).toBeInTheDocument();
      });

      expect(screen.getByText(/山田太郎（S001）を削除してもよろしいですか/)).toBeInTheDocument();
    });

    test('削除確認ダイアログで削除を実行すると、APIが呼ばれ一覧画面に戻る', async () => {
      const user = userEvent.setup();

      // 管理者一覧取得のレスポンス
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockManagerListResponse,
      });

      // 削除APIのレスポンス
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      render(<SalesForm salesData={mockSalesData} isEditMode={true} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '削除' })).toBeInTheDocument();
      });

      // 削除ボタンをクリック
      const deleteButton = screen.getByRole('button', { name: '削除' });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText('営業担当者の削除')).toBeInTheDocument();
      });

      // 確認ダイアログで削除を実行（ダイアログ内のボタンを選択）
      const deleteButtons = screen.getAllByRole('button', { name: '削除' });
      // ダイアログ内のボタンは2番目（最初はフォーム内の削除ボタン）
      const confirmButton = deleteButtons.find((btn) => btn.closest('[role="dialog"]'));
      expect(confirmButton).toBeDefined();
      await user.click(confirmButton!);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/sales/507f1f77bcf86cd799439011',
          expect.objectContaining({
            method: 'DELETE',
            credentials: 'include',
          })
        );
      });

      expect(mockPush).toHaveBeenCalledWith('/sales');
      expect(mockRefresh).toHaveBeenCalled();
    });

    test('削除確認ダイアログでキャンセルすると、削除が実行されない', async () => {
      const user = userEvent.setup();
      render(<SalesForm salesData={mockSalesData} isEditMode={true} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '削除' })).toBeInTheDocument();
      });

      // 削除ボタンをクリック
      const deleteButton = screen.getByRole('button', { name: '削除' });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText('営業担当者の削除')).toBeInTheDocument();
      });

      // キャンセルボタンをクリック
      const cancelButtons = screen.getAllByRole('button', { name: 'キャンセル' });
      const dialogCancelButton = cancelButtons.find((btn) => btn.closest('[role="dialog"]'));
      expect(dialogCancelButton).toBeDefined();

      await user.click(dialogCancelButton!);

      await waitFor(() => {
        expect(screen.queryByText('営業担当者の削除')).not.toBeInTheDocument();
      });

      // DELETE APIが呼ばれていないことを確認
      expect(global.fetch).not.toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  describe('共通機能', () => {
    test('キャンセルボタンをクリックすると一覧画面に戻る', async () => {
      const user = userEvent.setup();
      render(<SalesForm isEditMode={false} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'キャンセル' })).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: 'キャンセル' });
      await user.click(cancelButton);

      expect(mockPush).toHaveBeenCalledWith('/sales');
    });

    test('管理者一覧が正しくプルダウンに表示される', async () => {
      render(<SalesForm isEditMode={false} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/上長/)).toBeInTheDocument();
      });

      const managerSelect = screen.getByLabelText(/上長/) as HTMLSelectElement;
      const options = Array.from(managerSelect.options);

      expect(options).toHaveLength(3); // 「選択してください」+ 2人の管理者
      expect(options[0].text).toBe('選択してください（任意）');
      expect(options[1].text).toBe('管理者太郎');
      expect(options[2].text).toBe('管理者花子');
    });

    test('入力エラーをクリアすると、エラーメッセージが消える', async () => {
      const user = userEvent.setup();
      render(<SalesForm isEditMode={false} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '保存' })).toBeInTheDocument();
      });

      // まずエラーを表示させる
      const saveButton = screen.getByRole('button', { name: '保存' });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('営業コードは必須です')).toBeInTheDocument();
      });

      // 営業コードを入力すると、エラーが消える
      const codeInput = screen.getByLabelText(/営業コード/);
      await user.type(codeInput, 'S100');

      await waitFor(() => {
        expect(screen.queryByText('営業コードは必須です')).not.toBeInTheDocument();
      });
    });
  });
});
