#
# Building stage
#
ARG BASEPLATFORM=linux/amd64

FROM rust:1.87 AS builder

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      build-essential \
      clang \
      libclang-dev \
      cmake \
      pkg-config \
      gcc-x86-64-linux-gnu \
      g++-x86-64-linux-gnu
      # openssl

# 1.2) Inside a stable image, install the nightly toolchain
RUN rustup toolchain install nightly

# (Optional) If you want `cargo build` to default to nightly:
RUN rustup default nightly

RUN rustup target add x86_64-unknown-linux-gnu

WORKDIR /usr/src/app

RUN mkdir ./src && echo 'fn main() { panic!("Dummy Image Called!")}' > ./src/main.rs
COPY Cargo.toml Cargo.lock .

RUN mkdir -p .cargo && \
    printf '[target.x86_64-unknown-linux-gnu]\nlinker = "x86_64-linux-gnu-gcc"\nrustflags = ["-C", "target-feature=+aes,+ssse3"]\n' \
           > .cargo/config.toml

RUN cargo build --release --target x86_64-unknown-linux-gnu

RUN rm -rf ./src
RUN rm -rf ./target/release

COPY src src

RUN touch -a -m ./src/main.rs
RUN cargo build --release --target x86_64-unknown-linux-gnu

#
# Production stage
#
FROM --platform=${BASEPLATFORM} debian

# If your binary makes HTTPS calls, install CA certificates.
# RUN apt-get update \
#    && apt-get install -y --no-install-recommends ca-certificates \
#    && rm -rf /var/lib/apt/lists/*

# COPY --from=builder /usr/src/app/target/release/engine /usr/local/bin/engine
COPY --from=builder /usr/src/app/target/x86_64-unknown-linux-gnu/release/engine \
     /usr/local/bin/engine

# Run the binary by default when the container starts.
ENTRYPOINT ["/usr/local/bin/engine"]
