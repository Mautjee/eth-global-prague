FROM oven/bun:1.0 as base

# Set working directory
WORKDIR /app

# Copy package.json and bun.lock files
COPY package.json bun.lock ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy the rest of the application
COPY . .

# Generate TypeChain types
RUN bun run generate-types

# Set environment variables
ENV NODE_ENV=production

# Expose port if needed
# EXPOSE 3000

# Start the application
CMD ["bun", "run", "index.ts"]
