import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;
  const appId = "0x123456789012345678901234567890123456789012";

  console.log("Deploying with deployer:", deployer);

  console.log("Deploying Master...");
  const vault = await deploy("Master", {
    from: deployer,
    args: [appId],
    log: true,
    waitConfirmations: 1,
    gasLimit: 3000000,
  });
  console.log("Master deployed to:", vault.address);
};

export default func;
func.tags = ["Master"];
