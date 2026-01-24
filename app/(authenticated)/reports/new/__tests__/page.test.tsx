import { describe, test, expect, vi } from 'vitest';
import { redirect } from 'next/navigation';
import ReportNewPage from '../page';

// next/navigationのモック
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

// session.tsのモック
vi.mock('@/lib/session', () => ({
  getSession: vi.fn(),
  isSessionValid: vi.fn(),
}));

// ReportFormのモック
vi.mock('../../ReportForm', () => ({
  ReportForm: () => <div data-testid="report-form">Report Form</div>,
}));

describe('ReportNewPage', () => {
  test('有効なセッションの場合、フォームが表示される', async () => {
    const { getSession, isSessionValid } = await import('@/lib/session');

    (getSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      salesId: '507f1f77bcf86cd799439011',
      salesName: '山田太郎',
      isManager: false,
    });
    (isSessionValid as ReturnType<typeof vi.fn>).mockReturnValue(true);

    const page = await ReportNewPage();

    // ReportFormが含まれることを確認
    expect(page).toBeDefined();
    expect(page.props.children).toBeDefined();
  });

  test('無効なセッションの場合、ログイン画面にリダイレクトされる', async () => {
    const { getSession, isSessionValid } = await import('@/lib/session');

    (getSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (isSessionValid as ReturnType<typeof vi.fn>).mockReturnValue(false);

    // redirectは例外を投げるので、それを無視
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (redirect as any).mockImplementation(() => {
      throw new Error('NEXT_REDIRECT');
    });

    try {
      await ReportNewPage();
    } catch {
      // redirectの例外は期待される動作
    }

    expect(redirect).toHaveBeenCalledWith('/login');
  });
});
