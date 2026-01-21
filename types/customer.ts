/**
 * 顧客マスタAPIのレスポンス型定義
 */

/**
 * 顧客情報（基本）
 */
export interface CustomerBasic {
  customer_id: string;
  customer_code: string;
  customer_name: string;
  industry?: string;
  address?: string;
  phone?: string;
  sales: {
    sales_id: string;
    sales_name: string;
  };
  created_at: string;
  updated_at: string;
}

/**
 * 顧客情報（詳細）
 */
export interface CustomerDetail extends CustomerBasic {
  postal_code?: string;
  sales: {
    sales_id: string;
    sales_name: string;
    department: string;
  };
  notes?: string;
}

/**
 * 顧客一覧取得レスポンス
 */
export interface CustomerListResponse {
  items: CustomerBasic[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
    limit: number;
  };
}

/**
 * 顧客詳細取得レスポンス
 */
export type CustomerDetailResponse = CustomerDetail;

/**
 * 顧客作成レスポンス
 */
export interface CustomerCreateResponse {
  customer_id: string;
  customer_code: string;
  customer_name: string;
  created_at: string;
}

/**
 * 顧客更新レスポンス
 */
export interface CustomerUpdateResponse {
  customer_id: string;
  updated_at: string;
}

/**
 * 顧客作成リクエスト
 */
export interface CustomerCreateRequest {
  customer_code: string;
  customer_name: string;
  industry?: string;
  postal_code?: string;
  address?: string;
  phone?: string;
  sales_id: string;
  notes?: string;
}

/**
 * 顧客更新リクエスト
 */
export interface CustomerUpdateRequest {
  customer_name: string;
  industry?: string;
  postal_code?: string;
  address?: string;
  phone?: string;
  sales_id: string;
  notes?: string;
}
