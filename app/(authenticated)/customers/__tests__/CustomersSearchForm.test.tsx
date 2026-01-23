import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter, useSearchParams } from 'next/navigation';
import { CustomersSearchForm } from '../CustomersSearchForm';

// Next.js navigationのモック
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

describe('CustomersSearchForm', () => {
  const mockPush = vi.fn();
  const salesList = ['山田太郎', '田中花子', '佐藤次郎'];

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as ReturnType<typeof vi.fn>).mockReturnValue({ push: mockPush });
    (useSearchParams as ReturnType<typeof vi.fn>).mockReturnValue({
      get: vi.fn().mockReturnValue(null),
    });
  });

  test('検索フォームの全ての入力項目が表示される', () => {
    render(<CustomersSearchForm salesList={salesList} />);

    expect(screen.getByLabelText('顧客名')).toBeInTheDocument();
    expect(screen.getByLabelText('顧客コード')).toBeInTheDocument();
    expect(screen.getByLabelText('担当営業')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '検索' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'クリア' })).toBeInTheDocument();
  });

  test('顧客名を入力できる', async () => {
    const user = userEvent.setup();
    render(<CustomersSearchForm salesList={salesList} />);

    const input = screen.getByLabelText('顧客名');
    await user.type(input, '株式会社テスト');

    expect(input).toHaveValue('株式会社テスト');
  });

  test('顧客コードを入力できる', async () => {
    const user = userEvent.setup();
    render(<CustomersSearchForm salesList={salesList} />);

    const input = screen.getByLabelText('顧客コード');
    await user.type(input, 'C001');

    expect(input).toHaveValue('C001');
  });

  test('担当営業のデフォルトオプションが表示される', () => {
    render(<CustomersSearchForm salesList={salesList} />);

    const select = screen.getByLabelText('担当営業') as HTMLSelectElement;
    expect(select).toBeInTheDocument();
    expect(select.value).toBe('');
  });

  test('検索ボタンをクリックすると検索が実行される', async () => {
    const user = userEvent.setup();
    render(<CustomersSearchForm salesList={salesList} />);

    const nameInput = screen.getByLabelText('顧客名');
    const codeInput = screen.getByLabelText('顧客コード');

    await user.type(nameInput, '株式会社テスト');
    await user.type(codeInput, 'C001');

    const searchButton = screen.getByRole('button', { name: '検索' });
    await user.click(searchButton);

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining(
        'customer_name=%E6%A0%AA%E5%BC%8F%E4%BC%9A%E7%A4%BE%E3%83%86%E3%82%B9%E3%83%88'
      )
    );
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('customer_code=C001'));
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('page=1'));
  });

  test('空白のみの入力値は検索パラメータに含まれない', async () => {
    const user = userEvent.setup();
    render(<CustomersSearchForm salesList={salesList} />);

    const nameInput = screen.getByLabelText('顧客名');
    await user.type(nameInput, '   ');

    const searchButton = screen.getByRole('button', { name: '検索' });
    await user.click(searchButton);

    expect(mockPush).toHaveBeenCalledWith(expect.not.stringContaining('customer_name'));
  });

  test('クリアボタンをクリックすると入力値がリセットされる', async () => {
    const user = userEvent.setup();
    render(<CustomersSearchForm salesList={salesList} />);

    const nameInput = screen.getByLabelText('顧客名');
    const codeInput = screen.getByLabelText('顧客コード');

    await user.type(nameInput, '株式会社テスト');
    await user.type(codeInput, 'C001');

    const clearButton = screen.getByRole('button', { name: 'クリア' });
    await user.click(clearButton);

    expect(nameInput).toHaveValue('');
    expect(codeInput).toHaveValue('');
    expect(mockPush).toHaveBeenCalledWith('/customers');
  });

  test('URLパラメータから初期値を復元する', () => {
    (useSearchParams as ReturnType<typeof vi.fn>).mockReturnValue({
      get: vi.fn((key: string) => {
        const params: Record<string, string> = {
          customer_name: '有限会社サンプル',
          customer_code: 'C002',
          sales_name: '田中花子',
        };
        return params[key] || null;
      }),
    });

    render(<CustomersSearchForm salesList={salesList} />);

    expect(screen.getByLabelText('顧客名')).toHaveValue('有限会社サンプル');
    expect(screen.getByLabelText('顧客コード')).toHaveValue('C002');
    expect(screen.getByLabelText('担当営業')).toHaveValue('田中花子');
  });

  test('フォームの送信時にデフォルトのページが1にリセットされる', async () => {
    const user = userEvent.setup();
    (useSearchParams as ReturnType<typeof vi.fn>).mockReturnValue({
      get: vi.fn((key: string) => {
        return key === 'page' ? '3' : null;
      }),
    });

    render(<CustomersSearchForm salesList={salesList} />);

    const searchButton = screen.getByRole('button', { name: '検索' });
    await user.click(searchButton);

    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('page=1'));
  });

  test('複数の営業担当者選択肢が提供される', () => {
    render(<CustomersSearchForm salesList={salesList} />);

    const select = screen.getByLabelText('担当営業') as HTMLSelectElement;
    const options = Array.from(select.options).map((opt) => opt.value);

    expect(options).toContain('');
    expect(options).toContain('山田太郎');
    expect(options).toContain('田中花子');
    expect(options).toContain('佐藤次郎');
  });

  test('担当営業を選択して検索できる', async () => {
    const user = userEvent.setup();
    render(<CustomersSearchForm salesList={salesList} />);

    const select = screen.getByLabelText('担当営業') as HTMLSelectElement;
    await user.selectOptions(select, '山田太郎');

    const searchButton = screen.getByRole('button', { name: '検索' });
    await user.click(searchButton);

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining('sales_name=%E5%B1%B1%E7%94%B0%E5%A4%AA%E9%83%8E')
    );
  });

  test('複数条件を組み合わせて検索できる', async () => {
    const user = userEvent.setup();
    render(<CustomersSearchForm salesList={salesList} />);

    const nameInput = screen.getByLabelText('顧客名');
    const codeInput = screen.getByLabelText('顧客コード');
    const select = screen.getByLabelText('担当営業') as HTMLSelectElement;

    await user.type(nameInput, 'テスト');
    await user.type(codeInput, 'C0');
    await user.selectOptions(select, '田中花子');

    const searchButton = screen.getByRole('button', { name: '検索' });
    await user.click(searchButton);

    const calledUrl = mockPush.mock.calls[0][0];
    expect(calledUrl).toContain('customer_name');
    expect(calledUrl).toContain('customer_code=C0');
    expect(calledUrl).toContain('sales_name');
    expect(calledUrl).toContain('page=1');
  });

  test('空の営業担当者リストでもフォームが表示される', () => {
    render(<CustomersSearchForm salesList={[]} />);

    const select = screen.getByLabelText('担当営業') as HTMLSelectElement;
    expect(select).toBeInTheDocument();

    const options = Array.from(select.options);
    expect(options.length).toBe(1); // "全て"のみ
    expect(options[0].value).toBe('');
  });
});
