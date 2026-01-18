import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Header } from '../Header';
import { useRouter } from 'next/navigation';

// Mock dependencies
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

vi.mock('../UnconfirmedCommentBadge', () => ({
  UnconfirmedCommentBadge: () => <div data-testid="unconfirmed-badge">Badge</div>,
}));

// Mock global fetch
global.fetch = vi.fn();

describe('Header Component', () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
    });
  });

  it('システム名を表示する', () => {
    // Act
    render(<Header userName="山田太郎" isManager={false} />);

    // Assert
    expect(screen.getByText('営業日報システム')).toBeInTheDocument();
  });

  it('ユーザー名を表示する', () => {
    // Act
    render(<Header userName="山田太郎" isManager={false} />);

    // Assert
    expect(screen.getByText('山田太郎')).toBeInTheDocument();
  });

  it('営業担当者の場合、未確認コメントバッジを表示する', () => {
    // Act
    render(<Header userName="山田太郎" isManager={false} />);

    // Assert
    const badge = screen.getByTestId('unconfirmed-badge');
    expect(badge).toBeInTheDocument();
  });

  it('管理者の場合、未確認コメントバッジを表示しない', () => {
    // Act
    render(<Header userName="佐藤花子" isManager={true} />);

    // Assert
    const badge = screen.queryByTestId('unconfirmed-badge');
    expect(badge).not.toBeInTheDocument();
  });

  it('ログアウトボタンをクリックすると、ログアウトAPIを呼び出す', async () => {
    // Arrange
    vi.mocked(global.fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          status: 'success',
          data: {},
        }),
        { status: 200 }
      )
    );

    // Act
    render(<Header userName="山田太郎" isManager={false} />);
    const logoutButton = screen.getByRole('button', { name: /ログアウト/ });
    fireEvent.click(logoutButton);

    // Assert
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  it('ログアウト中はボタンが無効化される', async () => {
    // Arrange
    vi.mocked(global.fetch).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve(
                new Response(
                  JSON.stringify({
                    status: 'success',
                    data: {},
                  }),
                  { status: 200 }
                )
              ),
            100
          )
        )
    );

    // Act
    render(<Header userName="山田太郎" isManager={false} />);
    const logoutButton = screen.getByRole('button', { name: /ログアウト/ });
    fireEvent.click(logoutButton);

    // Assert
    expect(screen.getByText('ログアウト中...')).toBeInTheDocument();
    expect(logoutButton).toBeDisabled();

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  it('モバイルメニュートグルボタンが表示される', () => {
    // Arrange
    const mockOnMenuToggle = vi.fn();

    // Act
    render(<Header userName="山田太郎" isManager={false} onMenuToggle={mockOnMenuToggle} />);

    const toggleButton = screen.getByLabelText('メニューを開く');

    // Assert
    expect(toggleButton).toBeInTheDocument();
  });

  it('モバイルメニュートグルボタンをクリックすると、コールバックが呼ばれる', () => {
    // Arrange
    const mockOnMenuToggle = vi.fn();

    // Act
    render(<Header userName="山田太郎" isManager={false} onMenuToggle={mockOnMenuToggle} />);

    const toggleButton = screen.getByLabelText('メニューを開く');
    fireEvent.click(toggleButton);

    // Assert
    expect(mockOnMenuToggle).toHaveBeenCalledTimes(1);
  });
});
