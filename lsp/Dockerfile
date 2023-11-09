FROM node:20-bullseye-slim

ARG APP_ROOT=/app
WORKDIR $APP_ROOT

RUN apt-get update \
  && apt-get install -y --no-install-recommends wget lsb-release software-properties-common gnupg \
  && apt-get -y clean \
  && rm -rf /var/lib/apt/lists/*

RUN bash -c "$(wget -O - https://apt.llvm.org/llvm.sh)"
RUN apt-get install -y clangd-17 clang-format-17
ENV CLANGD /usr/bin/clangd-17

RUN apt purge --auto-remove -y wget lsb-release software-properties-common gnupg \
  && apt clean \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

RUN npm ci --only=production

COPY index.mjs ./
COPY .clang-format /
CMD ["node", "index.mjs"]
