import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { checkLoginRateLimit, resetLoginRateLimit, getClientIp } from '../rate-limiter';

describe('rate-limiter', () => {
  describe('checkLoginRateLimit', () => {
    const testIp = '192.168.1.100';

    beforeEach(async () => {
      // テスト前にレート制限をリセット
      await resetLoginRateLimit(testIp);
    });

    it('最初のリクエストは成功する', async () => {
      const result = await checkLoginRateLimit(testIp);

      expect(result.success).toBe(true);
      expect(result.remainingPoints).toBeDefined();
      expect(result.remainingPoints).toBeLessThanOrEqual(5);
    });

    it('5回連続でリクエストが成功する', async () => {
      for (let i = 0; i < 5; i++) {
        const result = await checkLoginRateLimit(testIp);
        expect(result.success).toBe(true);
      }
    });

    it('6回目のリクエストはレート制限に引っかかる', async () => {
      // 5回リクエストして制限に達する
      for (let i = 0; i < 5; i++) {
        const result = await checkLoginRateLimit(testIp);
        expect(result.success).toBe(true);
      }

      // 6回目はブロックされる
      const result = await checkLoginRateLimit(testIp);
      expect(result.success).toBe(false);
      expect(result.retryAfter).toBeDefined();
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    it('異なるIPアドレスは独立してカウントされる', async () => {
      const ip1 = '192.168.1.1';
      const ip2 = '192.168.1.2';

      // 各IPをリセット
      await resetLoginRateLimit(ip1);
      await resetLoginRateLimit(ip2);

      // ip1で5回リクエストして制限に達する
      for (let i = 0; i < 5; i++) {
        const result = await checkLoginRateLimit(ip1);
        expect(result.success).toBe(true);
      }

      // ip2では成功する（独立してカウントされている）
      const result2 = await checkLoginRateLimit(ip2);
      expect(result2.success).toBe(true);

      // ip1では失敗する（制限に達している）
      const result1 = await checkLoginRateLimit(ip1);
      expect(result1.success).toBe(false);
    });
  });

  describe('resetLoginRateLimit', () => {
    const testIp = '192.168.1.200';

    it('レート制限をリセットできる', async () => {
      // 5回リクエストしてレート制限に達する
      for (let i = 0; i < 5; i++) {
        await checkLoginRateLimit(testIp);
      }

      // レート制限をリセット
      await resetLoginRateLimit(testIp);

      // リセット後は再度リクエストが成功する
      const result = await checkLoginRateLimit(testIp);
      expect(result.success).toBe(true);
    });
  });

  describe('getClientIp', () => {
    const originalTrustProxy = process.env.TRUST_PROXY;

    beforeEach(() => {
      // TRUST_PROXY環境変数を設定してプロキシヘッダーを信頼する
      process.env.TRUST_PROXY = 'true';
    });

    afterEach(() => {
      // テスト後に元の値に戻す
      process.env.TRUST_PROXY = originalTrustProxy;
    });

    it('X-Forwarded-ForヘッダーからIPを取得できる（最後のIPを返す）', () => {
      const request = new Request('http://localhost', {
        headers: {
          'x-forwarded-for': '203.0.113.1, 198.51.100.1',
        },
      });

      const ip = getClientIp(request);
      // セキュリティ上、最後のIP（最も信頼できるプロキシに近いIP）を返す
      expect(ip).toBe('198.51.100.1');
    });

    it('X-Real-IPヘッダーからIPを取得できる', () => {
      const request = new Request('http://localhost', {
        headers: {
          'x-real-ip': '203.0.113.2',
        },
      });

      const ip = getClientIp(request);
      expect(ip).toBe('203.0.113.2');
    });

    it('X-Forwarded-ForがX-Real-IPより優先される', () => {
      const request = new Request('http://localhost', {
        headers: {
          'x-forwarded-for': '203.0.113.1',
          'x-real-ip': '203.0.113.2',
        },
      });

      const ip = getClientIp(request);
      expect(ip).toBe('203.0.113.1');
    });

    it('ヘッダーがない場合はunknownを返す', () => {
      const request = new Request('http://localhost');

      const ip = getClientIp(request);
      expect(ip).toBe('unknown');
    });

    it('X-Forwarded-Forに複数のIPがある場合、最後のIPを返す', () => {
      const request = new Request('http://localhost', {
        headers: {
          'x-forwarded-for': '203.0.113.1, 198.51.100.1, 192.168.1.1',
        },
      });

      const ip = getClientIp(request);
      // セキュリティ上、最後のIP（最も信頼できるプロキシに近いIP）を返す
      expect(ip).toBe('192.168.1.1');
    });

    it('X-Forwarded-ForのIPにスペースがある場合、トリムされる', () => {
      const request = new Request('http://localhost', {
        headers: {
          'x-forwarded-for': '  203.0.113.1  , 198.51.100.1',
        },
      });

      const ip = getClientIp(request);
      // セキュリティ上、最後のIP（最も信頼できるプロキシに近いIP）を返す
      expect(ip).toBe('198.51.100.1');
    });

    it('TRUST_PROXYがfalseの場合はunknownを返す', () => {
      process.env.TRUST_PROXY = 'false';

      const request = new Request('http://localhost', {
        headers: {
          'x-forwarded-for': '203.0.113.1',
          'x-real-ip': '203.0.113.2',
        },
      });

      const ip = getClientIp(request);
      // プロキシを信頼しない場合はヘッダーを読まない
      expect(ip).toBe('unknown');
    });
  });
});
