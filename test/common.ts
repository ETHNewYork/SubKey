import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {ethers} from "hardhat";

export async function deployContract(signer: SignerWithAddress, name: string): Promise<any> {
  const factory = await ethers.getContractFactory(name);
  const contract = await factory.connect(signer).deploy();
  await contract.deployed();
  return contract;
}
