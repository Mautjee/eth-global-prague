# FROM ubuntu:24.10 as base

# # Avoid prompts during package installation
# ARG DEBIAN_FRONTEND=noninteractive

# # Install system dependencies including those needed for DuckDB compilation
# RUN apt-get update && apt-get install -y \
#     build-essential \
#     python3 \
#     cmake \
#     git \
#     libssl-dev \
#     pkg-config \
#     curl \
#     unzip \
#     ca-certificates

# # Install Bun
# RUN curl -fsSL https://bun.sh/install | bash
# ENV PATH="/root/.bun/bin:${PATH}"

# # Verify Bun installation and GLIBC version
# RUN bun --version && ldd --version

# # Set working directory
# WORKDIR /app

# # Copy package.json and bun.lock files
# COPY package.json bun.lock ./

# # Install dependencies with native build support
# RUN bun install

# # Copy the rest of the application
# COPY . .

# # Generate TypeChain types
# RUN bun run generate-types

# # Set default environment variables
# ENV NODE_ENV=production

# # Print environment info at startup (for debugging)
# RUN echo "Bun version: $(bun --version)"

# # Expose port if needed
# # EXPOSE 3000

# # Start the application
# CMD ["bun", "run", "index.ts"]# Use Ubuntu 24.10 as the base
FROM node:20-bookworm

# Avoid prompts during package installation
# ARG DEBIAN_FRONTEND=noninteractive

# Install system dependencies needed for DuckDB’s native build (and general build tools)
RUN apt-get update && apt-get install -y \
    build-essential \
    python3 \
    python-is-python3 \
    cmake \
    git \
    libssl-dev \
    pkg-config \
    curl \
    unzip \
    ca-certificates

# Enable Corepack and activate Yarn (so that `yarn` is available)
RUN corepack enable \
 && corepack prepare yarn@stable --activate

# Set /app as our working directory
WORKDIR /app

# Copy only package.json and yarn.lock first (for caching purposes)
COPY package.json ./

# Install all JS/TS dependencies (this will also compile DuckDB’s native addon via node-gyp/CMake)
RUN yarn install

# Copy the rest of the application’s source files
COPY . .

# Generate TypeChain types (adjust this if your script name is different)
RUN yarn run generate-types

# Set environment to production
ENV NODE_ENV=production

# (Optional) Expose a port if your app listens on one
# EXPOSE 3000

# Start the application.
# If your project’s “package.json” has, for example, a `"start": "ts-node index.ts"` script,
# you can do: ["yarn", "run", "start"]
# Otherwise, replace this with whatever start command you need.
CMD ["yarn", "run", "start"]