import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { Textarea } from '@/components/ui/textarea';

describe('Textarea', () => {
  test('テキストエリアが表示される', () => {
    render(<Textarea placeholder="コメントを入力" />);
    expect(screen.getByPlaceholderText('コメントを入力')).toBeInTheDocument();
  });

  test('複数行のテキストを入力できる', async () => {
    const user = userEvent.setup();
    render(<Textarea placeholder="メッセージ" />);

    const textarea = screen.getByPlaceholderText('メッセージ');
    const multiLineText = '1行目\n2行目\n3行目';
    await user.type(textarea, multiLineText);

    expect(textarea).toHaveValue(multiLineText);
  });

  test('changeイベントが発火する', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<Textarea onChange={handleChange} placeholder="入力" />);

    const textarea = screen.getByPlaceholderText('入力');
    await user.type(textarea, 'test');

    expect(handleChange).toHaveBeenCalledTimes(4); // t, e, s, t の4回
  });

  test('disabled状態で入力できない', async () => {
    const user = userEvent.setup();
    render(<Textarea disabled placeholder="入力不可" />);

    const textarea = screen.getByPlaceholderText('入力不可');
    await user.type(textarea, 'test');

    expect(textarea).toHaveValue('');
    expect(textarea).toBeDisabled();
  });

  test('error propsでエラー状態のスタイルが適用される', () => {
    render(<Textarea error placeholder="エラー入力" />);
    const textarea = screen.getByPlaceholderText('エラー入力');
    expect(textarea).toHaveClass('border-red-500');
  });

  test('カスタムclassNameが適用される', () => {
    render(<Textarea className="custom-class" placeholder="カスタム" />);
    const textarea = screen.getByPlaceholderText('カスタム');
    expect(textarea).toHaveClass('custom-class');
  });

  test('required属性が正しく設定される', () => {
    render(<Textarea required placeholder="必須入力" />);
    expect(screen.getByPlaceholderText('必須入力')).toBeRequired();
  });

  test('maxLength属性が正しく設定される', () => {
    render(<Textarea maxLength={100} placeholder="最大100文字" />);
    expect(screen.getByPlaceholderText('最大100文字')).toHaveAttribute('maxLength', '100');
  });

  test('rows属性で行数を指定できる', () => {
    render(<Textarea rows={5} placeholder="5行" />);
    expect(screen.getByPlaceholderText('5行')).toHaveAttribute('rows', '5');
  });

  test('defaultValueで初期値が設定される', () => {
    render(<Textarea defaultValue="初期テキスト" placeholder="入力" />);
    expect(screen.getByPlaceholderText('入力')).toHaveValue('初期テキスト');
  });

  test('valueとonChangeで制御されたコンポーネントとして動作する', async () => {
    const user = userEvent.setup();
    const TestComponent = () => {
      const [value, setValue] = React.useState('');
      return (
        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="制御された入力"
        />
      );
    };

    render(<TestComponent />);
    const textarea = screen.getByPlaceholderText('制御された入力');

    await user.type(textarea, 'テスト');
    expect(textarea).toHaveValue('テスト');
  });

  test('focusイベントが発火する', async () => {
    const user = userEvent.setup();
    const handleFocus = vi.fn();

    render(<Textarea onFocus={handleFocus} placeholder="フォーカス" />);

    const textarea = screen.getByPlaceholderText('フォーカス');
    await user.click(textarea);

    expect(handleFocus).toHaveBeenCalledTimes(1);
  });

  test('blurイベントが発火する', async () => {
    const user = userEvent.setup();
    const handleBlur = vi.fn();

    render(<Textarea onBlur={handleBlur} placeholder="ブラー" />);

    const textarea = screen.getByPlaceholderText('ブラー');
    await user.click(textarea);
    await user.tab(); // フォーカスを外す

    expect(handleBlur).toHaveBeenCalledTimes(1);
  });

  test('readOnly属性で読み取り専用になる', async () => {
    const user = userEvent.setup();
    render(<Textarea readOnly value="読み取り専用" placeholder="読み取り専用" />);

    const textarea = screen.getByPlaceholderText('読み取り専用');
    await user.type(textarea, 'test');

    expect(textarea).toHaveValue('読み取り専用');
  });

  test('空文字列を入力できる', async () => {
    const user = userEvent.setup();
    render(<Textarea defaultValue="初期値" placeholder="クリア可能" />);

    const textarea = screen.getByPlaceholderText('クリア可能');
    await user.clear(textarea);

    expect(textarea).toHaveValue('');
  });

  test('長いテキストを入力できる', async () => {
    const user = userEvent.setup();
    render(<Textarea placeholder="長文入力" />);

    const textarea = screen.getByPlaceholderText('長文入力');
    const longText = 'これは非常に長いテキストです。'.repeat(20);
    await user.type(textarea, longText);

    expect(textarea).toHaveValue(longText);
  });

  test('textarea要素として正しくレンダリングされる', () => {
    const { container } = render(<Textarea placeholder="テスト" />);
    const textarea = container.querySelector('textarea');
    expect(textarea).toBeInTheDocument();
  });
});
