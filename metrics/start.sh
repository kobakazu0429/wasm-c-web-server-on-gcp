docker build --platform linux/amd64 -t metrics . &&  docker run --rm --init -p 8082:8080 -t metrics
