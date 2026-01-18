import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

interface UsePaginationOptions {
  /**
   * ページネーションを適用するベースパス
   * @example '/sales', '/reports'
   */
  basePath: string;
}

interface UsePaginationReturn {
  /**
   * 指定したページ番号に遷移する
   * @param page ページ番号（1始まり）
   */
  goToPage: (page: number) => void;

  /**
   * 前のページに遷移する
   */
  goToPreviousPage: () => void;

  /**
   * 次のページに遷移する
   */
  goToNextPage: () => void;

  /**
   * 現在のページ番号（1始まり）
   */
  currentPage: number;
}

/**
 * ページネーションのURL操作を行うカスタムフック
 *
 * @example
 * ```tsx
 * const { goToPage, currentPage } = usePagination({ basePath: '/sales' });
 *
 * // ページ2に遷移
 * goToPage(2);
 * ```
 */
export function usePagination({ basePath }: UsePaginationOptions): UsePaginationReturn {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  const goToPage = useCallback(
    (page: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('page', page.toString());
      router.push(`${basePath}?${params.toString()}`);
    },
    [basePath, router, searchParams]
  );

  const goToPreviousPage = useCallback(() => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  }, [currentPage, goToPage]);

  const goToNextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  return {
    goToPage,
    goToPreviousPage,
    goToNextPage,
    currentPage,
  };
}
