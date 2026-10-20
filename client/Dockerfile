# Stage 1: Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package.json package-lock.json ./

# Install dependencies using clean install from lockfile
RUN npm ci

# Copy frontend source files
COPY . .

# Build production bundle
RUN npm run build

# Stage 2: Lightweight runtime stage
FROM node:22-alpine AS runner

WORKDIR /app

# Copy manifests, dependencies, built dist, and configuration from builder stage
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/vite.config.js ./vite.config.js

# Expose Vite preview port
EXPOSE 5173

# Run Vite preview listening on 0.0.0.0:5173 using existing npm preview script
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "5173"]
