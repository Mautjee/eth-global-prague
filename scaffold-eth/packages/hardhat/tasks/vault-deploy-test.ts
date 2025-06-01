import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Vault } from "../typechain-types";

task("vault:debug-deployment", "Debug Vault contract deployment issues").setAction(
  async (_taskArgs, hre: HardhatRuntimeEnvironment) => {
    console.log("=== Debugging Vault Deployment ===\n");

    // Check network and deployer info
    console.log("--- Network Information ---");
    const network = await hre.ethers.provider.getNetwork();
    console.log(`Network: ${network.name} (Chain ID: ${network.chainId})`);

    const [deployer] = await hre.ethers.getSigners();
    console.log(`Deployer: ${deployer.address}`);

    const balance = await deployer.getBalance();
    console.log(`Balance: ${hre.ethers.utils.formatEther(balance)} ETH`);

    if (balance.isZero()) {
      console.log("⚠️  Warning: Deployer has no ETH balance!");
      return;
    }

    // Test contract compilation
    console.log("\n--- Testing Contract Compilation ---");
    try {
      await hre.run("compile");
      const Vault = await hre.ethers.getContractFactory("Vault");
      console.log("✓ Contract compiled successfully");
      console.log(`✓ Bytecode length: ${Vault.bytecode.length} characters`);
    } catch (error) {
      console.log(`✗ Compilation failed: ${error}`);
      return;
    }

    // Test different appId formats
    const testAppIds = [
      "0x000000000000000000000000000000000000000000", // 21 bytes of zeros
      "0x123456789012345678901234567890123456789012", // 21 bytes of mixed hex
      hre.ethers.utils.hexZeroPad("0x1234", 21), // Padded short value
      hre.ethers.utils.hexlify(hre.ethers.utils.randomBytes(21)), // Random 21 bytes
    ];

    console.log("\n--- Testing Different AppId Formats ---");

    for (let i = 0; i < testAppIds.length; i++) {
      const appId = testAppIds[i];
      console.log(`\nTest ${i + 1}: ${appId}`);
      console.log(`Length: ${appId.length} chars, ${(appId.length - 2) / 2} bytes`);

      try {
        // Test parameter encoding
        const abiCoder = new hre.ethers.AbiCoder();
        const encoded = abiCoder.encode(["bytes21"], [appId]);
        console.log("✓ Parameter encoding successful");

        // Test gas estimation
        const Vault = await hre.ethers.getContractFactory("Vault");
        const gasEstimate = await Vault.estimateGas.deploy(appId);
        console.log(`✓ Gas estimate: ${gasEstimate.toString()}`);

        // Try deployment
        console.log("Attempting deployment...");
        const vault = await Vault.deploy(appId, {
          gasLimit: gasEstimate.mul(120).div(100), // 20% buffer
        });

        console.log(`✓ Deployment transaction hash: ${vault.deployTransaction.hash}`);
        await vault.deployed();
        console.log(`✓ Contract deployed at: ${vault.address}`);

        // Verify stored value
        const storedAppId = await vault.appId();
        console.log(`✓ Stored appId: ${storedAppId}`);
        console.log(`✓ Values match: ${storedAppId === appId}`);

        console.log("🎉 Deployment successful!");
        break;
      } catch (error: any) {
        console.log(`✗ Failed: ${error.message}`);

        if (error.reason) {
          console.log(`✗ Reason: ${error.reason}`);
        }

        if (error.code === "INVALID_ARGUMENT") {
          console.log("✗ This is a parameter encoding issue");
        }

        if (error.code === "CALL_EXCEPTION") {
          console.log("✗ This is a contract execution issue");
          console.log("✗ Check constructor logic and requirements");
        }
      }
    }
  },
);

