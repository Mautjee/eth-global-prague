import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Master } from "../typechain-types";

task("master:propose", "Propose a new query")
  .addParam("query", "The SQL query to propose")
  .addParam("publickey", "The public key for result encryption")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const [deployer] = await hre.ethers.getSigners();
    const masterAddress = "0xFdDbD880F784a593db4392416996c4dc7617eAEB"; // Master contract address
    const master = (await hre.ethers.getContractAt("Master", masterAddress)) as unknown as Master;

    const tx = await master.connect(deployer).proposeQuery(taskArgs.query, taskArgs.publickey);
    const receipt = await tx.wait();

    const event = receipt?.logs.find((log: any) => log.fragment?.name === "ProposalSubmitted");

    if (event) {
      const proposalId = event.data[0];
      console.log(`Proposal submitted with ID: ${proposalId}`);
    }
  });

task("master:approve", "Approve a query proposal")
  .addParam("id", "The proposal ID to approve")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const [deployer] = await hre.ethers.getSigners();
    const masterAddress = "0xFdDbD880F784a593db4392416996c4dc7617eAEB";
    const master = (await hre.ethers.getContractAt("Master", masterAddress)) as unknown as Master;

    const tx = await master.connect(deployer).approveProposal(taskArgs.id);
    await tx.wait();

    console.log(`Proposal ${taskArgs.id} approved`);
  });

task("master:reject", "Reject a query proposal")
  .addParam("id", "The proposal ID to reject")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const [deployer] = await hre.ethers.getSigners();
    const masterAddress = "0xFdDbD880F784a593db4392416996c4dc7617eAEB";
    const master = (await hre.ethers.getContractAt("Master", masterAddress)) as unknown as Master;

    const tx = await master.connect(deployer).rejectProposal(taskArgs.id);
    await tx.wait();

    console.log(`Proposal ${taskArgs.id} rejected`);
  });

task("master:consume", "Consume an approved proposal")
  .addParam("id", "The proposal ID to consume")
  .addParam("result", "The encrypted result")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const [deployer] = await hre.ethers.getSigners();
    const masterAddress = "0xFdDbD880F784a593db4392416996c4dc7617eAEB";
    const master = (await hre.ethers.getContractAt("Master", masterAddress)) as unknown as Master;

    const tx = await master.connect(deployer).consumeProposal(taskArgs.id, taskArgs.result);
    await tx.wait();

    console.log(`Proposal ${taskArgs.id} consumed with result`);
  });

task("master:get-approved", "Get approved proposals")
  .addParam("offset", "Offset for pagination", "0")
  .addParam("limit", "Limit for pagination", "10")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const masterAddress = "0xFdDbD880F784a593db4392416996c4dc7617eAEB";
    const master = (await hre.ethers.getContractAt("Master", masterAddress)) as unknown as Master;

    const proposals = await master.getApprovedProposals(taskArgs.offset, taskArgs.limit);

    console.log("Approved proposals:");
    proposals.forEach((proposal: any) => {
      console.log(`ID: ${proposal.id}`);
      console.log(`Requester: ${proposal.requester}`);
      console.log(`Query: ${proposal.sqlQuery}`);
      console.log(`Status: ${proposal.status}`);
      console.log("---");
    });
  });

task("master:get-completed", "Get completed query result")
  .addParam("id", "The proposal ID")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const masterAddress = "0xFdDbD880F784a593db4392416996c4dc7617eAEB";
    const master = (await hre.ethers.getContractAt("Master", masterAddress)) as unknown as Master;

    const result = await master.getCompletedQuery(taskArgs.id);

    console.log("Completed query result:");
    console.log(`Proposal ID: ${result.proposalId}`);
    console.log(`Original Query: ${result.originalQuery}`);
    console.log(`Encrypted Result: ${result.encryptedResult}`);
    console.log(`Completed at: ${new Date(Number(result.completedTimestamp) * 1000).toISOString()}`);
  });

task("master:check-expired", "Check and update expired proposals").setAction(
  async (_taskArgs, hre: HardhatRuntimeEnvironment) => {
    const [deployer] = await hre.ethers.getSigners();
    const masterAddress = "0xFdDbD880F784a593db4392416996c4dc7617eAEB";
    const master = (await hre.ethers.getContractAt("Master", masterAddress)) as unknown as Master;

    const tx = await master.connect(deployer).checkAndUpdateExpiredProposals();
    await tx.wait();

    console.log("Expired proposals checked and updated");
  },
);

