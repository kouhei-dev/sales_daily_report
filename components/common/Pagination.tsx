'use client';

import { Button } from '@/components/ui/button';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';

export interface PaginationProps {
  /** 現在のページ番号（1始まり） */
  currentPage: number;
  /** 総ページ数 */
  totalPages: number;
  /** 総アイテム数 */
  totalItems: number;
  /** ページ変更時のハンドラー */
  onPageChange: (page: number) => void;
  /** 1ページあたりの表示件数（デフォルト: DEFAULT_PAGE_SIZE） */
  pageSize?: number;
}

/**
 * 汎用ページネーションコンポーネント
 *
 * 機能:
 * - 前ページ・次ページへの移動
 * - ページ番号の表示（省略記号付き）
 * - 総件数と現在の表示範囲の表示
 *
 * @example
 * ```tsx
 * const { goToPage, currentPage } = usePagination({ basePath: '/sales' });
 *
 * <Pagination
 *   currentPage={currentPage}
 *   totalPages={10}
 *   totalItems={200}
 *   onPageChange={goToPage}
 * />
 * ```
 */
export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
  pageSize = DEFAULT_PAGE_SIZE,
}: PaginationProps) {
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

  // 現在の表示範囲を計算
  const startItem = Math.min((currentPage - 1) * pageSize + 1, totalItems);
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
      <div className="text-sm text-gray-600">
        全 {totalItems} 件中 {startItem} - {endItem} 件を表示
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
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
              onClick={() => onPageChange(pageNum)}
            >
              {pageNum}
            </Button>
          );
        })}

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          次へ
        </Button>
      </div>
    </div>
  );
}
