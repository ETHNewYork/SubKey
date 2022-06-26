import {expect} from "chai";
import {ethers} from "hardhat";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {OnChainWallet, PredicateImplV1, SubKeyChecker, TestNFT} from "../typechain";

describe("Subkeys", function () {
  let walletOwner: SignerWithAddress,
    thirdParty: SignerWithAddress,
    nftReceiver: SignerWithAddress,
    wrongThirdParty: SignerWithAddress;

  let subKeyChecker: SubKeyChecker;
  let walletContract: OnChainWallet;
  let nftContract: TestNFT;
  let predicateContract: PredicateImplV1;

  beforeEach(async () => {
    [walletOwner, thirdParty, nftReceiver, wrongThirdParty] =
      await ethers.getSigners();

    const Lib = await ethers.getContractFactory("SubKeyChecker");
    subKeyChecker = await Lib.deploy();
    await subKeyChecker.deployed();

    walletContract = await deployWallet(walletOwner);
    nftContract = await deployNftContract(walletOwner);
    predicateContract = await deployPredicate(walletOwner);
  });

  async function deployPredicate(signer: SignerWithAddress) {
    const predicateFactory = await ethers.getContractFactory("PredicateImplV1");
    const predicateContract = await predicateFactory.connect(signer).deploy();
    await predicateContract.deployed();
    return predicateContract;
  }

  async function deployNftContract(signer: SignerWithAddress) {
    const nftFactory = await ethers.getContractFactory("TestNFT");
    const nftContract = await nftFactory.connect(signer).deploy();
    await nftContract.deployed();
    return nftContract;
  }

  async function deployWallet(signer: SignerWithAddress) {
    const walletFactory = await ethers.getContractFactory("OnChainWallet", {
      libraries: {
        SubKeyChecker: subKeyChecker.address,
      },
    });
    const walletContract = await walletFactory.connect(signer).deploy();
    await walletContract.deployed();
    return walletContract;
  }

  it("Create wallet and subkeys, grant permission, submit transaction", async function () {


    nftContract.connect(walletOwner).transferOwnership(walletContract.address);

    const abi = ["function safeMint(address to, uint256 tokenId)"];
    const iface = new ethers.utils.Interface(abi);

    const mintCallData = iface.encodeFunctionData("safeMint", [
      nftReceiver.address,
      1,
    ]);

    const predicateParams = {
      allowedAddress: nftContract.address,
      allowedMethod: iface.getSighash("safeMint"),
    };
    const permissionStruct = {
      predicate: predicateContract.address,
      caller: thirdParty.address,
      predicateParams: ethers.utils.defaultAbiCoder.encode(
        ["address", "bytes4"],
        [predicateParams.allowedAddress, predicateParams.allowedMethod]
      ),
    };
    const messageHash = await subKeyChecker.getPermissionHash(permissionStruct);
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

    const walletContract = await deployWallet(walletOwner);
    const nftContract = await deployNftContract(walletOwner);
    const predicateContract = await deployPredicate(walletOwner);

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
    const messageHash = await subKeyChecker.getPermissionHash(
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