task("master:set-expiration", "Set default expiration period")
  .addParam("period", "New expiration period in seconds")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const [deployer] = await hre.ethers.getSigners();
    const masterAddress = "0xFdDbD880F784a593db4392416996c4dc7617eAEB";
    const master = (await hre.ethers.getContractAt("Master", masterAddress)) as unknown as Master;

    const tx = await master.connect(deployer).setDefaultExpirationPeriod(taskArgs.period);
    await tx.wait();

    console.log(`Default expiration period set to ${taskArgs.period} seconds`);
  });

task("master:extend-expiration", "Extend proposal expiration")
  .addParam("id", "The proposal ID")
  .addParam("extension", "Extension period in seconds")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const [deployer] = await hre.ethers.getSigners();
    const masterAddress = "0xFdDbD880F784a593db4392416996c4dc7617eAEB";
    const master = (await hre.ethers.getContractAt("Master", masterAddress)) as unknown as Master;

    const tx = await master.connect(deployer).extendProposalExpiration(taskArgs.id, taskArgs.extension);
    await tx.wait();

    console.log(`Proposal ${taskArgs.id} expiration extended by ${taskArgs.extension} seconds`);
  });

task("master:get-by-status", "Get proposals by status")
  .addParam("status", "Status (0=Pending, 1=Approved, 2=Completed, 3=Rejected, 4=Expired)")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const masterAddress = "0xFdDbD880F784a593db4392416996c4dc7617eAEB";
    const master = (await hre.ethers.getContractAt("Master", masterAddress)) as unknown as Master;

    const proposals = await master.getProposalsByStatus(taskArgs.status);

    console.log(`Proposals with status ${taskArgs.status}:`);
    proposals.forEach((proposal: any) => {
      console.log(`ID: ${proposal.id}`);
      console.log(`Requester: ${proposal.requester}`);
      console.log(`Query: ${proposal.sqlQuery}`);
      console.log(`Status: ${proposal.status}`);
      console.log("---");
    });
  });

task("master:get-user-proposals", "Get proposals by user")
  .addParam("address", "User address")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const masterAddress = "0xFdDbD880F784a593db4392416996c4dc7617eAEB";
    const master = (await hre.ethers.getContractAt("Master", masterAddress)) as unknown as Master;

    const proposals = await master.getUserProposals(taskArgs.address);

    console.log(`Proposals for user ${taskArgs.address}:`);
    proposals.forEach((proposal: any) => {
      console.log(`ID: ${proposal.id}`);
      console.log(`Query: ${proposal.sqlQuery}`);
      console.log(`Status: ${proposal.status}`);
      console.log("---");
    });
  });

task("master:get-proposal", "Get proposal details")
  .addParam("id", "The proposal ID")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const masterAddress = "0xFdDbD880F784a593db4392416996c4dc7617eAEB";
    const master = (await hre.ethers.getContractAt("Master", masterAddress)) as unknown as Master;

    const proposal = await master.getProposal(taskArgs.id);

    console.log("Proposal details:");
    console.log(`ID: ${proposal.id}`);
    console.log(`Requester: ${proposal.requester}`);
    console.log(`Query: ${proposal.sqlQuery}`);
    console.log(`Status: ${proposal.status}`);
    console.log(`Timestamp: ${new Date(Number(proposal.timestamp) * 1000).toISOString()}`);
    console.log(`Expiration Time: ${new Date(Number(proposal.expirationTime) * 1000).toISOString()}`);
  });

task("master:pause", "Pause the contract").setAction(async (_taskArgs, hre: HardhatRuntimeEnvironment) => {
  const [deployer] = await hre.ethers.getSigners();
  const masterAddress = "0xFdDbD880F784a593db4392416996c4dc7617eAEB";
  const master = (await hre.ethers.getContractAt("Master", masterAddress)) as unknown as Master;

  const tx = await master.connect(deployer).pause();
  await tx.wait();

  console.log("Contract paused");
});

task("master:unpause", "Unpause the contract").setAction(async (_taskArgs, hre: HardhatRuntimeEnvironment) => {
  const [deployer] = await hre.ethers.getSigners();
  const masterAddress = "0xFdDbD880F784a593db4392416996c4dc7617eAEB";
  const master = (await hre.ethers.getContractAt("Master", masterAddress)) as unknown as Master;

  const tx = await master.connect(deployer).unpause();
  await tx.wait();

  console.log("Contract unpaused");
});
