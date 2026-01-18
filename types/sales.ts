/**
 * 営業マスタAPIのレスポンス型定義
 */

/**
 * 営業情報（基本）
 */
export interface SalesBasic {
  sales_id: string;
  sales_code: string;
  sales_name: string;
  email: string;
  department: string;
  is_manager: boolean;
}

/**
 * 営業情報（詳細）
 */
export interface SalesDetail extends SalesBasic {
  manager?: {
    sales_id: string;
    sales_name: string;
  };
  created_at: string;
  updated_at: string;
}

/**
 * 営業一覧取得レスポンス
 */
export interface SalesListResponse {
  items: SalesDetail[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
    limit: number;
  };
}

/**
 * 営業詳細取得レスポンス
 */
export type SalesDetailResponse = SalesDetail;

/**
 * 営業作成レスポンス
 */
export interface SalesCreateResponse {
  sales_id: string;
  sales_code: string;
  sales_name: string;
  created_at: string;
}

/**
 * 営業更新レスポンス
 */
export interface SalesUpdateResponse {
  sales_id: string;
  updated_at: string;
}

/**
 * 営業作成リクエスト
 */
export interface SalesCreateRequest {
  sales_code: string;
  sales_name: string;
  email: string;
  password: string;
  department: string;
  manager_id?: string;
  is_manager: boolean;
}

/**
 * 営業更新リクエスト
 */
export interface SalesUpdateRequest {
  sales_name: string;
  email: string;
  password?: string; // 任意
  department: string;
  manager_id?: string;
  is_manager: boolean;
}
