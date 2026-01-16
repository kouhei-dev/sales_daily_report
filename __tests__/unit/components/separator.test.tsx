import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Separator } from '@/components/ui/separator';

describe('Separator', () => {
  test('セパレーターが表示される', () => {
    render(<Separator />);
    expect(screen.getByRole('separator')).toBeInTheDocument();
  });

  test('デフォルトのorientationはhorizontal', () => {
    render(<Separator />);
    const separator = screen.getByRole('separator');
    expect(separator).toHaveAttribute('aria-orientation', 'horizontal');
    expect(separator).toHaveClass('h-[1px]');
    expect(separator).toHaveClass('w-full');
  });

  test('orientation="horizontal"が適用される', () => {
    render(<Separator orientation="horizontal" />);
    const separator = screen.getByRole('separator');
    expect(separator).toHaveAttribute('aria-orientation', 'horizontal');
    expect(separator).toHaveClass('h-[1px]');
    expect(separator).toHaveClass('w-full');
  });

  test('orientation="vertical"が適用される', () => {
    render(<Separator orientation="vertical" />);
    const separator = screen.getByRole('separator');
    expect(separator).toHaveAttribute('aria-orientation', 'vertical');
    expect(separator).toHaveClass('h-full');
    expect(separator).toHaveClass('w-[1px]');
  });

  test('カスタムclassNameが適用される', () => {
    render(<Separator className="custom-separator" />);
    const separator = screen.getByRole('separator');
    expect(separator).toHaveClass('custom-separator');
  });

  test('背景色クラスが適用されている', () => {
    render(<Separator />);
    const separator = screen.getByRole('separator');
    expect(separator).toHaveClass('bg-gray-200');
  });

  test('実際のユースケース: コンテンツの区切り', () => {
    render(
      <div>
        <div>セクション1</div>
        <Separator />
        <div>セクション2</div>
      </div>
    );

    expect(screen.getByText('セクション1')).toBeInTheDocument();
    expect(screen.getByRole('separator')).toBeInTheDocument();
    expect(screen.getByText('セクション2')).toBeInTheDocument();
  });

  test('実際のユースケース: メニューの区切り', () => {
    render(
      <nav>
        <a href="#home">ホーム</a>
        <Separator orientation="vertical" />
        <a href="#about">会社概要</a>
        <Separator orientation="vertical" />
        <a href="#contact">お問い合わせ</a>
      </nav>
    );

    const separators = screen.getAllByRole('separator');
    expect(separators).toHaveLength(2);
    separators.forEach((separator) => {
      expect(separator).toHaveAttribute('aria-orientation', 'vertical');
    });
  });

  test('実際のユースケース: カード内の区切り', () => {
    render(
      <div>
        <h2>タイトル</h2>
        <Separator className="my-4" />
        <p>本文コンテンツ</p>
      </div>
    );

    const separator = screen.getByRole('separator');
    expect(separator).toHaveClass('my-4');
  });

  test('複数のセパレーターを配置できる', () => {
    render(
      <div>
        <div>項目1</div>
        <Separator />
        <div>項目2</div>
        <Separator />
        <div>項目3</div>
        <Separator />
        <div>項目4</div>
      </div>
    );

    const separators = screen.getAllByRole('separator');
    expect(separators).toHaveLength(3);
  });

  test('カスタム色のセパレーターを表示できる', () => {
    render(<Separator className="bg-blue-500" />);
    const separator = screen.getByRole('separator');
    expect(separator).toHaveClass('bg-blue-500');
  });

  test('太いセパレーターを表示できる', () => {
    render(<Separator className="h-[2px]" />);
    const separator = screen.getByRole('separator');
    expect(separator).toHaveClass('h-[2px]');
  });
});
