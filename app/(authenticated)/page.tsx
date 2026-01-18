/**
 * Home Page (Dashboard)
 *
 * ログイン後の初期画面
 * ダッシュボードとして機能
 */
export default function HomePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">ホーム</h1>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">営業日報システムへようこそ</h2>
        <p className="text-gray-600">
          このシステムでは、営業活動の記録と管理を行うことができます。
        </p>
      </div>

      {/* TODO: 今後のフェーズで以下を実装 */}
      {/* - 当日の日報作成状況 */}
      {/* - 未確認コメント通知 */}
      {/* - メインメニューカード */}
    </div>
  );
}
