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
import { deployContract } from "./common";

describe("Tests ZeroGasRoleModule.sol - zodiac permissions module", function () {
  let avatarAndModuleOwner: SignerWithAddress,
    developer: SignerWithAddress,
    nftReceiver: SignerWithAddress,
    thirdParty: SignerWithAddress;

  let predicateContract: PredicateImplV1;
  let moduleContract: ZeroGasRoleModule;
  let avatarContract: TestAvatar;
  let nftContract: TestNFT;

  beforeEach(async () => {
    [avatarAndModuleOwner, thirdParty, nftReceiver, developer] =
      await ethers.getSigners();

    // deploy predicate (one per chain)
    predicateContract = await deployContract(developer, "PredicateImplV1");

    // deploy avatar
    avatarContract = await deployContract(avatarAndModuleOwner, "TestAvatar");

    // deploy module and connect with avatar
    const moduleFactory = await ethers.getContractFactory("ZeroGasRoleModule");
    moduleContract = await moduleFactory
      .connect(avatarAndModuleOwner)
      .deploy(avatarContract.address);
    await moduleContract.deployed();

    // create NFT collection
    nftContract = await deployContract(avatarAndModuleOwner, "TestNFT");

    // transfer NFT collection ownership to avatar
    nftContract
      .connect(avatarAndModuleOwner)
      .transferOwnership(avatarContract.address);
  });

  it("Test 1", async () => {
    // 1. create permission for thirdParty to mint NFT (off chain)
    const permissionToMint = createPermissionToMint(thirdParty.address);

    // 2. sign permission with the avatarAndModuleOwner keys (off chain)
    const permissionSignature = await signPermission(
      avatarAndModuleOwner,
      permissionToMint
    );

    // 3. prepare NFT mint call (off chain)
    const mintCall = {
      to: nftContract.address,
      data: createMintMethodCallData(),
    };

    // 4. send NFT mint call from 3rdparty wallet
    // on chain
    await moduleContract
      .connect(thirdParty)
      .execute(mintCall, permissionToMint, permissionSignature);

    // 5. confirm a transaction successfully completed
    expect(await nftContract.ownerOf(1)).to.be.equal(nftReceiver.address);
  });

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
    const messageHash = await moduleContract.getPermissionHash(permission);
    const messageHashBinary = ethers.utils.arrayify(messageHash);
    return await signer.signMessage(messageHashBinary);
  }

  function createMintMethodCallData() {
    const abi = ["function safeMint(address to, uint256 tokenId)"];
    const iface = new ethers.utils.Interface(abi);
    return iface.encodeFunctionData("safeMint", [nftReceiver.address, 1]);
  }
});
