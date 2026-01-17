import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from '../page';
import type { ApiSuccessResponse, ApiErrorResponse, LoginResponse } from '@/types/session';

// Next.jsのルーターをモック
const mockPush = vi.fn();
const mockReplace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
}));

describe('LoginPage', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // fetchのモックをセットアップ
    fetchMock = vi.fn();
    global.fetch = fetchMock as typeof fetch;

    // モック関数をリセット
    mockPush.mockClear();
    mockReplace.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ===== 1. 画面表示のテスト =====
  describe('画面表示', () => {
    test('ログイン画面が正しく表示される', () => {
      render(<LoginPage />);

      // 基本要素が表示されていることを確認
      expect(screen.getByText('営業日報システム')).toBeInTheDocument();
      expect(
        screen.getByText('営業コードとパスワードを入力してログインしてください')
      ).toBeInTheDocument();
      expect(screen.getByLabelText(/営業コード/)).toBeInTheDocument();
      expect(screen.getByLabelText(/パスワード/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'ログイン' })).toBeInTheDocument();
    });

    test('タイトル「営業日報システム」が表示される', () => {
      render(<LoginPage />);
      const title = screen.getByText('営業日報システム');
      expect(title).toBeInTheDocument();
      expect(title.tagName).toBe('H3');
    });

    test('説明文「営業コードとパスワードを入力してログインしてください」が表示される', () => {
      render(<LoginPage />);
      expect(
        screen.getByText('営業コードとパスワードを入力してログインしてください')
      ).toBeInTheDocument();
    });

    test('営業コードの入力フィールドが表示される', () => {
      render(<LoginPage />);
      const input = screen.getByLabelText(/営業コード/);
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'text');
      expect(input).toHaveAttribute('placeholder', '営業コードを入力');
    });

    test('パスワードの入力フィールドが表示される', () => {
      render(<LoginPage />);
      const input = screen.getByLabelText(/パスワード/);
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'password');
      expect(input).toHaveAttribute('placeholder', 'パスワードを入力');
    });

    test('ログインボタンが表示される', () => {
      render(<LoginPage />);
      const button = screen.getByRole('button', { name: 'ログイン' });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('type', 'submit');
    });
  });

  // ===== 2. フォームバリデーションのテスト =====
  describe('フォームバリデーション', () => {
    test('初期状態ではログインボタンが無効化されている', () => {
      render(<LoginPage />);
      const button = screen.getByRole('button', { name: 'ログイン' });
      expect(button).toBeDisabled();
    });

    test('営業コードのみ入力した場合、ログインボタンが無効化されている', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      const salesCodeInput = screen.getByLabelText(/営業コード/);
      await user.type(salesCodeInput, 'S001');

      const button = screen.getByRole('button', { name: 'ログイン' });
      expect(button).toBeDisabled();
    });

    test('パスワードのみ入力した場合、ログインボタンが無効化されている', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      const passwordInput = screen.getByLabelText(/パスワード/);
      await user.type(passwordInput, 'password123');

      const button = screen.getByRole('button', { name: 'ログイン' });
      expect(button).toBeDisabled();
    });

    test('両方入力した場合、ログインボタンが有効化される', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      const salesCodeInput = screen.getByLabelText(/営業コード/);
      const passwordInput = screen.getByLabelText(/パスワード/);

      await user.type(salesCodeInput, 'S001');
      await user.type(passwordInput, 'password123');

      const button = screen.getByRole('button', { name: 'ログイン' });
      expect(button).not.toBeDisabled();
    });

    test('スペースのみの入力は無効として扱われる - 営業コード', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      const salesCodeInput = screen.getByLabelText(/営業コード/);
      const passwordInput = screen.getByLabelText(/パスワード/);

      await user.type(salesCodeInput, '   ');
      await user.type(passwordInput, 'password123');

      const button = screen.getByRole('button', { name: 'ログイン' });
      expect(button).toBeDisabled();
    });

    test('スペースのみの入力は無効として扱われる - パスワード', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      const salesCodeInput = screen.getByLabelText(/営業コード/);
      const passwordInput = screen.getByLabelText(/パスワード/);

      await user.type(salesCodeInput, 'S001');
      await user.type(passwordInput, '   ');

      const button = screen.getByRole('button', { name: 'ログイン' });
      expect(button).toBeDisabled();
    });

    test('スペースのみの入力は無効として扱われる - 両方', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      const salesCodeInput = screen.getByLabelText(/営業コード/);
      const passwordInput = screen.getByLabelText(/パスワード/);

      await user.type(salesCodeInput, '   ');
      await user.type(passwordInput, '   ');

      const button = screen.getByRole('button', { name: 'ログイン' });
      expect(button).toBeDisabled();
    });
  });

  // ===== 3. ログイン成功のテスト =====
  describe('ログイン成功', () => {
    test('正しい認証情報でログインすると、ホーム画面（/）にリダイレクトされる', async () => {
      const user = userEvent.setup();

      const mockResponse: ApiSuccessResponse<LoginResponse> = {
        status: 'success',
        data: {
          user: {
            sales_id: 'user-id-1',
            sales_code: 'S001',
            sales_name: '佐藤花子',
            email: 'sato@example.com',
            department: '営業1課',
            is_manager: false,
          },
          session_id: 'session-id-1',
        },
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      render(<LoginPage />);

      const salesCodeInput = screen.getByLabelText(/営業コード/);
      const passwordInput = screen.getByLabelText(/パスワード/);
      const button = screen.getByRole('button', { name: 'ログイン' });

      await user.type(salesCodeInput, 'S001');
      await user.type(passwordInput, 'password123');
      await user.click(button);

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/');
      });

      // APIが正しいパラメータで呼ばれたことを確認
      expect(fetchMock).toHaveBeenCalledWith('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sales_code: 'S001',
          password: 'password123',
        }),
      });
    });

    test('ログイン処理中はローディングスピナーが表示される', async () => {
      const user = userEvent.setup();

      // fetchをゆっくり解決するようにモック
      fetchMock.mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  status: 200,
                  json: async () => ({
                    status: 'success',
                    data: {
                      user: {
                        sales_id: 'user-id-1',
                        sales_code: 'S001',
                        sales_name: '佐藤花子',
                        email: 'sato@example.com',
                        department: '営業1課',
                        is_manager: false,
                      },
                      session_id: 'session-id-1',
                    },
                  }),
                }),
              100
            )
          )
      );

      render(<LoginPage />);

      const salesCodeInput = screen.getByLabelText(/営業コード/);
      const passwordInput = screen.getByLabelText(/パスワード/);
      const button = screen.getByRole('button', { name: 'ログイン' });

      await user.type(salesCodeInput, 'S001');
      await user.type(passwordInput, 'password123');
      await user.click(button);

      // ローディング中は「ログイン中...」と表示される
      expect(screen.getByText('ログイン中...')).toBeInTheDocument();
    });

    test('ログイン処理中はボタンが無効化される', async () => {
      const user = userEvent.setup();

      // fetchをゆっくり解決するようにモック
      fetchMock.mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  status: 200,
                  json: async () => ({
                    status: 'success',
                    data: {
                      user: {
                        sales_id: 'user-id-1',
                        sales_code: 'S001',
                        sales_name: '佐藤花子',
                        email: 'sato@example.com',
                        department: '営業1課',
                        is_manager: false,
                      },
                      session_id: 'session-id-1',
                    },
                  }),
                }),
              100
            )
          )
      );

      render(<LoginPage />);

      const salesCodeInput = screen.getByLabelText(/営業コード/);
      const passwordInput = screen.getByLabelText(/パスワード/);
      const button = screen.getByRole('button', { name: 'ログイン' });

      await user.type(salesCodeInput, 'S001');
      await user.type(passwordInput, 'password123');
      await user.click(button);

      // ローディング中はボタンが無効化される
      const loadingButton = screen.getByRole('button', { name: /ログイン中/ });
      expect(loadingButton).toBeDisabled();
    });

    test('ログイン処理中は入力フィールドが無効化される', async () => {
      const user = userEvent.setup();

      // fetchをゆっくり解決するようにモック
      fetchMock.mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  status: 200,
                  json: async () => ({
                    status: 'success',
                    data: {
                      user: {
                        sales_id: 'user-id-1',
                        sales_code: 'S001',
                        sales_name: '佐藤花子',
                        email: 'sato@example.com',
                        department: '営業1課',
                        is_manager: false,
                      },
                      session_id: 'session-id-1',
                    },
                  }),
                }),
              100
            )
          )
      );

      render(<LoginPage />);

      const salesCodeInput = screen.getByLabelText(/営業コード/);
      const passwordInput = screen.getByLabelText(/パスワード/);
      const button = screen.getByRole('button', { name: 'ログイン' });

      await user.type(salesCodeInput, 'S001');
      await user.type(passwordInput, 'password123');
      await user.click(button);

      // ローディング中は入力フィールドが無効化される
      expect(salesCodeInput).toBeDisabled();
      expect(passwordInput).toBeDisabled();
    });

    test('営業コードの前後の空白がトリムされて送信される', async () => {
      const user = userEvent.setup();

      const mockResponse: ApiSuccessResponse<LoginResponse> = {
        status: 'success',
        data: {
          user: {
            sales_id: 'user-id-1',
            sales_code: 'S001',
            sales_name: '佐藤花子',
            email: 'sato@example.com',
            department: '営業1課',
            is_manager: false,
          },
          session_id: 'session-id-1',
        },
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      render(<LoginPage />);

      const salesCodeInput = screen.getByLabelText(/営業コード/);
      const passwordInput = screen.getByLabelText(/パスワード/);
      const button = screen.getByRole('button', { name: 'ログイン' });

      await user.type(salesCodeInput, '  S001  ');
      await user.type(passwordInput, 'password123');
      await user.click(button);

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sales_code: 'S001', // トリムされている
            password: 'password123',
          }),
        });
      });
    });
  });

  // ===== 4. ログイン失敗のテスト =====
  describe('ログイン失敗', () => {
    test('認証エラー（401）の場合、エラーメッセージが表示される', async () => {
      const user = userEvent.setup();

      const mockErrorResponse: ApiErrorResponse = {
        status: 'error',
        error: {
          code: 'INVALID_CREDENTIALS',
          message: '営業コードまたはパスワードが正しくありません',
        },
      };

      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => mockErrorResponse,
      });

      render(<LoginPage />);

      const salesCodeInput = screen.getByLabelText(/営業コード/);
      const passwordInput = screen.getByLabelText(/パスワード/);
      const button = screen.getByRole('button', { name: 'ログイン' });

      await user.type(salesCodeInput, 'S001');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(button);

      await waitFor(() => {
        expect(
          screen.getByText('営業コードまたはパスワードが正しくありません')
        ).toBeInTheDocument();
      });
    });

    test('レート制限エラー（429）の場合、レート制限メッセージが表示される', async () => {
      const user = userEvent.setup();

      const mockErrorResponse: ApiErrorResponse = {
        status: 'error',
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message:
            'ログイン試行回数が上限に達しました。しばらく時間をおいてから再試行してください。',
        },
      };

      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => mockErrorResponse,
      });

      render(<LoginPage />);

      const salesCodeInput = screen.getByLabelText(/営業コード/);
      const passwordInput = screen.getByLabelText(/パスワード/);
      const button = screen.getByRole('button', { name: 'ログイン' });

      await user.type(salesCodeInput, 'S001');
      await user.type(passwordInput, 'password123');
      await user.click(button);

      await waitFor(() => {
        expect(
          screen.getByText(
            'ログイン試行回数が上限に達しました。しばらく時間をおいてから再試行してください。'
          )
        ).toBeInTheDocument();
      });
    });

    test('レート制限エラー（429）でメッセージがない場合、デフォルトメッセージが表示される', async () => {
      const user = userEvent.setup();

      const mockErrorResponse: ApiErrorResponse = {
        status: 'error',
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: '',
        },
      };

      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => mockErrorResponse,
      });

      render(<LoginPage />);

      const salesCodeInput = screen.getByLabelText(/営業コード/);
      const passwordInput = screen.getByLabelText(/パスワード/);
      const button = screen.getByRole('button', { name: 'ログイン' });

      await user.type(salesCodeInput, 'S001');
      await user.type(passwordInput, 'password123');
      await user.click(button);

      await waitFor(() => {
        expect(
          screen.getByText(
            'ログイン試行回数が上限に達しました。しばらく時間をおいてから再試行してください。'
          )
        ).toBeInTheDocument();
      });
    });

    test('ネットワークエラーの場合、接続エラーメッセージが表示される', async () => {
      const user = userEvent.setup();

      // ネットワークエラーをシミュレート
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      render(<LoginPage />);

      const salesCodeInput = screen.getByLabelText(/営業コード/);
      const passwordInput = screen.getByLabelText(/パスワード/);
      const button = screen.getByRole('button', { name: 'ログイン' });

      await user.type(salesCodeInput, 'S001');
      await user.type(passwordInput, 'password123');
      await user.click(button);

      await waitFor(() => {
        expect(
          screen.getByText(
            'ネットワークエラーが発生しました。インターネット接続を確認してください。'
          )
        ).toBeInTheDocument();
      });
    });

    test('その他のエラー（500など）の場合、エラーメッセージが表示される', async () => {
      const user = userEvent.setup();

      const mockErrorResponse: ApiErrorResponse = {
        status: 'error',
        error: {
          code: 'INTERNAL_ERROR',
          message: 'サーバーエラーが発生しました',
        },
      };

      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => mockErrorResponse,
      });

      render(<LoginPage />);

      const salesCodeInput = screen.getByLabelText(/営業コード/);
      const passwordInput = screen.getByLabelText(/パスワード/);
      const button = screen.getByRole('button', { name: 'ログイン' });

      await user.type(salesCodeInput, 'S001');
      await user.type(passwordInput, 'password123');
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText('サーバーエラーが発生しました')).toBeInTheDocument();
      });
    });

    test('エラー時は入力フィールドが赤枠で強調される', async () => {
      const user = userEvent.setup();

      const mockErrorResponse: ApiErrorResponse = {
        status: 'error',
        error: {
          code: 'INVALID_CREDENTIALS',
          message: '営業コードまたはパスワードが正しくありません',
        },
      };

      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => mockErrorResponse,
      });

      render(<LoginPage />);

      const salesCodeInput = screen.getByLabelText(/営業コード/);
      const passwordInput = screen.getByLabelText(/パスワード/);
      const button = screen.getByRole('button', { name: 'ログイン' });

      await user.type(salesCodeInput, 'S001');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(button);

      await waitFor(() => {
        // エラー状態の確認
        expect(salesCodeInput).toHaveAttribute('aria-invalid', 'true');
        expect(passwordInput).toHaveAttribute('aria-invalid', 'true');
      });
    });

    test('エラーメッセージが表示された後、再入力するとエラーがクリアされる', async () => {
      const user = userEvent.setup();

      const mockErrorResponse: ApiErrorResponse = {
        status: 'error',
        error: {
          code: 'INVALID_CREDENTIALS',
          message: '営業コードまたはパスワードが正しくありません',
        },
      };

      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => mockErrorResponse,
      });

      render(<LoginPage />);

      const salesCodeInput = screen.getByLabelText(/営業コード/);
      const passwordInput = screen.getByLabelText(/パスワード/);
      const button = screen.getByRole('button', { name: 'ログイン' });

      // 最初のログイン試行（失敗）
      await user.type(salesCodeInput, 'S001');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(button);

      await waitFor(() => {
        expect(
          screen.getByText('営業コードまたはパスワードが正しくありません')
        ).toBeInTheDocument();
      });

      // 成功レスポンスをモック
      const mockSuccessResponse: ApiSuccessResponse<LoginResponse> = {
        status: 'success',
        data: {
          user: {
            sales_id: 'user-id-1',
            sales_code: 'S001',
            sales_name: '佐藤花子',
            email: 'sato@example.com',
            department: '営業1課',
            is_manager: false,
          },
          session_id: 'session-id-1',
        },
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockSuccessResponse,
      });

      // 再度ログイン試行（成功）
      await user.clear(passwordInput);
      await user.type(passwordInput, 'correctpassword');
      await user.click(button);

      // エラーメッセージが消えることを確認
      await waitFor(() => {
        expect(
          screen.queryByText('営業コードまたはパスワードが正しくありません')
        ).not.toBeInTheDocument();
      });
    });
  });

  // ===== 5. インタラクションのテスト =====
  describe('インタラクション', () => {
    test('営業コードに入力できる', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      const salesCodeInput = screen.getByLabelText(/営業コード/);
      await user.type(salesCodeInput, 'S001');

      expect(salesCodeInput).toHaveValue('S001');
    });

    test('パスワードに入力できる', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      const passwordInput = screen.getByLabelText(/パスワード/);
      await user.type(passwordInput, 'password123');

      expect(passwordInput).toHaveValue('password123');
    });

    test('Enterキーでフォーム送信できる', async () => {
      const user = userEvent.setup();

      const mockResponse: ApiSuccessResponse<LoginResponse> = {
        status: 'success',
        data: {
          user: {
            sales_id: 'user-id-1',
            sales_code: 'S001',
            sales_name: '佐藤花子',
            email: 'sato@example.com',
            department: '営業1課',
            is_manager: false,
          },
          session_id: 'session-id-1',
        },
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      render(<LoginPage />);

      const salesCodeInput = screen.getByLabelText(/営業コード/);
      const passwordInput = screen.getByLabelText(/パスワード/);

      await user.type(salesCodeInput, 'S001');
      await user.type(passwordInput, 'password123');

      // Enterキーを押す
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sales_code: 'S001',
            password: 'password123',
          }),
        });
      });
    });

    test('ログインボタンをクリックして送信できる', async () => {
      const user = userEvent.setup();

      const mockResponse: ApiSuccessResponse<LoginResponse> = {
        status: 'success',
        data: {
          user: {
            sales_id: 'user-id-1',
            sales_code: 'S001',
            sales_name: '佐藤花子',
            email: 'sato@example.com',
            department: '営業1課',
            is_manager: false,
          },
          session_id: 'session-id-1',
        },
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      render(<LoginPage />);

      const salesCodeInput = screen.getByLabelText(/営業コード/);
      const passwordInput = screen.getByLabelText(/パスワード/);
      const button = screen.getByRole('button', { name: 'ログイン' });

      await user.type(salesCodeInput, 'S001');
      await user.type(passwordInput, 'password123');
      await user.click(button);

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sales_code: 'S001',
            password: 'password123',
          }),
        });
      });
    });

    test('入力フィールドをクリアできる', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      const salesCodeInput = screen.getByLabelText(/営業コード/);
      const passwordInput = screen.getByLabelText(/パスワード/);

      await user.type(salesCodeInput, 'S001');
      await user.type(passwordInput, 'password123');

      expect(salesCodeInput).toHaveValue('S001');
      expect(passwordInput).toHaveValue('password123');

      await user.clear(salesCodeInput);
      await user.clear(passwordInput);

      expect(salesCodeInput).toHaveValue('');
      expect(passwordInput).toHaveValue('');
    });

    test('複数回ログインを試行できる', async () => {
      const user = userEvent.setup();

      // 1回目は失敗
      const mockErrorResponse: ApiErrorResponse = {
        status: 'error',
        error: {
          code: 'INVALID_CREDENTIALS',
          message: '営業コードまたはパスワードが正しくありません',
        },
      };

      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => mockErrorResponse,
      });

      render(<LoginPage />);

      const salesCodeInput = screen.getByLabelText(/営業コード/);
      const passwordInput = screen.getByLabelText(/パスワード/);
      const button = screen.getByRole('button', { name: 'ログイン' });

      // 1回目のログイン試行
      await user.type(salesCodeInput, 'S001');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(button);

      await waitFor(() => {
        expect(
          screen.getByText('営業コードまたはパスワードが正しくありません')
        ).toBeInTheDocument();
      });

      // 2回目は成功
      const mockSuccessResponse: ApiSuccessResponse<LoginResponse> = {
        status: 'success',
        data: {
          user: {
            sales_id: 'user-id-1',
            sales_code: 'S001',
            sales_name: '佐藤花子',
            email: 'sato@example.com',
            department: '営業1課',
            is_manager: false,
          },
          session_id: 'session-id-1',
        },
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockSuccessResponse,
      });

      // 2回目のログイン試行
      await user.clear(passwordInput);
      await user.type(passwordInput, 'correctpassword');
      await user.click(button);

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/');
      });

      // fetchが2回呼ばれたことを確認
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });

  // ===== 6. エッジケースとセキュリティ =====
  describe('エッジケースとセキュリティ', () => {
    test('パスワードフィールドはマスクされている', () => {
      render(<LoginPage />);
      const passwordInput = screen.getByLabelText(/パスワード/);
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    test('オートコンプリート属性が正しく設定されている', () => {
      render(<LoginPage />);
      const salesCodeInput = screen.getByLabelText(/営業コード/);
      const passwordInput = screen.getByLabelText(/パスワード/);

      expect(salesCodeInput).toHaveAttribute('autoComplete', 'username');
      expect(passwordInput).toHaveAttribute('autoComplete', 'current-password');
    });

    test('入力フィールドにname属性が設定されている', () => {
      render(<LoginPage />);
      const salesCodeInput = screen.getByLabelText(/営業コード/);
      const passwordInput = screen.getByLabelText(/パスワード/);

      expect(salesCodeInput).toHaveAttribute('name', 'salesCode');
      expect(passwordInput).toHaveAttribute('name', 'password');
    });

    test('特殊文字を含む営業コードが入力できる', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      const salesCodeInput = screen.getByLabelText(/営業コード/);
      await user.type(salesCodeInput, 'S-001_TEST');

      expect(salesCodeInput).toHaveValue('S-001_TEST');
    });

    test('長いパスワードが入力できる', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      const passwordInput = screen.getByLabelText(/パスワード/);
      const longPassword = 'a'.repeat(100);
      await user.type(passwordInput, longPassword);

      expect(passwordInput).toHaveValue(longPassword);
    });

    test('日本語を含む営業コードは受け入れられる', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      const salesCodeInput = screen.getByLabelText(/営業コード/);
      await user.type(salesCodeInput, '営業001');

      expect(salesCodeInput).toHaveValue('営業001');
    });
  });
});
