import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// 各テスト後にクリーンアップ
afterEach(() => {
  cleanup();
});

// グローバルなモック設定（必要に応じて追加）
// 例: Next.jsのルーター、環境変数など
