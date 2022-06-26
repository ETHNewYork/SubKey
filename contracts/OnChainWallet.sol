//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;
pragma abicoder v2;

import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";
import "./Predicate.sol";

contract OnChainWallet is Ownable {

  struct Call {
    address to;
    bytes data;
  }

  struct Permission {
    address caller;
    Predicate predicate;
    bytes predicateParams;
  }

  function execute(Call memory call,
    Permission memory permission, // created by owner
    bytes memory permissionSignature // created by owner
  ) public {
    //1. Check that Permission was signed by the owner => we trust the Permission data
    checkSignatureValid(owner(), getPermissionHash(permission), permissionSignature);

    //2. Check that caller is the same as approved by the Permission
    require(permission.caller == msg.sender, "Wrong transaction sender");

    //3. Check that Predicate(transaction)=true => we trust transaction
    permission.predicate.check(call, permission.predicateParams);

    //4. Execute trusted transaction
    _execute(call);
  }

  function _execute(Call memory call) private returns (bytes memory) {
    (bool success, bytes memory result) = call.to.call(call.data);
    if (!success) {
      if (result.length < 68) revert();
      assembly {
        result := add(result, 0x04)
      }
      revert(abi.decode(result, (string)));
    }
    return result;
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
