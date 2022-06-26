import { expect } from "chai";
import { ethers } from "hardhat";
import {
  PredicateImplV1,
  SubkeysWallet,
  TestAvatar,
  TestNFT,
  ZeroGasRoleModule,
} from "../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("Zodiac integration with Permissioned wallet", function () {
  let walletOwner: SignerWithAddress,
      nftReceiver: SignerWithAddress,
      thirdParty: SignerWithAddress,
      wrongThirdParty: SignerWithAddress;

  let predicateContract: PredicateImplV1;
  let nftContract: TestNFT;

  beforeEach(async () => {
    [walletOwner, thirdParty, nftReceiver, wrongThirdParty] =
        await ethers.getSigners();

    // deploy predicate (one per chain)
    predicateContract = await deployPredicate(walletOwner);

    // create avatar
    const avatarFactory = await ethers.getContractFactory("TestAvatar");
    const avatarContract: TestAvatar = await avatarFactory.deploy();

    // create NFT collection and transfer to avatar
    nftContract = await deployNftContract(walletOwner);
    nftContract.connect(walletOwner).transferOwnership(avatarContract.address);
  });

  it("should emit event because of successful set up", async () => {
    const [walletOwner, thirdParty, nftReceiver] = await ethers.getSigners();


    // 1. create permission for thirdParty to mint NFT (off chain)
    const permissionToMint = createPermissionToMint(thirdParty.address);

    // 2. sign permission with the owner keys (off chain)
    // const messageSignature = await signPermission(
    //     walletOwner,
    //     permissionToMint
    // );

    // 3. prepare NFT mint call (off chain)
    // const mintCall = {
    //   to: nftContract.address,
    //   data: createMintMethodCallData(),
    // };
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

  // async function signPermission(
  //     signer: SignerWithAddress,
  //     permission: {
  //       predicate: string;
  //       caller: string;
  //       predicateParams: string;
  //     }
  // ) {
  //   const messageHash = await walletContract.getPermissionHash(permission);
  //   const messageHashBinary = ethers.utils.arrayify(messageHash);
  //   return await signer.signMessage(messageHashBinary);
  // }
});
