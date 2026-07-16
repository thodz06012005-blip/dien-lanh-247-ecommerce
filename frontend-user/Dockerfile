# syntax=docker/dockerfile:1.7
FROM node:22-alpine AS build
WORKDIR /app
ARG VITE_APP_ENV=production
ARG VITE_APP_URL=https://dienlanh247.example
ARG VITE_API_BASE_URL=https://dienlanh247.example/api/v1
ARG VITE_USE_MOCK_API=false
ENV VITE_APP_ENV=$VITE_APP_ENV \
    VITE_APP_URL=$VITE_APP_URL \
    VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_USE_MOCK_API=$VITE_USE_MOCK_API
COPY frontend-user/package.json frontend-user/package-lock.json ./
RUN npm ci
COPY frontend-user/ ./
RUN npm run build

FROM nginx:1.27-alpine
COPY frontend-user/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1/healthz || exit 1
