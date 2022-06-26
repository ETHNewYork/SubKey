import {expect} from "chai";
import {ethers} from "hardhat";
import {
  PredicateImplV1,
  SubkeysWallet,
  TestAvatar,
  TestNFT,
  ZeroGasRoleModule,
} from "../typechain";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {deployContract} from "./common";

describe("Zodiac integration with Permissioned wallet", function () {
  let walletOwner: SignerWithAddress,
    nftReceiver: SignerWithAddress,
    thirdParty: SignerWithAddress,
    wrongThirdParty: SignerWithAddress;

  let predicateContract: PredicateImplV1;
  let nftContract: TestNFT;
  let avatarContract: TestAvatar;

  beforeEach(async () => {
    [walletOwner, thirdParty, nftReceiver, wrongThirdParty] =
      await ethers.getSigners();

    // deploy predicate (one per chain)
    predicateContract = await deployContract(walletOwner, "PredicateImplV1");

    // create avatar
    avatarContract = await deployContract(walletOwner, "TestAvatar");

    // create NFT collection and transfer to avatar
    nftContract = await deployContract(walletOwner, "TestNFT");
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
