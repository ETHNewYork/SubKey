// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import {ethers} from "hardhat";
import {OnChainWallet} from "../typechain";

async function main() {
  // await hre.run('compile');

  const [signer1] = await ethers.getSigners();

  // We get the contract to deploy
  const OnChainWalletFactory = await ethers.getContractFactory("OnChainWallet");
  const walletContract: OnChainWallet = await OnChainWalletFactory.deploy();
  await walletContract.deployed();
  console.log("Deployed to address", walletContract.address);

  // const ERC721Factory = await ethers.getContractFactory("ERC721");
  // const erc721Contract: ERC721 = await ERC721Factory.deploy();
  // erc721Contract.
  // console.log(await signer1.signMessage("test"));
  // walletContract.execute()
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
