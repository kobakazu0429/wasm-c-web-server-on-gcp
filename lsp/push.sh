#!/bin/bash

# -e: コマンドが失敗した時点でスクリプト全体を即座にエラー終了する
# -u: 初期化していない変数があるとエラーにしてくれる
# -x: 実行するコマンドを出力してくれる
set -ux

repository=gcr
location=asia-northeast1
tag=lsp

docker build --platform linux/amd64 -t $tag .
# docker build --platform linux/amd64 -t $tag --no-cache .

if [ $? -ne 0 ]; then
  echo "build failed :C"
  exit 1
fi

ar_tag=$location-docker.pkg.dev/wasm-c-web/$repository/$tag:latest

docker tag $tag:latest $ar_tag

docker push $ar_tag

if [ $? -ne 0 ]; then
  gcloud auth configure-docker $location-docker.pkg.dev
  gcloud artifacts repositories create $repository \
    --repository-format=docker \
    --location=$location
  docker push $ar_tag
fi
