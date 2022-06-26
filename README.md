# SubKeys

# SubKeys - keys issued by main account keys that can only submit transaction allowed by Permissions.

# Deploy

```
npx hardhat run scripts/deploy.ts --network localhost
```



# Ideas for future improvements
- Create SDK to ease interaction with SubkeysWallet for developers
- Create UI to ease interaction with SubkeysWallet
- Move SubkeysWallet methods to Library
- PredicateV2 with budget restrictions, method parameters restrictions
- Create SubkeysWallet proxy instead of contract
- Batch multiple transactions in one call
