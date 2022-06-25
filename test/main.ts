import { expect } from "chai";
import { ethers } from "hardhat";

describe("Permissioned wallet", function () {
  it("Create wallet, grant permission, submit transaction", async function () {
    const [walletOwner, thirdParty, nftReceiver] = await ethers.getSigners();

    const walletFactory = await ethers.getContractFactory("OnChainWallet");
    const walletContract = await walletFactory.connect(walletOwner).deploy();
    await walletContract.deployed();

    const nftFactory = await ethers.getContractFactory("TestNFT");
    const nftContract = await nftFactory.connect(walletOwner).deploy();
    await nftContract.deployed();

    const predicateFactory = await ethers.getContractFactory("PredicateImplV1");
    const predicateContract = await predicateFactory
      .connect(walletOwner)
      .deploy();
    await predicateContract.deployed();

    nftContract.connect(walletOwner).transferOwnership(walletContract.address);

    const abi = ["function safeMint(address to, uint256 tokenId)"];
    const iface = new ethers.utils.Interface(abi);

    const mintCallData = iface.encodeFunctionData("safeMint", [
      nftReceiver.address,
      1,
    ]);

    const permissionStruct = {
      predicate: predicateContract.address,
      caller: thirdParty.address,
      // predicateParams : {
      //   allowedAddress : ,
      //   allowedMethod :
      // }
    };
    const messageHash = await walletContract.getPermissionHash(
      permissionStruct
    );
    const messageHashBinary = ethers.utils.arrayify(messageHash);
    const messageSignature = await walletOwner.signMessage(messageHashBinary);

    const callStruct = {
      to: nftContract.address,
      data: mintCallData,
    };
    await walletContract
      .connect(thirdParty)
      .execute(callStruct, permissionStruct, messageSignature);
  });
});
