#
# Building stage
#
FROM rust:1.86 AS builder

WORKDIR /usr/src/app

COPY Cargo.toml Cargo.lock ./

COPY . .

RUN cargo build --release

#
# Production stage
#
FROM debian

# If your binary makes HTTPS calls, install CA certificates.
# RUN apt-get update \
#    && apt-get install -y --no-install-recommends ca-certificates \
#    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /usr/src/app/target/release/engine /usr/local/bin/engine

# Run the binary by default when the container starts.
ENTRYPOINT ["/usr/local/bin/engine"]
