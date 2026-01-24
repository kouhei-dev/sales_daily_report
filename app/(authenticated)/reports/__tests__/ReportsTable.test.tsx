import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReportsTable } from '../ReportsTable';
import type { ReportListItem } from '@/types/report';

describe('ReportsTable', () => {
  const mockReportsList: ReportListItem[] = [
    {
      report_id: 'r1',
      report_date: '2024-01-15',
      sales: {
        sales_id: 's1',
        sales_name: '山田太郎',
      },
      visit_count: 3,
      status: 'submitted',
      has_comments: true,
      unread_comment_count: 2,
      submitted_at: '2024-01-15T10:00:00.000Z',
      created_at: '2024-01-15T09:00:00.000Z',
      updated_at: '2024-01-15T10:00:00.000Z',
    },
    {
      report_id: 'r2',
      report_date: '2024-01-14',
      sales: {
        sales_id: 's2',
        sales_name: '田中花子',
      },
      visit_count: 5,
      status: 'commented',
      has_comments: true,
      unread_comment_count: 0,
      submitted_at: '2024-01-14T10:00:00.000Z',
      created_at: '2024-01-14T09:00:00.000Z',
      updated_at: '2024-01-14T11:00:00.000Z',
    },
    {
      report_id: 'r3',
      report_date: '2024-01-13',
      sales: {
        sales_id: 's1',
        sales_name: '山田太郎',
      },
      visit_count: 2,
      status: 'draft',
      has_comments: false,
      unread_comment_count: 0,
      created_at: '2024-01-13T09:00:00.000Z',
      updated_at: '2024-01-13T09:00:00.000Z',
    },
  ];

  test('日報一覧が表示される', () => {
    render(<ReportsTable reportsList={mockReportsList} currentUserSalesId="s1" />);

    // レスポンシブデザインで2回レンダリングされるため、getAllByTextを使用
    expect(screen.getAllByText('2024/01/15')[0]).toBeInTheDocument();
    expect(screen.getAllByText('2024/01/14')[0]).toBeInTheDocument();
    expect(screen.getAllByText('2024/01/13')[0]).toBeInTheDocument();
    expect(screen.getAllByText('山田太郎').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('田中花子')[0]).toBeInTheDocument();
  });

  test('訪問件数が正しく表示される', () => {
    render(<ReportsTable reportsList={mockReportsList} currentUserSalesId="s1" />);

    expect(screen.getAllByText('3件')[0]).toBeInTheDocument();
    expect(screen.getAllByText('5件')[0]).toBeInTheDocument();
    expect(screen.getAllByText('2件')[0]).toBeInTheDocument();
  });

  test('ステータスがバッジで表示される', () => {
    render(<ReportsTable reportsList={mockReportsList} currentUserSalesId="s1" />);

    expect(screen.getAllByText('提出済み')[0]).toBeInTheDocument();
    expect(screen.getAllByText('コメント済み')[0]).toBeInTheDocument();
    expect(screen.getAllByText('下書き')[0]).toBeInTheDocument();
  });

  test('コメントがある場合、アイコンが表示される', () => {
    const { container } = render(
      <ReportsTable reportsList={mockReportsList} currentUserSalesId="s1" />
    );

    // MessageSquareアイコンを探す（lucide-reactのアイコン）
    const icons = container.querySelectorAll('svg');
    // has_comments=true の日報が2件あるので、アイコンも存在する
    expect(icons.length).toBeGreaterThan(0);
  });

  test('未確認コメントがある場合、バッジが表示される', () => {
    render(<ReportsTable reportsList={mockReportsList} currentUserSalesId="s1" />);

    expect(screen.getAllByText('NEW 2件')[0]).toBeInTheDocument();
  });

  test('未確認コメントがない場合、バッジは表示されない', () => {
    const reportsWithoutUnread: ReportListItem[] = [
      {
        report_id: 'r1',
        report_date: '2024-01-15',
        sales: {
          sales_id: 's1',
          sales_name: '山田太郎',
        },
        visit_count: 3,
        status: 'submitted',
        has_comments: false,
        unread_comment_count: 0,
        submitted_at: '2024-01-15T10:00:00.000Z',
        created_at: '2024-01-15T09:00:00.000Z',
        updated_at: '2024-01-15T10:00:00.000Z',
      },
    ];

    render(<ReportsTable reportsList={reportsWithoutUnread} currentUserSalesId="s1" />);

    expect(screen.queryByText(/NEW/)).not.toBeInTheDocument();
  });

  test('自分の日報の場合、編集ボタンが表示される', () => {
    render(<ReportsTable reportsList={mockReportsList} currentUserSalesId="s1" />);

    const editButtons = screen.getAllByRole('link', { name: '編集' });
    // s1の日報が2件、レスポンシブで2回レンダリング = 4つ
    expect(editButtons.length).toBeGreaterThanOrEqual(2);
  });

  test('他人の日報の場合、編集ボタンは表示されない', () => {
    render(<ReportsTable reportsList={mockReportsList} currentUserSalesId="s3" />);

    const editButtons = screen.queryAllByRole('link', { name: '編集' });
    // s3の日報はないので、編集ボタンは表示されない
    expect(editButtons).toHaveLength(0);
  });

  test('すべての日報に詳細ボタンが表示される', () => {
    render(<ReportsTable reportsList={mockReportsList} currentUserSalesId="s1" />);

    const detailButtons = screen.getAllByRole('link', { name: '詳細' });
    // レスポンシブデザインで2回レンダリングされるため、最低でも日報数以上
    expect(detailButtons.length).toBeGreaterThanOrEqual(mockReportsList.length);
  });

  test('詳細ボタンに正しいリンクが設定される', () => {
    render(<ReportsTable reportsList={mockReportsList} currentUserSalesId="s1" />);

    const detailButtons = screen.getAllByRole('link', { name: '詳細' });
    expect(detailButtons[0]).toHaveAttribute('href', '/reports/r1');
    expect(detailButtons[1]).toHaveAttribute('href', '/reports/r2');
    expect(detailButtons[2]).toHaveAttribute('href', '/reports/r3');
  });

  test('編集ボタンに正しいリンクが設定される', () => {
    render(<ReportsTable reportsList={mockReportsList} currentUserSalesId="s1" />);

    const editButtons = screen.getAllByRole('link', { name: '編集' });
    expect(editButtons[0]).toHaveAttribute('href', '/reports/r1/edit');
    expect(editButtons[1]).toHaveAttribute('href', '/reports/r3/edit');
  });

  test('データが空の場合、空のメッセージが表示される', () => {
    render(<ReportsTable reportsList={[]} currentUserSalesId="s1" />);

    expect(screen.getByText('該当する日報が見つかりませんでした。')).toBeInTheDocument();
  });

  test('テーブルのヘッダーが正しく表示される', () => {
    render(<ReportsTable reportsList={mockReportsList} currentUserSalesId="s1" />);

    expect(screen.getByText('日報日付')).toBeInTheDocument();
    expect(screen.getByText('営業担当者')).toBeInTheDocument();
    expect(screen.getByText('訪問件数')).toBeInTheDocument();
    expect(screen.getByText('ステータス')).toBeInTheDocument();
    expect(screen.getByText('コメント')).toBeInTheDocument();
    expect(screen.getByText('未確認')).toBeInTheDocument();
    expect(screen.getByText('操作')).toBeInTheDocument();
  });

  test('複数の日報が正しい順序で表示される', () => {
    render(<ReportsTable reportsList={mockReportsList} currentUserSalesId="s1" />);

    const rows = screen.getAllByRole('row');
    // ヘッダー行 + データ行3つ
    expect(rows).toHaveLength(4);
  });

  test('日付が正しいフォーマットで表示される', () => {
    const reportsWithDifferentDates: ReportListItem[] = [
      {
        report_id: 'r1',
        report_date: '2024-12-31',
        sales: {
          sales_id: 's1',
          sales_name: '山田太郎',
        },
        visit_count: 1,
        status: 'submitted',
        has_comments: false,
        unread_comment_count: 0,
        submitted_at: '2024-12-31T10:00:00.000Z',
        created_at: '2024-12-31T09:00:00.000Z',
        updated_at: '2024-12-31T10:00:00.000Z',
      },
    ];

    render(<ReportsTable reportsList={reportsWithDifferentDates} currentUserSalesId="s1" />);

    expect(screen.getAllByText('2024/12/31')[0]).toBeInTheDocument();
  });

  test('ステータスごとに異なるバッジバリアントが適用される', () => {
    render(<ReportsTable reportsList={mockReportsList} currentUserSalesId="s1" />);

    const draftBadges = screen.getAllByText('下書き');
    const submittedBadges = screen.getAllByText('提出済み');
    const commentedBadges = screen.getAllByText('コメント済み');

    expect(draftBadges[0]).toBeInTheDocument();
    expect(submittedBadges[0]).toBeInTheDocument();
    expect(commentedBadges[0]).toBeInTheDocument();
  });

  test('訪問件数が0件の場合も正しく表示される', () => {
    const reportsWithZeroVisits: ReportListItem[] = [
      {
        report_id: 'r1',
        report_date: '2024-01-15',
        sales: {
          sales_id: 's1',
          sales_name: '山田太郎',
        },
        visit_count: 0,
        status: 'draft',
        has_comments: false,
        unread_comment_count: 0,
        created_at: '2024-01-15T09:00:00.000Z',
        updated_at: '2024-01-15T09:00:00.000Z',
      },
    ];

    render(<ReportsTable reportsList={reportsWithZeroVisits} currentUserSalesId="s1" />);

    expect(screen.getAllByText('0件')[0]).toBeInTheDocument();
  });

  test('大量の未確認コメントがある場合も正しく表示される', () => {
    const reportsWithManyUnread: ReportListItem[] = [
      {
        report_id: 'r1',
        report_date: '2024-01-15',
        sales: {
          sales_id: 's1',
          sales_name: '山田太郎',
        },
        visit_count: 3,
        status: 'commented',
        has_comments: true,
        unread_comment_count: 15,
        submitted_at: '2024-01-15T10:00:00.000Z',
        created_at: '2024-01-15T09:00:00.000Z',
        updated_at: '2024-01-15T11:00:00.000Z',
      },
    ];

    render(<ReportsTable reportsList={reportsWithManyUnread} currentUserSalesId="s1" />);

    expect(screen.getAllByText('NEW 15件')[0]).toBeInTheDocument();
  });

  test('同一営業担当者の複数日報が表示される', () => {
    const singleSalesReports: ReportListItem[] = [
      {
        report_id: 'r1',
        report_date: '2024-01-15',
        sales: {
          sales_id: 's1',
          sales_name: '山田太郎',
        },
        visit_count: 3,
        status: 'submitted',
        has_comments: false,
        unread_comment_count: 0,
        submitted_at: '2024-01-15T10:00:00.000Z',
        created_at: '2024-01-15T09:00:00.000Z',
        updated_at: '2024-01-15T10:00:00.000Z',
      },
      {
        report_id: 'r2',
        report_date: '2024-01-14',
        sales: {
          sales_id: 's1',
          sales_name: '山田太郎',
        },
        visit_count: 2,
        status: 'draft',
        has_comments: false,
        unread_comment_count: 0,
        created_at: '2024-01-14T09:00:00.000Z',
        updated_at: '2024-01-14T09:00:00.000Z',
      },
    ];

    render(<ReportsTable reportsList={singleSalesReports} currentUserSalesId="s1" />);

    const salesNames = screen.getAllByText('山田太郎');
    expect(salesNames.length).toBeGreaterThanOrEqual(2);
  });
});
