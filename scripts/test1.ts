import {ethers} from "hardhat";
import {expect} from "chai";
import {Signer} from "ethers";
import {MyNFT} from "../typechain";

async function main() {

  const [walletOwner, thirdParty, nftReceiver] = await ethers.getSigners();

  const walletFactory = await ethers.getContractFactory("OnChainWallet");
  const walletContract = await walletFactory.connect(walletOwner).deploy();
  await walletContract.deployed();

  const nftFactory = await ethers.getContractFactory("MyNFT");
  const nftContract = await nftFactory.connect(walletOwner).deploy("ipfs://");
  await nftContract.deployed();

  const predicateFactory = await ethers.getContractFactory(
    "AccessOneAccount"
  );
  const predicateContract = await predicateFactory.connect(walletOwner).deploy(nftContract.address);
  await predicateContract.deployed();

  nftContract.connect(walletOwner).transferOwnership(walletContract.address);
  const abi = [
    "function safeMint(address to, uint256 tokenId)"
  ];
  const iface = new ethers.utils.Interface(abi);
  const mintCallData = iface.encodeFunctionData("safeMint", [nftReceiver.address, 1]);
  const permissionStruct = {
    predicate: predicateContract.address,
    caller: thirdParty.address,
  };
  const hashedPermissions = await walletContract.hashPermissions(
    permissionStruct
  );
  const permissionSignature = ethers.utils.splitSignature(
    await walletOwner.signMessage(hashedPermissions)
  );

  const callStruct = {
    to: nftContract.address,
    data: mintCallData,
  };
  const hashedCall = await walletContract.hashCall(callStruct);
  const callSignature = ethers.utils.splitSignature(
    await thirdParty.signMessage(hashedCall)
  );
  walletContract
    .connect(thirdParty)
    .execute(
      callStruct,
      callSignature,
      permissionStruct,
      permissionSignature
    );

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});