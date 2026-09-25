FROM node:20-alpine AS builder

WORKDIR /app

# Copy package manifests and configurations
COPY package.json ./
COPY packages/shared-types ./packages/shared-types
COPY apps/api ./apps/api

# Install dependencies and build shared-types & API
RUN npm install
RUN npm run build --workspace=packages/shared-types
RUN npx --workspace=apps/api prisma generate
RUN npm run build --workspace=apps/api

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV API_PORT=4000

# Copy built artifacts and production dependencies
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared-types ./packages/shared-types
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules

EXPOSE 4000

CMD ["sh", "-c", "npx prisma migrate deploy --schema=./apps/api/prisma/schema.prisma || true && node apps/api/dist/server.js"]
