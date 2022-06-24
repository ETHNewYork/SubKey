//SPDX-License-Identifier: Unlicense
pragma solidity =0.7.6;
pragma abicoder v2;

import "hardhat/console.sol";
import "./OnChainWallet.sol";

interface Predicate {

    function isValid(OnChainWallet.Call memory call) external returns (bool);
}
