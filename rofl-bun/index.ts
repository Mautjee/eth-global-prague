import { Result, ok, err } from 'neverthrow';
import type { Vault } from './types/contracts';
import { provider, transferInitialFunds, GENERATED_MNEMONIC, BOOTSTRAP_MNEMONIC } from './config';
import { getProposalsByStatus, consumeProposal, ProposalState } from './vault';
import duckdb from 'duckdb';
import { ethers } from 'ethers';

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

const executeQueryProposal = async (proposal: Vault.QueryProposalStruct): Promise<Result<string, Error>> => {
    const db = new duckdb.Database(':memory:');
    let result = "";

    // MOCK
    db.run("CREATE TABLE Bas (id INT, name TEXT)");
    db.run("INSERT INTO Bas VALUES (1, 'test')");
    db.run("CREATE TABLE mauro (id INT, name TEXT)");
    db.run("INSERT INTO mauro VALUES (1, 'test')");
    db.run("CREATE TABLE merlijn (id INT, name TEXT)");
    db.run("INSERT INTO merlijn VALUES (1, 'test')");


    db.all(proposal.sqlQuery, (err, rows) => {
        if (err) {
            result = err.message;
        }
        result = rows.join('\n');
    });
    db.close();

    return ok(result);
}

const proposalFlow = async () => {
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
    const executeResult = await executeQueryProposal(result.value);

    if (executeResult.isErr()) {
        console.error(`Error executing proposal:`, executeResult.error);
        return;
    }
    console.log(`Proposal executed: ${executeResult.value}`);

    // const consumeResult = await consumeProposal(result.value.id, executeResult.value);

    // if (consumeResult.isErr()) {
    //     console.error(`Error consuming proposal:`, consumeResult.error);
    // }
};

const uploadFlow = async () => {

};

// Initialize application and transfer funds
const initialize = async () => {
    if (!BOOTSTRAP_MNEMONIC || !GENERATED_MNEMONIC) {
        throw new Error("Mnemonics are not properly initialized");
    }

    console.log("Initializing application...");
    const bootstrapWallet = ethers.Wallet.fromPhrase(BOOTSTRAP_MNEMONIC);
    const generatedWallet = ethers.Wallet.fromPhrase(GENERATED_MNEMONIC);

    console.log(`Bootstrap wallet address: ${bootstrapWallet.address}`);
    console.log(`Generated wallet address: ${generatedWallet.address}`);

    // Check balances before transfer
    const bootstrapBalance = await provider.getBalance(bootstrapWallet.address);
    const generatedBalance = await provider.getBalance(generatedWallet.address);

    console.log(`Bootstrap wallet balance: ${ethers.formatEther(bootstrapBalance)} ETH`);
    console.log(`Generated wallet balance: ${ethers.formatEther(generatedBalance)} ETH`);

    // Transfer funds if needed
    if (bootstrapBalance > ethers.parseEther("0.01") && generatedBalance < ethers.parseEther("0.005")) {
        await transferInitialFunds();

        // Check balances after transfer
        const newBootstrapBalance = await provider.getBalance(bootstrapWallet.address);
        const newGeneratedBalance = await provider.getBalance(generatedWallet.address);

        console.log(`New bootstrap wallet balance: ${ethers.formatEther(newBootstrapBalance)} ETH`);
        console.log(`New generated wallet balance: ${ethers.formatEther(newGeneratedBalance)} ETH`);
    } else {
        console.log("Skipping fund transfer - either bootstrap wallet has insufficient funds or generated wallet already has funds");
    }

    console.log("Initialization complete");
};

// Run initialization
initialize().catch(error => {
    console.error("Initialization failed:", error);
});

provider.on("block", async (blockNumber) => {
    console.log(`📬 New block received: ${blockNumber}`);

    proposalFlow();
    uploadFlow();
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
