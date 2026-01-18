import { describe, test, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { usePagination } from '../usePagination';

// Next.js navigationのモック
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

describe('usePagination', () => {
  const mockPush = vi.fn();
  const mockSearchParams = {
    get: vi.fn(),
    toString: vi.fn().mockReturnValue(''),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.get.mockReturnValue(null);
    mockSearchParams.toString.mockReturnValue('');
    (useRouter as ReturnType<typeof vi.fn>).mockReturnValue({ push: mockPush });
    (useSearchParams as ReturnType<typeof vi.fn>).mockReturnValue(mockSearchParams);
  });

  test('初期状態ではcurrentPageは1', () => {
    mockSearchParams.get.mockReturnValue(null);

    const { result } = renderHook(() => usePagination({ basePath: '/sales' }));

    expect(result.current.currentPage).toBe(1);
  });

  test('URLパラメータからcurrentPageを取得する', () => {
    mockSearchParams.get.mockImplementation((key: string) => {
      if (key === 'page') return '3';
      return null;
    });

    const { result } = renderHook(() => usePagination({ basePath: '/sales' }));

    expect(result.current.currentPage).toBe(3);
  });

  test('goToPageで指定したページに遷移する', () => {
    mockSearchParams.get.mockReturnValue(null);

    const { result } = renderHook(() => usePagination({ basePath: '/sales' }));

    act(() => {
      result.current.goToPage(5);
    });

    expect(mockPush).toHaveBeenCalledWith('/sales?page=5');
  });

  test('goToPageは既存のクエリパラメータを保持する', () => {
    mockSearchParams.get.mockReturnValue(null);
    mockSearchParams.toString.mockReturnValue('sales_name=test&department=営業1課');

    const { result } = renderHook(() => usePagination({ basePath: '/sales' }));

    act(() => {
      result.current.goToPage(2);
    });

    // URLSearchParamsは日本語を自動的にエンコードする
    expect(mockPush).toHaveBeenCalledWith(
      '/sales?sales_name=test&department=%E5%96%B6%E6%A5%AD1%E8%AA%B2&page=2'
    );
  });

  test('goToPreviousPageで前のページに遷移する', () => {
    mockSearchParams.get.mockImplementation((key: string) => {
      if (key === 'page') return '3';
      return null;
    });
    mockSearchParams.toString.mockReturnValue('page=3');

    const { result } = renderHook(() => usePagination({ basePath: '/sales' }));

    act(() => {
      result.current.goToPreviousPage();
    });

    expect(mockPush).toHaveBeenCalledWith('/sales?page=2');
  });

  test('goToPreviousPageはページ1より前には行かない', () => {
    mockSearchParams.get.mockReturnValue(null);

    const { result } = renderHook(() => usePagination({ basePath: '/sales' }));

    act(() => {
      result.current.goToPreviousPage();
    });

    // ページ1の場合は何も実行されない
    expect(mockPush).not.toHaveBeenCalled();
  });

  test('goToNextPageで次のページに遷移する', () => {
    mockSearchParams.get.mockImplementation((key: string) => {
      if (key === 'page') return '2';
      return null;
    });
    mockSearchParams.toString.mockReturnValue('page=2');

    const { result } = renderHook(() => usePagination({ basePath: '/sales' }));

    act(() => {
      result.current.goToNextPage();
    });

    expect(mockPush).toHaveBeenCalledWith('/sales?page=3');
  });

  test('異なるbasePathで動作する', () => {
    mockSearchParams.get.mockReturnValue(null);
    mockSearchParams.toString.mockReturnValue('');

    const { result } = renderHook(() => usePagination({ basePath: '/reports' }));

    act(() => {
      result.current.goToPage(2);
    });

    expect(mockPush).toHaveBeenCalledWith('/reports?page=2');
  });
});
