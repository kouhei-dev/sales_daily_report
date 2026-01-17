/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../route';

// モックの設定
vi.mock('@/lib/session', () => ({
  getSession: vi.fn(),
  isSessionValid: vi.fn(),
  refreshSession: vi.fn(),
}));

describe('GET /api/auth/session', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('有効なセッション情報を取得できる', async () => {
    const { getSession, isSessionValid, refreshSession } = await import('@/lib/session');

    const mockSession = {
      salesId: 'user-id-1',
      salesCode: 'S001',
      salesName: '佐藤花子',
      email: 'sato@example.com',
      department: '営業1課',
      isManager: false,
      expiresAt: Date.now() + 30 * 60 * 1000, // 30分後
    };

    vi.mocked(getSession).mockResolvedValue(mockSession as any);
    vi.mocked(isSessionValid).mockReturnValue(true);
    vi.mocked(refreshSession).mockResolvedValue(undefined);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('success');
    expect(data.data.user.sales_id).toBe('user-id-1');
    expect(data.data.user.sales_code).toBe('S001');
    expect(data.data.user.sales_name).toBe('佐藤花子');
    expect(data.data.session_expires_at).toBeDefined();
    expect(refreshSession).toHaveBeenCalled();
  });

  it('セッションが無効な場合、401エラーを返す', async () => {
    const { getSession, isSessionValid } = await import('@/lib/session');

    const mockSession = {};

    vi.mocked(getSession).mockResolvedValue(mockSession as any);
    vi.mocked(isSessionValid).mockReturnValue(false);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.status).toBe('error');
    expect(data.error.code).toBe('AUTH_SESSION_EXPIRED');
  });

  it('セッションが期限切れの場合、401エラーを返す', async () => {
    const { getSession, isSessionValid } = await import('@/lib/session');

    const mockSession = {
      salesId: 'user-id-1',
      expiresAt: Date.now() - 1000, // 過去の時刻
    };

    vi.mocked(getSession).mockResolvedValue(mockSession as any);
    vi.mocked(isSessionValid).mockReturnValue(false);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.status).toBe('error');
    expect(data.error.code).toBe('AUTH_SESSION_EXPIRED');
  });
});
