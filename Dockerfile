# ---- build the frontend ----
FROM node:22-alpine AS web
WORKDIR /app/frontend
COPY frontend/package.json ./
RUN npm install --no-audit --no-fund
COPY frontend/ ./
RUN npm run build

# ---- runtime: zero-dependency Node API that also serves the built frontend ----
FROM node:22-alpine
ENV NODE_ENV=production PORT=5000
WORKDIR /app
COPY backend/ ./backend/
COPY --from=web /app/frontend/dist ./frontend/dist
EXPOSE 5000
VOLUME ["/app/backend/data/runtime"]
HEALTHCHECK CMD wget -qO- http://127.0.0.1:5000/api/health || exit 1
CMD ["node", "backend/src/server.js"]
