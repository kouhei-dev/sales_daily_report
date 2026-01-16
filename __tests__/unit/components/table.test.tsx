import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from '@/components/ui/table';

describe('Table', () => {
  test('基本的なテーブルが表示される', () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ヘッダー</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>データ</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );

    expect(screen.getByText('ヘッダー')).toBeInTheDocument();
    expect(screen.getByText('データ')).toBeInTheDocument();
  });

  test('複数のカラムを持つテーブルが表示される', () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>名前</TableHead>
            <TableHead>年齢</TableHead>
            <TableHead>職業</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>太郎</TableCell>
            <TableCell>25</TableCell>
            <TableCell>エンジニア</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );

    expect(screen.getByText('名前')).toBeInTheDocument();
    expect(screen.getByText('年齢')).toBeInTheDocument();
    expect(screen.getByText('職業')).toBeInTheDocument();
    expect(screen.getByText('太郎')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('エンジニア')).toBeInTheDocument();
  });

  test('複数の行を持つテーブルが表示される', () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>商品</TableHead>
            <TableHead>価格</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>商品A</TableCell>
            <TableCell>1000円</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>商品B</TableCell>
            <TableCell>2000円</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>商品C</TableCell>
            <TableCell>3000円</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );

    expect(screen.getByText('商品A')).toBeInTheDocument();
    expect(screen.getByText('1000円')).toBeInTheDocument();
    expect(screen.getByText('商品B')).toBeInTheDocument();
    expect(screen.getByText('2000円')).toBeInTheDocument();
    expect(screen.getByText('商品C')).toBeInTheDocument();
    expect(screen.getByText('3000円')).toBeInTheDocument();
  });

  test('TableCaptionが表示される', () => {
    render(
      <Table>
        <TableCaption>売上データ一覧</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>項目</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>データ</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );

    expect(screen.getByText('売上データ一覧')).toBeInTheDocument();
  });

  test('カスタムclassNameが各コンポーネントに適用される', () => {
    const { container } = render(
      <Table>
        <TableHeader className="custom-header">
          <TableRow className="custom-row">
            <TableHead className="custom-head">ヘッダー</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="custom-body">
          <TableRow>
            <TableCell className="custom-cell">データ</TableCell>
          </TableRow>
        </TableBody>
        <TableCaption className="custom-caption">キャプション</TableCaption>
      </Table>
    );

    const thead = container.querySelector('thead');
    const tbody = container.querySelector('tbody');
    const th = screen.getByText('ヘッダー');
    const td = screen.getByText('データ');
    const caption = screen.getByText('キャプション');

    expect(thead).toHaveClass('custom-header');
    expect(tbody).toHaveClass('custom-body');
    expect(th).toHaveClass('custom-head');
    expect(td).toHaveClass('custom-cell');
    expect(caption).toHaveClass('custom-caption');
  });

  test('空のテーブルが表示される', () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>名前</TableHead>
            <TableHead>メール</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell colSpan={2}>データがありません</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );

    expect(screen.getByText('データがありません')).toBeInTheDocument();
  });

  test('TableHeadが正しくth要素としてレンダリングされる', () => {
    const { container } = render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>見出し</TableHead>
          </TableRow>
        </TableHeader>
      </Table>
    );

    const th = container.querySelector('th');
    expect(th).toBeInTheDocument();
    expect(th).toHaveTextContent('見出し');
  });

  test('TableCellが正しくtd要素としてレンダリングされる', () => {
    const { container } = render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>セルデータ</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );

    const td = container.querySelector('td');
    expect(td).toBeInTheDocument();
    expect(td).toHaveTextContent('セルデータ');
  });

  test('colSpan属性が正しく適用される', () => {
    const { container } = render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell colSpan={3}>結合されたセル</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );

    const td = container.querySelector('td');
    expect(td).toHaveAttribute('colSpan', '3');
  });

  test('rowSpan属性が正しく適用される', () => {
    const { container } = render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell rowSpan={2}>結合されたセル</TableCell>
            <TableCell>セル1</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>セル2</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );

    const td = screen.getByText('結合されたセル');
    expect(td).toHaveAttribute('rowSpan', '2');
  });

  test('実際のデータテーブルのレイアウトが正しく表示される', () => {
    const users = [
      { id: 1, name: '山田太郎', email: 'yamada@example.com', role: '管理者' },
      { id: 2, name: '佐藤花子', email: 'sato@example.com', role: 'ユーザー' },
      { id: 3, name: '鈴木一郎', email: 'suzuki@example.com', role: 'ユーザー' },
    ];

    render(
      <Table>
        <TableCaption>ユーザー一覧</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>名前</TableHead>
            <TableHead>メールアドレス</TableHead>
            <TableHead>権限</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.id}</TableCell>
              <TableCell>{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.role}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );

    expect(screen.getByText('ユーザー一覧')).toBeInTheDocument();
    expect(screen.getByText('山田太郎')).toBeInTheDocument();
    expect(screen.getByText('yamada@example.com')).toBeInTheDocument();
    expect(screen.getByText('佐藤花子')).toBeInTheDocument();
    expect(screen.getByText('sato@example.com')).toBeInTheDocument();
    expect(screen.getByText('鈴木一郎')).toBeInTheDocument();
    expect(screen.getByText('suzuki@example.com')).toBeInTheDocument();
  });
});
