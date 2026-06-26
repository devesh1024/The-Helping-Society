# Stage 1: Build stage
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Copy package files to leverage Docker layer caching
COPY frontend/package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application source code
COPY frontend/ ./

# Build static assets (creates dist/ folder)
RUN npm run build

# Stage 2: Runtime stage
FROM nginx:1.27-alpine

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built static assets from builder stage
COPY --from=builder /usr/src/app/dist /usr/share/nginx/html

# Custom nginx config is mounted/copied to Nginx configuration folder
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

# Expose HTTP and HTTPS ports
EXPOSE 80 443

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
