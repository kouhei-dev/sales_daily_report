import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from '@/components/ui/badge';

describe('Badge', () => {
  test('デフォルトのバッジが表示される', () => {
    render(<Badge>新着</Badge>);
    expect(screen.getByText('新着')).toBeInTheDocument();
  });

  test('variant="default"が適用される', () => {
    render(<Badge variant="default">デフォルト</Badge>);
    const badge = screen.getByText('デフォルト');
    expect(badge).toHaveClass('bg-gray-900');
  });

  test('variant="primary"が適用される', () => {
    render(<Badge variant="primary">プライマリ</Badge>);
    const badge = screen.getByText('プライマリ');
    expect(badge).toHaveClass('bg-blue-600');
  });

  test('variant="success"が適用される', () => {
    render(<Badge variant="success">成功</Badge>);
    const badge = screen.getByText('成功');
    expect(badge).toHaveClass('bg-green-600');
  });

  test('variant="warning"が適用される', () => {
    render(<Badge variant="warning">警告</Badge>);
    const badge = screen.getByText('警告');
    expect(badge).toHaveClass('bg-yellow-500');
  });

  test('variant="danger"が適用される', () => {
    render(<Badge variant="danger">エラー</Badge>);
    const badge = screen.getByText('エラー');
    expect(badge).toHaveClass('bg-red-600');
  });

  test('variant="outline"が適用される', () => {
    render(<Badge variant="outline">アウトライン</Badge>);
    const badge = screen.getByText('アウトライン');
    expect(badge).toHaveClass('border');
  });

  test('カスタムclassNameが適用される', () => {
    render(<Badge className="custom-badge">カスタム</Badge>);
    const badge = screen.getByText('カスタム');
    expect(badge).toHaveClass('custom-badge');
  });

  test('複数のバッジを並べて表示できる', () => {
    render(
      <div>
        <Badge>タグ1</Badge>
        <Badge>タグ2</Badge>
        <Badge>タグ3</Badge>
      </div>
    );

    expect(screen.getByText('タグ1')).toBeInTheDocument();
    expect(screen.getByText('タグ2')).toBeInTheDocument();
    expect(screen.getByText('タグ3')).toBeInTheDocument();
  });

  test('子要素として複雑なコンテンツを含められる', () => {
    render(
      <Badge>
        <span>アイコン</span>
        <span>テキスト</span>
      </Badge>
    );

    expect(screen.getByText('アイコン')).toBeInTheDocument();
    expect(screen.getByText('テキスト')).toBeInTheDocument();
  });

  test('数値を表示できる', () => {
    render(<Badge>99+</Badge>);
    expect(screen.getByText('99+')).toBeInTheDocument();
  });

  test('異なるvariantのバッジを同時に表示できる', () => {
    render(
      <div>
        <Badge variant="success">承認済み</Badge>
        <Badge variant="warning">保留中</Badge>
        <Badge variant="danger">却下</Badge>
      </div>
    );

    const approvedBadge = screen.getByText('承認済み');
    const pendingBadge = screen.getByText('保留中');
    const rejectedBadge = screen.getByText('却下');

    expect(approvedBadge).toHaveClass('bg-green-600');
    expect(pendingBadge).toHaveClass('bg-yellow-500');
    expect(rejectedBadge).toHaveClass('bg-red-600');
  });

  test('aria-label属性を設定できる', () => {
    render(<Badge aria-label="通知バッジ">3</Badge>);
    const badge = screen.getByLabelText('通知バッジ');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('3');
  });

  test('実際のユースケース: ステータスバッジ', () => {
    const statuses = [
      { label: '公開', variant: 'success' as const },
      { label: '下書き', variant: 'default' as const },
      { label: '保留', variant: 'warning' as const },
      { label: '削除済み', variant: 'danger' as const },
    ];

    render(
      <div>
        {statuses.map((status, index) => (
          <Badge key={index} variant={status.variant}>
            {status.label}
          </Badge>
        ))}
      </div>
    );

    expect(screen.getByText('公開')).toBeInTheDocument();
    expect(screen.getByText('下書き')).toBeInTheDocument();
    expect(screen.getByText('保留')).toBeInTheDocument();
    expect(screen.getByText('削除済み')).toBeInTheDocument();
  });

  test('実際のユースケース: カテゴリタグ', () => {
    const categories = ['React', 'TypeScript', 'Next.js', 'Tailwind CSS'];

    render(
      <div>
        {categories.map((category) => (
          <Badge key={category} variant="outline">
            {category}
          </Badge>
        ))}
      </div>
    );

    categories.forEach((category) => {
      expect(screen.getByText(category)).toBeInTheDocument();
    });
  });

  test('空のバッジも表示できる', () => {
    const { container } = render(<Badge data-testid="empty-badge"></Badge>);
    expect(container.querySelector('[data-testid="empty-badge"]')).toBeInTheDocument();
  });

  test('長いテキストも表示できる', () => {
    const longText = 'これは非常に長いバッジテキストです';
    render(<Badge>{longText}</Badge>);
    expect(screen.getByText(longText)).toBeInTheDocument();
  });
});
