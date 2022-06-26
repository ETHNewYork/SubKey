import {expect} from "chai";
import {ethers} from "hardhat";

describe("Subkeys", function () {
  it("Create wallet and subkeys, grant permission, submit transaction", async function () {
    const [walletOwner, thirdParty, nftReceiver, wrongThirdParty] = await ethers.getSigners();

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

    const safeMintSignature = iface.getSighash("safeMint");

    const predicateParams = {
      allowedAddress: nftContract.address,
      allowedMethod: safeMintSignature,
    };
    const permissionStruct = {
      predicate: predicateContract.address,
      caller: thirdParty.address,
      predicateParams: ethers.utils.defaultAbiCoder.encode(
        ["address", "bytes4"],
        [predicateParams.allowedAddress, predicateParams.allowedMethod]
      ),
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

    // Success scenario
    const nft1Owner = await nftContract.ownerOf(1);
    expect(nft1Owner).to.be.equal(nftReceiver.address);

    const t = walletContract
      .connect(wrongThirdParty)
      .execute(callStruct, permissionStruct, messageSignature);
    expect(t).to.be.revertedWith("Wrong transaction sender");
  });

  it("Transaction to not allowed method fails", async function () {
    const [walletOwner, thirdParty] = await ethers.getSigners();

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

    const abi1 = ["function safeMint(address to, uint256 tokenId)"];
    const abi2 = ["function setBaseURI(string memory _newBaseURI)"];
    const iface1 = new ethers.utils.Interface(abi1);
    const iface2 = new ethers.utils.Interface(abi2);

    const setBaseURICallData = iface2.encodeFunctionData("setBaseURI", [
      "ipfs://newAddress",
    ]);

    const safeMintSignature = iface1.getSighash("safeMint");

    // Allow safeMint function
    const predicateParams = {
      allowedAddress: nftContract.address,
      allowedMethod: safeMintSignature,
    };
    const permissionStruct = {
      predicate: predicateContract.address,
      caller: thirdParty.address,
      predicateParams: ethers.utils.defaultAbiCoder.encode(
        ["address", "bytes4"],
        [predicateParams.allowedAddress, predicateParams.allowedMethod]
      ),
    };
    const messageHash = await walletContract.getPermissionHash(
      permissionStruct
    );
    const messageHashBinary = ethers.utils.arrayify(messageHash);
    const messageSignature = await walletOwner.signMessage(messageHashBinary);

    // Call setBaseURI function
    const callStruct = {
      to: nftContract.address,
      data: setBaseURICallData,
    };
    const t = walletContract
      .connect(thirdParty)
      .execute(callStruct, permissionStruct, messageSignature);

    expect(t).to.revertedWith("Method is not allowed");

  });

});
