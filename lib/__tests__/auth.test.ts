import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, validatePassword } from '../auth';

describe('auth utility', () => {
  describe('hashPassword', () => {
    it('パスワードをハッシュ化できる', async () => {
      const password = 'TestPassword123';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(0);
    });

    it('同じパスワードでも異なるハッシュが生成される（ソルトが異なるため）', async () => {
      const password = 'TestPassword123';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verifyPassword', () => {
    it('正しいパスワードで検証が成功する', async () => {
      const password = 'TestPassword123';
      const hash = await hashPassword(password);

      const result = await verifyPassword(password, hash);
      expect(result).toBe(true);
    });

    it('間違ったパスワードで検証が失敗する', async () => {
      const password = 'TestPassword123';
      const wrongPassword = 'WrongPassword456';
      const hash = await hashPassword(password);

      const result = await verifyPassword(wrongPassword, hash);
      expect(result).toBe(false);
    });

    it('大文字小文字を区別する', async () => {
      const password = 'TestPassword123';
      const hash = await hashPassword(password);

      const result = await verifyPassword('testpassword123', hash);
      expect(result).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('有効なパスワードが検証を通過する', () => {
      const result = validatePassword('Password123');

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('8文字未満のパスワードがエラーになる', () => {
      const result = validatePassword('Pass1');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('パスワードは8文字以上である必要があります');
    });

    it('英字が含まれていないパスワードがエラーになる', () => {
      const result = validatePassword('12345678');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('パスワードには英字を含める必要があります');
    });

    it('数字が含まれていないパスワードがエラーになる', () => {
      const result = validatePassword('Password');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('パスワードには数字を含める必要があります');
    });

    it('空のパスワードが全てのエラーを返す', () => {
      const result = validatePassword('');

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors).toContain('パスワードは8文字以上である必要があります');
    });

    it('英大文字のみでも有効', () => {
      const result = validatePassword('PASSWORD123');

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('英小文字のみでも有効', () => {
      const result = validatePassword('password123');

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('特殊文字を含むパスワードも有効', () => {
      const result = validatePassword('Pass@word123!');

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});
