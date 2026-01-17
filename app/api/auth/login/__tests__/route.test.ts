/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../route';
import { NextRequest } from 'next/server';

// vi.hoisted を使ってモック関数を定義（これらは vi.mock の前に実行される）
const mockSalesFindUnique = vi.hoisted(() => vi.fn());
const mockDisconnect = vi.hoisted(() => vi.fn());

// モックの設定
vi.mock('@prisma/client', () => {
  class MockPrismaClient {
    sales = {
      findUnique: mockSalesFindUnique,
    };
    $disconnect = mockDisconnect;
  }

  return {
    PrismaClient: MockPrismaClient,
  };
});

vi.mock('@/lib/auth', () => ({
  verifyPassword: vi.fn(),
}));

vi.mock('@/lib/session', () => ({
  getSession: vi.fn(),
  setSessionData: vi.fn(),
}));

vi.mock('@/lib/rate-limiter', () => ({
  checkLoginRateLimit: vi.fn(),
  resetLoginRateLimit: vi.fn(),
  getClientIp: vi.fn(() => '127.0.0.1'),
}));

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('有効な認証情報でログインできる', async () => {
    const { verifyPassword } = await import('@/lib/auth');
    const { getSession, setSessionData } = await import('@/lib/session');
    const { checkLoginRateLimit, resetLoginRateLimit } = await import('@/lib/rate-limiter');

    // モックの設定
    mockSalesFindUnique.mockResolvedValue({
      id: 'user-id-1',
      salesCode: 'S001',
      salesName: '佐藤花子',
      email: 'sato@example.com',
      passwordHash: '$2a$10$mockhashedpassword',
      department: '営業1課',
      managerId: 'manager-id-1',
      isManager: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      manager: {
        id: 'manager-id-1',
        salesCode: 'M001',
        salesName: '山田太郎',
        email: 'yamada@example.com',
        passwordHash: 'hash',
        department: '営業部',
        managerId: null,
        isManager: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    } as any);

    vi.mocked(verifyPassword).mockResolvedValue(true);
    vi.mocked(checkLoginRateLimit).mockResolvedValue({
      success: true,
      remainingPoints: 4,
    });

    const mockSession = {
      salesId: 'user-id-1',
      save: vi.fn(),
      destroy: vi.fn(),
    };
    vi.mocked(getSession).mockResolvedValue(mockSession as any);
    vi.mocked(setSessionData).mockResolvedValue(undefined);
    vi.mocked(resetLoginRateLimit).mockResolvedValue(undefined);

    const request = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        sales_code: 'S001',
        password: 'password123',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('success');
    expect(data.data.user.sales_code).toBe('S001');
    expect(data.data.user.sales_name).toBe('佐藤花子');
    expect(data.data.user.manager.sales_name).toBe('山田太郎');
    expect(setSessionData).toHaveBeenCalled();
    expect(resetLoginRateLimit).toHaveBeenCalled();
  });

  it('営業コードが未入力の場合、バリデーションエラーを返す', async () => {
    const request = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        password: 'password123',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.status).toBe('error');
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });

  it('パスワードが未入力の場合、バリデーションエラーを返す', async () => {
    const request = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        sales_code: 'S001',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.status).toBe('error');
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });

  it('存在しない営業コードの場合、認証エラーを返す', async () => {
    const { checkLoginRateLimit } = await import('@/lib/rate-limiter');

    // モックの設定
    mockSalesFindUnique.mockResolvedValue(null);
    vi.mocked(checkLoginRateLimit).mockResolvedValue({
      success: true,
      remainingPoints: 4,
    });

    const request = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        sales_code: 'INVALID',
        password: 'password123',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.status).toBe('error');
    expect(data.error.code).toBe('AUTH_INVALID_CREDENTIALS');
  });

  it('パスワードが間違っている場合、認証エラーを返す', async () => {
    const { verifyPassword } = await import('@/lib/auth');
    const { checkLoginRateLimit } = await import('@/lib/rate-limiter');

    // モックの設定
    mockSalesFindUnique.mockResolvedValue({
      id: 'user-id-1',
      salesCode: 'S001',
      salesName: '佐藤花子',
      email: 'sato@example.com',
      passwordHash: '$2a$10$mockhashedpassword',
      department: '営業1課',
      managerId: null,
      isManager: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      manager: null,
    } as any);

    vi.mocked(verifyPassword).mockResolvedValue(false);
    vi.mocked(checkLoginRateLimit).mockResolvedValue({
      success: true,
      remainingPoints: 4,
    });

    const request = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        sales_code: 'S001',
        password: 'wrongpassword',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.status).toBe('error');
    expect(data.error.code).toBe('AUTH_INVALID_CREDENTIALS');
  });

  it('レート制限に達した場合、429エラーを返す', async () => {
    const { checkLoginRateLimit } = await import('@/lib/rate-limiter');

    vi.mocked(checkLoginRateLimit).mockResolvedValue({
      success: false,
      retryAfter: 300,
    });

    const request = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        sales_code: 'S001',
        password: 'password123',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.status).toBe('error');
    expect(data.error.code).toBe('RATE_LIMIT_EXCEEDED');
    expect(data.error.message).toContain('300秒後');
  });
});
