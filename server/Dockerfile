# 這份映像只跑大師 API，沒有前端靜態檔。
# 單一預覽網址請用 repo 根目錄的 render.yaml（Node 服務），不要用這份 Dockerfile。
# Maglody 大師後端：沒有任何 npm 相依套件，Node 22.18+ 可直接執行 TypeScript
FROM node:22-slim
WORKDIR /app
COPY . ./server
ENV NODE_ENV=production
# Cloud Run 會自動提供 PORT（預設 8080）
CMD ["node", "server/index.ts"]
