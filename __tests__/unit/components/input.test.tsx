import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { Input } from '@/components/ui/input';

describe('Input', () => {
  test('入力フィールドが表示される', () => {
    render(<Input placeholder="名前を入力" />);
    expect(screen.getByPlaceholderText('名前を入力')).toBeInTheDocument();
  });

  test('テキストを入力できる', async () => {
    const user = userEvent.setup();
    render(<Input placeholder="名前を入力" />);

    const input = screen.getByPlaceholderText('名前を入力');
    await user.type(input, 'テスト太郎');

    expect(input).toHaveValue('テスト太郎');
  });

  test('changeイベントが発火する', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<Input onChange={handleChange} placeholder="入力" />);

    const input = screen.getByPlaceholderText('入力');
    await user.type(input, 'abc');

    expect(handleChange).toHaveBeenCalledTimes(3); // a, b, c の3回
  });

  test('disabled状態で入力できない', async () => {
    const user = userEvent.setup();
    render(<Input disabled placeholder="入力不可" />);

    const input = screen.getByPlaceholderText('入力不可');
    await user.type(input, 'test');

    expect(input).toHaveValue('');
    expect(input).toBeDisabled();
  });

  test('type属性が正しく設定される', () => {
    const { rerender } = render(<Input type="email" placeholder="メール" />);
    expect(screen.getByPlaceholderText('メール')).toHaveAttribute('type', 'email');

    rerender(<Input type="password" placeholder="パスワード" />);
    expect(screen.getByPlaceholderText('パスワード')).toHaveAttribute('type', 'password');

    rerender(<Input type="number" placeholder="数値" />);
    expect(screen.getByPlaceholderText('数値')).toHaveAttribute('type', 'number');
  });

  test('デフォルトのtype属性はtext', () => {
    render(<Input placeholder="テキスト" />);
    expect(screen.getByPlaceholderText('テキスト')).toHaveAttribute('type', 'text');
  });

  test('error propsでエラー状態のスタイルが適用される', () => {
    render(<Input error placeholder="エラー入力" />);
    const input = screen.getByPlaceholderText('エラー入力');
    expect(input).toHaveClass('border-red-500');
  });

  test('カスタムclassNameが適用される', () => {
    render(<Input className="custom-class" placeholder="カスタム" />);
    const input = screen.getByPlaceholderText('カスタム');
    expect(input).toHaveClass('custom-class');
  });

  test('required属性が正しく設定される', () => {
    render(<Input required placeholder="必須入力" />);
    expect(screen.getByPlaceholderText('必須入力')).toBeRequired();
  });

  test('maxLength属性が正しく設定される', () => {
    render(<Input maxLength={10} placeholder="最大10文字" />);
    expect(screen.getByPlaceholderText('最大10文字')).toHaveAttribute('maxLength', '10');
  });

  test('defaultValueで初期値が設定される', () => {
    render(<Input defaultValue="初期値" placeholder="入力" />);
    expect(screen.getByPlaceholderText('入力')).toHaveValue('初期値');
  });

  test('valueとonChangeで制御されたコンポーネントとして動作する', async () => {
    const user = userEvent.setup();
    const TestComponent = () => {
      const [value, setValue] = React.useState('');
      return (
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="制御された入力"
        />
      );
    };

    render(<TestComponent />);
    const input = screen.getByPlaceholderText('制御された入力');

    await user.type(input, 'テスト');
    expect(input).toHaveValue('テスト');
  });

  test('focusイベントが発火する', async () => {
    const user = userEvent.setup();
    const handleFocus = vi.fn();

    render(<Input onFocus={handleFocus} placeholder="フォーカス" />);

    const input = screen.getByPlaceholderText('フォーカス');
    await user.click(input);

    expect(handleFocus).toHaveBeenCalledTimes(1);
  });

  test('blurイベントが発火する', async () => {
    const user = userEvent.setup();
    const handleBlur = vi.fn();

    render(<Input onBlur={handleBlur} placeholder="ブラー" />);

    const input = screen.getByPlaceholderText('ブラー');
    await user.click(input);
    await user.tab(); // フォーカスを外す

    expect(handleBlur).toHaveBeenCalledTimes(1);
  });

  test('readOnly属性で読み取り専用になる', async () => {
    const user = userEvent.setup();
    render(<Input readOnly value="読み取り専用" placeholder="読み取り専用" />);

    const input = screen.getByPlaceholderText('読み取り専用');
    await user.type(input, 'test');

    expect(input).toHaveValue('読み取り専用');
  });

  test('空文字列を入力できる', async () => {
    const user = userEvent.setup();
    render(<Input defaultValue="初期値" placeholder="クリア可能" />);

    const input = screen.getByPlaceholderText('クリア可能');
    await user.clear(input);

    expect(input).toHaveValue('');
  });
});
