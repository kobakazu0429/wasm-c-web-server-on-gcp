#!/bin/bash

# -e: コマンドが失敗した時点でスクリプト全体を即座にエラー終了する
# -u: 初期化していない変数があるとエラーにしてくれる
# -x: 実行するコマンドを出力してくれる
set -ux

PROJECT_ID="wasm-c-web"
SERVICE_ACCOUNT_NAME="wasm-c-web-tf"

gcloud config set project $PROJECT_ID
gcloud config set run/region asia-northeast1

gcloud iam service-accounts create $SERVICE_ACCOUNT_NAME
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/editor"
gcloud iam service-accounts keys create key.json \
  --iam-account "$SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com"

bash deploy.sh

terraform init
terraform apply

gcloud run services add-iam-policy-binding compiler \
  --member="allUsers" \
  --role="roles/run.invoker"
gcloud run services add-iam-policy-binding lsp \
  --member="allUsers" \
  --role="roles/run.invoker"
gcloud run services add-iam-policy-binding metrics \
  --member="allUsers" \
  --role="roles/run.invoker"
