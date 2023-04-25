# 构建前端应用程序
FROM node:lts-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# 运行生产应用程序
FROM node:lts-alpine
WORKDIR /app
COPY --from=build /app/build ./build
COPY package*.json ./
RUN npm install --production
EXPOSE 8080
CMD ["npm", "start"]
