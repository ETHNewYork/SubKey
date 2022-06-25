import {expect} from "chai";
import {ethers} from "hardhat";
import {Signer} from "ethers";
import {MyNFT} from "../typechain";

async function deployConract(name: string, signer: Signer) {
  const factory = await ethers.getContractFactory(name);
  const contract = await factory.connect(signer).deploy();
  await contract.deployed();
  return contract;
}

describe("Permission test 1", function () {
  it("Should add permissions", async function () {
    const [walletOwner, thirdParty, nftReceiver] = await ethers.getSigners();

    const walletFactory = await ethers.getContractFactory("OnChainWallet");
    const walletContract = await walletFactory.connect(walletOwner).deploy();
    await walletContract.deployed();

    const nftFactory = await ethers.getContractFactory("MyNFT");
    const nftContract = await nftFactory.connect(walletOwner).deploy("ipfs://");
    await nftContract.deployed();

    nftContract.connect(walletOwner).transferOwnership(walletContract.address);

    const abi = [
      "function safeMint(address to, uint256 tokenId)"
    ];
    const iface = new ethers.utils.Interface(abi);

    const data = iface.encodeFunctionData("safeMint", [nftReceiver, 1]);

    const callStruct = walletContract.getHash(nftContract.address, data);
    const callSignature = ethers.utils.splitSignature(
      await walletOwner.signMessage(ethers.utils.arrayify(callStruct))
    );
    walletContract.connect(thirdParty).execute(callStruct)


    // expect(await greeter.greet()).to.equal("Hello, world!");
    //
    // const setGreetingTx = await greeter.setGreeting("Hola, mundo!");
    //
    // // wait until the transaction is mined
    // await setGreetingTx.wait();
    //
    // expect(await greeter.greet()).to.equal("Hola, mundo!");
  });
});
