import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { redirect, notFound } from 'next/navigation';
import { getSession, isSessionValid } from '@/lib/session';
import CustomerEditPage from '../page';

// Next.js navigationのモック
// redirect と notFound は例外をthrowする必要がある
vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT: ${url}`);
  }),
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    refresh: vi.fn(),
  })),
}));

// sessionのモック
vi.mock('@/lib/session', () => ({
  getSession: vi.fn(),
  isSessionValid: vi.fn(),
}));

// CustomerFormコンポーネントのモック
vi.mock('../../../CustomerForm', () => ({
  CustomerForm: vi.fn(({ customerData, isEditMode }) => (
    <div
      data-testid="customer-form"
      data-edit-mode={isEditMode}
      data-customer-id={customerData?.customer_id}
    >
      Mock CustomerForm for {customerData?.customer_name}
    </div>
  )),
}));

// PrismaClientのモック
const mockFindUnique = vi.fn();
const mockDisconnect = vi.fn();

vi.mock('@prisma/client', () => {
  return {
    PrismaClient: class MockPrismaClient {
      customer = {
        findUnique: mockFindUnique,
      };
      $disconnect = mockDisconnect;
    },
  };
});

describe('CustomerEditPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('セッションが無効な場合はログイン画面にリダイレクト', async () => {
    (getSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      sessionId: 'invalid-session',
      salesId: 'test-sales-id',
      isManager: false,
    });
    (isSessionValid as ReturnType<typeof vi.fn>).mockReturnValueOnce(false);

    await expect(
      CustomerEditPage({
        params: Promise.resolve({ id: '507f1f77bcf86cd799439011' }),
      })
    ).rejects.toThrow('NEXT_REDIRECT: /login');

    expect(redirect).toHaveBeenCalledWith('/login');
  });

  test('無効なIDの場合は一覧画面にリダイレクト', async () => {
    (getSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      sessionId: 'valid-session',
      salesId: 'test-sales-id',
      isManager: false,
    });
    (isSessionValid as ReturnType<typeof vi.fn>).mockReturnValueOnce(true);

    await expect(
      CustomerEditPage({
        params: Promise.resolve({ id: 'invalid-id' }),
      })
    ).rejects.toThrow('NEXT_REDIRECT: /customers');

    expect(redirect).toHaveBeenCalledWith('/customers');
  });

  test('顧客データが見つからない場合は404ページを表示', async () => {
    (getSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      sessionId: 'valid-session',
      salesId: 'test-sales-id',
      isManager: false,
    });
    (isSessionValid as ReturnType<typeof vi.fn>).mockReturnValueOnce(true);

    mockFindUnique.mockResolvedValueOnce(null);

    await expect(
      CustomerEditPage({
        params: Promise.resolve({ id: '507f1f77bcf86cd799439011' }),
      })
    ).rejects.toThrow('NEXT_NOT_FOUND');

    expect(notFound).toHaveBeenCalled();
  });

  test('セッションが有効な場合は編集画面が表示される', async () => {
    (getSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      sessionId: 'valid-session',
      salesId: 'test-sales-id',
      isManager: false,
    });
    (isSessionValid as ReturnType<typeof vi.fn>).mockReturnValueOnce(true);

    mockFindUnique.mockResolvedValueOnce({
      id: '507f1f77bcf86cd799439011',
      customerCode: 'C001',
      customerName: '株式会社テスト',
      industry: 'IT',
      postalCode: '123-4567',
      address: '東京都渋谷区',
      phone: '03-1234-5678',
      sales: {
        id: '507f1f77bcf86cd799439012',
        salesName: '山田太郎',
        department: {
          departmentName: '営業1課',
        },
      },
      notes: 'テスト備考',
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-24T00:00:00.000Z'),
    });

    const result = await CustomerEditPage({
      params: Promise.resolve({ id: '507f1f77bcf86cd799439011' }),
    });
    render(result);

    // パンくずリストの確認
    expect(screen.getByText('顧客マスタ一覧')).toBeInTheDocument();
    expect(screen.getByText(/株式会社テスト（C001）の編集/)).toBeInTheDocument();

    // フォームが表示され、編集モードであることを確認
    const form = screen.getByTestId('customer-form');
    expect(form).toBeInTheDocument();
    expect(form).toHaveAttribute('data-edit-mode', 'true');
    expect(form).toHaveAttribute('data-customer-id', '507f1f77bcf86cd799439011');
  });

  test('Prismaを使用して顧客データを取得する', async () => {
    (getSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      sessionId: 'test-session-id',
      salesId: 'test-sales-id',
      isManager: false,
    });
    (isSessionValid as ReturnType<typeof vi.fn>).mockReturnValueOnce(true);

    mockFindUnique.mockResolvedValueOnce({
      id: '507f1f77bcf86cd799439011',
      customerCode: 'C001',
      customerName: '株式会社テスト',
      industry: 'IT',
      postalCode: '123-4567',
      address: '東京都渋谷区',
      phone: '03-1234-5678',
      sales: {
        id: '507f1f77bcf86cd799439012',
        salesName: '山田太郎',
        department: {
          departmentName: '営業1課',
        },
      },
      notes: 'テスト備考',
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-24T00:00:00.000Z'),
    });

    await CustomerEditPage({
      params: Promise.resolve({ id: '507f1f77bcf86cd799439011' }),
    });

    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { id: '507f1f77bcf86cd799439011' },
      include: {
        sales: {
          select: {
            id: true,
            salesName: true,
            department: {
              select: {
                departmentName: true,
              },
            },
          },
        },
      },
    });
    expect(mockDisconnect).toHaveBeenCalled();
  });

  test('Prismaエラー時は一覧画面にリダイレクト', async () => {
    (getSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      sessionId: 'valid-session',
      salesId: 'test-sales-id',
      isManager: false,
    });
    (isSessionValid as ReturnType<typeof vi.fn>).mockReturnValueOnce(true);

    mockFindUnique.mockRejectedValueOnce(new Error('Database error'));

    await expect(
      CustomerEditPage({
        params: Promise.resolve({ id: '507f1f77bcf86cd799439011' }),
      })
    ).rejects.toThrow('NEXT_REDIRECT: /customers');

    expect(redirect).toHaveBeenCalledWith('/customers');
  });

  test('パンくずリストに一覧画面へのリンクが表示される', async () => {
    (getSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      sessionId: 'valid-session',
      salesId: 'test-sales-id',
      isManager: false,
    });
    (isSessionValid as ReturnType<typeof vi.fn>).mockReturnValueOnce(true);

    mockFindUnique.mockResolvedValueOnce({
      id: '507f1f77bcf86cd799439011',
      customerCode: 'C001',
      customerName: '株式会社テスト',
      industry: 'IT',
      postalCode: '123-4567',
      address: '東京都渋谷区',
      phone: '03-1234-5678',
      sales: {
        id: '507f1f77bcf86cd799439012',
        salesName: '山田太郎',
        department: {
          departmentName: '営業1課',
        },
      },
      notes: 'テスト備考',
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-24T00:00:00.000Z'),
    });

    const result = await CustomerEditPage({
      params: Promise.resolve({ id: '507f1f77bcf86cd799439011' }),
    });
    render(result);

    const customerListLink = screen.getByRole('link', { name: '顧客マスタ一覧' });
    expect(customerListLink).toBeInTheDocument();
    expect(customerListLink).toHaveAttribute('href', '/customers');
  });

  test('管理者がアクセスした場合も編集画面が表示される', async () => {
    (getSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      sessionId: 'valid-session',
      salesId: 'test-sales-id',
      isManager: true,
    });
    (isSessionValid as ReturnType<typeof vi.fn>).mockReturnValueOnce(true);

    mockFindUnique.mockResolvedValueOnce({
      id: '507f1f77bcf86cd799439011',
      customerCode: 'C001',
      customerName: '株式会社テスト',
      industry: 'IT',
      postalCode: '123-4567',
      address: '東京都渋谷区',
      phone: '03-1234-5678',
      sales: {
        id: '507f1f77bcf86cd799439012',
        salesName: '山田太郎',
        department: {
          departmentName: '営業1課',
        },
      },
      notes: 'テスト備考',
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-24T00:00:00.000Z'),
    });

    const result = await CustomerEditPage({
      params: Promise.resolve({ id: '507f1f77bcf86cd799439011' }),
    });
    render(result);

    // フォームが表示され、編集モードであることを確認
    const form = screen.getByTestId('customer-form');
    expect(form).toBeInTheDocument();
    expect(form).toHaveAttribute('data-edit-mode', 'true');
  });

  test('null値のオプショナルフィールドを正しく処理する', async () => {
    (getSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      sessionId: 'valid-session',
      salesId: 'test-sales-id',
      isManager: false,
    });
    (isSessionValid as ReturnType<typeof vi.fn>).mockReturnValueOnce(true);

    mockFindUnique.mockResolvedValueOnce({
      id: '507f1f77bcf86cd799439011',
      customerCode: 'C001',
      customerName: '株式会社テスト',
      industry: null,
      postalCode: null,
      address: null,
      phone: null,
      sales: {
        id: '507f1f77bcf86cd799439012',
        salesName: '山田太郎',
        department: {
          departmentName: '営業1課',
        },
      },
      notes: null,
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-24T00:00:00.000Z'),
    });

    const result = await CustomerEditPage({
      params: Promise.resolve({ id: '507f1f77bcf86cd799439011' }),
    });
    render(result);

    // フォームが正常にレンダリングされることを確認
    const form = screen.getByTestId('customer-form');
    expect(form).toBeInTheDocument();
  });
});
