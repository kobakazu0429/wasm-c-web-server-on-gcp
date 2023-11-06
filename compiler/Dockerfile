FROM node:20-slim

ARG APP_ROOT=/app
WORKDIR $APP_ROOT

RUN apt-get update \
  && apt-get install -y --no-install-recommends wget tar gzip \
  && apt-get -y clean \
  && rm -rf /var/lib/apt/lists/*

# wasi-sdk
RUN wget --no-check-certificate https://github.com/WebAssembly/wasi-sdk/releases/download/wasi-sdk-12/wasi-sdk-12.0-linux.tar.gz
RUN tar xvzf wasi-sdk-12.0-linux.tar.gz && rm wasi-sdk-12.0-linux.tar.gz
ENV PATH $PATH:$APP_ROOT/wasi-sdk-12.0/bin
ENV WASI_SDK_PATH $APP_ROOT/wasi-sdk-12.0

# wasm-opt
RUN wget --no-check-certificate https://github.com/WebAssembly/binaryen/releases/download/version_101/binaryen-version_101-x86_64-linux.tar.gz
RUN tar xvzf binaryen-version_101-x86_64-linux.tar.gz && rm binaryen-version_101-x86_64-linux.tar.gz
ENV PATH $PATH:$APP_ROOT/binaryen-version_101/bin
ENV WASM_OPT_PATH $APP_ROOT/binaryen-version_101/bin/wasm-opt

COPY package*.json ./

RUN npm ci --only=production

COPY index.mjs ./
CMD ["node", "index.mjs"]
