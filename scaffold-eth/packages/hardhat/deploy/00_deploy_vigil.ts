import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

/**
 * Deploys the Vigil contract
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployVigil: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  await deploy("Vigil", {
    from: deployer,
    args: [], // Vigil contract doesn't need constructor arguments
    log: true,
    autoMine: true,
    gasPrice: "0x047f25",
  });

  // Get the deployed contract to verify deployment
  const vigil = await hre.ethers.getContract("Vigil", deployer);
  console.log("Vigil deployed at:", await vigil.getAddress());
};

export default deployVigil;

// Tags are useful if you have multiple deploy files and only want to run one of them.
// e.g. yarn deploy --tags Vigil
deployVigil.tags = ["Vigil"];
