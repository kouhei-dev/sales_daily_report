#!/bin/bash

# MongoDBレプリカセットの初期化を確実に実行するスクリプト
# docker-compose up 後にこのスクリプトを実行してください

echo "🔍 Checking MongoDB container status..."

# MongoDBコンテナが起動するまで待機
until docker exec sales_daily_report_mongodb mongosh --quiet --eval "db.adminCommand('ping')" > /dev/null 2>&1; do
  echo "⏳ Waiting for MongoDB to be ready..."
  sleep 2
done

echo "✅ MongoDB is ready"

# レプリカセットが既に初期化されているかチェック
echo "🔍 Checking if replica set is already initialized..."
if docker exec sales_daily_report_mongodb mongosh --quiet --eval "try { rs.status().ok } catch(e) { 0 }" | grep -q "1"; then
  echo "✅ Replica set is already initialized."
  exit 0
fi

# レプリカセットを初期化
echo "🚀 Initializing replica set..."
docker exec sales_daily_report_mongodb mongosh --eval '
try {
  var result = rs.initiate({
    _id: "rs0",
    members: [
      { _id: 0, host: "localhost:27017" }
    ]
  });
  if (result.ok === 1) {
    print("✅ Replica set initialized successfully!");
  } else {
    print("⚠️  Replica set initialization returned:", JSON.stringify(result));
  }
} catch (e) {
  if (e.codeName === "AlreadyInitialized") {
    print("ℹ️  Replica set is already initialized.");
  } else {
    print("❌ Error initializing replica set:", e);
    throw e;
  }
}
'

echo "🎉 Replica set setup completed!"
