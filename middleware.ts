import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSession, isSessionValid } from '@/lib/session';

/**
 * Next.js Middleware
 *
 * ルート保護とリダイレクト処理を行う
 *
 * 機能:
 * - ログインページ: 認証済みユーザーをホームへリダイレクト
 * - 保護されたルート: 未認証ユーザーをログインページへリダイレクト
 * - 管理者限定ルート: 非管理者をホームへリダイレクト
 *
 * 除外ルート:
 * - /api (APIルート - 各ルートで認証チェック)
 * - /_next (Next.jsの内部ファイル)
 * - /favicon.ico (ファビコン)
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // セッション取得
  const session = await getSession();
  const isValid = isSessionValid(session);

  // ログインページの処理
  if (pathname === '/login') {
    if (isValid) {
      // 認証済みユーザーはホームへリダイレクト
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // 保護されたルート（認証が必要）
  if (!isValid) {
    // 未認証ユーザーはログインページへリダイレクト
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 管理者限定ルート
  if (pathname.startsWith('/sales')) {
    if (!session.isManager) {
      // 非管理者はホームへリダイレクト
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

/**
 * Middleware設定
 *
 * matcher: ミドルウェアを適用するパスパターン
 * - /api, /_next/static, /_next/image, /favicon.ico を除外
 */
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
