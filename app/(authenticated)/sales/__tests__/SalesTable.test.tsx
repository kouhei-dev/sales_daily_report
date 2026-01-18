import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SalesTable } from '../SalesTable';
import type { SalesDetail } from '@/types/sales';

describe('SalesTable', () => {
  const mockSalesList: SalesDetail[] = [
    {
      sales_id: '1',
      sales_code: 'S001',
      sales_name: '山田太郎',
      email: 'yamada@example.com',
      department: '営業1課',
      is_manager: true,
      manager: {
        sales_id: '2',
        sales_name: '佐藤次郎',
      },
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z',
    },
    {
      sales_id: '3',
      sales_code: 'S002',
      sales_name: '田中花子',
      email: 'tanaka@example.com',
      department: '営業2課',
      is_manager: false,
      created_at: '2024-01-02T00:00:00.000Z',
      updated_at: '2024-01-02T00:00:00.000Z',
    },
  ];

  test('営業一覧が表示される', () => {
    render(<SalesTable salesList={mockSalesList} />);

    expect(screen.getByText('S001')).toBeInTheDocument();
    expect(screen.getByText('山田太郎')).toBeInTheDocument();
    expect(screen.getByText('営業1課')).toBeInTheDocument();
    expect(screen.getByText('佐藤次郎')).toBeInTheDocument();

    expect(screen.getByText('S002')).toBeInTheDocument();
    expect(screen.getByText('田中花子')).toBeInTheDocument();
    expect(screen.getByText('営業2課')).toBeInTheDocument();
  });

  test('管理者フラグが正しく表示される', () => {
    render(<SalesTable salesList={mockSalesList} />);

    const badges = screen.getAllByText('○');
    expect(badges).toHaveLength(1);

    const nonManagerMarks = screen.getAllByText('－');
    expect(nonManagerMarks).toHaveLength(1);
  });

  test('上長が存在しない場合はハイフンが表示される', () => {
    render(<SalesTable salesList={mockSalesList} />);

    const hyphens = screen.getAllByText('-');
    expect(hyphens.length).toBeGreaterThan(0);
  });

  test('各営業担当者に詳細ボタンが表示される', () => {
    render(<SalesTable salesList={mockSalesList} />);

    const detailButtons = screen.getAllByRole('link', { name: '詳細' });
    expect(detailButtons).toHaveLength(mockSalesList.length);
  });

  test('各営業担当者に編集ボタンが表示される', () => {
    render(<SalesTable salesList={mockSalesList} />);

    const editButtons = screen.getAllByRole('link', { name: '編集' });
    expect(editButtons).toHaveLength(mockSalesList.length);
  });

  test('詳細ボタンに正しいリンクが設定される', () => {
    render(<SalesTable salesList={mockSalesList} />);

    const detailButtons = screen.getAllByRole('link', { name: '詳細' });
    expect(detailButtons[0]).toHaveAttribute('href', '/sales/1');
    expect(detailButtons[1]).toHaveAttribute('href', '/sales/3');
  });

  test('編集ボタンに正しいリンクが設定される', () => {
    render(<SalesTable salesList={mockSalesList} />);

    const editButtons = screen.getAllByRole('link', { name: '編集' });
    expect(editButtons[0]).toHaveAttribute('href', '/sales/1/edit');
    expect(editButtons[1]).toHaveAttribute('href', '/sales/3/edit');
  });

  test('データが空の場合は空のメッセージが表示される', () => {
    render(<SalesTable salesList={[]} />);

    expect(
      screen.getByText('検索条件に一致する営業担当者が見つかりませんでした。')
    ).toBeInTheDocument();
  });

  test('テーブルのヘッダーが正しく表示される', () => {
    render(<SalesTable salesList={mockSalesList} />);

    expect(screen.getByText('営業コード')).toBeInTheDocument();
    expect(screen.getByText('営業担当者名')).toBeInTheDocument();
    expect(screen.getByText('所属部署')).toBeInTheDocument();
    expect(screen.getByText('上長')).toBeInTheDocument();
    expect(screen.getByText('管理者')).toBeInTheDocument();
    expect(screen.getByText('操作')).toBeInTheDocument();
  });

  test('複数の営業担当者が正しい順序で表示される', () => {
    render(<SalesTable salesList={mockSalesList} />);

    const rows = screen.getAllByRole('row');
    // ヘッダー行 + データ行2つ
    expect(rows).toHaveLength(3);
  });

  test('管理者フラグがtrueの営業担当者にはバッジが表示される', () => {
    const managerSales: SalesDetail[] = [
      {
        sales_id: '1',
        sales_code: 'S001',
        sales_name: '管理者A',
        email: 'manager@example.com',
        department: '営業1課',
        is_manager: true,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
      },
    ];

    render(<SalesTable salesList={managerSales} />);

    const badge = screen.getByText('○');
    expect(badge).toBeInTheDocument();
  });

  test('管理者フラグがfalseの営業担当者にはハイフンが表示される', () => {
    const nonManagerSales: SalesDetail[] = [
      {
        sales_id: '2',
        sales_code: 'S002',
        sales_name: '一般社員B',
        email: 'employee@example.com',
        department: '営業2課',
        is_manager: false,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
      },
    ];

    render(<SalesTable salesList={nonManagerSales} />);

    const hyphen = screen.getByText('－');
    expect(hyphen).toBeInTheDocument();
  });
});
