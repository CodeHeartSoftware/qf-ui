# Builds the static UI bundle, then serves it with serve.mjs (a tiny dependency-free Node static
# file server). The API base URL is baked in at build time — pass
# `--build-arg VITE_API_BASE_URL=...` to point at anything other than http://localhost:4410.
FROM node:25-alpine AS build
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . .
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
RUN yarn build

FROM node:25-alpine
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY serve.mjs ./serve.mjs
ENV PORT=5420
EXPOSE 5420
CMD ["node", "serve.mjs"]
