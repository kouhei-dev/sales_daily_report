'use client';

import { useState } from 'react';
import { Header } from './Header';
import { SideMenu } from './SideMenu';
import { Footer } from './Footer';

interface AuthenticatedLayoutClientProps {
  children: React.ReactNode;
  userName: string;
  isManager: boolean;
}

/**
 * Authenticated Layout Client Component
 *
 * 認証済みユーザー向けのレイアウトコンポーネント（クライアントサイド）
 *
 * 構成:
 * - Header: システム名、ユーザー情報、未確認コメント数、ログアウトボタン
 * - SideMenu: ナビゲーションメニュー（権限に応じた表示）
 * - Main: ページコンテンツ
 * - Footer: 著作権情報
 *
 * 機能:
 * - モバイルメニューの開閉状態管理
 * - レスポンシブ対応
 */
export function AuthenticatedLayoutClient({
  children,
  userName,
  isManager,
}: AuthenticatedLayoutClientProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleMenuClose = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header userName={userName} isManager={isManager} onMenuToggle={handleMenuToggle} />
      <div className="flex flex-1">
        <SideMenu isManager={isManager} isOpen={isMobileMenuOpen} onClose={handleMenuClose} />
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
