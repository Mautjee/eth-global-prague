import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const vault = await deploy("Vault", {
    from: deployer,
    args: ["0x0000000000000000000000000000000000000000000000"],
    log: true,
    waitConfirmations: 1,
  });
};

export default func;
func.tags = ["Vault"];

