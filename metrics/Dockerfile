FROM node:20-slim

ARG APP_ROOT=/app
WORKDIR $APP_ROOT

COPY package*.json ./

RUN npm ci --only=production

COPY index.mjs ./
CMD ["node", "index.mjs"]
