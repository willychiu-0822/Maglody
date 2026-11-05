# Maglody 大師後端：沒有任何 npm 相依套件，Node 22.18+ 可直接執行 TypeScript
FROM node:22-slim
WORKDIR /app
COPY . ./server
ENV NODE_ENV=production
# Cloud Run 會自動提供 PORT（預設 8080）
CMD ["node", "server/index.ts"]
