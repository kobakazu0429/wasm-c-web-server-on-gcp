#!/bin/bash

# -e: コマンドが失敗した時点でスクリプト全体を即座にエラー終了する
# -u: 初期化していない変数があるとエラーにしてくれる
# -x: 実行するコマンドを出力してくれる
set -ux

pushd compiler
bash push.sh
popd

pushd lsp
bash push.sh
popd
