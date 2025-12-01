# Use Bun 1.3.0 Alpine as base image
FROM oven/bun:1.3.0-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install all dependencies (including dev dependencies for building)
RUN bun install

# Copy source code
COPY . .

# Set Google Application Credentials for Firebase
ENV GOOGLE_APPLICATION_CREDENTIALS=/app/firestore-creds.json

# Deploy Firestore indexes
RUN bun run deploy-indexes

# Build the TypeScript code
RUN bun run build

# Remove dev dependencies to reduce image size
RUN bun install --production

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S tmsuser -u 1001

# Change ownership of app directory
RUN chown -R tmsuser:nodejs /app

# Switch to non-root user
USER tmsuser

# Expose port (adjust if your app uses a different port)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD bun -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => { process.exit(1) })"

# Start the application
CMD ["bun", "run", "start"]