#!/bin/sh

set -eu

# Private key of the first test account.
export PRIVATE_KEY="ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
export CONTRACT_ADDR="0x5FbDB2315678afecb367f032d93F642f64180aa3"

# Network to use.
NETWORK="sapphire-localnet"

# Message to store in the box.
MSG="this is cool!!!"

# Store the message inside the deployed contract.
./demo-starter setMessage --network ${NETWORK} "${CONTRACT_ADDR}" "${MSG}"

# Retrieve the message from the deployed contract.
MSG_GOT=$(./demo-starter message --network ${NETWORK} "${CONTRACT_ADDR}")

# Check if the retrieved message matches the stored message.
if [ "x${MSG}" = "x${MSG_GOT}" ]; then
  echo "Test passed!"
  echo "Stored \"${MSG}\", got \"${MSG_GOT}\"."
  exit 0
else
  echo "Test failed!"
  echo "Expected \"${MSG}\", got \"${MSG_GOT}\"."
  exit 1
fi
