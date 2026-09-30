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
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html

EXPOSE 80
