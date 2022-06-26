import { ethers } from "hardhat";

async function main() {
  const contractName = "SubKey";
  const factory = await ethers.getContractFactory(contractName);
  const contract = await factory.deploy();

  await contract.deployed();

  console.log("Contract deployed to:", contract.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
