/**
 * セッションデータの型定義
 */
export interface SessionData {
  salesId: string;
  salesCode: string;
  salesName: string;
  email: string;
  department: string;
  isManager: boolean;
  /**
   * セッションの有効期限（Unix timestamp）
   */
  expiresAt: number;
}

/**
 * ログインAPIのレスポンス型
 */
export interface LoginResponse {
  user: {
    sales_id: string;
    sales_code: string;
    sales_name: string;
    email: string;
    department: string;
    is_manager: boolean;
    manager?: {
      sales_id: string;
      sales_name: string;
    };
  };
  session_id: string;
}

/**
 * セッション確認APIのレスポンス型
 */
export interface SessionResponse {
  user: {
    sales_id: string;
    sales_code: string;
    sales_name: string;
    email: string;
    department: string;
    is_manager: boolean;
  };
  session_expires_at: string;
}

/**
 * APIエラーレスポンスの型定義
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Array<{
    field: string;
    message: string;
  }>;
}

/**
 * API成功レスポンスの型定義
 */
export interface ApiSuccessResponse<T> {
  status: 'success';
  data: T;
}

/**
 * APIエラーレスポンスの型定義
 */
export interface ApiErrorResponse {
  status: 'error';
  error: ApiError;
}
