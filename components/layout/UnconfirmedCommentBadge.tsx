'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import type { ApiSuccessResponse, ApiErrorResponse } from '@/types/session';
import type { UnconfirmedCommentCountResponse } from '@/app/api/comments/unconfirmed-count/route';

/**
 * UnconfirmedCommentBadge Component
 *
 * 未確認コメント数を表示するバッジコンポーネント
 *
 * 機能:
 * - 初回マウント時に未確認コメント数を取得
 * - 60秒ごとに自動更新（ポーリング）
 * - 未確認コメントがある場合のみバッジを表示（赤色で強調）
 */
export function UnconfirmedCommentBadge() {
  const [count, setCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCount = async () => {
    try {
      const response = await fetch('/api/comments/unconfirmed-count', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data: ApiSuccessResponse<UnconfirmedCommentCountResponse> | ApiErrorResponse =
        await response.json();

      if (response.ok && data.status === 'success') {
        setCount(data.data.count);
      } else {
        console.error('Failed to fetch unconfirmed comment count:', data);
      }
    } catch (error) {
      console.error('Failed to fetch unconfirmed comment count:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // 初回取得
    fetchCount();

    // 60秒ごとに自動更新
    const interval = setInterval(fetchCount, 60000);

    return () => clearInterval(interval);
  }, []);

  // ロード中または未確認コメントがない場合は何も表示しない
  if (isLoading || count === 0) {
    return null;
  }

  return (
    <Badge variant="danger" className="ml-2" aria-label={`未確認コメント${count}件`}>
      {count}
    </Badge>
  );
}
