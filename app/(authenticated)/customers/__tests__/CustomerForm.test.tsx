import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { CustomerForm } from '../CustomerForm';
import type { CustomerDetail } from '@/types/customer';

// Next.js navigationのモック
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

// グローバルfetchのモック
global.fetch = vi.fn();

describe('CustomerForm', () => {
  const mockPush = vi.fn();
  const mockRefresh = vi.fn();

  const mockSalesList = {
    data: {
      items: [
        { sales_id: '507f1f77bcf86cd799439011', sales_name: '山田太郎' },
        { sales_id: '507f191e810c19729de860ea', sales_name: '田中花子' },
      ],
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as ReturnType<typeof vi.fn>).mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
    });

    // デフォルトの営業担当者リスト取得をモック
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => mockSalesList,
    });
  });

  describe('新規登録モード', () => {
    test('新規登録フォームの全ての入力項目が表示される', async () => {
      render(<CustomerForm isEditMode={false} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/顧客コード/)).toBeInTheDocument();
      });

      expect(screen.getByLabelText(/顧客名/)).toBeInTheDocument();
      expect(screen.getByLabelText('業種')).toBeInTheDocument();
      expect(screen.getByLabelText('郵便番号')).toBeInTheDocument();
      expect(screen.getByLabelText('住所')).toBeInTheDocument();
      expect(screen.getByLabelText('電話番号')).toBeInTheDocument();
      expect(screen.getByLabelText(/担当営業/)).toBeInTheDocument();
      expect(screen.getByLabelText('備考')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '保存' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'キャンセル' })).toBeInTheDocument();
    });

    test('タイトルが「顧客マスタ新規登録」と表示される', async () => {
      render(<CustomerForm isEditMode={false} />);

      await waitFor(() => {
        expect(screen.getByText('顧客マスタ新規登録')).toBeInTheDocument();
      });
    });

    test('削除ボタンは表示されない', async () => {
      render(<CustomerForm isEditMode={false} />);

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: '削除' })).not.toBeInTheDocument();
      });
    });

    test('必須項目を入力して送信できる', async () => {
      const user = userEvent.setup();

      const mockFetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSalesList,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: {
              customer_id: 'cust1',
              customer_code: 'C001',
              customer_name: '株式会社テスト',
              created_at: '2026-01-24T00:00:00Z',
            },
          }),
        });

      global.fetch = mockFetch;

      render(<CustomerForm isEditMode={false} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/顧客コード/)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/顧客コード/), 'C001');
      await user.type(screen.getByLabelText(/顧客名/), '株式会社テスト');
      await user.selectOptions(screen.getByLabelText(/担当営業/), '507f1f77bcf86cd799439011');

      await user.click(screen.getByRole('button', { name: '保存' }));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/customers',
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('C001'),
          })
        );
        expect(mockPush).toHaveBeenCalledWith('/customers');
      });
    });

    test('必須項目が未入力の場合、エラーメッセージが表示される', async () => {
      const user = userEvent.setup();

      render(<CustomerForm isEditMode={false} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/顧客コード/)).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: '保存' }));

      await waitFor(() => {
        expect(screen.getByText('顧客コードは必須です')).toBeInTheDocument();
        expect(screen.getByText('顧客名は必須です')).toBeInTheDocument();
        expect(screen.getByText('担当営業は必須です')).toBeInTheDocument();
      });
    });

    test('顧客コードが半角英数字でない場合、エラーメッセージが表示される', async () => {
      const user = userEvent.setup();

      render(<CustomerForm isEditMode={false} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/顧客コード/)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/顧客コード/), 'C-001');
      await user.click(screen.getByRole('button', { name: '保存' }));

      await waitFor(() => {
        expect(screen.getByText('顧客コードは半角英数字で入力してください')).toBeInTheDocument();
      });
    });

    test('郵便番号が不正な形式の場合、エラーメッセージが表示される', async () => {
      const user = userEvent.setup();

      render(<CustomerForm isEditMode={false} />);

      await waitFor(() => {
        expect(screen.getByLabelText('郵便番号')).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText('郵便番号'), '1234567');
      await user.click(screen.getByRole('button', { name: '保存' }));

      await waitFor(() => {
        expect(screen.getByText('郵便番号はXXX-XXXX形式で入力してください')).toBeInTheDocument();
      });
    });

    test('電話番号が不正な形式の場合、エラーメッセージが表示される', async () => {
      const user = userEvent.setup();

      render(<CustomerForm isEditMode={false} />);

      await waitFor(() => {
        expect(screen.getByLabelText('電話番号')).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText('電話番号'), '0312345678');
      await user.click(screen.getByRole('button', { name: '保存' }));

      await waitFor(() => {
        expect(screen.getByText(/電話番号は正しい形式で入力してください/)).toBeInTheDocument();
      });
    });

    test('キャンセルボタンをクリックすると一覧画面に戻る', async () => {
      const user = userEvent.setup();

      render(<CustomerForm isEditMode={false} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'キャンセル' })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: 'キャンセル' }));

      expect(mockPush).toHaveBeenCalledWith('/customers');
    });

    test('APIエラー時にエラーメッセージが表示される', async () => {
      const user = userEvent.setup();

      const mockFetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSalesList,
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({
            error: {
              message: '顧客コードが既に存在します',
              details: [{ field: 'customer_code', message: '顧客コードが既に存在します' }],
            },
          }),
        });

      global.fetch = mockFetch;

      render(<CustomerForm isEditMode={false} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/顧客コード/)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/顧客コード/), 'C001');
      await user.type(screen.getByLabelText(/顧客名/), '株式会社テスト');
      await user.selectOptions(screen.getByLabelText(/担当営業/), '507f1f77bcf86cd799439011');

      await user.click(screen.getByRole('button', { name: '保存' }));

      await waitFor(() => {
        const errorMessages = screen.getAllByText('顧客コードが既に存在します');
        expect(errorMessages.length).toBeGreaterThan(0);
      });
    });
  });

  describe('編集モード', () => {
    const mockCustomerData: CustomerDetail = {
      customer_id: '507f1f77bcf86cd799439012',
      customer_code: 'C001',
      customer_name: '株式会社テスト',
      industry: 'IT',
      postal_code: '123-4567',
      address: '東京都渋谷区',
      phone: '03-1234-5678',
      sales: {
        sales_id: '507f1f77bcf86cd799439011',
        sales_name: '山田太郎',
        department: '営業1課',
      },
      notes: 'テスト備考',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-24T00:00:00Z',
    };

    test('編集フォームに既存データが表示される', async () => {
      render(<CustomerForm customerData={mockCustomerData} isEditMode={true} />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('C001')).toBeInTheDocument();
      });

      expect(screen.getByDisplayValue('株式会社テスト')).toBeInTheDocument();
      expect(screen.getByDisplayValue('IT')).toBeInTheDocument();
      expect(screen.getByDisplayValue('123-4567')).toBeInTheDocument();
      expect(screen.getByDisplayValue('東京都渋谷区')).toBeInTheDocument();
      expect(screen.getByDisplayValue('03-1234-5678')).toBeInTheDocument();
      expect(screen.getByDisplayValue('テスト備考')).toBeInTheDocument();
    });

    test('タイトルが「顧客マスタ編集」と表示される', async () => {
      render(<CustomerForm customerData={mockCustomerData} isEditMode={true} />);

      await waitFor(() => {
        expect(screen.getByText('顧客マスタ編集')).toBeInTheDocument();
      });
    });

    test('顧客コードフィールドが無効化されている', async () => {
      render(<CustomerForm customerData={mockCustomerData} isEditMode={true} />);

      await waitFor(() => {
        const codeInput = screen.getByLabelText(/顧客コード/);
        expect(codeInput).toBeDisabled();
      });
    });

    test('削除ボタンが表示される', async () => {
      render(<CustomerForm customerData={mockCustomerData} isEditMode={true} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '削除' })).toBeInTheDocument();
      });
    });

    test('データを編集して保存できる', async () => {
      const user = userEvent.setup();

      const mockFetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSalesList,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: {
              customer_id: 'cust1',
              updated_at: '2026-01-24T12:00:00Z',
            },
          }),
        });

      global.fetch = mockFetch;

      render(<CustomerForm customerData={mockCustomerData} isEditMode={true} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/顧客名/)).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/顧客名/);
      await user.clear(nameInput);
      await user.type(nameInput, '株式会社更新テスト');

      await user.click(screen.getByRole('button', { name: '保存' }));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/customers/507f1f77bcf86cd799439012',
          expect.objectContaining({
            method: 'PUT',
            body: expect.stringContaining('株式会社更新テスト'),
          })
        );
        expect(mockPush).toHaveBeenCalledWith('/customers');
      });
    });

    test('削除ボタンをクリックすると確認ダイアログが表示される', async () => {
      const user = userEvent.setup();

      render(<CustomerForm customerData={mockCustomerData} isEditMode={true} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '削除' })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: '削除' }));

      await waitFor(() => {
        expect(screen.getByText('顧客の削除')).toBeInTheDocument();
        expect(
          screen.getByText(/株式会社テスト（C001）を削除してもよろしいですか/)
        ).toBeInTheDocument();
      });
    });

    test('削除確認ダイアログで削除を実行できる', async () => {
      const user = userEvent.setup();

      const mockFetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSalesList,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { message: 'Deleted successfully' } }),
        });

      global.fetch = mockFetch;

      render(<CustomerForm customerData={mockCustomerData} isEditMode={true} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '削除' })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: '削除' }));

      await waitFor(() => {
        expect(screen.getByText('顧客の削除')).toBeInTheDocument();
      });

      const confirmButtons = screen.getAllByRole('button', { name: '削除' });
      const dialogDeleteButton = confirmButtons[1]; // ダイアログ内の削除ボタン
      await user.click(dialogDeleteButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/customers/507f1f77bcf86cd799439012',
          expect.objectContaining({
            method: 'DELETE',
          })
        );
        expect(mockPush).toHaveBeenCalledWith('/customers');
      });
    });

    test('削除確認ダイアログでキャンセルできる', async () => {
      const user = userEvent.setup();

      render(<CustomerForm customerData={mockCustomerData} isEditMode={true} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '削除' })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: '削除' }));

      await waitFor(() => {
        expect(screen.getByText('顧客の削除')).toBeInTheDocument();
      });

      const cancelButtons = screen.getAllByRole('button', { name: 'キャンセル' });
      const dialogCancelButton = cancelButtons[1]; // ダイアログ内のキャンセルボタン
      await user.click(dialogCancelButton);

      await waitFor(() => {
        expect(screen.queryByText('顧客の削除')).not.toBeInTheDocument();
      });
    });
  });

  describe('業種選択', () => {
    test('業種の選択肢が表示される', async () => {
      render(<CustomerForm isEditMode={false} />);

      await waitFor(() => {
        expect(screen.getByLabelText('業種')).toBeInTheDocument();
      });

      const select = screen.getByLabelText('業種') as HTMLSelectElement;
      const options = Array.from(select.options).map((opt) => opt.value);

      expect(options).toContain('');
      expect(options).toContain('製造業');
      expect(options).toContain('IT');
      expect(options).toContain('サービス');
      expect(options).toContain('その他');
    });

    test('業種を選択できる', async () => {
      const user = userEvent.setup();

      render(<CustomerForm isEditMode={false} />);

      await waitFor(() => {
        expect(screen.getByLabelText('業種')).toBeInTheDocument();
      });

      await user.selectOptions(screen.getByLabelText('業種'), 'IT');

      expect(screen.getByLabelText('業種')).toHaveValue('IT');
    });
  });

  describe('営業担当者選択', () => {
    test('営業担当者の選択肢が動的に取得される', async () => {
      render(<CustomerForm isEditMode={false} />);

      await waitFor(() => {
        const select = screen.getByLabelText(/担当営業/) as HTMLSelectElement;
        const options = Array.from(select.options).map((opt) => opt.textContent);
        expect(options).toContain('山田太郎');
        expect(options).toContain('田中花子');
      });
    });

    test('営業担当者の取得中は選択が無効化される', async () => {
      const mockFetch = vi.fn().mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => mockSalesList,
                }),
              100
            )
          )
      );

      global.fetch = mockFetch;

      render(<CustomerForm isEditMode={false} />);

      const select = screen.getByLabelText(/担当営業/) as HTMLSelectElement;
      expect(select).toBeDisabled();

      await waitFor(() => {
        expect(select).not.toBeDisabled();
      });
    });
  });

  describe('フォーム入力のバリデーション', () => {
    test('文字数制限を超えた場合エラーメッセージが表示される', async () => {
      const user = userEvent.setup();

      render(<CustomerForm isEditMode={false} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/顧客名/)).toBeInTheDocument();
      });

      await user.type(
        screen.getByLabelText(/顧客名/),
        'あ'.repeat(101) // 101文字
      );
      await user.click(screen.getByRole('button', { name: '保存' }));

      await waitFor(() => {
        expect(screen.getByText('顧客名は100文字以内で入力してください')).toBeInTheDocument();
      });
    });

    test('住所が200文字を超えた場合エラーメッセージが表示される', async () => {
      const user = userEvent.setup();

      render(<CustomerForm isEditMode={false} />);

      await waitFor(() => {
        expect(screen.getByLabelText('住所')).toBeInTheDocument();
      });

      await user.type(
        screen.getByLabelText('住所'),
        'あ'.repeat(201) // 201文字
      );
      await user.click(screen.getByRole('button', { name: '保存' }));

      await waitFor(() => {
        expect(screen.getByText('住所は200文字以内で入力してください')).toBeInTheDocument();
      });
    });

    test('備考が500文字を超えた場合エラーメッセージが表示される', async () => {
      const user = userEvent.setup();

      render(<CustomerForm isEditMode={false} />);

      await waitFor(() => {
        expect(screen.getByLabelText('備考')).toBeInTheDocument();
      });

      await user.type(
        screen.getByLabelText('備考'),
        'あ'.repeat(501) // 501文字
      );
      await user.click(screen.getByRole('button', { name: '保存' }));

      await waitFor(() => {
        expect(screen.getByText('備考は500文字以内で入力してください')).toBeInTheDocument();
      });
    });
  });

  describe('エラーハンドリング', () => {
    test('入力値変更時にエラーがクリアされる', async () => {
      const user = userEvent.setup();

      render(<CustomerForm isEditMode={false} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/顧客コード/)).toBeInTheDocument();
      });

      // エラーを発生させる
      await user.click(screen.getByRole('button', { name: '保存' }));

      await waitFor(() => {
        expect(screen.getByText('顧客コードは必須です')).toBeInTheDocument();
      });

      // 入力するとエラーがクリアされる
      await user.type(screen.getByLabelText(/顧客コード/), 'C001');

      await waitFor(() => {
        expect(screen.queryByText('顧客コードは必須です')).not.toBeInTheDocument();
      });
    });
  });
});