task("vault:validate-appid", "Validate a bytes21 appId format")
  .addParam("appid", "The appId to validate")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const appId = taskArgs.appid;

    console.log(`Validating appId: ${appId}`);

    try {
      if (typeof appId !== "string") {
        throw new Error("App ID must be a string");
      }

      if (!appId.startsWith("0x")) {
        throw new Error("App ID must start with 0x");
      }

      const hexPart = appId.slice(2);
      if (hexPart.length !== 42) {
        throw new Error(`App ID must be exactly 42 hex characters (21 bytes), got ${hexPart.length}`);
      }

      if (!/^[0-9a-fA-F]+$/.test(hexPart)) {
        throw new Error("App ID must contain only valid hex characters");
      }

      // Test encoding
      const abiCoder = new hre.ethers.AbiCoder();
      const encoded = abiCoder.encode(["bytes21"], [appId]);

      console.log("✓ App ID format is valid");
      console.log(`✓ Length: ${appId.length} characters`);
      console.log(`✓ Bytes: ${(appId.length - 2) / 2}`);
      console.log(`✓ Can be encoded as bytes21`);
    } catch (error: any) {
      console.log(`✗ Validation failed: ${error.message}`);
    }
  });

task("vault:safe-deploy", "Deploy Vault with comprehensive error handling").setAction(
  async (_taskArgs, hre: HardhatRuntimeEnvironment) => {
    console.log("=== Safe Vault Deployment ===\n");

    const { deploy } = hre.deployments;
    const { deployer } = await hre.getNamedAccounts();

    // Use the safest appId format
    const appId = "0x000000000000000000000000000000000000000000";

    console.log(`Using appId: ${appId}`);
    console.log(`Deployer: ${deployer}`);

    try {
      const deployResult = await deploy("Vault", {
        from: deployer,
        args: [appId],
        log: true,
        autoMine: true,
        gasLimit: 3000000, // Explicit gas limit
        waitConfirmations: 1,
      });

      console.log(`✓ Vault deployed successfully at: ${deployResult.address}`);

      // Verify deployment
      const vault = await hre.ethers.getContractAt("Vault", deployResult.address);
      const storedAppId = await vault.appId();
      const owner = await vault.owner();

      console.log(`✓ Stored appId: ${storedAppId}`);
      console.log(`✓ Owner: ${owner}`);
      console.log(`✓ Default expiration: ${await vault.defaultExpirationPeriod()} seconds`);

      return deployResult.address;
    } catch (error: any) {
      console.log(`✗ Deployment failed: ${error.message}`);

      if (error.transaction) {
        console.log(`✗ Transaction hash: ${error.transaction.hash}`);
      }

      if (error.receipt && error.receipt.status === 0) {
        console.log("✗ Transaction was mined but failed (status 0)");
        console.log("✗ This indicates a revert in the constructor or contract logic");
      }

      throw error;
    }
  },
);

task("vault:quick-test", "Quick functional test of deployed Vault").setAction(
  async (_taskArgs, hre: HardhatRuntimeEnvironment) => {
    console.log("=== Quick Vault Test ===\n");

    try {
      // Deploy first
      console.log("Deploying Vault...");
      const address = await hre.run("vault:safe-deploy");

      const vault = (await hre.ethers.getContractAt("Vault", address)) as Vault;
      const [deployer] = await hre.ethers.getSigners();

      console.log("\n--- Testing Basic Functionality ---");

      // Test 1: Propose query
      console.log("1. Testing proposeQuery...");
      const proposeTx = await vault.proposeQuery("SELECT * FROM test_table", "0x1234567890abcdef");
      const proposeReceipt = await proposeTx.wait();

      // Extract proposal ID from events
      const proposalEvent = proposeReceipt.events?.find(e => e.event === "ProposalSubmitted");
      const proposalId = proposalEvent?.args?.proposalId;

      if (!proposalId) {
        throw new Error("Could not extract proposal ID from event");
      }

      console.log(`✓ Proposal created with ID: ${proposalId}`);

      // Test 2: Check proposal status
      console.log("2. Testing getProposal...");
      const proposal = await vault.getProposal(proposalId);
      console.log(`✓ Proposal status: ${proposal.status} (should be 0 for Pending)`);

      // Test 3: Approve proposal (as owner)
      console.log("3. Testing approveProposal...");
      const approveTx = await vault.connect(deployer).approveProposal(proposalId);
      await approveTx.wait();
      console.log("✓ Proposal approved");

      // Test 4: Get approved proposals
      console.log("4. Testing getApprovedProposals...");
      const approvedProposals = await vault.getApprovedProposals(0, 10);
      console.log(`✓ Found ${approvedProposals.length} approved proposals`);

      // Test 5: Consume proposal
      console.log("5. Testing consumeProposal...");
      const consumeTx = await vault.consumeProposal(proposalId, "encrypted_result_data");
      await consumeTx.wait();
      console.log("✓ Proposal consumed");

      // Test 6: Get completed query
      console.log("6. Testing getCompletedQuery...");
      const completedQuery = await vault.getCompletedQuery(proposalId);
      console.log(`✓ Completed query retrieved, result length: ${completedQuery.encryptedResult.length}`);

      console.log("\n🎉 All tests passed! Vault is working correctly.");
    } catch (error: any) {
      console.log(`\n❌ Test failed: ${error.message}`);

      if (error.reason) {
        console.log(`Reason: ${error.reason}`);
      }

      throw error;
    }
  },
);

