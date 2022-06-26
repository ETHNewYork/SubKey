pragma solidity ^0.8.4;

import "@gnosis.pm/zodiac/contracts/core/Module.sol";
import "../SubkeysWallet.sol";

// 'Zero gas' means that owner does not need to spend gas to assign
contract ZeroGasRoleModule is Module {

  address public owner2;

  constructor(address _avatar) {
    avatar = _avatar;
    target = _avatar;
    owner2 = msg.sender;
  }

  function setUp(bytes memory initParams) public override pure {
    (address _owner, address _avatar, address _target) = abi.decode(
      initParams,
      (address, address, address)
    );
  }

  function execute(SubkeysWallet.Call memory call,
    SubkeysWallet.Permission memory permission,
    bytes memory permissionSignature
  ) public {
    //1. Check that Permission was signed by the owner => we trust the Permission data
    checkSignatureValid(owner2, getPermissionHash(permission), permissionSignature);

    //2. Check that caller is the same as approved by the Permission
    require(permission.caller == msg.sender, "Wrong transaction sender");

    //3. Check that Predicate(transaction)=true => we trust transaction
    permission.predicate.check(call, permission.predicateParams);

    //4. Execute trusted transaction
    exec(call.to, 0, call.data, Enum.Operation.Call);
  }

  function getPermissionHash(SubkeysWallet.Permission memory permission) public pure returns (bytes32){
    return keccak256(
      abi.encode(
        permission.caller, permission.predicate, permission.predicateParams
      )
    );
  }

  function checkSignatureValid(address signer, bytes32 hash, bytes memory signature) private pure {
    bytes32 etherHash = getHashEthereum(bytes32ToString(hash));
    (address recovered, ECDSA.RecoverError error) = ECDSA.tryRecover(etherHash, signature);
    require(signer == recovered, "Invalid signature");
  }

  function getHashEthereum(string memory hash) private pure returns (bytes32){
    return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));
  }

  function bytes32ToString(bytes32 _bytes32) private pure returns (string memory) {
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