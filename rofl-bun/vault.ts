import { err, ok, Result } from "neverthrow";
import type { BigNumberish } from "ethers";
import { vaultContract, vaultContractWithSigner } from "./config";

// Enum for proposal states
export enum ProposalState {
  Pending = 0,
  Approved = 1,
  Rejected = 2,
  Completed = 3
}

// Function to get proposals by status using TypeChain's typed contract
export async function getProposalsByStatus(status: ProposalState | bigint): Promise<Result<{
  id: bigint;
  requester: string;
  sqlQuery: string;
  publicKey: string;
  timestamp: bigint;
  expirationTime: bigint;
  status: ProposalState;
  governanceProposalId: bigint;
}[], Error>> {
  try {
    // Using the TypeChain typed contract to call getProposalsByStatus
    const proposals = await vaultContract.getProposalsByStatus(BigInt(status));
    
    // Convert the returned structs to our TypeScript interface and map the status to our enum
    return ok(proposals.map(proposal => ({
      ...proposal,
      status: Number(proposal.status) as ProposalState // Cast the status to our enum
    })));
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}

// Function to get proposal details by ID
export async function getProposalDetails(proposalId: bigint): Promise<Result<{
  id: bigint;
  requester: string;
  sqlQuery: string;
  publicKey: string;
  timestamp: bigint;
  expirationTime: bigint;
  status: ProposalState;
  governanceProposalId: bigint;
}, Error>> {
  try {
    const proposal = await vaultContract.proposals(proposalId);
    return ok({
      ...proposal,
      status: Number(proposal.status) as ProposalState // Cast the status to our enum
    });
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}

// Function to consume a proposal by providing the encrypted result
export async function consumeProposal(proposalId: BigNumberish, encryptedResult: string): Promise<Result<void, Error>> {
  try {
    // Call the consumeProposal function on the Vault contract with signer
    const tx = await vaultContractWithSigner.consumeProposal(proposalId, encryptedResult);
    
    // Wait for the transaction to be mined
    await tx.wait();
    
    return ok(undefined);
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}