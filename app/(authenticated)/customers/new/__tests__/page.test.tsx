import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { redirect } from 'next/navigation';
import { getSession, isSessionValid } from '@/lib/session';
import CustomerNewPage from '../page';

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

// CustomerFormコンポーネントのモック
vi.mock('../../CustomerForm', () => ({
  CustomerForm: vi.fn(({ isEditMode }) => (
    <div data-testid="customer-form" data-edit-mode={isEditMode}>
      Mock CustomerForm
    </div>
  )),
}));

// グローバルfetchのモック
global.fetch = vi.fn();

describe('CustomerNewPage', () => {
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

    await expect(CustomerNewPage()).rejects.toThrow('NEXT_REDIRECT: /login');

    expect(redirect).toHaveBeenCalledWith('/login');
  });

  test('セッションが有効な場合は新規登録画面が表示される', async () => {
    (getSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      sessionId: 'valid-session',
      salesId: 'test-sales-id',
      isManager: false,
    });
    (isSessionValid as ReturnType<typeof vi.fn>).mockReturnValueOnce(true);

    const result = await CustomerNewPage();
    render(result);

    // パンくずリストの確認
    expect(screen.getByText('顧客マスタ一覧')).toBeInTheDocument();
    expect(screen.getByText('新規登録')).toBeInTheDocument();

    // フォームが表示され、編集モードではないことを確認
    const form = screen.getByTestId('customer-form');
    expect(form).toBeInTheDocument();
    expect(form).toHaveAttribute('data-edit-mode', 'false');
  });

  test('パンくずリストに一覧画面へのリンクが表示される', async () => {
    (getSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      sessionId: 'valid-session',
      salesId: 'test-sales-id',
      isManager: false,
    });
    (isSessionValid as ReturnType<typeof vi.fn>).mockReturnValueOnce(true);

    const result = await CustomerNewPage();
    render(result);

    const customerListLink = screen.getByRole('link', { name: '顧客マスタ一覧' });
    expect(customerListLink).toBeInTheDocument();
    expect(customerListLink).toHaveAttribute('href', '/customers');
  });

  test('管理者がアクセスした場合も新規登録画面が表示される', async () => {
    (getSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      sessionId: 'valid-session',
      salesId: 'test-sales-id',
      isManager: true,
    });
    (isSessionValid as ReturnType<typeof vi.fn>).mockReturnValueOnce(true);

    const result = await CustomerNewPage();
    render(result);

    // フォームが表示され、編集モードではないことを確認
    const form = screen.getByTestId('customer-form');
    expect(form).toBeInTheDocument();
    expect(form).toHaveAttribute('data-edit-mode', 'false');
  });
});
