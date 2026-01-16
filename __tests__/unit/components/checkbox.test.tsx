import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { Checkbox } from '@/components/ui/checkbox';

describe('Checkbox', () => {
  test('チェックボックスが表示される', () => {
    render(<Checkbox aria-label="利用規約に同意する" />);
    expect(screen.getByRole('checkbox', { name: '利用規約に同意する' })).toBeInTheDocument();
  });

  test('label propsでラベル付きチェックボックスが表示される', () => {
    render(<Checkbox label="ニュースレターを受け取る" />);
    expect(screen.getByRole('checkbox', { name: 'ニュースレターを受け取る' })).toBeInTheDocument();
    expect(screen.getByText('ニュースレターを受け取る')).toBeInTheDocument();
  });

  test('チェックボックスをクリックしてチェックできる', async () => {
    const user = userEvent.setup();
    render(<Checkbox aria-label="チェック" />);

    const checkbox = screen.getByRole('checkbox', { name: 'チェック' });
    expect(checkbox).not.toBeChecked();

    await user.click(checkbox);
    expect(checkbox).toBeChecked();
  });

  test('チェック状態を切り替えられる', async () => {
    const user = userEvent.setup();
    render(<Checkbox aria-label="トグル" />);

    const checkbox = screen.getByRole('checkbox', { name: 'トグル' });

    await user.click(checkbox);
    expect(checkbox).toBeChecked();

    await user.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });

  test('changeイベントが発火する', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<Checkbox onChange={handleChange} aria-label="変更検知" />);

    const checkbox = screen.getByRole('checkbox', { name: '変更検知' });
    await user.click(checkbox);

    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  test('disabled状態でチェックできない', async () => {
    const user = userEvent.setup();
    render(<Checkbox disabled aria-label="無効なチェックボックス" />);

    const checkbox = screen.getByRole('checkbox', { name: '無効なチェックボックス' });
    await user.click(checkbox);

    expect(checkbox).not.toBeChecked();
    expect(checkbox).toBeDisabled();
  });

  test('ラベルをクリックしてチェックできる', async () => {
    const user = userEvent.setup();
    render(<Checkbox label="ラベルクリック" />);

    const label = screen.getByText('ラベルクリック');
    const checkbox = screen.getByRole('checkbox', { name: 'ラベルクリック' });

    await user.click(label);
    expect(checkbox).toBeChecked();
  });

  test('defaultCheckedで初期チェック状態を設定できる', () => {
    render(<Checkbox defaultChecked aria-label="初期チェック" />);
    expect(screen.getByRole('checkbox', { name: '初期チェック' })).toBeChecked();
  });

  test('checkedとonChangeで制御されたコンポーネントとして動作する', async () => {
    const user = userEvent.setup();
    const TestComponent = () => {
      const [checked, setChecked] = React.useState(false);
      return (
        <Checkbox
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          aria-label="制御された"
        />
      );
    };

    render(<TestComponent />);
    const checkbox = screen.getByRole('checkbox', { name: '制御された' });

    expect(checkbox).not.toBeChecked();

    await user.click(checkbox);
    expect(checkbox).toBeChecked();

    await user.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });

  test('カスタムclassNameが適用される', () => {
    render(<Checkbox className="custom-checkbox" aria-label="カスタム" />);
    const checkbox = screen.getByRole('checkbox', { name: 'カスタム' });
    expect(checkbox).toHaveClass('custom-checkbox');
  });

  test('required属性が正しく設定される', () => {
    render(<Checkbox required aria-label="必須チェック" />);
    expect(screen.getByRole('checkbox', { name: '必須チェック' })).toBeRequired();
  });

  test('value属性が正しく設定される', () => {
    render(<Checkbox value="agree" aria-label="同意" />);
    expect(screen.getByRole('checkbox', { name: '同意' })).toHaveAttribute('value', 'agree');
  });

  test('複数のチェックボックスを個別に操作できる', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <Checkbox label="オプション1" />
        <Checkbox label="オプション2" />
        <Checkbox label="オプション3" />
      </div>
    );

    const checkbox1 = screen.getByRole('checkbox', { name: 'オプション1' });
    const checkbox2 = screen.getByRole('checkbox', { name: 'オプション2' });
    const checkbox3 = screen.getByRole('checkbox', { name: 'オプション3' });

    await user.click(checkbox1);
    await user.click(checkbox3);

    expect(checkbox1).toBeChecked();
    expect(checkbox2).not.toBeChecked();
    expect(checkbox3).toBeChecked();
  });

  test('キーボード操作でチェックできる', async () => {
    const user = userEvent.setup();
    render(<Checkbox label="キーボード操作" />);

    const checkbox = screen.getByRole('checkbox', { name: 'キーボード操作' });
    checkbox.focus();

    await user.keyboard(' '); // スペースキーで切り替え
    expect(checkbox).toBeChecked();

    await user.keyboard(' ');
    expect(checkbox).not.toBeChecked();
  });

  test('input要素として正しくレンダリングされる', () => {
    const { container } = render(<Checkbox aria-label="テスト" />);
    const checkbox = container.querySelector('input[type="checkbox"]');
    expect(checkbox).toBeInTheDocument();
  });
});
