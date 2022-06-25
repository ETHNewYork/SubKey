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
    Predicate predicate;
    address caller;
  }

  struct Signature {
    uint8 v;
    bytes32 r;
    bytes32 s;
  }

  function execute(Call memory call,
    bytes memory callSignature,
    Permission memory permission, // created by owner
    Signature memory permissionSignature // created by owner
  ) public {
    //1. Check that Artefact was signed by Master-key => we trust Artefact data
    checkSignatureValid(owner(), getHash(permission), permissionSignature);

    //2. Check that caller is the same as approved by artefact
    require(permission.caller == msg.sender, "Wrong message sender");

    //3. Check that Predicate(transaction)=true => we trust transaction
    require(permission.predicate.isValid(call));

    //4. Execute
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

  function getHash(Permission memory permission) public returns (bytes32){
    return keccak256(
      abi.encode(
        permission
      )
    );
  }

  function getHash(Call memory call) public pure returns (bytes32){
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
