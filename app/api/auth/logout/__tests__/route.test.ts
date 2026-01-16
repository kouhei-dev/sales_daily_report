/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../route';

// モックの設定
vi.mock('@/lib/session', () => ({
  getSession: vi.fn(),
  destroySession: vi.fn(),
}));

describe('POST /api/auth/logout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ログアウトが成功する', async () => {
    const { getSession, destroySession } = await import('@/lib/session');

    const mockSession = {
      salesId: 'user-id-1',
      save: vi.fn(),
      destroy: vi.fn(),
    };

    vi.mocked(getSession).mockResolvedValue(mockSession as any);
    vi.mocked(destroySession).mockResolvedValue(undefined);

    const response = await POST();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('success');
    expect(data.data.message).toBe('ログアウトしました');
    expect(destroySession).toHaveBeenCalledWith(mockSession);
  });

  it('セッションがない場合でもログアウトが成功する', async () => {
    const { getSession, destroySession } = await import('@/lib/session');

    const mockSession = {
      save: vi.fn(),
      destroy: vi.fn(),
    };

    vi.mocked(getSession).mockResolvedValue(mockSession as any);
    vi.mocked(destroySession).mockResolvedValue(undefined);

    const response = await POST();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('success');
    expect(destroySession).toHaveBeenCalled();
  });
});
