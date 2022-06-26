//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract TestNFT is ERC721, Ownable {

  using Strings for uint256;

  string public baseURI;
  string public baseExtension = ".json";

  constructor() ERC721("NFT Name", "NFT_SYMBOL") {
    setBaseURI("ipfs://");
  }

  function safeMint(address to, uint256 tokenId) public onlyOwner {
    _safeMint(to, tokenId);
  }

  function _baseURI() internal view override returns (string memory) {
    return baseURI;
  }

  function setBaseURI(string memory _newBaseURI) public onlyOwner {
    baseURI = _newBaseURI;
  }

  function setBaseExtension(string memory _newBaseExtension) public onlyOwner {
    baseExtension = _newBaseExtension;
  }

  function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
    require(
      _exists(tokenId),
      "ERC721Metadata: URI query for nonexistent token"
    );

    string memory currentBaseURI = _baseURI();
    return bytes(currentBaseURI).length > 0
    ? string(abi.encodePacked(currentBaseURI, tokenId.toString(), baseExtension))
    : "";
  }

}
