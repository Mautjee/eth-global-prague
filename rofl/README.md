# Trusted Execution Environment (TEE) for Oasis

TEE for processing query requests from the EVM-based DAO contract.

## Pre-requisites

Run the oasis CLI with developer tools installed (this should be run in the root of the repository).

```sh
docker run --platform linux/amd64 --volume ./rofl:/src -it ghcr.io/oasisprotocol/rofl-dev:main
```

To interact with the Oasis network, a wallet should be configured through `oasis wallet`.

## Building

```sh
docker buildx build --platform=linux/amd64 -t engine-test:latest .
```

### Oasis

Creating a new ROFL application.

```sh
oasis rofl init
oasis rofl create
```

Build the ROFL bundle.

```sh
oasis rofl build
```

Update the signature of the ROFL bundle.

```sh
oasis rofl update
```

Deploy the ROFL bundle to the network.

```sh
oasis rofl deploy
```
