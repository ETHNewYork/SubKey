//SPDX-License-Identifier: Unlicense
pragma solidity =0.7.6;
pragma abicoder v2;

import "hardhat/console.sol";
import "../Predicate.sol";

contract AccessOneAccount is Predicate {
    address public allowedAddress;

    constructor(address _allowedAddress){
        allowedAddress = _allowedAddress;
    }

    function isValid(OnChainWallet.Call memory call) override external returns (bool){
        return call.to == allowedAddress;
    }
}
