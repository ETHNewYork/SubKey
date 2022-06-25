//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;
pragma abicoder v2;

import "hardhat/console.sol";
import "../Predicate.sol";

contract WhitelistedAccount is Predicate {

  function isValid(OnChainWallet.Call memory call, bytes memory predicateParams) override external view returns (bool){
    (address _allowedToAddress) = abi.decode(predicateParams, (address));
    return call.to == _allowedToAddress;
  }
}
