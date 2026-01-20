/**
 * 所属部署API関連の型定義
 */

/**
 * 所属部署一覧アイテム
 */
export interface DepartmentListItem {
  department_id: string;
  department_name: string;
  display_order: number;
}

/**
 * 所属部署一覧レスポンス
 */
export interface DepartmentListResponse {
  departments: DepartmentListItem[];
}
