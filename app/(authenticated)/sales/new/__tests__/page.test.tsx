import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { redirect } from 'next/navigation';
import { getSession, isSessionValid } from '@/lib/session';
import SalesNewPage from '../page';

// Next.js navigationのモック
// redirect は例外をthrowする必要がある
vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT: ${url}`);
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
vi.mock('../../SalesForm', () => ({
  SalesForm: vi.fn(({ isEditMode }) => (
    <div data-testid="sales-form" data-edit-mode={isEditMode}>
      Mock SalesForm
    </div>
  )),
}));

// グローバルfetchのモック
global.fetch = vi.fn();

describe('SalesNewPage', () => {
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

    await expect(SalesNewPage()).rejects.toThrow('NEXT_REDIRECT: /login');

    expect(redirect).toHaveBeenCalledWith('/login');
  });

  test('管理者権限がない場合はホーム画面にリダイレクト', async () => {
    (getSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      sessionId: 'valid-session',
      salesId: 'test-sales-id',
      isManager: false,
    });
    (isSessionValid as ReturnType<typeof vi.fn>).mockReturnValueOnce(true);

    await expect(SalesNewPage()).rejects.toThrow('NEXT_REDIRECT: /');

    expect(redirect).toHaveBeenCalledWith('/');
  });

  test('管理者権限がある場合は新規登録画面が表示される', async () => {
    (getSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      sessionId: 'valid-session',
      salesId: 'test-sales-id',
      isManager: true,
    });
    (isSessionValid as ReturnType<typeof vi.fn>).mockReturnValueOnce(true);

    const result = await SalesNewPage();
    render(result);

    // パンくずリストの確認
    expect(screen.getByText('営業マスタ一覧')).toBeInTheDocument();
    expect(screen.getByText('新規登録')).toBeInTheDocument();

    // フォームが表示され、編集モードではないことを確認
    const form = screen.getByTestId('sales-form');
    expect(form).toBeInTheDocument();
    expect(form).toHaveAttribute('data-edit-mode', 'false');
  });

  test('パンくずリストに一覧画面へのリンクが表示される', async () => {
    (getSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      sessionId: 'valid-session',
      salesId: 'test-sales-id',
      isManager: true,
    });
    (isSessionValid as ReturnType<typeof vi.fn>).mockReturnValueOnce(true);

    const result = await SalesNewPage();
    render(result);

    const salesListLink = screen.getByRole('link', { name: '営業マスタ一覧' });
    expect(salesListLink).toBeInTheDocument();
    expect(salesListLink).toHaveAttribute('href', '/sales');
  });
});
