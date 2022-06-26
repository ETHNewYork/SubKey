import { expect } from "chai";
import { ethers } from "hardhat";
import { TestAvatar, ZeroGasRoleModule } from "../typechain";

describe("Zodiac integration with Permissioned wallet", function () {
  it("should emit event because of successful set up", async () => {
    const avatarFactory = await ethers.getContractFactory("TestAvatar");
    const avatarContract: TestAvatar = await avatarFactory.deploy();

    const moduleFactory = await ethers.getContractFactory("ZeroGasRoleModule");
    const moduleContract: ZeroGasRoleModule = await moduleFactory.deploy(
      avatarContract.address
    );

    const nftFactory = await ethers.getContractFactory("TestNFT");
    const nftContract = await nftFactory.deploy();
  });
});
