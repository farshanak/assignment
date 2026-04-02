# --- Stage 1: Dependencies ---
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production

# --- Stage 2: Production ---
FROM node:20-alpine AS production
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
WORKDIR /app
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs src/ ./src/
COPY --chown=nodejs:nodejs package.json ./
ENV NODE_ENV=production PORT=3000
EXPOSE 3000
USER nodejs
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1
CMD ["node", "src/index.js"]

# --- Stage 3: Development ---
FROM node:20-alpine AS development
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
ENV NODE_ENV=development PORT=3000
EXPOSE 3000
CMD ["npm", "run", "dev"]
