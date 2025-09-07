FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S megalog -u 1001

# Change ownership of the app directory
RUN chown -R megalog:nodejs /app
USER megalog

# Expose port (not used for this consumer, but good practice)
EXPOSE 3151

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "process.exit(0)"

# Start the application
CMD ["npm", "start"] 