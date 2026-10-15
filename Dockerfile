FROM node:22-bookworm-slim

WORKDIR /app

ARG NPM_STRICT_SSL=true
ARG NODE_TLS_REJECT_UNAUTHORIZED=1
ENV npm_config_strict_ssl=${NPM_STRICT_SSL}
ENV NODE_TLS_REJECT_UNAUTHORIZED=${NODE_TLS_REJECT_UNAUTHORIZED}

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma
RUN npm ci --no-audit --no-fund

COPY . .
RUN npx prisma generate && npm run build \
  && chmod +x docker-entrypoint.sh

EXPOSE 3001

CMD ["./docker-entrypoint.sh"]
