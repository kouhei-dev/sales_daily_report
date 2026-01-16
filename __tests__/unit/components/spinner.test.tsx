import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Spinner } from '@/components/ui/spinner';

describe('Spinner', () => {
  test('スピナーが表示される', () => {
    render(<Spinner />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  test('aria-labelが設定されている', () => {
    render(<Spinner />);
    expect(screen.getByLabelText('読み込み中')).toBeInTheDocument();
  });

  test('スクリーンリーダー用のテキストが含まれる', () => {
    render(<Spinner />);
    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
  });

  test('デフォルトサイズはmd', () => {
    render(<Spinner />);
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('h-8');
    expect(spinner).toHaveClass('w-8');
  });

  test('size="sm"が適用される', () => {
    render(<Spinner size="sm" />);
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('h-4');
    expect(spinner).toHaveClass('w-4');
  });

  test('size="md"が適用される', () => {
    render(<Spinner size="md" />);
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('h-8');
    expect(spinner).toHaveClass('w-8');
  });

  test('size="lg"が適用される', () => {
    render(<Spinner size="lg" />);
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('h-12');
    expect(spinner).toHaveClass('w-12');
  });

  test('カスタムclassNameが適用される', () => {
    render(<Spinner className="custom-spinner" />);
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('custom-spinner');
  });

  test('animate-spinクラスが適用されている', () => {
    render(<Spinner />);
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('animate-spin');
  });

  test('複数のスピナーを表示できる', () => {
    render(
      <div>
        <Spinner size="sm" data-testid="spinner-1" />
        <Spinner size="md" data-testid="spinner-2" />
        <Spinner size="lg" data-testid="spinner-3" />
      </div>
    );

    expect(screen.getByTestId('spinner-1')).toBeInTheDocument();
    expect(screen.getByTestId('spinner-2')).toBeInTheDocument();
    expect(screen.getByTestId('spinner-3')).toBeInTheDocument();
  });

  test('カスタムaria-labelを設定できる', () => {
    render(<Spinner aria-label="データ取得中" />);
    expect(screen.getByLabelText('データ取得中')).toBeInTheDocument();
  });

  test('実際のユースケース: ローディングボタン', () => {
    render(
      <button disabled>
        <Spinner size="sm" />
        <span>送信中...</span>
      </button>
    );

    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('送信中...')).toBeInTheDocument();
  });

  test('実際のユースケース: ページローディング', () => {
    render(
      <div className="flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );

    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('h-12', 'w-12');
  });

  test('実際のユースケース: インラインローディング', () => {
    render(
      <p>
        データを読み込んでいます <Spinner size="sm" />
      </p>
    );

    expect(screen.getByText('データを読み込んでいます')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
