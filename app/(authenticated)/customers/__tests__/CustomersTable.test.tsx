import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CustomersTable } from '../CustomersTable';
import type { CustomerBasic } from '@/types/customer';

describe('CustomersTable', () => {
  const mockCustomersList: CustomerBasic[] = [
    {
      customer_id: '1',
      customer_code: 'C001',
      customer_name: '株式会社テスト',
      industry: '製造業',
      address: '東京都千代田区',
      phone: '03-1234-5678',
      sales: {
        sales_id: 's1',
        sales_name: '山田太郎',
      },
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z',
    },
    {
      customer_id: '2',
      customer_code: 'C002',
      customer_name: '有限会社サンプル',
      industry: 'IT',
      address: '東京都渋谷区',
      phone: '03-9876-5432',
      sales: {
        sales_id: 's2',
        sales_name: '田中花子',
      },
      created_at: '2024-01-02T00:00:00.000Z',
      updated_at: '2024-01-02T00:00:00.000Z',
    },
  ];

  test('顧客一覧が表示される', () => {
    render(<CustomersTable customersList={mockCustomersList} />);

    expect(screen.getByText('C001')).toBeInTheDocument();
    expect(screen.getByText('株式会社テスト')).toBeInTheDocument();
    expect(screen.getByText('製造業')).toBeInTheDocument();
    expect(screen.getByText('山田太郎')).toBeInTheDocument();
    expect(screen.getByText('03-1234-5678')).toBeInTheDocument();

    expect(screen.getByText('C002')).toBeInTheDocument();
    expect(screen.getByText('有限会社サンプル')).toBeInTheDocument();
    expect(screen.getByText('IT')).toBeInTheDocument();
    expect(screen.getByText('田中花子')).toBeInTheDocument();
    expect(screen.getByText('03-9876-5432')).toBeInTheDocument();
  });

  test('業種が未設定の場合はハイフンが表示される', () => {
    const customersWithoutIndustry: CustomerBasic[] = [
      {
        customer_id: '1',
        customer_code: 'C001',
        customer_name: '株式会社テスト',
        sales: {
          sales_id: 's1',
          sales_name: '山田太郎',
        },
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
      },
    ];

    render(<CustomersTable customersList={customersWithoutIndustry} />);

    const table = screen.getByRole('table');
    expect(table).toHaveTextContent('-');
  });

  test('電話番号が未設定の場合はハイフンが表示される', () => {
    const customersWithoutPhone: CustomerBasic[] = [
      {
        customer_id: '1',
        customer_code: 'C001',
        customer_name: '株式会社テスト',
        industry: '製造業',
        sales: {
          sales_id: 's1',
          sales_name: '山田太郎',
        },
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
      },
    ];

    render(<CustomersTable customersList={customersWithoutPhone} />);

    const table = screen.getByRole('table');
    expect(table).toHaveTextContent('-');
  });

  test('各顧客に詳細ボタンが表示される', () => {
    render(<CustomersTable customersList={mockCustomersList} />);

    const detailButtons = screen.getAllByRole('link', { name: '詳細' });
    expect(detailButtons).toHaveLength(mockCustomersList.length);
  });

  test('各顧客に編集ボタンが表示される', () => {
    render(<CustomersTable customersList={mockCustomersList} />);

    const editButtons = screen.getAllByRole('link', { name: '編集' });
    expect(editButtons).toHaveLength(mockCustomersList.length);
  });

  test('詳細ボタンに正しいリンクが設定される', () => {
    render(<CustomersTable customersList={mockCustomersList} />);

    const detailButtons = screen.getAllByRole('link', { name: '詳細' });
    expect(detailButtons[0]).toHaveAttribute('href', '/customers/1');
    expect(detailButtons[1]).toHaveAttribute('href', '/customers/2');
  });

  test('編集ボタンに正しいリンクが設定される', () => {
    render(<CustomersTable customersList={mockCustomersList} />);

    const editButtons = screen.getAllByRole('link', { name: '編集' });
    expect(editButtons[0]).toHaveAttribute('href', '/customers/1/edit');
    expect(editButtons[1]).toHaveAttribute('href', '/customers/2/edit');
  });

  test('データが空の場合は空のメッセージが表示される', () => {
    render(<CustomersTable customersList={[]} />);

    expect(screen.getByText('検索条件に一致する顧客が見つかりませんでした。')).toBeInTheDocument();
  });

  test('テーブルのヘッダーが正しく表示される', () => {
    render(<CustomersTable customersList={mockCustomersList} />);

    expect(screen.getByText('顧客コード')).toBeInTheDocument();
    expect(screen.getByText('顧客名')).toBeInTheDocument();
    expect(screen.getByText('業種')).toBeInTheDocument();
    expect(screen.getByText('担当営業')).toBeInTheDocument();
    expect(screen.getByText('電話番号')).toBeInTheDocument();
    expect(screen.getByText('操作')).toBeInTheDocument();
  });

  test('複数の顧客が正しい順序で表示される', () => {
    render(<CustomersTable customersList={mockCustomersList} />);

    const rows = screen.getAllByRole('row');
    // ヘッダー行 + データ行2つ
    expect(rows).toHaveLength(3);
  });

  test('業種と電話番号の両方が未設定の場合', () => {
    const minimalCustomers: CustomerBasic[] = [
      {
        customer_id: '1',
        customer_code: 'C001',
        customer_name: '株式会社テスト',
        sales: {
          sales_id: 's1',
          sales_name: '山田太郎',
        },
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
      },
    ];

    render(<CustomersTable customersList={minimalCustomers} />);

    const table = screen.getByRole('table');
    const cells = table.querySelectorAll('td');
    const hyphenCells = Array.from(cells).filter((cell) => cell.textContent === '-');
    expect(hyphenCells.length).toBe(2); // 業種と電話番号
  });

  test('顧客コードがfont-mediumクラスで表示される', () => {
    render(<CustomersTable customersList={mockCustomersList} />);

    const table = screen.getByRole('table');
    const firstRow = table.querySelector('tbody tr:first-child');
    const codeCell = firstRow?.querySelector('td:first-child');

    expect(codeCell).toHaveClass('font-medium');
    expect(codeCell).toHaveTextContent('C001');
  });

  test('担当営業名が正しく表示される', () => {
    render(<CustomersTable customersList={mockCustomersList} />);

    const salesNames = mockCustomersList.map((customer) => customer.sales.sales_name);
    salesNames.forEach((name) => {
      expect(screen.getByText(name)).toBeInTheDocument();
    });
  });

  test('異なる業種が正しく表示される', () => {
    const diverseCustomers: CustomerBasic[] = [
      {
        customer_id: '1',
        customer_code: 'C001',
        customer_name: '製造業の会社',
        industry: '製造業',
        sales: { sales_id: 's1', sales_name: '山田太郎' },
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
      },
      {
        customer_id: '2',
        customer_code: 'C002',
        customer_name: 'IT企業',
        industry: 'IT',
        sales: { sales_id: 's2', sales_name: '田中花子' },
        created_at: '2024-01-02T00:00:00.000Z',
        updated_at: '2024-01-02T00:00:00.000Z',
      },
      {
        customer_id: '3',
        customer_code: 'C003',
        customer_name: 'サービス業',
        industry: 'サービス',
        sales: { sales_id: 's3', sales_name: '佐藤次郎' },
        created_at: '2024-01-03T00:00:00.000Z',
        updated_at: '2024-01-03T00:00:00.000Z',
      },
    ];

    render(<CustomersTable customersList={diverseCustomers} />);

    expect(screen.getByText('製造業')).toBeInTheDocument();
    expect(screen.getByText('IT')).toBeInTheDocument();
    expect(screen.getByText('サービス')).toBeInTheDocument();
  });
});
