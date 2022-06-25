//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;
pragma abicoder v2;

import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
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

  struct Signature {
    uint8 v;
    bytes32 r;
    bytes32 s;
  }

  function execute(Call memory call,
    Signature memory callSignature,
    Permission memory permission, // created by owner
    Signature memory permissionSignature // created by owner
  ) public {
    //1. Check that Permission was signed by the owner => we trust the Permission data
    checkSignatureValid(owner(), hashPermissions(permission), permissionSignature);

    //2. Check that caller is the same as approved by the Permission
    require(permission.caller == msg.sender, "Wrong transaction sender");

    //3. Check that Predicate(transaction)=true => we trust transaction
    require(permission.predicate.isValid(call, permission.predicateParams), "Unpermitted operation");

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

  function hashPermissions(Permission memory permission) public pure returns (bytes32){
    return keccak256(
      abi.encode(
        permission
      )
    );
  }

  function hashCall(Call memory call) public pure returns (bytes32){
    return keccak256(
      abi.encode(
        call
      )
    );
  }

  function checkSignatureValid(address signer,
    bytes32 hash,
    Signature memory signature) public pure {
    address signingRecovered = ecrecover(hash, signature.v, signature.r, signature.s);
    require(signer == signingRecovered, "Message signed by incorrect address");
  }

}
