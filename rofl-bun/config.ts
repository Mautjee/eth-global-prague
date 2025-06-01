import * as fs from 'fs';
import * as path from 'path';
import { ethers } from "ethers";
import type { Vault } from './types/contracts';
import { Vault__factory } from './types/contracts';
import { getOrCreatePersistentMnemonic, transferFundsToGeneratedWallet, initializeWalletClientFromMnemonic } from './wallet';
import { mnemonicToAccount } from 'viem/accounts';

// Get bootstrap mnemonic from environment variable
export const BOOTSTRAP_MNEMONIC = process.env.DEV_MNEMONIC;
if (!BOOTSTRAP_MNEMONIC) {
    throw new Error("DEV_MNEMONIC environment variable is not set");
}

// Get or create a persistent mnemonic for the application
export const GENERATED_MNEMONIC = getOrCreatePersistentMnemonic();
console.log(`Using generated wallet with address: ${ethers.Wallet.fromPhrase(GENERATED_MNEMONIC).address}`);

export const WEBSOCKET_RPC = "wss://testnet.sapphire.oasis.io/ws";
export let provider = new ethers.WebSocketProvider(WEBSOCKET_RPC);

// Create accounts for both mnemonics
export const bootstrapAccount = mnemonicToAccount(BOOTSTRAP_MNEMONIC);
export const generatedAccount = mnemonicToAccount(GENERATED_MNEMONIC);

// Initialize wallet client for transactions using the generated mnemonic
export const initializeWalletClient = async () => {
    return await initializeWalletClientFromMnemonic(GENERATED_MNEMONIC);
};

// Transfer funds from bootstrap wallet to generated wallet
export const transferInitialFunds = async () => {
    console.log("Transferring funds from bootstrap wallet to generated wallet...");
    const result = await transferFundsToGeneratedWallet(
        provider,
        BOOTSTRAP_MNEMONIC,
        GENERATED_MNEMONIC
    );

    if (result.isErr()) {
        console.error("Failed to transfer funds:", result.error);
    } else {
        console.log("Funds transfer completed:", result.value);
    }

    return result;
};

// Load Vault contract data from the ABI file
const vaultJsonPath = path.join(__dirname, 'abis', 'Vault.json');
const vaultJson = JSON.parse(fs.readFileSync(vaultJsonPath, 'utf8'));

// Contract address and ABI from the loaded file
export const VAULT_CONTRACT_ADDRESS = vaultJson.address;

// Create a typed contract instance using TypeChain with provider (for read operations)
export let vaultContract: Vault = Vault__factory.connect(VAULT_CONTRACT_ADDRESS, provider);

// Create signers from both mnemonics
const bootstrapWallet = ethers.Wallet.fromPhrase(BOOTSTRAP_MNEMONIC, provider);
const generatedWallet = ethers.Wallet.fromPhrase(GENERATED_MNEMONIC, provider);

// Create contract instances with signers for write operations
export let vaultContractWithBootstrapSigner: Vault = vaultContract.connect(bootstrapWallet);
export let vaultContractWithSigner: Vault = vaultContract.connect(generatedWallet);
