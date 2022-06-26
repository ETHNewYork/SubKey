//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;
pragma abicoder v2;

import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";
import "./Predicate.sol";
import "./SubKeyChecker.sol";

contract OnChainWallet is Ownable {

  struct Call {
    address to;
    bytes data;
  }

  function execute(Call memory call,
    SubKeyChecker.Permission memory permission, // created by owner
    bytes memory permissionSignature // created by owner
  ) public {
    //1. Check that Permission was signed by the owner => we trust the Permission data
    SubKeyChecker.checkSignatureValid(owner(), SubKeyChecker.getPermissionHash(permission), permissionSignature);

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

}
