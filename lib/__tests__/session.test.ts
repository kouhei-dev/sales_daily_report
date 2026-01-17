import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { IronSession } from 'iron-session';
import type { SessionData } from '@/types/session';

describe('session module', () => {
  // 環境変数のバックアップ
  let originalSessionSecret: string | undefined;
  let originalNodeEnv: string | undefined;

  beforeEach(() => {
    // 環境変数をバックアップ
    originalSessionSecret = process.env.SESSION_SECRET;
    originalNodeEnv = process.env.NODE_ENV;

    // vitestのモジュールキャッシュをクリア
    vi.resetModules();
  });

  afterEach(() => {
    // 環境変数を復元
    if (originalSessionSecret !== undefined) {
      process.env.SESSION_SECRET = originalSessionSecret;
    } else {
      delete process.env.SESSION_SECRET;
    }

    if (originalNodeEnv !== undefined) {
      // @ts-expect-error - テスト環境でのみ環境変数を変更
      process.env.NODE_ENV = originalNodeEnv;
    } else {
      // @ts-expect-error - テスト環境でのみ環境変数を削除
      delete process.env.NODE_ENV;
    }

    // vitestのモジュールキャッシュをクリア
    vi.resetModules();
  });

  describe('getSessionSecret', () => {
    it('本番環境でSESSION_SECRET未設定時にエラーをthrow', async () => {
      // 本番環境に設定
      // @ts-expect-error - テスト環境でのみ環境変数を変更
      process.env.NODE_ENV = 'production';
      delete process.env.SESSION_SECRET;

      // モジュールを再読み込み
      await expect(async () => {
        await import('../session');
      }).rejects.toThrow(
        'SESSION_SECRET environment variable must be set in production. ' +
          'Generate a strong random string with at least 32 characters.'
      );
    });

    it('32文字未満のシークレットでエラーをthrow', async () => {
      // 31文字のシークレットを設定
      process.env.SESSION_SECRET = 'a'.repeat(31);
      // @ts-expect-error - テスト環境でのみ環境変数を変更
      process.env.NODE_ENV = 'development';

      // モジュールを再読み込み
      await expect(async () => {
        await import('../session');
      }).rejects.toThrow(
        'SESSION_SECRET must be at least 32 characters long. Current length: 31. ' +
          'Generate a strong random string for production use.'
      );
    });

    it('32文字未満のシークレットのエラーメッセージに現在の文字数を含む', async () => {
      // 20文字のシークレットを設定
      const shortSecret = 'a'.repeat(20);
      process.env.SESSION_SECRET = shortSecret;
      // @ts-expect-error - テスト環境でのみ環境変数を変更
      process.env.NODE_ENV = 'development';

      // モジュールを再読み込み
      await expect(async () => {
        await import('../session');
      }).rejects.toThrow(`Current length: ${shortSecret.length}`);
    });

    it('開発環境でSESSION_SECRET未設定時にデフォルト値を返す', async () => {
      // @ts-expect-error - テスト環境でのみ環境変数を変更
      process.env.NODE_ENV = 'development';
      delete process.env.SESSION_SECRET;

      // モジュールを再読み込み
      const sessionModule = await import('../session');

      // sessionOptionsのpasswordがデフォルト値であることを確認
      expect(sessionModule.sessionOptions.password).toBe(
        'complex_password_at_least_32_characters_long_for_development'
      );
      expect(sessionModule.sessionOptions.password.length).toBeGreaterThanOrEqual(32);
    });

    it('有効なシークレットを正しく返す', async () => {
      const validSecret = 'a'.repeat(32);
      process.env.SESSION_SECRET = validSecret;
      // @ts-expect-error - テスト環境でのみ環境変数を変更
      process.env.NODE_ENV = 'production';

      // モジュールを再読み込み
      const sessionModule = await import('../session');

      // sessionOptionsのpasswordが設定したシークレットであることを確認
      expect(sessionModule.sessionOptions.password).toBe(validSecret);
    });

    it('SESSION_SECRETが正確に32文字の場合は成功する', async () => {
      const exactSecret = 'a'.repeat(32);
      process.env.SESSION_SECRET = exactSecret;
      // @ts-expect-error - テスト環境でのみ環境変数を変更
      process.env.NODE_ENV = 'production';

      // モジュールを再読み込み - エラーが発生しないことを確認
      const sessionModule = await import('../session');

      expect(sessionModule.sessionOptions.password).toBe(exactSecret);
      expect(sessionModule.sessionOptions.password.length).toBe(32);
    });
  });

  describe('sessionOptions', () => {
    it('本番環境でsecure cookieが有効になる', async () => {
      // @ts-expect-error - テスト環境でのみ環境変数を変更
      process.env.NODE_ENV = 'production';
      process.env.SESSION_SECRET = 'a'.repeat(32);

      const sessionModule = await import('../session');

      expect(sessionModule.sessionOptions.cookieOptions).toBeDefined();
      expect(sessionModule.sessionOptions.cookieOptions?.secure).toBe(true);
    });

    it('開発環境でsecure cookieが無効になる', async () => {
      // @ts-expect-error - テスト環境でのみ環境変数を変更
      process.env.NODE_ENV = 'development';
      delete process.env.SESSION_SECRET;

      const sessionModule = await import('../session');

      expect(sessionModule.sessionOptions.cookieOptions).toBeDefined();
      expect(sessionModule.sessionOptions.cookieOptions?.secure).toBe(false);
    });

    it('cookieOptionsに適切なセキュリティ設定が含まれる', async () => {
      // @ts-expect-error - テスト環境でのみ環境変数を変更
      process.env.NODE_ENV = 'development';
      delete process.env.SESSION_SECRET;

      const sessionModule = await import('../session');

      expect(sessionModule.sessionOptions.cookieOptions).toBeDefined();
      expect(sessionModule.sessionOptions.cookieOptions?.httpOnly).toBe(true);
      expect(sessionModule.sessionOptions.cookieOptions?.sameSite).toBe('lax');
      expect(sessionModule.sessionOptions.cookieOptions?.maxAge).toBe(
        sessionModule.SESSION_TIMEOUT_SECONDS
      );
    });

    it('cookieNameが正しく設定される', async () => {
      // @ts-expect-error - テスト環境でのみ環境変数を変更
      process.env.NODE_ENV = 'development';
      delete process.env.SESSION_SECRET;

      const sessionModule = await import('../session');

      expect(sessionModule.sessionOptions.cookieName).toBe('sales_daily_report_session');
    });
  });

  describe('isSessionValid', () => {
    beforeEach(() => {
      // @ts-expect-error - テスト環境でのみ環境変数を変更
      process.env.NODE_ENV = 'development';
      delete process.env.SESSION_SECRET;
      vi.resetModules();
    });

    it('有効なセッションでtrueを返す', async () => {
      const sessionModule = await import('../session');

      const mockSession = {
        salesId: 'test-id',
        salesCode: 'TEST001',
        salesName: 'Test User',
        email: 'test@example.com',
        department: 'Sales',
        isManager: false,
        expiresAt: Date.now() + 10000, // 10秒後に期限切れ
      } as IronSession<SessionData>;

      expect(sessionModule.isSessionValid(mockSession)).toBe(true);
    });

    it('salesIdが存在しない場合にfalseを返す', async () => {
      const sessionModule = await import('../session');

      const mockSession = {
        expiresAt: Date.now() + 10000,
      } as IronSession<SessionData>;

      expect(sessionModule.isSessionValid(mockSession)).toBe(false);
    });

    it('expiresAtが存在しない場合にfalseを返す', async () => {
      const sessionModule = await import('../session');

      const mockSession = {
        salesId: 'test-id',
        salesCode: 'TEST001',
        salesName: 'Test User',
        email: 'test@example.com',
        department: 'Sales',
        isManager: false,
      } as IronSession<SessionData>;

      expect(sessionModule.isSessionValid(mockSession)).toBe(false);
    });

    it('期限切れのセッションでfalseを返す', async () => {
      const sessionModule = await import('../session');

      const mockSession = {
        salesId: 'test-id',
        salesCode: 'TEST001',
        salesName: 'Test User',
        email: 'test@example.com',
        department: 'Sales',
        isManager: false,
        expiresAt: Date.now() - 1000, // 1秒前に期限切れ
      } as IronSession<SessionData>;

      expect(sessionModule.isSessionValid(mockSession)).toBe(false);
    });

    it('現在時刻と等しいexpiresAtでfalseを返す（境界値テスト）', async () => {
      const sessionModule = await import('../session');

      const now = Date.now();
      const mockSession = {
        salesId: 'test-id',
        salesCode: 'TEST001',
        salesName: 'Test User',
        email: 'test@example.com',
        department: 'Sales',
        isManager: false,
        expiresAt: now,
      } as IronSession<SessionData>;

      expect(sessionModule.isSessionValid(mockSession)).toBe(false);
    });

    it('現在時刻より1ミリ秒後のexpiresAtでtrueを返す（境界値テスト）', async () => {
      const sessionModule = await import('../session');

      const now = Date.now();
      const mockSession = {
        salesId: 'test-id',
        salesCode: 'TEST001',
        salesName: 'Test User',
        email: 'test@example.com',
        department: 'Sales',
        isManager: false,
        expiresAt: now + 1,
      } as IronSession<SessionData>;

      expect(sessionModule.isSessionValid(mockSession)).toBe(true);
    });
  });

  describe('setSessionData', () => {
    beforeEach(() => {
      // @ts-expect-error - テスト環境でのみ環境変数を変更
      process.env.NODE_ENV = 'development';
      delete process.env.SESSION_SECRET;
      vi.resetModules();
    });

    it('セッションにユーザーデータを設定できる', async () => {
      const sessionModule = await import('../session');

      const mockSession = {
        save: vi.fn().mockResolvedValue(undefined),
      } as unknown as IronSession<SessionData>;

      const userData = {
        salesId: 'test-id-123',
        salesCode: 'TEST001',
        salesName: 'Test User',
        email: 'test@example.com',
        department: 'Sales Department',
        isManager: true,
      };

      await sessionModule.setSessionData(mockSession, userData);

      // 全てのユーザーデータが設定されたことを確認
      expect(mockSession.salesId).toBe(userData.salesId);
      expect(mockSession.salesCode).toBe(userData.salesCode);
      expect(mockSession.salesName).toBe(userData.salesName);
      expect(mockSession.email).toBe(userData.email);
      expect(mockSession.department).toBe(userData.department);
      expect(mockSession.isManager).toBe(userData.isManager);

      // expiresAtが設定されたことを確認
      expect(mockSession.expiresAt).toBeDefined();
      expect(typeof mockSession.expiresAt).toBe('number');

      // expiresAtが未来の時刻であることを確認
      expect(mockSession.expiresAt).toBeGreaterThan(Date.now());

      // saveが呼ばれたことを確認
      expect(mockSession.save).toHaveBeenCalledTimes(1);
    });

    it('expiresAtが正しく計算される（SESSION_TIMEOUT_SECONDS後）', async () => {
      const sessionModule = await import('../session');

      const mockSession = {
        save: vi.fn().mockResolvedValue(undefined),
      } as unknown as IronSession<SessionData>;

      const userData = {
        salesId: 'test-id',
        salesCode: 'TEST001',
        salesName: 'Test User',
        email: 'test@example.com',
        department: 'Sales',
        isManager: false,
      };

      const beforeTime = Date.now() + sessionModule.SESSION_TIMEOUT_SECONDS * 1000;
      await sessionModule.setSessionData(mockSession, userData);
      const afterTime = Date.now() + sessionModule.SESSION_TIMEOUT_SECONDS * 1000;

      // expiresAtが期待される範囲内にあることを確認（時間の経過を考慮）
      expect(mockSession.expiresAt).toBeGreaterThanOrEqual(beforeTime);
      expect(mockSession.expiresAt).toBeLessThanOrEqual(afterTime);
    });

    it('管理者フラグが正しく設定される', async () => {
      const sessionModule = await import('../session');

      const mockSession = {
        save: vi.fn().mockResolvedValue(undefined),
      } as unknown as IronSession<SessionData>;

      const managerData = {
        salesId: 'manager-id',
        salesCode: 'MGR001',
        salesName: 'Manager User',
        email: 'manager@example.com',
        department: 'Management',
        isManager: true,
      };

      await sessionModule.setSessionData(mockSession, managerData);

      expect(mockSession.isManager).toBe(true);
    });

    it('非管理者フラグが正しく設定される', async () => {
      const sessionModule = await import('../session');

      const mockSession = {
        save: vi.fn().mockResolvedValue(undefined),
      } as unknown as IronSession<SessionData>;

      const userData = {
        salesId: 'user-id',
        salesCode: 'USR001',
        salesName: 'Regular User',
        email: 'user@example.com',
        department: 'Sales',
        isManager: false,
      };

      await sessionModule.setSessionData(mockSession, userData);

      expect(mockSession.isManager).toBe(false);
    });
  });

  describe('destroySession', () => {
    beforeEach(() => {
      // @ts-expect-error - テスト環境でのみ環境変数を変更
      process.env.NODE_ENV = 'development';
      delete process.env.SESSION_SECRET;
      vi.resetModules();
    });

    it('セッションを破棄できる', async () => {
      const sessionModule = await import('../session');

      const mockSession = {
        destroy: vi.fn(),
        save: vi.fn().mockResolvedValue(undefined),
      } as unknown as IronSession<SessionData>;

      await sessionModule.destroySession(mockSession);

      expect(mockSession.destroy).toHaveBeenCalledTimes(1);
      expect(mockSession.save).toHaveBeenCalledTimes(1);
    });

    it('destroyとsaveが正しい順序で呼ばれる', async () => {
      const sessionModule = await import('../session');

      const callOrder: string[] = [];
      const mockSession = {
        destroy: vi.fn(() => callOrder.push('destroy')),
        save: vi.fn().mockImplementation(() => {
          callOrder.push('save');
          return Promise.resolve();
        }),
      } as unknown as IronSession<SessionData>;

      await sessionModule.destroySession(mockSession);

      expect(callOrder).toEqual(['destroy', 'save']);
    });
  });

  describe('refreshSession', () => {
    beforeEach(() => {
      // @ts-expect-error - テスト環境でのみ環境変数を変更
      process.env.NODE_ENV = 'development';
      delete process.env.SESSION_SECRET;
      vi.resetModules();
    });

    it('有効なセッションの有効期限を延長できる', async () => {
      const sessionModule = await import('../session');

      const originalExpiresAt = Date.now() + 5000;
      const mockSession = {
        salesId: 'test-id',
        salesCode: 'TEST001',
        salesName: 'Test User',
        email: 'test@example.com',
        department: 'Sales',
        isManager: false,
        expiresAt: originalExpiresAt,
        save: vi.fn().mockResolvedValue(undefined),
        destroy: vi.fn(),
        updateConfig: vi.fn(),
      } as unknown as IronSession<SessionData>;

      await sessionModule.refreshSession(mockSession);

      // expiresAtが更新されたことを確認
      expect(mockSession.expiresAt).toBeGreaterThan(originalExpiresAt);

      // 新しいexpiresAtが期待される範囲内にあることを確認
      const expectedMinExpiresAt = Date.now() + sessionModule.SESSION_TIMEOUT_SECONDS * 1000;
      expect(mockSession.expiresAt).toBeGreaterThanOrEqual(expectedMinExpiresAt - 100); // 100msの誤差を許容

      // saveが呼ばれたことを確認
      expect(mockSession.save).toHaveBeenCalledTimes(1);
    });

    it('無効なセッション（期限切れ）は更新されない', async () => {
      const sessionModule = await import('../session');

      const expiredExpiresAt = Date.now() - 5000;
      const mockSession = {
        salesId: 'test-id',
        salesCode: 'TEST001',
        salesName: 'Test User',
        email: 'test@example.com',
        department: 'Sales',
        isManager: false,
        expiresAt: expiredExpiresAt,
        save: vi.fn().mockResolvedValue(undefined),
        destroy: vi.fn(),
        updateConfig: vi.fn(),
      } as unknown as IronSession<SessionData>;

      await sessionModule.refreshSession(mockSession);

      // expiresAtが変更されていないことを確認
      expect(mockSession.expiresAt).toBe(expiredExpiresAt);

      // saveが呼ばれていないことを確認
      expect(mockSession.save).not.toHaveBeenCalled();
    });

    it('salesIdが存在しないセッションは更新されない', async () => {
      const sessionModule = await import('../session');

      const mockSession = {
        expiresAt: Date.now() + 5000,
        save: vi.fn().mockResolvedValue(undefined),
        destroy: vi.fn(),
        updateConfig: vi.fn(),
      } as unknown as IronSession<SessionData>;

      await sessionModule.refreshSession(mockSession);

      // saveが呼ばれていないことを確認
      expect(mockSession.save).not.toHaveBeenCalled();
    });

    it('expiresAtが存在しないセッションは更新されない', async () => {
      const sessionModule = await import('../session');

      const mockSession = {
        salesId: 'test-id',
        salesCode: 'TEST001',
        salesName: 'Test User',
        email: 'test@example.com',
        department: 'Sales',
        isManager: false,
        save: vi.fn().mockResolvedValue(undefined),
        destroy: vi.fn(),
        updateConfig: vi.fn(),
      } as unknown as IronSession<SessionData>;

      await sessionModule.refreshSession(mockSession);

      // saveが呼ばれていないことを確認
      expect(mockSession.save).not.toHaveBeenCalled();
    });
  });

  describe('SESSION_TIMEOUT_SECONDS', () => {
    it('SESSION_TIMEOUT_SECONDSが30分（1800秒）である', async () => {
      // @ts-expect-error - テスト環境でのみ環境変数を変更
      process.env.NODE_ENV = 'development';
      delete process.env.SESSION_SECRET;

      const sessionModule = await import('../session');

      expect(sessionModule.SESSION_TIMEOUT_SECONDS).toBe(30 * 60); // 30分 = 1800秒
      expect(sessionModule.SESSION_TIMEOUT_SECONDS).toBe(1800);
    });
  });
});
