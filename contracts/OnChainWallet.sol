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

    //2. Check that caller is the same as approved by artefact

    //3. Check that Predicate(transaction)=true => we trust transaction

    //4. Execute
  }

}
