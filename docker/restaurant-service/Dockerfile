FROM node:22-alpine AS builder

WORKDIR /app

COPY restaurant-service/package*.json ./
RUN npm ci

COPY restaurant-service/ .
RUN npm run build

FROM node:22-alpine AS runner

WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

USER appuser

EXPOSE 5564

CMD ["node", "dist/main"]
