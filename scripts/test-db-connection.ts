#!/usr/bin/env ts-node

/* eslint-disable no-console */
/**
 * Database Connection Test Script
 *
 * このスクリプトはPrismaクライアントを使用してMongoDBへの接続をテストします。
 * 接続成功時はデータベース情報を表示し、失敗時は詳細なエラー情報と
 * トラブルシューティングガイドを提供します。
 */

// 環境変数を読み込む（.env.localから）
import { config } from 'dotenv';
import { resolve } from 'path';

// .env.localを読み込む
config({ path: resolve(__dirname, '../.env.local') });

import { PrismaClient } from '@prisma/client';

interface ConnectionTestResult {
  success: boolean;
  message: string;
  details?: {
    databaseUrl?: string;
    serverVersion?: string;
    collections?: string[];
    error?: string;
    stack?: string;
  };
}

/**
 * トラブルシューティングガイドを表示
 */
function displayTroubleshootingGuide(error: Error): void {
  console.error('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error('❌ データベース接続エラー');
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.error(`エラーメッセージ: ${error.message}\n`);

  // エラータイプに応じたトラブルシューティング
  if (error.message.includes('ECONNREFUSED')) {
    console.error('🔍 原因: MongoDBサーバーに接続できません\n');
    console.error('📝 解決方法:');
    console.error('  1. MongoDBが起動しているか確認してください:');
    console.error('     $ docker ps | grep mongodb');
    console.error('\n  2. MongoDBを起動してください:');
    console.error('     $ npm run db:up');
    console.error('\n  3. 接続文字列が正しいか確認してください:');
    console.error('     .env.local ファイルの DATABASE_URL を確認');
  } else if (error.message.includes('Authentication failed') || error.message.includes('auth')) {
    console.error('🔍 原因: 認証に失敗しました\n');
    console.error('📝 解決方法:');
    console.error('  1. ユーザー名とパスワードが正しいか確認してください');
    console.error('  2. MongoDB Atlas の場合:');
    console.error('     - IPアドレスがホワイトリストに追加されているか確認');
    console.error('     - ユーザーに適切な権限が付与されているか確認');
  } else if (error.message.includes('getaddrinfo') || error.message.includes('ENOTFOUND')) {
    console.error('🔍 原因: ホスト名が解決できません\n');
    console.error('📝 解決方法:');
    console.error('  1. ネットワーク接続を確認してください');
    console.error('  2. DATABASE_URLのホスト名が正しいか確認してください');
    console.error('  3. MongoDB Atlas の場合:');
    console.error('     - クラスターのURLが正しいか確認');
  } else if (error.message.includes('timeout')) {
    console.error('🔍 原因: 接続タイムアウトが発生しました\n');
    console.error('📝 解決方法:');
    console.error('  1. ネットワーク接続が安定しているか確認');
    console.error('  2. ファイアウォール設定を確認');
    console.error('  3. MongoDB Atlas の場合:');
    console.error('     - ネットワークアクセス設定を確認');
  } else if (!process.env.DATABASE_URL) {
    console.error('🔍 原因: DATABASE_URL環境変数が設定されていません\n');
    console.error('📝 解決方法:');
    console.error('  1. .env.local ファイルを作成してください:');
    console.error('     $ cp .env.example .env.local');
    console.error('\n  2. DATABASE_URL を設定してください');
    console.error('     ローカル: DATABASE_URL="mongodb://localhost:27017/sales_daily_report"');
    console.error(
      '     Atlas: DATABASE_URL="mongodb+srv://user:pass@cluster.mongodb.net/sales_daily_report"'
    );
  } else {
    console.error('🔍 その他のエラーが発生しました\n');
    console.error('📝 一般的な解決方法:');
    console.error('  1. Prismaクライアントを再生成:');
    console.error('     $ npm run prisma:generate');
    console.error('\n  2. 環境変数を確認:');
    console.error('     $ cat .env.local');
    console.error('\n  3. MongoDBのログを確認:');
    console.error('     $ docker logs sales_daily_report_mongodb');
  }

  console.error('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

/**
 * データベース接続をテスト
 */
async function testDatabaseConnection(): Promise<ConnectionTestResult> {
  const prisma = new PrismaClient({
    log: ['error', 'warn'],
  });

  try {
    console.log('🔌 データベース接続テストを開始します...\n');

    // 環境変数の確認
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL 環境変数が設定されていません');
    }

    // セキュリティ: URLからパスワードを隠してログに表示
    const sanitizedUrl = databaseUrl.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
    console.log(`📝 接続先: ${sanitizedUrl}\n`);

    // 接続テスト: シンプルなクエリを実行
    console.log('⏳ データベースに接続中...');
    await prisma.$connect();
    console.log('✅ データベースに接続しました\n');

    // データベース情報を取得
    console.log('📊 データベース情報を取得中...');

    // MongoDBのバージョン情報を取得（rawクエリ使用）
    const serverInfo = await prisma.$runCommandRaw({
      buildInfo: 1,
    });

    const serverVersion =
      typeof serverInfo === 'object' && serverInfo !== null && 'version' in serverInfo
        ? String(serverInfo.version)
        : 'Unknown';

    console.log(`✅ MongoDBバージョン: ${serverVersion}\n`);

    // コレクション一覧を取得
    console.log('📋 コレクション一覧:');
    const collections = await prisma.$runCommandRaw({
      listCollections: 1,
    });

    const collectionNames =
      typeof collections === 'object' &&
      collections !== null &&
      'cursor' in collections &&
      typeof collections.cursor === 'object' &&
      collections.cursor !== null &&
      'firstBatch' in collections.cursor &&
      Array.isArray(collections.cursor.firstBatch)
        ? collections.cursor.firstBatch
            .map((col) =>
              typeof col === 'object' && col !== null && 'name' in col ? String(col.name) : null
            )
            .filter((name): name is string => name !== null)
        : [];

    if (collectionNames.length === 0) {
      console.log('  (コレクションはまだ作成されていません)');
      console.log('  💡 ヒント: "npm run db:push" を実行してスキーマを反映してください');
    } else {
      collectionNames.forEach((name) => {
        console.log(`  - ${name}`);
      });
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✨ データベース接続テスト成功！');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    return {
      success: true,
      message: 'データベース接続テストが成功しました',
      details: {
        databaseUrl: sanitizedUrl,
        serverVersion,
        collections: collectionNames,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    if (error instanceof Error) {
      displayTroubleshootingGuide(error);
    }

    return {
      success: false,
      message: 'データベース接続テストが失敗しました',
      details: {
        error: errorMessage,
        stack: errorStack,
      },
    };
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * メイン実行関数
 */
async function main(): Promise<void> {
  const result = await testDatabaseConnection();

  // 終了コードを設定
  process.exit(result.success ? 0 : 1);
}

// スクリプトとして実行された場合のみmainを実行
if (require.main === module) {
  main().catch((error) => {
    console.error('予期しないエラーが発生しました:', error);
    process.exit(1);
  });
}

export { testDatabaseConnection };
export type { ConnectionTestResult };
