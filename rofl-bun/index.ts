import { ethers } from "ethers";
import { createWalletClient } from 'viem'
import { mnemonicToAccount } from 'viem/accounts';
import { sapphireTestnet } from 'viem/chains';
import { sapphireHttpTransport, wrapWalletClient } from '@oasisprotocol/sapphire-viem-v2';
import { Result, ok, err } from 'neverthrow';
import type { Vault } from './types/contracts';
import { VAULT_CONTRACT_ADDRESS, provider, vaultContract, DEV_MNEMONIC } from './config';
import { getProposalsByStatus, getProposalDetails, consumeProposal, ProposalState } from './vault';


const account = mnemonicToAccount(DEV_MNEMONIC);

const walletClient = await wrapWalletClient(createWalletClient({
    account,
    chain: sapphireTestnet,
    transport: sapphireHttpTransport()
}));

// Function to read data from the Vault contract
async function readVaultData(): Promise<Result<{ appId: string; owner: string; isPaused: boolean }, Error>> {
    try {
        // With TypeChain, we don't need to cast the functions anymore
        const appId = await vaultContract.appId();
        const owner = await vaultContract.owner();
        const isPaused = await vaultContract.paused();

        return ok({
            appId: appId.toString(),
            owner,
            isPaused
        });
    } catch (error) {
        return err(error instanceof Error ? error : new Error(String(error)));
    }
}

const scanForProposals = async (): Promise<Result<void, Error>> => {
    const status = ProposalState.Approved;
    const result = await getProposalsByStatus(status);

    if (result.isErr()) {
        return err(result.error);
    }
    if (result.value.length === 0) {
        return ok(undefined);
    }

    const proposal = result.value[0];
    console.log(`Proposal ID at status ${ProposalState[status]}: ${proposal.id}`);

    // Example encrypted result - in a real scenario, this would be the actual encrypted data
    const mockEncryptedResult = "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

    // Call consumeProposal
    const consumeResult = await consumeProposal(proposal.id, mockEncryptedResult);

    if (consumeResult.isErr()) {
        console.error(`Error consuming proposal:`, consumeResult.error);
    }

    return ok(undefined);
}


provider.on("block", async (blockNumber) => {
    console.log(`📬 New block received: ${blockNumber}`);


    

   
}

);

// Set up initial error handling
provider.on("error", (error) => {
    console.error("Provider error:", error);
});

// Prevent the Node.js process from exiting
process.stdin.resume();

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('Shutting down...');
    provider.destroy();
    process.exit(0);
});
