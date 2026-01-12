import { describe, test, expect } from 'vitest';
import { cn, formatDate, formatDateJa } from '@/lib/utils';

describe('cn', () => {
  test('単一のクラス名を返す', () => {
    expect(cn('text-red-500')).toBe('text-red-500');
  });

  test('複数のクラス名をマージする', () => {
    expect(cn('text-red-500', 'bg-blue-500')).toBe('text-red-500 bg-blue-500');
  });

  test('条件付きクラス名を処理する', () => {
    const isActive = true;
    expect(cn('base-class', isActive && 'active-class')).toBe('base-class active-class');
  });

  test('falseの条件付きクラスを無視する', () => {
    const isActive = false;
    expect(cn('base-class', isActive && 'active-class')).toBe('base-class');
  });

  test('Tailwindクラスの競合を解決する', () => {
    // 後のクラスが優先される
    expect(cn('p-4', 'p-8')).toBe('p-8');
  });

  test('配列形式のクラスを処理する', () => {
    expect(cn(['text-red-500', 'bg-blue-500'])).toBe('text-red-500 bg-blue-500');
  });

  test('オブジェクト形式のクラスを処理する', () => {
    expect(cn({ 'text-red-500': true, 'bg-blue-500': false })).toBe('text-red-500');
  });
});

describe('formatDate', () => {
  test('Date型をYYYY-MM-DD形式にフォーマットする', () => {
    const date = new Date('2026-01-12T10:30:00');
    expect(formatDate(date)).toBe('2026-01-12');
  });

  test('文字列型の日付をYYYY-MM-DD形式にフォーマットする', () => {
    expect(formatDate('2026-01-12T10:30:00')).toBe('2026-01-12');
  });

  test('1桁の月日を0埋めする', () => {
    const date = new Date('2026-03-05T10:30:00');
    expect(formatDate(date)).toBe('2026-03-05');
  });

  test('年末の日付を正しくフォーマットする', () => {
    const date = new Date('2025-12-31T23:59:59');
    expect(formatDate(date)).toBe('2025-12-31');
  });

  test('年始の日付を正しくフォーマットする', () => {
    const date = new Date('2026-01-01T00:00:00');
    expect(formatDate(date)).toBe('2026-01-01');
  });
});

describe('formatDateJa', () => {
  test('Date型を日本語形式にフォーマットする', () => {
    const date = new Date('2026-01-12T10:30:00');
    expect(formatDateJa(date)).toBe('2026年1月12日');
  });

  test('文字列型の日付を日本語形式にフォーマットする', () => {
    expect(formatDateJa('2026-01-12T10:30:00')).toBe('2026年1月12日');
  });

  test('1桁の月日を0埋めしない', () => {
    const date = new Date('2026-03-05T10:30:00');
    expect(formatDateJa(date)).toBe('2026年3月5日');
  });

  test('年末の日付を正しくフォーマットする', () => {
    const date = new Date('2025-12-31T23:59:59');
    expect(formatDateJa(date)).toBe('2025年12月31日');
  });

  test('年始の日付を正しくフォーマットする', () => {
    const date = new Date('2026-01-01T00:00:00');
    expect(formatDateJa(date)).toBe('2026年1月1日');
  });
});
