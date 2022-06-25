pragma solidity ^0.8.4;

import "@gnosis.pm/zodiac/contracts/core/Module.sol";
import "../OnChainWallet.sol";

// 'Zero gas' means that owner does not need to spend gas to assign
contract ZeroGasRoleModule is Module {

  function setUp(bytes memory initParams) public override {
    (address _owner, address _avatar, address _target) = abi.decode(
      initParams,
      (address, address, address)
    );
  }

  function execute(OnChainWallet.Call memory call,
    OnChainWallet.Permission memory permission,
    bytes memory permissionSignature
  ) public {
    //1. Check that owner has approved this call
    //    checkSignatures(call, permission, permissionSignature);

    //2. Execute a transaction from safe
    exec(call.to, 0, call.data, Enum.Operation.Call);
  }
}