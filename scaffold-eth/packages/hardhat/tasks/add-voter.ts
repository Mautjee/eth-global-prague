import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { VaultGovernor } from "../typechain-types";

task("add-voter", "Add an authorized voter to the VaultGovernor contract")
  .addParam("voter", "The address of the voter to add")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { voter } = taskArgs;

    // Get the VaultGovernor contract
    const governorAddress = "0xb1880A2E479bA597844a4539777129081Ae52570"; // VaultGovernor address on Sapphire testnet
    const governor = (await hre.ethers.getContractAt("VaultGovernor", governorAddress)) as unknown as VaultGovernor;

    console.log(`Adding voter ${voter} to the VaultGovernor contract...`);

    try {
      const tx = await governor.addAuthorizedVoter(voter);
      await tx.wait();
      console.log(`Successfully added voter ${voter}`);
    } catch (error) {
      console.error("Error adding voter:", error);
    }
  });
