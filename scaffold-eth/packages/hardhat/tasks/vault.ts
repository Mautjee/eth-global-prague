import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Vault, VaultToken, VaultGovernor, VaultTimelock } from "../typechain-types";

// Global variables to store the latest deployed addresses
let lastDeployedAddresses: {
  vault: string;
  token: string;
  governor: string;
  timelock: string;
};

task("deploy-vault", "Deploy the Vault contract with governance").setAction(async (_args, hre) => {
  const { deploy } = hre.deployments;
  const [deployer] = await hre.ethers.getSigners();
  const appId = "0x123456789012345678901234567890123456789012";

  console.log("Deploying VaultToken...");
  const token = await deploy("VaultToken", {
    from: deployer.address,
    args: [deployer.address],
    log: true,
    autoMine: true,
  });
  console.log("VaultToken deployed to:", token.address);

  console.log("\nDeploying VaultTimelock...");
  const timelock = await deploy("VaultTimelock", {
    from: deployer.address,
    args: [
      60, // 1 minute min delay
      [deployer.address], // proposers
      [deployer.address], // executors
      deployer.address, // admin
    ],
    log: true,
    autoMine: true,
  });
  console.log("VaultTimelock deployed to:", timelock.address);

  console.log("\nDeploying VaultGovernor...");
  const governor = await deploy("VaultGovernor", {
    from: deployer.address,
    args: [token.address, timelock.address, deployer.address],
    log: true,
    autoMine: true,
  });
  console.log("VaultGovernor deployed to:", governor.address);

  console.log("\nDeploying Vault...");
  const vault = await deploy("Vault", {
    from: deployer.address,
    args: [appId, governor.address],
    log: true,
    autoMine: true,
    gasLimit: 5000000,
  });
  console.log("Vault deployed to:", vault.address);

  // Store addresses
  lastDeployedAddresses = {
    vault: vault.address,
    token: token.address,
    governor: governor.address,
    timelock: timelock.address,
  };

  return lastDeployedAddresses;
});

task("test-vault", "Test the Vault contract with governance functionality").setAction(
  async (_args, hre: HardhatRuntimeEnvironment) => {
    console.log("Compiling contracts...");
    await hre.run("compile");

    console.log("\nDeploying contracts...");
    const addresses = await hre.run("deploy-vault");
    const [deployer] = await hre.ethers.getSigners();

    // Get contract instances
    const vault = await hre.ethers.getContractAt("Vault", addresses.vault);
    const token = await hre.ethers.getContractAt("VaultToken", addresses.token);
    const governor = await hre.ethers.getContractAt("VaultGovernor", addresses.governor);

    console.log("\nTesting proposeQuery...");
    const tx = await vault.proposeQuery("SELECT * FROM users", "0x123");
    const receipt = await tx.wait();
    const event = receipt?.logs[0];
    if (!event || !event.topics[1]) {
      throw new Error("Could not get proposal ID from event");
    }
    const proposalId = BigInt(event.topics[1]);
    console.log("Proposal submitted with ID:", proposalId.toString());

    console.log("\nTesting createGovernanceProposal...");
    const createGovTx = await vault.createGovernanceProposal(proposalId);
    const createGovReceipt = await createGovTx.wait();
    console.log("Governance proposal created");

    // Get the governance proposal ID
    const governanceProposalId = await vault.getGovernanceProposalId(proposalId);
    console.log("Governance proposal ID:", governanceProposalId.toString());

    // Add deployer as authorized voter
    console.log("\nAdding deployer as authorized voter...");
    await governor.addAuthorizedVoter(deployer.address);

    // Cast vote
    console.log("\nCasting vote...");
    await governor.castVote(governanceProposalId, 1); // 1 = For

    // Wait for voting period to end (in a real scenario)
    console.log("\nWaiting for voting period to end...");
    // Note: In a real test, you would need to advance time here

    // Execute the proposal
    console.log("\nExecuting proposal...");
    const targets = [addresses.vault];
    const values = [0];
    const calldatas = [hre.ethers.AbiCoder.defaultAbiCoder().encode(["uint256"], [proposalId])];
    await governor.execute(targets, values, calldatas, hre.ethers.keccak256(hre.ethers.toUtf8Bytes("")));

    console.log("\nTesting getApprovedProposals...");
    const approvedProposals = await vault.getApprovedProposals(0, 10);
    console.log("Number of approved proposals:", approvedProposals.length);

    console.log("\nTesting consumeProposal...");
    const consumeTx = await vault.consumeProposal(proposalId, "encrypted_result_here");
    await consumeTx.wait();
    console.log("Proposal consumed");

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
