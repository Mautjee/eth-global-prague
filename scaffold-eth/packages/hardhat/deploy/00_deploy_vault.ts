import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log("Deploying VaultToken...");
  const token = await deploy("VaultToken", {
    from: deployer,
    args: [deployer],
    log: true,
    waitConfirmations: 1,
  });
  console.log("VaultToken deployed to:", token.address);

  console.log("\nDeploying VaultTimelock...");
  const timelock = await deploy("VaultTimelock", {
    from: deployer,
    args: [
      60, // 1 minute min delay
      [deployer], // proposers
      [deployer], // executors
      deployer, // admin
    ],
    log: true,
    waitConfirmations: 1,
  });
  console.log("VaultTimelock deployed to:", timelock.address);

  console.log("\nDeploying VaultGovernor...");
  const governor = await deploy("VaultGovernor", {
    from: deployer,
    args: [token.address, timelock.address, deployer],
    log: true,
    waitConfirmations: 1,
  });
  console.log("VaultGovernor deployed to:", governor.address);

  console.log("\nDeploying Vault...");
  const vault = await deploy("Vault", {
    from: deployer,
    args: ["0x123456789012345678901234567890123456789012", governor.address],
    log: true,
    waitConfirmations: 1,
    gasLimit: 5000000,
  });
  console.log("Vault deployed to:", vault.address);
};

func.tags = ["Vault"];
func.dependencies = []; // No dependencies
export default func;

