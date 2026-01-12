import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@/components/ui/button';

describe('Button', () => {
  test('テキストを表示する', () => {
    render(<Button>クリック</Button>);
    expect(screen.getByRole('button', { name: 'クリック' })).toBeInTheDocument();
  });

  test('クリックイベントが発火する', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<Button onClick={handleClick}>クリック</Button>);

    const button = screen.getByRole('button', { name: 'クリック' });
    await user.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('disabled状態でクリックイベントが発火しない', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(
      <Button onClick={handleClick} disabled>
        クリック
      </Button>
    );

    const button = screen.getByRole('button', { name: 'クリック' });
    await user.click(button);

    expect(handleClick).not.toHaveBeenCalled();
  });

  test('variant="primary"が適用される', () => {
    render(<Button variant="primary">送信</Button>);
    const button = screen.getByRole('button', { name: '送信' });
    expect(button).toHaveClass('bg-blue-600');
  });

  test('variant="secondary"が適用される', () => {
    render(<Button variant="secondary">キャンセル</Button>);
    const button = screen.getByRole('button', { name: 'キャンセル' });
    expect(button).toHaveClass('bg-gray-200');
  });

  test('variant="outline"が適用される', () => {
    render(<Button variant="outline">詳細</Button>);
    const button = screen.getByRole('button', { name: '詳細' });
    expect(button).toHaveClass('border');
  });

  test('size="sm"が適用される', () => {
    render(<Button size="sm">小さい</Button>);
    const button = screen.getByRole('button', { name: '小さい' });
    expect(button).toHaveClass('h-8');
  });

  test('size="lg"が適用される', () => {
    render(<Button size="lg">大きい</Button>);
    const button = screen.getByRole('button', { name: '大きい' });
    expect(button).toHaveClass('h-12');
  });

  test('カスタムclassNameが適用される', () => {
    render(<Button className="custom-class">カスタム</Button>);
    const button = screen.getByRole('button', { name: 'カスタム' });
    expect(button).toHaveClass('custom-class');
  });

  test('type属性が正しく設定される', () => {
    render(<Button type="submit">送信</Button>);
    const button = screen.getByRole('button', { name: '送信' });
    expect(button).toHaveAttribute('type', 'submit');
  });

  test('複数回クリックできる', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<Button onClick={handleClick}>カウント</Button>);

    const button = screen.getByRole('button', { name: 'カウント' });
    await user.click(button);
    await user.click(button);
    await user.click(button);

    expect(handleClick).toHaveBeenCalledTimes(3);
  });

  test('子要素として複雑なコンテンツを含められる', () => {
    render(
      <Button>
        <span>アイコン</span>
        <span>テキスト</span>
      </Button>
    );

    expect(screen.getByText('アイコン')).toBeInTheDocument();
    expect(screen.getByText('テキスト')).toBeInTheDocument();
  });
});
