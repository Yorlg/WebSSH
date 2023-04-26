# 构建前端应用程序
FROM node:lts-alpine AS frontend

RUN npm install pnpm -g

WORKDIR /app

COPY . /app

RUN pnpm install

RUN pnpm run build

# 运行生产应用程序
FROM node:lts-alpine

WORKDIR /app

COPY . /app

COPY --from=frontend /app/dist /app/dist

RUN npm install --production

EXPOSE 8080

CMD ["node", "/app/server/app.js"]
