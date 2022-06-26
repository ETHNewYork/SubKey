//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;
pragma abicoder v2;

import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";
import "./Predicate.sol";


library SubKeyChecker {

  struct Permission {
    address caller;
    Predicate predicate;
    bytes predicateParams;
  }

  function checkSignatureValid(address signer, bytes32 hash, bytes memory signature) internal pure {
    bytes32 etherHash = getHashEthereum(bytes32ToString(hash));
    (address recovered, ECDSA.RecoverError error) = ECDSA.tryRecover(etherHash, signature);
    require(signer == recovered, "Invalid signature");
  }

  function getPermissionHash(Permission memory permission) public pure returns (bytes32){
    return keccak256(
      abi.encode(
        permission.caller
      )
    );
  }

  function getHashEthereum(string memory hash) public pure returns (bytes32){
    return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));
  }

  function bytes32ToString(bytes32 _bytes32) public pure returns (string memory) {
    uint8 i = 0;
    while (i < 32 && _bytes32[i] != 0) {
      i++;
    }
    bytes memory bytesArray = new bytes(i);
    for (i = 0; i < 32 && _bytes32[i] != 0; i++) {
      bytesArray[i] = _bytes32[i];
    }
    return string(bytesArray);
  }

}
