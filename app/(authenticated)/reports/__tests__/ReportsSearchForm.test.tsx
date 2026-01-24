import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter, useSearchParams } from 'next/navigation';
import { ReportsSearchForm } from '../ReportsSearchForm';

// Next.js navigationのモック
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

describe('ReportsSearchForm', () => {
  const mockPush = vi.fn();
  const salesList = [
    { sales_id: 's1', sales_name: '山田太郎' },
    { sales_id: 's2', sales_name: '田中花子' },
    { sales_id: 's3', sales_name: '佐藤次郎' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as ReturnType<typeof vi.fn>).mockReturnValue({ push: mockPush });
    (useSearchParams as ReturnType<typeof vi.fn>).mockReturnValue({
      get: vi.fn().mockReturnValue(null),
    });
  });

  test('検索フォームの全ての入力項目が表示される', () => {
    render(<ReportsSearchForm salesList={salesList} currentUserSalesId="s1" isManager={true} />);

    expect(screen.getByLabelText('対象期間（開始）')).toBeInTheDocument();
    expect(screen.getByLabelText('対象期間（終了）')).toBeInTheDocument();
    expect(screen.getByLabelText('営業担当者')).toBeInTheDocument();
    expect(screen.getByLabelText('ステータス')).toBeInTheDocument();
    expect(screen.getByLabelText('未確認コメントのみ表示')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '検索' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'クリア' })).toBeInTheDocument();
  });

  test('対象期間のデフォルト値が設定される', () => {
    render(<ReportsSearchForm salesList={salesList} currentUserSalesId="s1" isManager={true} />);

    const startDateInput = screen.getByLabelText('対象期間（開始）') as HTMLInputElement;
    const endDateInput = screen.getByLabelText('対象期間（終了）') as HTMLInputElement;

    // デフォルト値が設定されていることを確認（当月1日と当日）
    expect(startDateInput.value).toBeTruthy();
    expect(endDateInput.value).toBeTruthy();
  });

  test('管理者の場合、全ての営業担当者が選択肢に表示される', () => {
    render(<ReportsSearchForm salesList={salesList} currentUserSalesId="s1" isManager={true} />);

    const select = screen.getByLabelText('営業担当者') as HTMLSelectElement;
    const options = Array.from(select.options).map((opt) => opt.value);

    expect(options).toContain('');
    expect(options).toContain('s1');
    expect(options).toContain('s2');
    expect(options).toContain('s3');
    expect(select.disabled).toBe(false);
  });

  test('営業担当者の場合、自分のみが選択肢に表示される', () => {
    render(<ReportsSearchForm salesList={salesList} currentUserSalesId="s1" isManager={false} />);

    const select = screen.getByLabelText('営業担当者') as HTMLSelectElement;
    const options = Array.from(select.options);

    // "全て" + 自分のみ = 2つ
    expect(options.length).toBe(2);
    expect(options[1].value).toBe('s1');
    expect(select.disabled).toBe(true);
  });

  test('ステータスの選択肢が正しく表示される', () => {
    render(<ReportsSearchForm salesList={salesList} currentUserSalesId="s1" isManager={true} />);

    const select = screen.getByLabelText('ステータス') as HTMLSelectElement;
    const options = Array.from(select.options).map((opt) => opt.value);

    expect(options).toContain('');
    expect(options).toContain('draft');
    expect(options).toContain('submitted');
    expect(options).toContain('commented');
  });

  test('対象期間を変更できる', async () => {
    const user = userEvent.setup();
    render(<ReportsSearchForm salesList={salesList} currentUserSalesId="s1" isManager={true} />);

    const startDateInput = screen.getByLabelText('対象期間（開始）') as HTMLInputElement;
    const endDateInput = screen.getByLabelText('対象期間（終了）') as HTMLInputElement;

    await user.clear(startDateInput);
    await user.type(startDateInput, '2024-01-01');
    await user.clear(endDateInput);
    await user.type(endDateInput, '2024-01-31');

    expect(startDateInput.value).toBe('2024-01-01');
    expect(endDateInput.value).toBe('2024-01-31');
  });

  test('営業担当者を選択できる', async () => {
    const user = userEvent.setup();
    render(<ReportsSearchForm salesList={salesList} currentUserSalesId="s1" isManager={true} />);

    const select = screen.getByLabelText('営業担当者') as HTMLSelectElement;
    await user.selectOptions(select, 's2');

    expect(select.value).toBe('s2');
  });

  test('ステータスを選択できる', async () => {
    const user = userEvent.setup();
    render(<ReportsSearchForm salesList={salesList} currentUserSalesId="s1" isManager={true} />);

    const select = screen.getByLabelText('ステータス') as HTMLSelectElement;
    await user.selectOptions(select, 'submitted');

    expect(select.value).toBe('submitted');
  });

  test('未確認コメントチェックボックスを操作できる', async () => {
    const user = userEvent.setup();
    render(<ReportsSearchForm salesList={salesList} currentUserSalesId="s1" isManager={true} />);

    const checkbox = screen.getByLabelText('未確認コメントのみ表示') as HTMLInputElement;
    expect(checkbox.checked).toBe(false);

    await user.click(checkbox);
    expect(checkbox.checked).toBe(true);

    await user.click(checkbox);
    expect(checkbox.checked).toBe(false);
  });

  test('検索ボタンをクリックすると検索が実行される', async () => {
    const user = userEvent.setup();
    render(<ReportsSearchForm salesList={salesList} currentUserSalesId="s1" isManager={true} />);

    const startDateInput = screen.getByLabelText('対象期間（開始）') as HTMLInputElement;
    const endDateInput = screen.getByLabelText('対象期間（終了）') as HTMLInputElement;
    const salesSelect = screen.getByLabelText('営業担当者') as HTMLSelectElement;
    const statusSelect = screen.getByLabelText('ステータス') as HTMLSelectElement;

    await user.clear(startDateInput);
    await user.type(startDateInput, '2024-01-01');
    await user.clear(endDateInput);
    await user.type(endDateInput, '2024-01-31');
    await user.selectOptions(salesSelect, 's2');
    await user.selectOptions(statusSelect, 'submitted');

    const searchButton = screen.getByRole('button', { name: '検索' });
    await user.click(searchButton);

    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('start_date=2024-01-01'));
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('end_date=2024-01-31'));
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('sales_id=s2'));
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('status=submitted'));
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('page=1'));
  });

  test('未確認コメントチェックONで検索する', async () => {
    const user = userEvent.setup();
    render(<ReportsSearchForm salesList={salesList} currentUserSalesId="s1" isManager={true} />);

    const checkbox = screen.getByLabelText('未確認コメントのみ表示') as HTMLInputElement;
    await user.click(checkbox);

    const searchButton = screen.getByRole('button', { name: '検索' });
    await user.click(searchButton);

    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('has_unread_comments=true'));
  });

  test('未確認コメントチェックOFFの場合、パラメータに含まれない', async () => {
    const user = userEvent.setup();
    render(<ReportsSearchForm salesList={salesList} currentUserSalesId="s1" isManager={true} />);

    const searchButton = screen.getByRole('button', { name: '検索' });
    await user.click(searchButton);

    expect(mockPush).toHaveBeenCalledWith(expect.not.stringContaining('has_unread_comments'));
  });

  test('クリアボタンをクリックすると入力値がリセットされる', async () => {
    const user = userEvent.setup();
    render(<ReportsSearchForm salesList={salesList} currentUserSalesId="s1" isManager={true} />);

    const salesSelect = screen.getByLabelText('営業担当者') as HTMLSelectElement;
    const statusSelect = screen.getByLabelText('ステータス') as HTMLSelectElement;
    const checkbox = screen.getByLabelText('未確認コメントのみ表示') as HTMLInputElement;

    await user.selectOptions(salesSelect, 's2');
    await user.selectOptions(statusSelect, 'submitted');
    await user.click(checkbox);

    const clearButton = screen.getByRole('button', { name: 'クリア' });
    await user.click(clearButton);

    expect(salesSelect.value).toBe('');
    expect(statusSelect.value).toBe('');
    expect(checkbox.checked).toBe(false);
    expect(mockPush).toHaveBeenCalledWith('/reports');
  });

  test('URLパラメータから初期値を復元する', () => {
    (useSearchParams as ReturnType<typeof vi.fn>).mockReturnValue({
      get: vi.fn((key: string) => {
        const params: Record<string, string> = {
          start_date: '2024-01-01',
          end_date: '2024-01-31',
          sales_id: 's2',
          status: 'submitted',
          has_unread_comments: 'true',
        };
        return params[key] || null;
      }),
    });

    render(<ReportsSearchForm salesList={salesList} currentUserSalesId="s1" isManager={true} />);

    expect(screen.getByLabelText('対象期間（開始）')).toHaveValue('2024-01-01');
    expect(screen.getByLabelText('対象期間（終了）')).toHaveValue('2024-01-31');
    expect(screen.getByLabelText('営業担当者')).toHaveValue('s2');
    expect(screen.getByLabelText('ステータス')).toHaveValue('submitted');
    expect((screen.getByLabelText('未確認コメントのみ表示') as HTMLInputElement).checked).toBe(
      true
    );
  });

  test('フォームの送信時にページが1にリセットされる', async () => {
    const user = userEvent.setup();
    (useSearchParams as ReturnType<typeof vi.fn>).mockReturnValue({
      get: vi.fn((key: string) => {
        return key === 'page' ? '3' : null;
      }),
    });

    render(<ReportsSearchForm salesList={salesList} currentUserSalesId="s1" isManager={true} />);

    const searchButton = screen.getByRole('button', { name: '検索' });
    await user.click(searchButton);

    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('page=1'));
  });

  test('空の営業担当者リストでもフォームが表示される', () => {
    render(<ReportsSearchForm salesList={[]} currentUserSalesId="s1" isManager={true} />);

    const select = screen.getByLabelText('営業担当者') as HTMLSelectElement;
    expect(select).toBeInTheDocument();

    const options = Array.from(select.options);
    expect(options.length).toBe(1); // "全て"のみ
    expect(options[0].value).toBe('');
  });

  test('複数条件を組み合わせて検索できる', async () => {
    const user = userEvent.setup();
    render(<ReportsSearchForm salesList={salesList} currentUserSalesId="s1" isManager={true} />);

    const startDateInput = screen.getByLabelText('対象期間（開始）') as HTMLInputElement;
    const salesSelect = screen.getByLabelText('営業担当者') as HTMLSelectElement;
    const statusSelect = screen.getByLabelText('ステータス') as HTMLSelectElement;
    const checkbox = screen.getByLabelText('未確認コメントのみ表示') as HTMLInputElement;

    await user.clear(startDateInput);
    await user.type(startDateInput, '2024-01-01');
    await user.selectOptions(salesSelect, 's3');
    await user.selectOptions(statusSelect, 'commented');
    await user.click(checkbox);

    const searchButton = screen.getByRole('button', { name: '検索' });
    await user.click(searchButton);

    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('start_date=2024-01-01'));
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('sales_id=s3'));
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('status=commented'));
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('has_unread_comments=true'));
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('page=1'));
  });

  test('営業担当者が非管理者の場合、営業担当者プルダウンが無効化される', () => {
    render(<ReportsSearchForm salesList={salesList} currentUserSalesId="s1" isManager={false} />);

    const select = screen.getByLabelText('営業担当者') as HTMLSelectElement;
    expect(select.disabled).toBe(true);
  });
});
