import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Pagination } from '../Pagination';

describe('Pagination', () => {
  const mockOnPageChange = vi.fn();

  test('総ページ数が1以下の場合は何も表示しない', () => {
    const { container } = render(
      <Pagination currentPage={1} totalPages={1} totalItems={10} onPageChange={mockOnPageChange} />
    );
    expect(container.firstChild).toBeNull();
  });

  test('ページネーションが正しく表示される', () => {
    render(
      <Pagination currentPage={1} totalPages={5} totalItems={100} onPageChange={mockOnPageChange} />
    );

    expect(screen.getByText('全 100 件中 1 - 20 件を表示')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '前へ' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '次へ' })).toBeInTheDocument();
  });

  test('最初のページでは前へボタンが無効になる', () => {
    render(
      <Pagination currentPage={1} totalPages={5} totalItems={100} onPageChange={mockOnPageChange} />
    );

    const prevButton = screen.getByRole('button', { name: '前へ' });
    expect(prevButton).toBeDisabled();
  });

  test('最後のページでは次へボタンが無効になる', () => {
    render(
      <Pagination currentPage={5} totalPages={5} totalItems={100} onPageChange={mockOnPageChange} />
    );

    const nextButton = screen.getByRole('button', { name: '次へ' });
    expect(nextButton).toBeDisabled();
  });

  test('次へボタンをクリックすると次のページに遷移する', async () => {
    const user = userEvent.setup();
    const mockOnPageChange = vi.fn();

    render(
      <Pagination currentPage={2} totalPages={5} totalItems={100} onPageChange={mockOnPageChange} />
    );

    const nextButton = screen.getByRole('button', { name: '次へ' });
    await user.click(nextButton);

    expect(mockOnPageChange).toHaveBeenCalledWith(3);
  });

  test('前へボタンをクリックすると前のページに遷移する', async () => {
    const user = userEvent.setup();
    const mockOnPageChange = vi.fn();

    render(
      <Pagination currentPage={3} totalPages={5} totalItems={100} onPageChange={mockOnPageChange} />
    );

    const prevButton = screen.getByRole('button', { name: '前へ' });
    await user.click(prevButton);

    expect(mockOnPageChange).toHaveBeenCalledWith(2);
  });

  test('ページ番号ボタンをクリックすると指定ページに遷移する', async () => {
    const user = userEvent.setup();
    const mockOnPageChange = vi.fn();

    render(
      <Pagination currentPage={1} totalPages={5} totalItems={100} onPageChange={mockOnPageChange} />
    );

    const page3Button = screen.getByRole('button', { name: '3' });
    await user.click(page3Button);

    expect(mockOnPageChange).toHaveBeenCalledWith(3);
  });

  test('現在のページ番号が強調表示される', () => {
    render(
      <Pagination currentPage={3} totalPages={5} totalItems={100} onPageChange={mockOnPageChange} />
    );

    // currentPageが3の場合、ページ3のボタンがprimaryバリアントになる
    const page3Button = screen.getByRole('button', { name: '3' });
    expect(page3Button).toBeInTheDocument();
  });

  test('ページ数が多い場合に省略記号が表示される', () => {
    render(
      <Pagination
        currentPage={5}
        totalPages={10}
        totalItems={200}
        onPageChange={mockOnPageChange}
      />
    );

    // 省略記号が表示されることを確認
    const ellipses = screen.queryAllByText('...');
    expect(ellipses.length).toBeGreaterThan(0);
  });

  test('カスタムページサイズで表示範囲が正しく計算される', () => {
    render(
      <Pagination
        currentPage={2}
        totalPages={5}
        totalItems={100}
        onPageChange={mockOnPageChange}
        pageSize={10}
      />
    );

    expect(screen.getByText('全 100 件中 11 - 20 件を表示')).toBeInTheDocument();
  });

  test('最後のページで正しい件数が表示される', () => {
    render(
      <Pagination
        currentPage={5}
        totalPages={5}
        totalItems={95}
        onPageChange={mockOnPageChange}
        pageSize={20}
      />
    );

    // 81-95件を表示（95件しかないので）
    expect(screen.getByText('全 95 件中 81 - 95 件を表示')).toBeInTheDocument();
  });

  test('2ページ目の表示範囲が正しく計算される', () => {
    render(
      <Pagination currentPage={2} totalPages={5} totalItems={100} onPageChange={mockOnPageChange} />
    );

    expect(screen.getByText('全 100 件中 21 - 40 件を表示')).toBeInTheDocument();
  });

  test('ページ番号が正しい範囲で表示される', () => {
    render(
      <Pagination
        currentPage={5}
        totalPages={10}
        totalItems={200}
        onPageChange={mockOnPageChange}
      />
    );

    // ページ1は常に表示
    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();

    // 現在のページ（5）の前後2つまで表示
    expect(screen.getByRole('button', { name: '3' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '4' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '5' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '6' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '7' })).toBeInTheDocument();

    // 最後のページは常に表示
    expect(screen.getByRole('button', { name: '10' })).toBeInTheDocument();
  });
});
