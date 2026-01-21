/**
 * 日報APIのレスポンス型定義
 */

/**
 * 日報一覧の各アイテム
 */
export interface ReportListItem {
  report_id: string;
  report_date: string;
  sales: {
    sales_id: string;
    sales_name: string;
  };
  visit_count: number;
  status: 'draft' | 'submitted' | 'commented';
  has_comments: boolean;
  unread_comment_count: number;
  submitted_at?: string;
  created_at: string;
  updated_at: string;
}

/**
 * 日報一覧取得レスポンス
 */
export interface ReportListResponse {
  items: ReportListItem[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
    limit: number;
  };
}

/**
 * 訪問記録（詳細）
 */
export interface VisitRecord {
  visit_id: string;
  customer: {
    customer_id: string;
    customer_code: string;
    customer_name: string;
  };
  visit_datetime: string;
  visit_content: string;
  visit_result?: string;
  display_order: number;
}

/**
 * コメント情報
 */
export interface Comment {
  comment_id: string;
  commenter: {
    sales_id: string;
    sales_name: string;
  };
  comment_text: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

/**
 * コメント（問題点・翌日の予定別）
 */
export interface CommentsByType {
  problem: Comment[];
  plan: Comment[];
}

/**
 * 日報詳細取得レスポンス
 */
export interface ReportDetailResponse {
  report_id: string;
  report_date: string;
  sales: {
    sales_id: string;
    sales_name: string;
    department: string;
  };
  problem?: string;
  plan?: string;
  status: 'draft' | 'submitted' | 'commented';
  submitted_at?: string;
  visit_records: VisitRecord[];
  comments: CommentsByType;
  created_at: string;
  updated_at: string;
}

/**
 * 日報作成レスポンス
 */
export interface ReportCreateResponse {
  report_id: string;
  report_date: string;
  status: 'draft' | 'submitted';
  created_at: string;
}

/**
 * 日報更新レスポンス
 */
export interface ReportUpdateResponse {
  report_id: string;
  updated_at: string;
}

/**
 * 未読コメント数レスポンス
 */
export interface UnreadCommentsCountResponse {
  unread_count: number;
}

/**
 * 訪問記録作成リクエスト
 */
export interface VisitRecordCreateRequest {
  customer_id: string;
  visit_datetime: string;
  visit_content: string;
  visit_result?: string;
  display_order: number;
}

/**
 * 訪問記録更新リクエスト
 */
export interface VisitRecordUpdateRequest {
  visit_id?: string;
  customer_id: string;
  visit_datetime: string;
  visit_content: string;
  visit_result?: string;
  display_order: number;
}

/**
 * 日報作成リクエスト
 */
export interface ReportCreateRequest {
  report_date: string;
  problem?: string;
  plan?: string;
  status: 'draft' | 'submitted';
  visit_records: VisitRecordCreateRequest[];
}

/**
 * 日報更新リクエスト
 */
export interface ReportUpdateRequest {
  problem?: string;
  plan?: string;
  status: 'draft' | 'submitted';
  visit_records: VisitRecordUpdateRequest[];
}
