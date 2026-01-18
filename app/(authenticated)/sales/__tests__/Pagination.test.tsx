import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter, useSearchParams } from 'next/navigation';
import { Pagination } from '../Pagination';

// Next.js navigationのモック
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

describe('Pagination', () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as ReturnType<typeof vi.fn>).mockReturnValue({ push: mockPush });
    (useSearchParams as ReturnType<typeof vi.fn>).mockReturnValue({
      toString: vi.fn().mockReturnValue(''),
    });
  });

  test('総ページ数が1以下の場合は何も表示しない', () => {
    const { container } = render(<Pagination currentPage={1} totalPages={1} totalItems={10} />);
    expect(container.firstChild).toBeNull();
  });

  test('ページネーションが正しく表示される', () => {
    render(<Pagination currentPage={1} totalPages={5} totalItems={100} />);

    expect(screen.getByText('全 100 件中 1 - 20 件を表示')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '前へ' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '次へ' })).toBeInTheDocument();
  });

  test('最初のページでは前へボタンが無効になる', () => {
    render(<Pagination currentPage={1} totalPages={5} totalItems={100} />);

    const prevButton = screen.getByRole('button', { name: '前へ' });
    expect(prevButton).toBeDisabled();
  });

  test('最後のページでは次へボタンが無効になる', () => {
    render(<Pagination currentPage={5} totalPages={5} totalItems={100} />);

    const nextButton = screen.getByRole('button', { name: '次へ' });
    expect(nextButton).toBeDisabled();
  });

  test('次へボタンをクリックすると次のページに遷移する', async () => {
    const user = userEvent.setup();
    render(<Pagination currentPage={1} totalPages={5} totalItems={100} />);

    const nextButton = screen.getByRole('button', { name: '次へ' });
    await user.click(nextButton);

    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('page=2'));
  });

  test('前へボタンをクリックすると前のページに遷移する', async () => {
    const user = userEvent.setup();
    render(<Pagination currentPage={3} totalPages={5} totalItems={100} />);

    const prevButton = screen.getByRole('button', { name: '前へ' });
    await user.click(prevButton);

    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('page=2'));
  });

  test('ページ番号ボタンをクリックすると該当ページに遷移する', async () => {
    const user = userEvent.setup();
    render(<Pagination currentPage={1} totalPages={5} totalItems={100} />);

    const page3Button = screen.getByRole('button', { name: '3' });
    await user.click(page3Button);

    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('page=3'));
  });

  test('現在のページ番号がハイライトされる', () => {
    render(<Pagination currentPage={3} totalPages={5} totalItems={100} />);

    const currentPageButton = screen.getByRole('button', { name: '3' });
    expect(currentPageButton).toHaveClass('bg-blue-600');
  });

  test('表示件数の計算が正しい（中間ページ）', () => {
    render(<Pagination currentPage={2} totalPages={5} totalItems={100} />);

    expect(screen.getByText('全 100 件中 21 - 40 件を表示')).toBeInTheDocument();
  });

  test('表示件数の計算が正しい（最終ページで端数がある場合）', () => {
    render(<Pagination currentPage={3} totalPages={3} totalItems={50} />);

    expect(screen.getByText('全 50 件中 41 - 50 件を表示')).toBeInTheDocument();
  });

  test('ページ番号が多い場合は省略記号が表示される', () => {
    render(<Pagination currentPage={5} totalPages={10} totalItems={200} />);

    const ellipses = screen.getAllByText('...');
    expect(ellipses.length).toBeGreaterThan(0);
  });

  test('最初と最後のページ番号は常に表示される', () => {
    render(<Pagination currentPage={5} totalPages={10} totalItems={200} />);

    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '10' })).toBeInTheDocument();
  });

  test('現在のページ周辺のページ番号が表示される', () => {
    render(<Pagination currentPage={5} totalPages={10} totalItems={200} />);

    expect(screen.getByRole('button', { name: '3' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '4' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '5' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '6' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '7' })).toBeInTheDocument();
  });

  test('検索パラメータが保持されたままページ遷移する', async () => {
    const user = userEvent.setup();
    (useSearchParams as ReturnType<typeof vi.fn>).mockReturnValue({
      toString: vi.fn().mockReturnValue('sales_name=test&department=営業1課'),
    });

    render(<Pagination currentPage={1} totalPages={3} totalItems={60} />);

    const nextButton = screen.getByRole('button', { name: '次へ' });
    await user.click(nextButton);

    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('sales_name=test'));
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('page=2'));
  });

  test('総ページ数が2の場合、ページ番号1と2のみ表示される', () => {
    render(<Pagination currentPage={1} totalPages={2} totalItems={40} />);

    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '2' })).toBeInTheDocument();
    expect(screen.queryByText('...')).not.toBeInTheDocument();
  });
});
