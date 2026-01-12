# Google Cloud Run デプロイ用 Makefile
# プロジェクト設定
PROJECT_ID := sales-daily-report-484115
REGION := asia-northeast1
SERVICE_NAME := sales-daily-report
IMAGE_NAME := $(SERVICE_NAME)
REGISTRY := $(REGION)-docker.pkg.dev
REPOSITORY := $(SERVICE_NAME)
IMAGE_TAG := $(REGISTRY)/$(PROJECT_ID)/$(REPOSITORY)/$(IMAGE_NAME)

# Cloud Run設定
MIN_INSTANCES := 0
MAX_INSTANCES := 10
MEMORY := 512Mi
CPU := 1
TIMEOUT := 300s
CONCURRENCY := 80

# カラー出力
GREEN := \033[0;32m
YELLOW := \033[0;33m
NC := \033[0m # No Color

.PHONY: help
help: ## ヘルプを表示
	@echo "$(GREEN)Sales Daily Report - Cloud Run デプロイ$(NC)"
	@echo ""
	@echo "利用可能なコマンド:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-20s$(NC) %s\n", $$1, $$2}'

.PHONY: setup
setup: ## 初期設定（GCPプロジェクト設定、API有効化、Artifact Registry作成）
	@echo "$(GREEN)GCPプロジェクトを設定...$(NC)"
	gcloud config set project $(PROJECT_ID)
	gcloud config set run/region $(REGION)
	@echo "$(GREEN)必要なAPIを有効化...$(NC)"
	gcloud services enable run.googleapis.com
	gcloud services enable cloudbuild.googleapis.com
	gcloud services enable artifactregistry.googleapis.com
	@echo "$(GREEN)Artifact Registryリポジトリを作成...$(NC)"
	gcloud artifacts repositories create $(REPOSITORY) \
		--repository-format=docker \
		--location=$(REGION) \
		--description="$(SERVICE_NAME) Docker repository" || true
	@echo "$(GREEN)Docker認証を設定...$(NC)"
	gcloud auth configure-docker $(REGISTRY)
	@echo "$(GREEN)セットアップ完了！$(NC)"

.PHONY: build
build: ## Dockerイメージをビルド
	@echo "$(GREEN)Dockerイメージをビルド中...$(NC)"
	docker build -t $(IMAGE_TAG):latest -t $(IMAGE_TAG):$(shell git rev-parse --short HEAD) .
	@echo "$(GREEN)ビルド完了！$(NC)"

.PHONY: push
push: ## DockerイメージをArtifact Registryにプッシュ
	@echo "$(GREEN)イメージをプッシュ中...$(NC)"
	docker push $(IMAGE_TAG):latest
	docker push $(IMAGE_TAG):$(shell git rev-parse --short HEAD)
	@echo "$(GREEN)プッシュ完了！$(NC)"

.PHONY: build-push
build-push: build push ## ビルドとプッシュを実行

.PHONY: deploy
deploy: ## Cloud Runにデプロイ
	@echo "$(GREEN)Cloud Runにデプロイ中...$(NC)"
	gcloud run deploy $(SERVICE_NAME) \
		--image $(IMAGE_TAG):latest \
		--platform managed \
		--region $(REGION) \
		--allow-unauthenticated \
		--memory $(MEMORY) \
		--cpu $(CPU) \
		--min-instances $(MIN_INSTANCES) \
		--max-instances $(MAX_INSTANCES) \
		--timeout $(TIMEOUT) \
		--concurrency $(CONCURRENCY)
	@echo "$(GREEN)デプロイ完了！$(NC)"
	@$(MAKE) url

.PHONY: deploy-full
deploy-full: build-push deploy ## フルデプロイ（ビルド→プッシュ→デプロイ）

.PHONY: deploy-cloud-build
deploy-cloud-build: ## Cloud Buildを使用してデプロイ
	@echo "$(GREEN)Cloud Buildでビルド・デプロイ中...$(NC)"
	gcloud builds submit --config cloudbuild.yaml
	@echo "$(GREEN)デプロイ完了！$(NC)"
	@$(MAKE) url

.PHONY: set-env
set-env: ## 環境変数を設定（.env.production から読み込み）
	@if [ ! -f .env.production ]; then \
		echo "$(YELLOW).env.production ファイルが見つかりません$(NC)"; \
		exit 1; \
	fi
	@echo "$(GREEN)環境変数を設定中...$(NC)"
	@export $$(cat .env.production | xargs) && \
	gcloud run services update $(SERVICE_NAME) \
		--region $(REGION) \
		--update-env-vars DATABASE_URL="$$DATABASE_URL",SESSION_SECRET="$$SESSION_SECRET",NEXT_PUBLIC_APP_URL="$$NEXT_PUBLIC_APP_URL",NODE_ENV=production
	@echo "$(GREEN)環境変数の設定完了！$(NC)"

.PHONY: create-secrets
create-secrets: ## Secret Managerにシークレットを作成
	@echo "$(GREEN)シークレットを作成中...$(NC)"
	@read -p "DATABASE_URL: " db_url; \
	echo -n "$$db_url" | gcloud secrets create database-url --data-file=- || true
	@read -p "SESSION_SECRET: " session_secret; \
	echo -n "$$session_secret" | gcloud secrets create session-secret --data-file=- || true
	@echo "$(GREEN)シークレットの作成完了！$(NC)"

.PHONY: set-secrets
set-secrets: ## Secret Managerからシークレットを設定
	@echo "$(GREEN)シークレットを設定中...$(NC)"
	gcloud run services update $(SERVICE_NAME) \
		--region $(REGION) \
		--set-secrets=DATABASE_URL=database-url:latest,SESSION_SECRET=session-secret:latest
	@echo "$(GREEN)シークレットの設定完了！$(NC)"

.PHONY: logs
logs: ## ログを表示（リアルタイム）
	@echo "$(GREEN)ログを表示中... (Ctrl+Cで終了)$(NC)"
	gcloud run services logs tail $(SERVICE_NAME) --region $(REGION)

.PHONY: logs-read
logs-read: ## 最新のログを表示（50件）
	@echo "$(GREEN)最新のログを表示...$(NC)"
	gcloud run services logs read $(SERVICE_NAME) --region $(REGION) --limit 50

.PHONY: logs-errors
logs-errors: ## エラーログのみ表示
	@echo "$(GREEN)エラーログを表示...$(NC)"
	gcloud run services logs read $(SERVICE_NAME) --region $(REGION) --filter "severity>=ERROR" --limit 50

.PHONY: describe
describe: ## サービスの詳細情報を表示
	@echo "$(GREEN)サービス情報...$(NC)"
	gcloud run services describe $(SERVICE_NAME) --region $(REGION)

.PHONY: url
url: ## サービスのURLを表示
	@echo "$(GREEN)サービスURL:$(NC)"
	@gcloud run services describe $(SERVICE_NAME) --region $(REGION) --format 'value(status.url)'

.PHONY: status
status: ## サービスのステータスを確認
	@echo "$(GREEN)サービスステータス...$(NC)"
	@gcloud run services describe $(SERVICE_NAME) --region $(REGION) --format 'value(status.conditions[0].status,status.conditions[0].message)'

.PHONY: revisions
revisions: ## デプロイ履歴（リビジョン）を表示
	@echo "$(GREEN)デプロイ履歴...$(NC)"
	gcloud run revisions list --service $(SERVICE_NAME) --region $(REGION)

.PHONY: rollback
rollback: ## 前のリビジョンにロールバック
	@echo "$(GREEN)リビジョン一覧:$(NC)"
	@gcloud run revisions list --service $(SERVICE_NAME) --region $(REGION) --format 'table(name,status)'
	@read -p "ロールバック先のリビジョン名を入力: " revision; \
	gcloud run services update-traffic $(SERVICE_NAME) --region $(REGION) --to-revisions $$revision=100
	@echo "$(GREEN)ロールバック完了！$(NC)"

.PHONY: scale
scale: ## スケーリング設定を変更
	@read -p "最小インスタンス数 (現在: $(MIN_INSTANCES)): " min; \
	read -p "最大インスタンス数 (現在: $(MAX_INSTANCES)): " max; \
	gcloud run services update $(SERVICE_NAME) \
		--region $(REGION) \
		--min-instances $$min \
		--max-instances $$max
	@echo "$(GREEN)スケーリング設定を更新しました$(NC)"

.PHONY: delete
delete: ## サービスを削除
	@read -p "本当に $(SERVICE_NAME) を削除しますか? (yes/no): " confirm; \
	if [ "$$confirm" = "yes" ]; then \
		gcloud run services delete $(SERVICE_NAME) --region $(REGION); \
		echo "$(GREEN)サービスを削除しました$(NC)"; \
	else \
		echo "$(YELLOW)削除をキャンセルしました$(NC)"; \
	fi

.PHONY: local-build
local-build: ## ローカルでDockerイメージをビルドしてテスト
	@echo "$(GREEN)ローカルでDockerイメージをビルド...$(NC)"
	docker build -t $(SERVICE_NAME):local .
	@echo "$(GREEN)ビルド完了！$(NC)"
	@echo "$(YELLOW)起動するには: docker run -p 3000:3000 --env-file .env.local $(SERVICE_NAME):local$(NC)"

.PHONY: local-run
local-run: local-build ## ローカルでDockerコンテナを起動
	@echo "$(GREEN)ローカルでコンテナを起動...$(NC)"
	docker run -p 3000:3000 --env-file .env.local $(SERVICE_NAME):local

.PHONY: clean
clean: ## ローカルのDockerイメージを削除
	@echo "$(GREEN)ローカルイメージを削除...$(NC)"
	docker rmi $(SERVICE_NAME):local || true
	docker rmi $(IMAGE_TAG):latest || true
	@echo "$(GREEN)削除完了！$(NC)"

.PHONY: prisma-push
prisma-push: ## 本番DBにPrismaスキーマをプッシュ（初回のみ）
	@if [ ! -f .env.production ]; then \
		echo "$(YELLOW).env.production ファイルが見つかりません$(NC)"; \
		exit 1; \
	fi
	@echo "$(GREEN)本番DBにPrismaスキーマをプッシュ...$(NC)"
	@export $$(cat .env.production | xargs) && npx prisma db push
	@echo "$(GREEN)完了！$(NC)"

.PHONY: info
info: ## プロジェクト情報を表示
	@echo "$(GREEN)=== プロジェクト情報 ===$(NC)"
	@echo "PROJECT_ID:   $(PROJECT_ID)"
	@echo "REGION:       $(REGION)"
	@echo "SERVICE_NAME: $(SERVICE_NAME)"
	@echo "IMAGE_TAG:    $(IMAGE_TAG):latest"
	@echo "MEMORY:       $(MEMORY)"
	@echo "CPU:          $(CPU)"
	@echo "MIN/MAX:      $(MIN_INSTANCES)/$(MAX_INSTANCES)"
