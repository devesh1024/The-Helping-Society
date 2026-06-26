# Stage 1: Build stage
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Copy package descriptors first to leverage Docker build cache
COPY package*.json ./

# Install all dependencies (including devDependencies for TypeScript build)
RUN npm ci

# Copy the rest of the backend source files
COPY . .

# Compile TypeScript to JavaScript (creates dist/ folder)
RUN npm run build

# Stage 2: Runtime stage
FROM node:20-alpine AS runner

ENV NODE_ENV=production
WORKDIR /usr/src/app

# Copy package descriptors
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy compiled files from builder stage
COPY --from=builder /usr/src/app/dist ./dist

# Run as non-root user for security hardening
USER node

# Expose internal port
EXPOSE 5000

# Start production server
CMD ["node", "dist/index.js"]
