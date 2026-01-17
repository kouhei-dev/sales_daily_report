'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import type { ApiSuccessResponse, ApiErrorResponse, LoginResponse } from '@/types/session';

export default function LoginPage() {
  const router = useRouter();
  const [salesCode, setSalesCode] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    // フォームバリデーション
    if (!salesCode.trim() || !password.trim()) {
      setError('営業コードとパスワードを入力してください');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sales_code: salesCode.trim(),
          password: password,
        }),
      });

      const data: ApiSuccessResponse<LoginResponse> | ApiErrorResponse = await response.json();

      if (response.ok && data.status === 'success') {
        // ログイン成功
        router.replace('/');
      } else if (data.status === 'error') {
        // エラーレスポンスの処理
        if (response.status === 429) {
          // レート制限エラー
          setError(
            data.error.message ||
              'ログイン試行回数が上限に達しました。しばらく時間をおいてから再試行してください。'
          );
        } else if (response.status === 401) {
          // 認証エラー
          setError('営業コードまたはパスワードが正しくありません');
        } else {
          // その他のエラー
          setError(data.error.message || 'エラーが発生しました');
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('ネットワークエラーが発生しました。インターネット接続を確認してください。');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = salesCode.trim() !== '' && password.trim() !== '';

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">営業日報システム</CardTitle>
          <CardDescription className="text-center">
            営業コードとパスワードを入力してログインしてください
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="danger">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="salesCode" required>
                営業コード
              </Label>
              <Input
                id="salesCode"
                name="salesCode"
                type="text"
                autoComplete="username"
                required
                value={salesCode}
                onChange={(e) => setSalesCode(e.target.value)}
                disabled={isLoading}
                placeholder="営業コードを入力"
                error={!!error}
                aria-invalid={!!error}
                aria-describedby={error ? 'error-message' : undefined}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" required>
                パスワード
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                placeholder="パスワードを入力"
                error={!!error}
                aria-invalid={!!error}
                aria-describedby={error ? 'error-message' : undefined}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={!isFormValid || isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner size="sm" />
                  ログイン中...
                </span>
              ) : (
                'ログイン'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
