docker build --platform linux/amd64 -t lsp . &&  docker run --rm --init -p 8083:8080 -t lsp
