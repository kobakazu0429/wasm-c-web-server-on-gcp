docker build --platform linux/amd64 -t compiler . &&  docker run --rm --init -p 8081:8080 -t compiler
