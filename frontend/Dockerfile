# --- Build: compile the Angular app ---
FROM node:24-alpine AS build
WORKDIR /app

# Install dependencies first so this layer is cached while only the source changes.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# --- Runtime: serve the static files with nginx ---
FROM nginx:1.29-alpine

# nginx renders /etc/nginx/templates/*.template into conf.d, substituting env vars like PORT.
ENV PORT=80
# Backend base URL, e.g. https://math-game-api.up.railway.app (set it in the platform).
ENV API_URL=""

COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --chmod=755 nginx/40-env-js.sh /docker-entrypoint.d/40-env-js.sh
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html

EXPOSE 80
