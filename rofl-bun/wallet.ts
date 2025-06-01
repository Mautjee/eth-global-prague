import { ethers } from "ethers";
import { mnemonicToAccount } from 'viem/accounts';
import { createWalletClient } from 'viem';
import { sapphireTestnet } from 'viem/chains';
import { sapphireHttpTransport, wrapWalletClient } from '@oasisprotocol/sapphire-viem-v2';
import { Result, ok, err } from 'neverthrow';
import * as fs from 'fs';
import * as path from 'path';

// Path to store the generated mnemonic
const MNEMONIC_FILE_PATH = path.join(__dirname, '.generated-mnemonic');

/**
 * Generates a new random mnemonic
 */
export function generateMnemonic(): string {
    return ethers.Wallet.createRandom().mnemonic?.phrase || "";
}

/**
 * Retrieves or creates a persistent mnemonic
 * If a mnemonic file exists, it will be read
 * Otherwise, a new mnemonic will be generated and saved
 */
export function getOrCreatePersistentMnemonic(): string {
    try {
        // Check if mnemonic file exists
        if (fs.existsSync(MNEMONIC_FILE_PATH)) {
            return fs.readFileSync(MNEMONIC_FILE_PATH, 'utf8').trim();
        }
        
        // Generate new mnemonic
        const newMnemonic = generateMnemonic();
        
        // Save to file
        fs.writeFileSync(MNEMONIC_FILE_PATH, newMnemonic);
        console.log("Generated new persistent mnemonic");
        
        return newMnemonic;
    } catch (error) {
        console.error("Error managing persistent mnemonic:", error);
        // Fallback to generating a new mnemonic without saving
        return generateMnemonic();
    }
}

/**
 * Transfers funds from bootstrap wallet to the generated wallet
 */
export async function transferFundsToGeneratedWallet(
    provider: ethers.Provider,
    bootstrapMnemonic: string,
    generatedMnemonic: string
): Promise<Result<string, Error>> {
    try {
        // Create wallets
        const bootstrapWallet = ethers.Wallet.fromPhrase(bootstrapMnemonic, provider);
        const generatedWallet = ethers.Wallet.fromPhrase(generatedMnemonic, provider);
        
        // Get bootstrap wallet balance
        const balance = await provider.getBalance(bootstrapWallet.address);
        
        // Keep some gas for future transactions (0.01 ETH)
        const gasReserve = ethers.parseEther("0.01");
        
        // Calculate amount to transfer (balance - gas reserve)
        const transferAmount = balance - gasReserve;
        
        // Check if there are enough funds to transfer
        if (transferAmount <= 0) {
            console.log("Not enough funds to transfer");
            return ok("Not enough funds to transfer");
        }
        
        // Create and send transaction
        const tx = await bootstrapWallet.sendTransaction({
            to: generatedWallet.address,
            value: transferAmount
        });
        
        console.log(`Transferred ${ethers.formatEther(transferAmount)} ETH from bootstrap wallet to generated wallet`);
        console.log(`Transaction hash: ${tx.hash}`);
        
        // Wait for transaction to be mined
        const receipt = await tx.wait();
        
        return ok(tx.hash);
    } catch (error) {
        console.error("Error transferring funds:", error);
        return err(error instanceof Error ? error : new Error(String(error)));
    }
}

/**
 * Initializes a wallet client from a mnemonic
 */
export async function initializeWalletClientFromMnemonic(mnemonic: string) {
    const account = mnemonicToAccount(mnemonic);
    return await wrapWalletClient(createWalletClient({
        account,
        chain: sapphireTestnet,
        transport: sapphireHttpTransport()
    }));
}
