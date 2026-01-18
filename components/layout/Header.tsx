'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { UnconfirmedCommentBadge } from './UnconfirmedCommentBadge';
import type { ApiSuccessResponse, ApiErrorResponse } from '@/types/session';

interface HeaderProps {
  userName: string;
  isManager: boolean;
  onMenuToggle?: () => void;
}

/**
 * Header Component
 *
 * アプリケーション全体で使用される共通ヘッダー
 *
 * 表示内容:
 * - システム名
 * - ログインユーザー名
 * - 未確認コメント数（営業担当者のみ）
 * - ログアウトボタン
 * - モバイルメニュートグルボタン
 */
export function Header({ userName, isManager, onMenuToggle }: HeaderProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data: ApiSuccessResponse<Record<string, never>> | ApiErrorResponse =
        await response.json();

      if (response.ok && data.status === 'success') {
        // ログアウト成功 - ログイン画面へ遷移
        router.push('/login');
      } else {
        console.error('Logout failed:', data);
        alert('ログアウトに失敗しました。もう一度お試しください。');
        setIsLoggingOut(false);
      }
    } catch (error) {
      console.error('Logout error:', error);
      alert('ログアウト中にエラーが発生しました。');
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white">
      <div className="flex h-16 items-center justify-between px-4">
        {/* Left section: Menu toggle (mobile) + System name */}
        <div className="flex items-center gap-4">
          {/* Mobile menu toggle button */}
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="メニューを開く"
            type="button"
          >
            <svg
              className="h-6 w-6 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          <h1 className="text-lg font-bold text-gray-900 sm:text-xl">営業日報システム</h1>
        </div>

        {/* Right section: User info + Logout */}
        <div className="flex items-center gap-4">
          {/* User info */}
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-sm text-gray-600">{userName}</span>
            {/* 未確認コメント数バッジ（営業担当者のみ） */}
            {!isManager && <UnconfirmedCommentBadge />}
          </div>

          {/* Logout button */}
          <Button variant="outline" size="sm" onClick={handleLogout} disabled={isLoggingOut}>
            {isLoggingOut ? 'ログアウト中...' : 'ログアウト'}
          </Button>
        </div>
      </div>
    </header>
  );
}
