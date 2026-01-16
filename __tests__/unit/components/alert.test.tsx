import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

describe('Alert', () => {
  test('デフォルトのアラートが表示される', () => {
    render(<Alert>通知メッセージ</Alert>);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('通知メッセージ')).toBeInTheDocument();
  });

  test('variant="default"が適用される', () => {
    render(<Alert variant="default">デフォルト</Alert>);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('bg-white');
  });

  test('variant="info"が適用される', () => {
    render(<Alert variant="info">情報</Alert>);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('bg-blue-50');
  });

  test('variant="success"が適用される', () => {
    render(<Alert variant="success">成功</Alert>);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('bg-green-50');
  });

  test('variant="warning"が適用される', () => {
    render(<Alert variant="warning">警告</Alert>);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('bg-yellow-50');
  });

  test('variant="danger"が適用される', () => {
    render(<Alert variant="danger">エラー</Alert>);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('bg-red-50');
  });

  test('AlertTitleが表示される', () => {
    render(
      <Alert>
        <AlertTitle>タイトル</AlertTitle>
      </Alert>
    );
    expect(screen.getByText('タイトル')).toBeInTheDocument();
  });

  test('AlertDescriptionが表示される', () => {
    render(
      <Alert>
        <AlertDescription>説明文</AlertDescription>
      </Alert>
    );
    expect(screen.getByText('説明文')).toBeInTheDocument();
  });

  test('完全なAlert構造をレンダリングできる', () => {
    render(
      <Alert variant="info">
        <AlertTitle>情報</AlertTitle>
        <AlertDescription>これは情報メッセージです。</AlertDescription>
      </Alert>
    );

    expect(screen.getByText('情報')).toBeInTheDocument();
    expect(screen.getByText('これは情報メッセージです。')).toBeInTheDocument();
  });

  test('カスタムclassNameが適用される', () => {
    render(<Alert className="custom-alert">カスタム</Alert>);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('custom-alert');
  });

  test('AlertTitleのカスタムclassNameが適用される', () => {
    render(
      <Alert>
        <AlertTitle className="custom-title">タイトル</AlertTitle>
      </Alert>
    );
    expect(screen.getByText('タイトル')).toHaveClass('custom-title');
  });

  test('AlertDescriptionのカスタムclassNameが適用される', () => {
    render(
      <Alert>
        <AlertDescription className="custom-desc">説明</AlertDescription>
      </Alert>
    );
    expect(screen.getByText('説明')).toHaveClass('custom-desc');
  });

  test('タイトルなしでも動作する', () => {
    render(
      <Alert>
        <AlertDescription>説明のみ</AlertDescription>
      </Alert>
    );
    expect(screen.getByText('説明のみ')).toBeInTheDocument();
  });

  test('説明なしでも動作する', () => {
    render(
      <Alert>
        <AlertTitle>タイトルのみ</AlertTitle>
      </Alert>
    );
    expect(screen.getByText('タイトルのみ')).toBeInTheDocument();
  });

  test('複数のアラートを並べて表示できる', () => {
    render(
      <div>
        <Alert variant="success">
          <AlertTitle>成功</AlertTitle>
        </Alert>
        <Alert variant="warning">
          <AlertTitle>警告</AlertTitle>
        </Alert>
        <Alert variant="danger">
          <AlertTitle>エラー</AlertTitle>
        </Alert>
      </div>
    );

    expect(screen.getByText('成功')).toBeInTheDocument();
    expect(screen.getByText('警告')).toBeInTheDocument();
    expect(screen.getByText('エラー')).toBeInTheDocument();
  });

  test('実際のユースケース: 成功メッセージ', () => {
    render(
      <Alert variant="success">
        <AlertTitle>保存完了</AlertTitle>
        <AlertDescription>データが正常に保存されました。</AlertDescription>
      </Alert>
    );

    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('bg-green-50');
    expect(screen.getByText('保存完了')).toBeInTheDocument();
    expect(screen.getByText('データが正常に保存されました。')).toBeInTheDocument();
  });

  test('実際のユースケース: エラーメッセージ', () => {
    render(
      <Alert variant="danger">
        <AlertTitle>エラーが発生しました</AlertTitle>
        <AlertDescription>入力内容に誤りがあります。もう一度確認してください。</AlertDescription>
      </Alert>
    );

    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('bg-red-50');
    expect(screen.getByText('エラーが発生しました')).toBeInTheDocument();
    expect(
      screen.getByText('入力内容に誤りがあります。もう一度確認してください。')
    ).toBeInTheDocument();
  });

  test('実際のユースケース: 警告メッセージ', () => {
    render(
      <Alert variant="warning">
        <AlertTitle>注意</AlertTitle>
        <AlertDescription>この操作は元に戻せません。</AlertDescription>
      </Alert>
    );

    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('bg-yellow-50');
    expect(screen.getByText('注意')).toBeInTheDocument();
    expect(screen.getByText('この操作は元に戻せません。')).toBeInTheDocument();
  });

  test('実際のユースケース: 情報メッセージ', () => {
    render(
      <Alert variant="info">
        <AlertTitle>お知らせ</AlertTitle>
        <AlertDescription>システムメンテナンスを実施します。</AlertDescription>
      </Alert>
    );

    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('bg-blue-50');
    expect(screen.getByText('お知らせ')).toBeInTheDocument();
    expect(screen.getByText('システムメンテナンスを実施します。')).toBeInTheDocument();
  });

  test('AlertDescriptionに複雑なコンテンツを含められる', () => {
    render(
      <Alert>
        <AlertTitle>詳細情報</AlertTitle>
        <AlertDescription>
          <p>段落1</p>
          <p>段落2</p>
        </AlertDescription>
      </Alert>
    );

    expect(screen.getByText('段落1')).toBeInTheDocument();
    expect(screen.getByText('段落2')).toBeInTheDocument();
  });

  test('AlertTitleがh5要素としてレンダリングされる', () => {
    const { container } = render(
      <Alert>
        <AlertTitle>見出し</AlertTitle>
      </Alert>
    );

    const heading = container.querySelector('h5');
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('見出し');
  });
});
