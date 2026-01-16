import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { Select } from '@/components/ui/select';

describe('Select', () => {
  test('セレクトボックスが表示される', () => {
    render(
      <Select aria-label="都道府県">
        <option value="">選択してください</option>
        <option value="tokyo">東京都</option>
        <option value="osaka">大阪府</option>
      </Select>
    );

    expect(screen.getByRole('combobox', { name: '都道府県' })).toBeInTheDocument();
  });

  test('選択肢が表示される', () => {
    render(
      <Select aria-label="色">
        <option value="red">赤</option>
        <option value="blue">青</option>
        <option value="green">緑</option>
      </Select>
    );

    expect(screen.getByRole('option', { name: '赤' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '青' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '緑' })).toBeInTheDocument();
  });

  test('選択肢を選択できる', async () => {
    const user = userEvent.setup();
    render(
      <Select aria-label="果物">
        <option value="">選択してください</option>
        <option value="apple">りんご</option>
        <option value="banana">バナナ</option>
      </Select>
    );

    const select = screen.getByRole('combobox', { name: '果物' });
    await user.selectOptions(select, 'apple');

    expect(select).toHaveValue('apple');
  });

  test('changeイベントが発火する', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(
      <Select onChange={handleChange} aria-label="サイズ">
        <option value="s">S</option>
        <option value="m">M</option>
        <option value="l">L</option>
      </Select>
    );

    const select = screen.getByRole('combobox', { name: 'サイズ' });
    await user.selectOptions(select, 'm');

    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  test('disabled状態で選択できない', async () => {
    const user = userEvent.setup();
    render(
      <Select disabled aria-label="無効なセレクト">
        <option value="a">A</option>
        <option value="b">B</option>
      </Select>
    );

    const select = screen.getByRole('combobox', { name: '無効なセレクト' });
    await user.selectOptions(select, 'b');

    expect(select).toBeDisabled();
    expect(select).not.toHaveValue('b');
  });

  test('error propsでエラー状態のスタイルが適用される', () => {
    render(
      <Select error aria-label="エラーセレクト">
        <option value="1">選択肢1</option>
      </Select>
    );

    const select = screen.getByRole('combobox', { name: 'エラーセレクト' });
    expect(select).toHaveClass('border-red-500');
  });

  test('カスタムclassNameが適用される', () => {
    render(
      <Select className="custom-class" aria-label="カスタム">
        <option value="1">選択肢</option>
      </Select>
    );

    const select = screen.getByRole('combobox', { name: 'カスタム' });
    expect(select).toHaveClass('custom-class');
  });

  test('required属性が正しく設定される', () => {
    render(
      <Select required aria-label="必須セレクト">
        <option value="">選択してください</option>
        <option value="1">選択肢1</option>
      </Select>
    );

    expect(screen.getByRole('combobox', { name: '必須セレクト' })).toBeRequired();
  });

  test('defaultValueで初期値が設定される', () => {
    render(
      <Select defaultValue="b" aria-label="初期値付き">
        <option value="a">A</option>
        <option value="b">B</option>
        <option value="c">C</option>
      </Select>
    );

    expect(screen.getByRole('combobox', { name: '初期値付き' })).toHaveValue('b');
  });

  test('valueとonChangeで制御されたコンポーネントとして動作する', async () => {
    const user = userEvent.setup();
    const TestComponent = () => {
      const [value, setValue] = React.useState('');
      return (
        <Select value={value} onChange={(e) => setValue(e.target.value)} aria-label="制御された">
          <option value="">選択してください</option>
          <option value="x">X</option>
          <option value="y">Y</option>
        </Select>
      );
    };

    render(<TestComponent />);
    const select = screen.getByRole('combobox', { name: '制御された' });

    await user.selectOptions(select, 'x');
    expect(select).toHaveValue('x');

    await user.selectOptions(select, 'y');
    expect(select).toHaveValue('y');
  });

  test('複数の選択肢から正しい値を選べる', async () => {
    const user = userEvent.setup();
    render(
      <Select aria-label="月">
        <option value="1">1月</option>
        <option value="2">2月</option>
        <option value="3">3月</option>
        <option value="4">4月</option>
        <option value="5">5月</option>
      </Select>
    );

    const select = screen.getByRole('combobox', { name: '月' });

    await user.selectOptions(select, '3');
    expect(select).toHaveValue('3');

    await user.selectOptions(select, '5');
    expect(select).toHaveValue('5');
  });

  test('focusイベントが発火する', async () => {
    const user = userEvent.setup();
    const handleFocus = vi.fn();

    render(
      <Select onFocus={handleFocus} aria-label="フォーカス">
        <option value="1">選択肢</option>
      </Select>
    );

    const select = screen.getByRole('combobox', { name: 'フォーカス' });
    await user.click(select);

    expect(handleFocus).toHaveBeenCalledTimes(1);
  });

  test('blurイベントが発火する', async () => {
    const user = userEvent.setup();
    const handleBlur = vi.fn();

    render(
      <Select onBlur={handleBlur} aria-label="ブラー">
        <option value="1">選択肢</option>
      </Select>
    );

    const select = screen.getByRole('combobox', { name: 'ブラー' });
    await user.click(select);
    await user.tab();

    expect(handleBlur).toHaveBeenCalledTimes(1);
  });

  test('select要素として正しくレンダリングされる', () => {
    const { container } = render(
      <Select aria-label="テスト">
        <option value="1">選択肢</option>
      </Select>
    );

    const select = container.querySelector('select');
    expect(select).toBeInTheDocument();
  });
});
