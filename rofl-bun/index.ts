import { Result, ok, err } from 'neverthrow';
import type { Vault } from './types/contracts';
import { provider } from './config';
import { getProposalsByStatus, consumeProposal, ProposalState } from './vault';

const scanForProposals = async (): Promise<Result<Vault.QueryProposalStruct | undefined, Error>> => {
    const status = ProposalState.Approved;
    const result = await getProposalsByStatus(status);

    if (result.isErr()) {
        return err(result.error);
    }
    if (result.value.length === 0) {
        return ok(undefined);
    }

    return ok(result.value[0]!);
}


provider.on("block", async (blockNumber) => {
    console.log(`📬 New block received: ${blockNumber}`);

    const result = await scanForProposals();

    if (result.isErr()) {
        console.error(`Error scanning for proposals:`, result.error);
        return;
    }
    if (result.value == undefined) {
        console.log(`No proposals found at status ${ProposalState.Approved}`);
        return;
    }

    console.log(`Proposal ID at status ${ProposalState.Approved}: ${result.value.id}`);

    const consumeResult = await consumeProposal(result.value.id, "0x0");

    if (consumeResult.isErr()) {
        console.error(`Error consuming proposal:`, consumeResult.error);
    }

});

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
