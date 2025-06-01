import { task } from "hardhat/config";
import "./vault";

// Global variable to store the latest deployed address
let lastDeployedAddress: string;

task("deploy").setAction(async (_args, hre) => {
  // Use hardhat-deploy to deploy the contract
  const deployResult = await hre.deployments.deploy("Vigil", {
    from: (await hre.getNamedAccounts()).deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  // Store address in the global variable
  lastDeployedAddress = deployResult.address;
  console.log(`Vigil address: ${lastDeployedAddress}`);
  return lastDeployedAddress;
});

task("create-secret")
  .addParam("address", "contract address")
  .setAction(async (args, hre) => {
    const vigil = await hre.ethers.getContractAt("Vigil", args.address);

    const tx = await vigil.createSecret("ingredient", 30 /* seconds */, Buffer.from("brussels sprouts"));
    console.log("Storing a secret in", tx.hash);
  });

task("check-secret")
  .addParam("address", "contract address")
  .setAction(async (args, hre) => {
    const vigil = await hre.ethers.getContractAt("Vigil", args.address);

    try {
      console.log("Checking the secret");
      await vigil.revealSecret(0);
      console.log("Uh oh. The secret was available!");
      process.exit(1);
    } catch (e: any) {
      console.log("failed to fetch secret:", e.message);
    }
    console.log("Waiting...");

    await new Promise(resolve => setTimeout(resolve, 30_000));
    console.log("Checking the secret again");
    const secret = await vigil.revealSecret.staticCallResult(0); // Get the value.
    console.log("The secret ingredient is", Buffer.from(secret[0].slice(2), "hex").toString());
  });

task("full-vigil").setAction(async (_args, hre) => {
  await hre.run("compile");

  await hre.run("deploy");
  // Use the global variable instead of the return value
  const address = lastDeployedAddress;

  console.log("Using contract at:", address);
  await hre.run("create-secret", { address });
  await hre.run("check-secret", { address });
});
