import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Vault } from "../typechain-types";

// Global variable to store the latest deployed address
let lastDeployedAddress: string;

task("deploy-vault").setAction(async (_args, hre) => {
  const appId = "0x123456789012345678901234567890123456789012";
  console.log("Length:", appId.length); // Should be 44
  console.log("Bytes:", (appId.length - 2) / 2); // Should be 21

  // Use hardhat-deploy to deploy the contract
  const deployResult = await hre.deployments.deploy("Vault", {
    from: (await hre.getNamedAccounts()).deployer,
    args: [appId],
    log: true,
    autoMine: true,
    gasLimit: 3000000,
  });

  // Store address in the global variable
  lastDeployedAddress = deployResult.address;
  console.log(`Vault address: ${lastDeployedAddress}`);
  return lastDeployedAddress;
});

task("test-vault", "Test the Vault contract functionality").setAction(
  async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    console.log("Compiling contracts...");
    await hre.run("compile");

    console.log("\nDeploying Vault contract...");
    const { deploy } = hre.deployments;
    const [deployer] = await hre.ethers.getSigners();
    const appId = "0x123456789012345678901234567890123456789012";

    const vault = await deploy("Vault", {
      from: deployer.address,
      args: [appId],
      log: true,
      autoMine: true,
      gasLimit: 3000000,
    });
    console.log("Vault deployed to:", vault.address);

    const vaultContract = await hre.ethers.getContractAt("Vault", vault.address);

    console.log("\nTesting proposeQuery...");
    const tx = await vaultContract.proposeQuery("SELECT * FROM users", "0x123");
    const receipt = await tx.wait();
    const event = receipt?.logs[0];
    if (!event || !event.topics[1]) {
      throw new Error("Could not get proposal ID from event");
    }
    const proposalId = BigInt(event.topics[1]);

    console.log("Proposal submitted with ID:", proposalId.toString());

    console.log("\nTesting approveProposal...");
    const approveTx = await vaultContract.approveProposal(proposalId);
    await approveTx.wait();
    console.log("Proposal approved");

    console.log("\nTesting getApprovedProposals...");
    const approvedProposals = await vaultContract.getApprovedProposals(0, 10);
    console.log("Number of approved proposals:", approvedProposals.length);

    console.log("\nTesting consumeProposal...");
    const consumeTx = await vaultContract.consumeProposal(proposalId, "encrypted_result_here");
    await consumeTx.wait();
    console.log("Proposal consumed");

    console.log("\nTesting checkAndUpdateExpiredProposals...");
    const checkTx = await vaultContract.checkAndUpdateExpiredProposals();
    await checkTx.wait();
    console.log("Expired proposals checked and updated");

    console.log("\nAll tests completed successfully!");
  },
);

task("vault:propose", "Propose a new query")
  .addParam("query", "The SQL query to propose")
  .addParam("publickey", "The public key for result encryption")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { ethers } = hre;
    const vault = await ethers.getContract<Vault>("Vault");

    const tx = await vault.proposeQuery(taskArgs.query, taskArgs.publickey);
    const receipt = await tx.wait();

    const event = receipt?.logs.find((log: any) => log.fragment?.name === "ProposalSubmitted");

    if (event) {
      const proposalId = event.data[0];
      console.log(`Proposal submitted with ID: ${proposalId}`);
    }
  });

task("vault:approve", "Approve a query proposal")
  .addParam("id", "The proposal ID to approve")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { ethers } = hre;
    const vault = await ethers.getContract<Vault>("Vault");

    const tx = await vault.approveProposal(taskArgs.id);
    await tx.wait();

    console.log(`Proposal ${taskArgs.id} approved`);
  });

task("vault:consume", "Consume an approved proposal")
  .addParam("id", "The proposal ID to consume")
  .addParam("result", "The encrypted result")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { ethers } = hre;
    const vault = await ethers.getContract<Vault>("Vault");

    const tx = await vault.consumeProposal(taskArgs.id, taskArgs.result);
    await tx.wait();

    console.log(`Proposal ${taskArgs.id} consumed with result`);
  });

