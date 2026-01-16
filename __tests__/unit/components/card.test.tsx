import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';

describe('Card', () => {
  test('Cardコンポーネントが表示される', () => {
    render(<Card data-testid="card">カード内容</Card>);
    expect(screen.getByTestId('card')).toBeInTheDocument();
    expect(screen.getByText('カード内容')).toBeInTheDocument();
  });

  test('CardのカスタムclassNameが適用される', () => {
    render(
      <Card className="custom-card" data-testid="card">
        内容
      </Card>
    );
    expect(screen.getByTestId('card')).toHaveClass('custom-card');
  });

  test('CardHeaderが表示される', () => {
    render(<CardHeader data-testid="card-header">ヘッダー</CardHeader>);
    expect(screen.getByTestId('card-header')).toBeInTheDocument();
    expect(screen.getByText('ヘッダー')).toBeInTheDocument();
  });

  test('CardTitleが表示される', () => {
    render(<CardTitle>タイトル</CardTitle>);
    expect(screen.getByText('タイトル')).toBeInTheDocument();
  });

  test('CardTitleがh3要素としてレンダリングされる', () => {
    const { container } = render(<CardTitle>見出し</CardTitle>);
    const heading = container.querySelector('h3');
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('見出し');
  });

  test('CardDescriptionが表示される', () => {
    render(<CardDescription>説明文</CardDescription>);
    expect(screen.getByText('説明文')).toBeInTheDocument();
  });

  test('CardContentが表示される', () => {
    render(<CardContent data-testid="card-content">コンテンツ</CardContent>);
    expect(screen.getByTestId('card-content')).toBeInTheDocument();
    expect(screen.getByText('コンテンツ')).toBeInTheDocument();
  });

  test('CardFooterが表示される', () => {
    render(<CardFooter data-testid="card-footer">フッター</CardFooter>);
    expect(screen.getByTestId('card-footer')).toBeInTheDocument();
    expect(screen.getByText('フッター')).toBeInTheDocument();
  });

  test('完全なCard構造をレンダリングできる', () => {
    render(
      <Card data-testid="full-card">
        <CardHeader>
          <CardTitle>カードタイトル</CardTitle>
          <CardDescription>カードの説明文</CardDescription>
        </CardHeader>
        <CardContent>
          <p>カードのメインコンテンツ</p>
        </CardContent>
        <CardFooter>
          <button>アクション</button>
        </CardFooter>
      </Card>
    );

    expect(screen.getByTestId('full-card')).toBeInTheDocument();
    expect(screen.getByText('カードタイトル')).toBeInTheDocument();
    expect(screen.getByText('カードの説明文')).toBeInTheDocument();
    expect(screen.getByText('カードのメインコンテンツ')).toBeInTheDocument();
    expect(screen.getByText('アクション')).toBeInTheDocument();
  });

  test('複数のCardを並べて表示できる', () => {
    render(
      <div>
        <Card data-testid="card1">
          <CardTitle>カード1</CardTitle>
        </Card>
        <Card data-testid="card2">
          <CardTitle>カード2</CardTitle>
        </Card>
        <Card data-testid="card3">
          <CardTitle>カード3</CardTitle>
        </Card>
      </div>
    );

    expect(screen.getByTestId('card1')).toBeInTheDocument();
    expect(screen.getByTestId('card2')).toBeInTheDocument();
    expect(screen.getByTestId('card3')).toBeInTheDocument();
  });

  test('CardContentに複雑なコンテンツを含められる', () => {
    render(
      <Card>
        <CardContent>
          <div>
            <h4>サブ見出し</h4>
            <p>段落1</p>
            <p>段落2</p>
            <ul>
              <li>アイテム1</li>
              <li>アイテム2</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    );

    expect(screen.getByText('サブ見出し')).toBeInTheDocument();
    expect(screen.getByText('段落1')).toBeInTheDocument();
    expect(screen.getByText('段落2')).toBeInTheDocument();
    expect(screen.getByText('アイテム1')).toBeInTheDocument();
    expect(screen.getByText('アイテム2')).toBeInTheDocument();
  });

  test('CardHeaderなしでも動作する', () => {
    render(
      <Card data-testid="card-no-header">
        <CardContent>ヘッダーなしのカード</CardContent>
      </Card>
    );

    expect(screen.getByTestId('card-no-header')).toBeInTheDocument();
    expect(screen.getByText('ヘッダーなしのカード')).toBeInTheDocument();
  });

  test('CardFooterなしでも動作する', () => {
    render(
      <Card data-testid="card-no-footer">
        <CardHeader>
          <CardTitle>タイトル</CardTitle>
        </CardHeader>
        <CardContent>フッターなしのカード</CardContent>
      </Card>
    );

    expect(screen.getByTestId('card-no-footer')).toBeInTheDocument();
    expect(screen.getByText('フッターなしのカード')).toBeInTheDocument();
  });

  test('各パーツにカスタムclassNameが適用される', () => {
    render(
      <Card data-testid="card">
        <CardHeader className="custom-header" data-testid="header">
          <CardTitle className="custom-title">タイトル</CardTitle>
          <CardDescription className="custom-desc">説明</CardDescription>
        </CardHeader>
        <CardContent className="custom-content" data-testid="content">
          内容
        </CardContent>
        <CardFooter className="custom-footer" data-testid="footer">
          フッター
        </CardFooter>
      </Card>
    );

    expect(screen.getByTestId('header')).toHaveClass('custom-header');
    expect(screen.getByText('タイトル')).toHaveClass('custom-title');
    expect(screen.getByText('説明')).toHaveClass('custom-desc');
    expect(screen.getByTestId('content')).toHaveClass('custom-content');
    expect(screen.getByTestId('footer')).toHaveClass('custom-footer');
  });
});
