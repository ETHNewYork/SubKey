import { expect } from "chai";
import { ethers } from "hardhat";
import { TestAvatar, ZeroGasRoleModule } from "../typechain";

describe("Zodiac integration with Permissioned wallet", function () {
  it("should emit event because of successful set up", async () => {
    const [walletOwner, thirdParty, nftReceiver] = await ethers.getSigners();

    const avatarFactory = await ethers.getContractFactory("TestAvatar");
    const avatarContract: TestAvatar = await avatarFactory.deploy();

    const predicateFactory = await ethers.getContractFactory("PredicateImplV1");
    const predicateContract = await predicateFactory
        .connect(walletOwner)
        .deploy();
    await predicateContract.deployed();

    //
    // const moduleFactory = await ethers.getContractFactory("ZeroGasRoleModule");
    // const moduleContract: ZeroGasRoleModule = await moduleFactory.deploy(
    //   avatarContract.address
    // );
    //
    // const nftFactory = await ethers.getContractFactory("TestNFT");
    // const nftContract = await nftFactory.deploy();
    //
    // const predicateParams = {
    //   allowedAddress: nftContract.address,
    //   allowedMethod: safeMintSignature,
    // };
    // const permissionStruct = {
    //   predicate: predicateContract.address,
    //   caller: thirdParty.address,
    //   predicateParams: ethers.utils.defaultAbiCoder.encode(
    //       ["address", "bytes4"],
    //       [predicateParams.allowedAddress, predicateParams.allowedMethod]
    //   ),
    // };
    // const messageHash = await walletContract.getPermissionHash(
    //     permissionStruct
    // );
    // const messageHashBinary = ethers.utils.arrayify(messageHash);
    // const messageSignature = await walletOwner.signMessage(messageHashBinary);
  });
});