task("vault:check-deployment", "Check if Vault is already deployed")
  .addOptionalParam("address", "Specific contract address to check")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    console.log("=== Checking Vault Deployment ===\n");

    let contractAddress = taskArgs.address;

    if (!contractAddress) {
      try {
        const deployment = await hre.deployments.get("Vault");
        contractAddress = deployment.address;
        console.log(`Found deployment at: ${contractAddress}`);
      } catch (error) {
        console.log("No deployment found in deployments directory");
        return;
      }
    }

    try {
      const vault = await hre.ethers.getContractAt("Vault", contractAddress);

      console.log("--- Contract Information ---");
      console.log(`Address: ${contractAddress}`);
      console.log(`AppId: ${await vault.appId()}`);
      console.log(`Owner: ${await vault.owner()}`);
      console.log(`Default Expiration: ${await vault.defaultExpirationPeriod()} seconds`);
      console.log(`Is Paused: ${await vault.paused()}`);

      // Test a simple read operation
      const pendingProposals = await vault.getProposalsByStatus(0);
      console.log(`Pending proposals: ${pendingProposals.length}`);

      console.log("\n✓ Contract is deployed and accessible");
    } catch (error: any) {
      console.log(`✗ Error accessing contract: ${error.message}`);

      if (error.code === "CALL_EXCEPTION") {
        console.log("✗ Contract may not be deployed at this address");
      }
    }
  });

task("vault:generate-appids", "Generate valid bytes21 appIds for testing").setAction(
  async (_taskArgs, hre: HardhatRuntimeEnvironment) => {
    console.log("=== Generated Valid AppIds ===\n");

    const examples = [
      {
        name: "Zero AppId",
        value: "0x000000000000000000000000000000000000000000",
        description: "21 bytes of zeros - safest option",
      },
      {
        name: "Sequential AppId",
        value: "0x123456789012345678901234567890123456789012",
        description: "Sequential hex values",
      },
      {
        name: "Padded Short Value",
        value: hre.ethers.utils.hexZeroPad("0xABC123", 21),
        description: "Short value padded to 21 bytes",
      },
      {
        name: "Random AppId",
        value: hre.ethers.utils.hexlify(hre.ethers.utils.randomBytes(21)),
        description: "Cryptographically random 21 bytes",
      },
      {
        name: "Timestamp-based AppId",
        value: hre.ethers.utils.hexZeroPad(hre.ethers.utils.hexlify(Date.now()), 21),
        description: "Based on current timestamp",
      },
    ];

    examples.forEach((example, index) => {
      console.log(`${index + 1}. ${example.name}`);
      console.log(`   Value: ${example.value}`);
      console.log(`   Description: ${example.description}`);
      console.log(`   Length: ${example.value.length} chars (${(example.value.length - 2) / 2} bytes)`);

      // Validate
      try {
        const abiCoder = new hre.ethers.utils.AbiCoder();
        abiCoder.encode(["bytes21"], [example.value]);
        console.log("   ✓ Valid for deployment");
      } catch (error) {
        console.log("   ✗ Invalid format");
      }
      console.log("");
    });

    console.log("Copy any of these values to use in your deployment!");
  },
);

export {};
