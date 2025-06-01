import * as fs from 'fs';
import * as path from 'path';
import { ethers } from "ethers";
import type { Vault } from './types/contracts';
import { Vault__factory } from './types/contracts';

export const DEV_MNEMONIC = "test test test wood junk test junk test border test test junk";

export const WEBSOCKET_RPC = "wss://testnet.sapphire.oasis.io/ws";
export let provider = new ethers.WebSocketProvider(WEBSOCKET_RPC);

// Load Vault contract data from the ABI file
const vaultJsonPath = path.join(__dirname, 'abis', 'Vault.json');
const vaultJson = JSON.parse(fs.readFileSync(vaultJsonPath, 'utf8'));

// Contract address and ABI from the loaded file
export const VAULT_CONTRACT_ADDRESS = vaultJson.address;

// Create a typed contract instance using TypeChain
export let vaultContract: Vault = Vault__factory.connect(VAULT_CONTRACT_ADDRESS, provider);
