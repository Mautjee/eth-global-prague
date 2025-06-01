import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

task("deploy-vault-fixed", "Deploy Vault contract with proper error handling").setAction(
  async (_args, hre: HardhatRuntimeEnvironment) => {
    console.log("=== Deploying Vault Contract ===\n");

    // Use the most reliable appId format
    const appId = "0x000000000000000000000000000000000000000000";

    console.log("Deployment Configuration:");
    console.log(`AppId: ${appId}`);
    console.log(`Length: ${appId.length} characters`);
    console.log(`Bytes: ${(appId.length - 2) / 2}`);

    // Validate appId format before deployment
    if (appId.length !== 44 || !appId.startsWith("0x")) {
      throw new Error("Invalid appId format");
    }

    try {
      // Method 1: Using hardhat-deploy (your preferred method)
      console.log("\nAttempting deployment with hardhat-deploy...");

      const { deployer } = await hre.getNamedAccounts();
      console.log(`Deployer: ${deployer}`);

      const deployResult = await hre.deployments.deploy("Vault", {
        from: deployer,
        args: [appId],
        log: true,
        autoMine: true,
        gasLimit: 3000000, // Explicit gas limit to avoid estimation issues
        waitConfirmations: 1,
      });

      console.log(`✓ Vault deployed successfully!`);
      console.log(`✓ Address: ${deployResult.address}`);
      console.log(`✓ Transaction hash: ${deployResult.transactionHash}`);
      console.log(`✓ Gas used: ${deployResult.receipt?.gasUsed}`);

      // Verify the deployment by reading contract state
      console.log("\nVerifying deployment...");
      const vault = await hre.ethers.getContractAt("Vault", deployResult.address);

      const storedAppId = await vault.appId();
      const owner = await vault.owner();
      const defaultExpiration = await vault.defaultExpirationPeriod();

      console.log(`✓ Stored AppId: ${storedAppId}`);
      console.log(`✓ Owner: ${owner}`);
      console.log(`✓ Default Expiration: ${defaultExpiration.toString()} seconds`);
      console.log(`✓ AppId matches: ${storedAppId === appId}`);

      return deployResult.address;
    } catch (error: any) {
      console.log("\n❌ hardhat-deploy failed, trying direct ethers deployment...");
      console.log(`Error: ${error.message}`);

      try {
        // Method 2: Direct ethers deployment as fallback
        const [signer] = await hre.ethers.getSigners();
        const Vault = await hre.ethers.getContractFactory("Vault");

        console.log(`\nTrying direct deployment with signer: ${signer.address}`);

        // Estimate gas first
        const gasEstimate = await Vault.estimateGas.deploy(appId);
        console.log(`Gas estimate: ${gasEstimate.toString()}`);

        const vault = await Vault.deploy(appId, {
          gasLimit: gasEstimate.mul(130).div(100), // 30% buffer
        });

        console.log(`✓ Deployment transaction: ${vault.deployTransaction.hash}`);

        await vault.deployed();

        console.log(`✓ Vault deployed at: ${vault.address}`);

        // Verify
        const storedAppId = await vault.appId();
        console.log(`✓ Verification successful, stored AppId: ${storedAppId}`);

        return vault.address;
      } catch (fallbackError: any) {
        console.log("\n❌ Both deployment methods failed!");
        console.log(`hardhat-deploy error: ${error.message}`);
        console.log(`ethers deploy error: ${fallbackError.message}`);

        // Provide debugging information
        if (fallbackError.code === "CALL_EXCEPTION") {
          console.log("\n🔍 Debug Info:");
          console.log("- This is a contract execution error");
          console.log("- The transaction was mined but the contract constructor failed");
          console.log("- Check your constructor logic and require statements");
          console.log("- Make sure the appId parameter is valid");
        }

        if (fallbackError.code === "INVALID_ARGUMENT") {
          console.log("\n🔍 Debug Info:");
          console.log("- This is a parameter encoding error");
          console.log("- The appId format is incorrect");
          console.log("- Make sure appId is exactly 21 bytes (42 hex characters)");
        }

        throw fallbackError;
      }
    }
  },
);

// Add this task to your existing file or create a new file with this content
task("test-deployment-methods", "Test different deployment approaches").setAction(
  async (_args, hre: HardhatRuntimeEnvironment) => {
    console.log("=== Testing Deployment Methods ===\n");

    const appId = "0x000000000000000000000000000000000000000000";

    console.log("1. Testing parameter encoding...");
    try {
      const abiCoder = new hre.ethers.AbiCoder();
      const encoded = abiCoder.encode(["bytes21"], [appId]);
      console.log("✓ Parameter encoding successful");
    } catch (error) {
      console.log(`✗ Parameter encoding failed: ${error}`);
      return;
    }

    console.log("\n2. Testing contract compilation...");
    try {
      await hre.run("compile");
      const Vault = await hre.ethers.getContractFactory("Vault");
      console.log("✓ Contract compilation successful");
    } catch (error) {
      console.log(`✗ Contract compilation failed: ${error}`);
      return;
    }

    console.log("\n3. Testing gas estimation...");
    try {
      const Vault = await hre.ethers.getContractFactory("Vault");
      const gasEstimate = await Vault.estimateGas.deploy(appId);
      console.log(`✓ Gas estimation successful: ${gasEstimate.toString()}`);
    } catch (error) {
      console.log(`✗ Gas estimation failed: ${error}`);
      return;
    }

    console.log("\n4. Testing actual deployment...");
    try {
      await hre.run("deploy-vault-fixed");
      console.log("✓ Deployment successful!");
    } catch (error) {
      console.log(`✗ Deployment failed: ${error}`);
    }
  },
);

export {};
