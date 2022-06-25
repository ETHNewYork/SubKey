//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;
pragma abicoder v2;

import "hardhat/console.sol";
import "./OnChainWallet.sol";

interface Predicate {

  function isValid(OnChainWallet.Call memory call, bytes memory predicateParams) external returns (bool);
}
