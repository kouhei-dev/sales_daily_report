import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter, useSearchParams } from 'next/navigation';
import { SalesSearchForm } from '../SalesSearchForm';

// Next.js navigationのモック
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

describe('SalesSearchForm', () => {
  const mockPush = vi.fn();
  const departments = ['営業1課', '営業2課', '営業3課'];

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as ReturnType<typeof vi.fn>).mockReturnValue({ push: mockPush });
    (useSearchParams as ReturnType<typeof vi.fn>).mockReturnValue({
      get: vi.fn().mockReturnValue(null),
    });
  });

  test('検索フォームの全ての入力項目が表示される', () => {
    render(<SalesSearchForm departments={departments} />);

    expect(screen.getByLabelText('営業担当者名')).toBeInTheDocument();
    expect(screen.getByLabelText('営業コード')).toBeInTheDocument();
    expect(screen.getByLabelText('所属部署')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '検索' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'クリア' })).toBeInTheDocument();
  });

  test('営業担当者名を入力できる', async () => {
    const user = userEvent.setup();
    render(<SalesSearchForm departments={departments} />);

    const input = screen.getByLabelText('営業担当者名');
    await user.type(input, '山田太郎');

    expect(input).toHaveValue('山田太郎');
  });

  test('営業コードを入力できる', async () => {
    const user = userEvent.setup();
    render(<SalesSearchForm departments={departments} />);

    const input = screen.getByLabelText('営業コード');
    await user.type(input, 'S001');

    expect(input).toHaveValue('S001');
  });

  test('所属部署のデフォルトオプションが表示される', () => {
    render(<SalesSearchForm departments={departments} />);

    const select = screen.getByLabelText('所属部署') as HTMLSelectElement;
    expect(select).toBeInTheDocument();
    expect(select.value).toBe('');
  });

  test('検索ボタンをクリックすると検索が実行される', async () => {
    const user = userEvent.setup();
    render(<SalesSearchForm departments={departments} />);

    const nameInput = screen.getByLabelText('営業担当者名');
    const codeInput = screen.getByLabelText('営業コード');

    await user.type(nameInput, '山田太郎');
    await user.type(codeInput, 'S001');

    const searchButton = screen.getByRole('button', { name: '検索' });
    await user.click(searchButton);

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining('sales_name=%E5%B1%B1%E7%94%B0%E5%A4%AA%E9%83%8E')
    );
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('sales_code=S001'));
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('page=1'));
  });

  test('空白のみの入力値は検索パラメータに含まれない', async () => {
    const user = userEvent.setup();
    render(<SalesSearchForm departments={departments} />);

    const nameInput = screen.getByLabelText('営業担当者名');
    await user.type(nameInput, '   ');

    const searchButton = screen.getByRole('button', { name: '検索' });
    await user.click(searchButton);

    expect(mockPush).toHaveBeenCalledWith(expect.not.stringContaining('sales_name'));
  });

  test('クリアボタンをクリックすると入力値がリセットされる', async () => {
    const user = userEvent.setup();
    render(<SalesSearchForm departments={departments} />);

    const nameInput = screen.getByLabelText('営業担当者名');
    const codeInput = screen.getByLabelText('営業コード');

    await user.type(nameInput, '山田太郎');
    await user.type(codeInput, 'S001');

    const clearButton = screen.getByRole('button', { name: 'クリア' });
    await user.click(clearButton);

    expect(nameInput).toHaveValue('');
    expect(codeInput).toHaveValue('');
    expect(mockPush).toHaveBeenCalledWith('/sales');
  });

  test('URLパラメータから初期値を復元する', () => {
    (useSearchParams as ReturnType<typeof vi.fn>).mockReturnValue({
      get: vi.fn((key: string) => {
        const params: Record<string, string> = {
          sales_name: '田中花子',
          sales_code: 'S002',
          department: '営業2課',
        };
        return params[key] || null;
      }),
    });

    render(<SalesSearchForm departments={departments} />);

    expect(screen.getByLabelText('営業担当者名')).toHaveValue('田中花子');
    expect(screen.getByLabelText('営業コード')).toHaveValue('S002');
  });

  test('フォームの送信時にデフォルトのページが1にリセットされる', async () => {
    const user = userEvent.setup();
    (useSearchParams as ReturnType<typeof vi.fn>).mockReturnValue({
      get: vi.fn((key: string) => {
        return key === 'page' ? '3' : null;
      }),
    });

    render(<SalesSearchForm departments={departments} />);

    const searchButton = screen.getByRole('button', { name: '検索' });
    await user.click(searchButton);

    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('page=1'));
  });

  test('複数の部署選択肢が提供される', () => {
    render(<SalesSearchForm departments={departments} />);

    const select = screen.getByLabelText('所属部署') as HTMLSelectElement;
    const options = Array.from(select.options).map((opt) => opt.value);

    expect(options).toContain('');
    expect(options).toContain('営業1課');
    expect(options).toContain('営業2課');
    expect(options).toContain('営業3課');
  });
});