task("vault:get-approved", "Get approved proposals")
  .addParam("offset", "Offset for pagination", "0")
  .addParam("limit", "Limit for pagination", "10")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { ethers } = hre;
    const vault = await ethers.getContract<Vault>("Vault");

    const proposals = await vault.getApprovedProposals(taskArgs.offset, taskArgs.limit);

    console.log("Approved proposals:");
    proposals.forEach((proposal: any) => {
      console.log(`ID: ${proposal.id}`);
      console.log(`Requester: ${proposal.requester}`);
      console.log(`Query: ${proposal.sqlQuery}`);
      console.log(`Status: ${proposal.status}`);
      console.log("---");
    });
  });

task("vault:get-completed", "Get completed query result")
  .addParam("id", "The proposal ID")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { ethers } = hre;
    const vault = await ethers.getContract<Vault>("Vault");

    const result = await vault.getCompletedQuery(taskArgs.id);

    console.log("Completed query result:");
    console.log(`Proposal ID: ${result.proposalId}`);
    console.log(`Original Query: ${result.originalQuery}`);
    console.log(`Encrypted Result: ${result.encryptedResult}`);
    console.log(`Completed at: ${new Date(Number(result.completedTimestamp) * 1000).toISOString()}`);
  });

task("vault:check-expired", "Check and update expired proposals").setAction(
  async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { ethers } = hre;
    const vault = await ethers.getContract<Vault>("Vault");

    const tx = await vault.checkAndUpdateExpiredProposals();
    await tx.wait();

    console.log("Expired proposals checked and updated");
  },
);

task("vault:set-expiration", "Set default expiration period")
  .addParam("period", "New expiration period in seconds")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { ethers } = hre;
    const vault = await ethers.getContract<Vault>("Vault");

    const tx = await vault.setDefaultExpirationPeriod(taskArgs.period);
    await tx.wait();

    console.log(`Default expiration period set to ${taskArgs.period} seconds`);
  });

task("vault:extend-expiration", "Extend proposal expiration")
  .addParam("id", "The proposal ID")
  .addParam("extension", "Extension period in seconds")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { ethers } = hre;
    const vault = await ethers.getContract<Vault>("Vault");

    const tx = await vault.extendProposalExpiration(taskArgs.id, taskArgs.extension);
    await tx.wait();

    console.log(`Proposal ${taskArgs.id} expiration extended by ${taskArgs.extension} seconds`);
  });

task("vault:get-by-status", "Get proposals by status")
  .addParam("status", "Status (0=Pending, 1=Approved, 2=Completed, 3=Rejected, 4=Expired)")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { ethers } = hre;
    const vault = await ethers.getContract<Vault>("Vault");

    const proposals = await vault.getProposalsByStatus(taskArgs.status);

    console.log(`Proposals with status ${taskArgs.status}:`);
    proposals.forEach((proposal: any) => {
      console.log(`ID: ${proposal.id}`);
      console.log(`Requester: ${proposal.requester}`);
      console.log(`Query: ${proposal.sqlQuery}`);
      console.log(`Status: ${proposal.status}`);
      console.log("---");
    });
  });

task("vault:get-user-proposals", "Get proposals by user")
  .addParam("address", "User address")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { ethers } = hre;
    const vault = await ethers.getContract<Vault>("Vault");

    const proposals = await vault.getUserProposals(taskArgs.address);

    console.log(`Proposals for user ${taskArgs.address}:`);
    proposals.forEach((proposal: any) => {
      console.log(`ID: ${proposal.id}`);
      console.log(`Query: ${proposal.sqlQuery}`);
      console.log(`Status: ${proposal.status}`);
      console.log("---");
    });
  });
