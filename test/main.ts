import {expect} from "chai";
import {ethers} from "hardhat";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {PredicateImplV1, SubkeysWallet, TestNFT} from "../typechain";

describe("SubkeysWallet", function () {
  let walletOwner: SignerWithAddress,
    nftReceiver: SignerWithAddress,
    thirdParty: SignerWithAddress,
    wrongThirdParty: SignerWithAddress;

  let walletContract: SubkeysWallet;
  let predicateContract: PredicateImplV1;
  let nftContract: TestNFT;

  beforeEach(async () => {
    [walletOwner, thirdParty, nftReceiver, wrongThirdParty] =
      await ethers.getSigners();

    walletContract = await deployWallet(walletOwner);
    nftContract = await deployNftContract(walletOwner);
    predicateContract = await deployPredicate(walletOwner);

    nftContract.connect(walletOwner).transferOwnership(walletContract.address);
  });

  it("Create permission, sign permission, submit a transaction allowed by permission", async function () {
    // 1. create permission for thirdParty to mint NFT
    const permissionToMint = createPermissionToMint(thirdParty.address);

    // 2. sign permission with the owner keys
    const messageSignature = await signPermission(
      walletOwner,
      permissionToMint
    );

    // 3. prepare NFT mint call
    const mintCall = {
      to: nftContract.address,
      data: createMintMethodCallData(),
    };

    // 4. send NFT mint call from 3rdparty wallet
    await walletContract
      .connect(thirdParty)
      .execute(mintCall, permissionToMint, messageSignature);

    // 5. confirm a transaction successfully completed
    expect(await nftContract.ownerOf(1)).to.be.equal(nftReceiver.address);

    // 6. send same request from a different user and confirm transaction fails
    const t = walletContract
      .connect(wrongThirdParty)
      .execute(mintCall, permissionToMint, messageSignature);
    expect(t).to.be.revertedWith("Wrong transaction sender");
  });

  it("Transaction to not allowed method fails", async function () {
    const abi1 = ["function safeMint(address to, uint256 tokenId)"];
    const abi2 = ["function setBaseURI(string memory _newBaseURI)"];
    const iface1 = new ethers.utils.Interface(abi1);
    const iface2 = new ethers.utils.Interface(abi2);

    // Allow safeMint function
    const permissionStruct = {
      predicate: predicateContract.address,
      caller: thirdParty.address,
      predicateParams: ethers.utils.defaultAbiCoder.encode(
        ["address", "bytes4"],
        [nftContract.address, iface1.getSighash("safeMint")]
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
      data: iface2.encodeFunctionData("setBaseURI", [
        "ipfs://newAddress",
      ]),
    };
    const t = walletContract
      .connect(thirdParty)
      .execute(callStruct, permissionStruct, messageSignature);

    expect(t).to.revertedWith("Method is not allowed");
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
    const walletFactory = await ethers.getContractFactory("SubkeysWallet");
    const walletContract = await walletFactory.connect(signer).deploy();
    await walletContract.deployed();
    return walletContract;
  }

  function createMintMethodCallData() {
    const abi = ["function safeMint(address to, uint256 tokenId)"];
    const iface = new ethers.utils.Interface(abi);
    return iface.encodeFunctionData("safeMint", [nftReceiver.address, 1]);
  }

  function createPermissionToMint(address: string) {
    const iface = new ethers.utils.Interface([
      "function safeMint(address to, uint256 tokenId)",
    ]);

    return {
      predicate: predicateContract.address,
      caller: address,
      predicateParams: ethers.utils.defaultAbiCoder.encode(
        ["address", "bytes4"],
        [nftContract.address, iface.getSighash("safeMint")]
      ),
    };
  }

  async function signPermission(
    signer: SignerWithAddress,
    permission: {
      predicate: string;
      caller: string;
      predicateParams: string;
    }
  ) {
    const messageHash = await walletContract.getPermissionHash(permission);
    const messageHashBinary = ethers.utils.arrayify(messageHash);
    return await signer.signMessage(messageHashBinary);
  }
});
