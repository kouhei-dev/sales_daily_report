import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

describe('Label', () => {
  test('テキストが表示される', () => {
    render(<Label>ユーザー名</Label>);
    expect(screen.getByText('ユーザー名')).toBeInTheDocument();
  });

  test('htmlFor属性でinputと関連付けられる', () => {
    render(
      <div>
        <Label htmlFor="username">ユーザー名</Label>
        <Input id="username" placeholder="入力してください" />
      </div>
    );

    const label = screen.getByText('ユーザー名');
    expect(label).toHaveAttribute('for', 'username');
  });

  test('ラベルをクリックすると関連するinputにフォーカスされる', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <Label htmlFor="email">メールアドレス</Label>
        <Input id="email" placeholder="email@example.com" />
      </div>
    );

    const label = screen.getByText('メールアドレス');
    const input = screen.getByPlaceholderText('email@example.com');

    await user.click(label);

    expect(input).toHaveFocus();
  });

  test('required propsで必須マークが表示される', () => {
    render(<Label required>必須項目</Label>);

    expect(screen.getByText('必須項目')).toBeInTheDocument();
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  test('required propsがfalseの場合は必須マークが表示されない', () => {
    render(<Label required={false}>任意項目</Label>);

    expect(screen.getByText('任意項目')).toBeInTheDocument();
    expect(screen.queryByText('*')).not.toBeInTheDocument();
  });

  test('カスタムclassNameが適用される', () => {
    render(<Label className="custom-label">カスタム</Label>);
    const label = screen.getByText('カスタム');
    expect(label).toHaveClass('custom-label');
  });

  test('子要素としてReactノードを含められる', () => {
    render(
      <Label>
        <span>アイコン</span>
        <span>ラベルテキスト</span>
      </Label>
    );

    expect(screen.getByText('アイコン')).toBeInTheDocument();
    expect(screen.getByText('ラベルテキスト')).toBeInTheDocument();
  });

  test('複数のinputと組み合わせて使用できる', () => {
    render(
      <form>
        <div>
          <Label htmlFor="firstName">名</Label>
          <Input id="firstName" />
        </div>
        <div>
          <Label htmlFor="lastName">姓</Label>
          <Input id="lastName" />
        </div>
      </form>
    );

    expect(screen.getByText('名')).toHaveAttribute('for', 'firstName');
    expect(screen.getByText('姓')).toHaveAttribute('for', 'lastName');
  });

  test('clickイベントが発火する', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<Label onClick={handleClick}>クリック可能</Label>);

    await user.click(screen.getByText('クリック可能'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('label要素として正しくレンダリングされる', () => {
    const { container } = render(<Label>テスト</Label>);
    const label = container.querySelector('label');
    expect(label).toBeInTheDocument();
  });
});
