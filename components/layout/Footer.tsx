/**
 * Footer Component
 *
 * アプリケーション全体で使用される共通フッター
 * 著作権情報を表示
 */
export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-200 bg-white px-4 py-4">
      <div className="container mx-auto">
        <p className="text-center text-sm text-gray-600">
          © {currentYear} 営業日報システム. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
