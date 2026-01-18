/**
 * プロジェクト共通の定数定義
 */

/**
 * ページネーション関連の定数
 */
export const PAGINATION = {
  /** 1ページあたりのデフォルト表示件数 */
  DEFAULT_PAGE_SIZE: 20,
} as const;

/**
 * デフォルトページサイズ（後方互換性のため）
 */
export const DEFAULT_PAGE_SIZE = PAGINATION.DEFAULT_PAGE_SIZE;
