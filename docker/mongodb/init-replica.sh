#!/bin/bash

# MongoDBレプリカセットの初期化スクリプト
# このスクリプトは開発環境用で、単一ノードのレプリカセットを構成します

echo "Waiting for MongoDB to start..."
sleep 5

echo "Checking if replica set is already initialized..."
if mongosh --quiet --eval "rs.status().ok" | grep -q "1"; then
  echo "Replica set is already initialized."
  exit 0
fi

echo "Initializing replica set..."
mongosh --eval '
try {
  var result = rs.initiate({
    _id: "rs0",
    members: [
      { _id: 0, host: "localhost:27017" }
    ]
  });
  print("Replica set initialization result:", JSON.stringify(result));
  if (result.ok === 1) {
    print("Replica set initialized successfully!");
  } else {
    print("Replica set initialization returned ok != 1");
  }
} catch (e) {
  if (e.codeName === "AlreadyInitialized") {
    print("Replica set is already initialized (caught exception).");
  } else {
    print("Error initializing replica set:", e);
    throw e;
  }
}
'

echo "Replica set initialization completed!"
