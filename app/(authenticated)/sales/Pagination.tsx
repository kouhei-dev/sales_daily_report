'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

/**
 * ページネーションコンポーネント
 *
 * 機能:
 * - 前ページ・次ページへの移動
 * - ページ番号の表示
 * - 総件数の表示
 */
export function Pagination({ currentPage, totalPages, totalItems }: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`/sales?${params.toString()}`);
  };

  if (totalPages <= 1) {
    return null;
  }

  // 表示するページ番号の計算
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const delta = 2; // 現在のページの前後に表示する数

    // 最初のページは常に表示
    pages.push(1);

    // 省略記号と中央のページ番号
    if (currentPage - delta > 2) {
      pages.push('...');
    }

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      pages.push(i);
    }

    if (currentPage + delta < totalPages - 1) {
      pages.push('...');
    }

    // 最後のページは常に表示（総ページ数が1より大きい場合のみ）
    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
      <div className="text-sm text-gray-600">
        全 {totalItems} 件中 {Math.min((currentPage - 1) * 20 + 1, totalItems)} -{' '}
        {Math.min(currentPage * 20, totalItems)} 件を表示
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          前へ
        </Button>

        {pageNumbers.map((page, index) => {
          if (page === '...') {
            return (
              <span key={`ellipsis-${index}`} className="px-2 text-gray-400">
                ...
              </span>
            );
          }

          const pageNum = page as number;
          return (
            <Button
              key={pageNum}
              variant={currentPage === pageNum ? 'primary' : 'outline'}
              size="sm"
              onClick={() => handlePageChange(pageNum)}
            >
              {pageNum}
            </Button>
          );
        })}

        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          次へ
        </Button>
      </div>
    </div>
  );
}
