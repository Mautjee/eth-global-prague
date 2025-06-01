import * as fs from 'fs';
import * as path from 'path';
import { ethers } from "ethers";
import type { Vault } from './types/contracts';
import { Vault__factory } from './types/contracts';
import { createWalletClient } from 'viem';
import { mnemonicToAccount } from 'viem/accounts';
import { sapphireTestnet } from 'viem/chains';
import { sapphireHttpTransport, wrapWalletClient } from '@oasisprotocol/sapphire-viem-v2';

export const DEV_MNEMONIC = "best game quarter review seminar wise motor seven fantasy loyal property similar";

export const WEBSOCKET_RPC = "wss://testnet.sapphire.oasis.io/ws";
export let provider = new ethers.WebSocketProvider(WEBSOCKET_RPC);

// Create wallet for transactions
export const account = mnemonicToAccount(DEV_MNEMONIC);

// Initialize wallet client for transactions
export const initializeWalletClient = async () => {
    return await wrapWalletClient(createWalletClient({
        account,
        chain: sapphireTestnet,
        transport: sapphireHttpTransport()
    }));
};

// Load Vault contract data from the ABI file
const vaultJsonPath = path.join(__dirname, 'abis', 'Vault.json');
const vaultJson = JSON.parse(fs.readFileSync(vaultJsonPath, 'utf8'));

// Contract address and ABI from the loaded file
export const VAULT_CONTRACT_ADDRESS = vaultJson.address;

// Create a typed contract instance using TypeChain with provider (for read operations)
export let vaultContract: Vault = Vault__factory.connect(VAULT_CONTRACT_ADDRESS, provider);

// Create a signer from the mnemonic for write operations
const wallet = ethers.Wallet.fromPhrase(DEV_MNEMONIC, provider);

// Create a contract instance with signer for write operations
export let vaultContractWithSigner: Vault = vaultContract.connect(wallet);

export const bucketName = "BaMaMe-Bucket";
