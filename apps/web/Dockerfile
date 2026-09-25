FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json ./
COPY packages/shared-types ./packages/shared-types
COPY apps/web ./apps/web

RUN npm install
RUN npm run build --workspace=packages/shared-types
RUN npm run build --workspace=apps/web

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared-types ./packages/shared-types
COPY --from=builder /app/apps/web/package.json ./apps/web/
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/node_modules ./apps/web/node_modules

EXPOSE 3000

CMD ["npm", "run", "start", "--workspace=apps/web"]
