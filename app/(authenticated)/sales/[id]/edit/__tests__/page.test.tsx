import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { redirect, notFound } from 'next/navigation';
import { getSession, isSessionValid } from '@/lib/session';
import SalesEditPage from '../page';

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

// SalesFormコンポーネントのモック
vi.mock('../../../SalesForm', () => ({
  SalesForm: vi.fn(({ salesData, isEditMode }) => (
    <div data-testid="sales-form" data-edit-mode={isEditMode} data-sales-id={salesData?.sales_id}>
      Mock SalesForm for {salesData?.sales_name}
    </div>
  )),
}));

// PrismaClientのモック
const mockFindUnique = vi.fn();
const mockDisconnect = vi.fn();

vi.mock('@prisma/client', () => {
  return {
    PrismaClient: class MockPrismaClient {
      sales = {
        findUnique: mockFindUnique,
      };
      $disconnect = mockDisconnect;
    },
  };
});

describe('SalesEditPage', () => {
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
      SalesEditPage({
        params: Promise.resolve({ id: '507f1f77bcf86cd799439011' }),
      })
    ).rejects.toThrow('NEXT_REDIRECT: /login');

    expect(redirect).toHaveBeenCalledWith('/login');
  });

  test('管理者権限がない場合はホーム画面にリダイレクト', async () => {
    (getSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      sessionId: 'valid-session',
      salesId: 'test-sales-id',
      isManager: false,
    });
    (isSessionValid as ReturnType<typeof vi.fn>).mockReturnValueOnce(true);

    await expect(
      SalesEditPage({
        params: Promise.resolve({ id: '507f1f77bcf86cd799439011' }),
      })
    ).rejects.toThrow('NEXT_REDIRECT: /');

    expect(redirect).toHaveBeenCalledWith('/');
  });

  test('営業データが見つからない場合は404ページを表示', async () => {
    (getSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      sessionId: 'valid-session',
      salesId: 'test-sales-id',
      isManager: true,
    });
    (isSessionValid as ReturnType<typeof vi.fn>).mockReturnValueOnce(true);

    mockFindUnique.mockResolvedValueOnce(null);

    await expect(
      SalesEditPage({
        params: Promise.resolve({ id: '507f1f77bcf86cd799439011' }),
      })
    ).rejects.toThrow('NEXT_NOT_FOUND');

    expect(notFound).toHaveBeenCalled();
  });

  test('管理者権限がある場合は編集画面が表示される', async () => {
    (getSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      sessionId: 'valid-session',
      salesId: 'test-sales-id',
      isManager: true,
    });
    (isSessionValid as ReturnType<typeof vi.fn>).mockReturnValueOnce(true);

    mockFindUnique.mockResolvedValueOnce({
      id: '507f1f77bcf86cd799439011',
      salesCode: 'S001',
      salesName: '山田太郎',
      email: 'yamada@example.com',
      department: '営業1課',
      isManager: true,
      manager: {
        id: '507f1f77bcf86cd799439012',
        salesName: '佐藤次郎',
      },
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    });

    const result = await SalesEditPage({
      params: Promise.resolve({ id: '507f1f77bcf86cd799439011' }),
    });
    render(result);

    // パンくずリストの確認
    expect(screen.getByText('営業マスタ一覧')).toBeInTheDocument();
    expect(screen.getByText('山田太郎（S001）の編集')).toBeInTheDocument();

    // フォームが表示され、編集モードであることを確認
    const form = screen.getByTestId('sales-form');
    expect(form).toBeInTheDocument();
    expect(form).toHaveAttribute('data-edit-mode', 'true');
    expect(form).toHaveAttribute('data-sales-id', '507f1f77bcf86cd799439011');
  });

  test('Prismaを使用して営業データを取得する', async () => {
    (getSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      sessionId: 'test-session-id',
      salesId: 'test-sales-id',
      isManager: true,
    });
    (isSessionValid as ReturnType<typeof vi.fn>).mockReturnValueOnce(true);

    mockFindUnique.mockResolvedValueOnce({
      id: '507f1f77bcf86cd799439011',
      salesCode: 'S001',
      salesName: '山田太郎',
      email: 'yamada@example.com',
      department: '営業1課',
      isManager: true,
      manager: {
        id: '507f1f77bcf86cd799439012',
        salesName: '佐藤次郎',
      },
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    });

    await SalesEditPage({
      params: Promise.resolve({ id: '507f1f77bcf86cd799439011' }),
    });

    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { id: '507f1f77bcf86cd799439011' },
      include: {
        manager: {
          select: {
            id: true,
            salesName: true,
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
      isManager: true,
    });
    (isSessionValid as ReturnType<typeof vi.fn>).mockReturnValueOnce(true);

    mockFindUnique.mockRejectedValueOnce(new Error('Database error'));

    await expect(
      SalesEditPage({
        params: Promise.resolve({ id: '507f1f77bcf86cd799439011' }),
      })
    ).rejects.toThrow('NEXT_REDIRECT: /sales');

    expect(redirect).toHaveBeenCalledWith('/sales');
  });

  test('パンくずリストに一覧画面へのリンクが表示される', async () => {
    (getSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      sessionId: 'valid-session',
      salesId: 'test-sales-id',
      isManager: true,
    });
    (isSessionValid as ReturnType<typeof vi.fn>).mockReturnValueOnce(true);

    mockFindUnique.mockResolvedValueOnce({
      id: '507f1f77bcf86cd799439011',
      salesCode: 'S001',
      salesName: '山田太郎',
      email: 'yamada@example.com',
      department: '営業1課',
      isManager: true,
      manager: {
        id: '507f1f77bcf86cd799439012',
        salesName: '佐藤次郎',
      },
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    });

    const result = await SalesEditPage({
      params: Promise.resolve({ id: '507f1f77bcf86cd799439011' }),
    });
    render(result);

    const salesListLink = screen.getByRole('link', { name: '営業マスタ一覧' });
    expect(salesListLink).toBeInTheDocument();
    expect(salesListLink).toHaveAttribute('href', '/sales');
  });

  test('無効なIDの場合は一覧画面にリダイレクト', async () => {
    (getSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      sessionId: 'valid-session',
      salesId: 'test-sales-id',
      isManager: true,
    });
    (isSessionValid as ReturnType<typeof vi.fn>).mockReturnValueOnce(true);

    await expect(
      SalesEditPage({
        params: Promise.resolve({ id: 'invalid-id' }),
      })
    ).rejects.toThrow('NEXT_REDIRECT: /sales');

    expect(redirect).toHaveBeenCalledWith('/sales');
  });
});
