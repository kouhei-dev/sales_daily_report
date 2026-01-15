// MongoDB初期化スクリプト
// データベースとインデックスの初期設定

db = db.getSiblingDB('sales_daily_report');

// コレクションが存在しない場合のみ作成
// Prismaがスキーマから自動生成するため、通常は不要だが、
// 明示的にコレクションを作成しておくことで、初期化を確実にする

print('Initializing sales_daily_report database...');

// 各コレクションを作成（存在しない場合のみ）
const collections = [
  'sales',
  'customers',
  'daily_reports',
  'visit_records',
  'comments',
];

collections.forEach((collectionName) => {
  if (!db.getCollectionNames().includes(collectionName)) {
    db.createCollection(collectionName);
    print(`Created collection: ${collectionName}`);
  } else {
    print(`Collection already exists: ${collectionName}`);
  }
});

print('Database initialization completed successfully.');
