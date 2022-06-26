# SubKey

SubKey enables issuing keys with limited permissions.

# How to use

Let's say you have an NFT contract and want to grant permission to a third party to only mint tokens and no other rights. Here are the steps:
1. The NFT contract owner deploys the SubKey contract and transfers the NFT contract ownership to it.
2. Owner creates the Permission struct and the permission signature
and passes it to the third party.
3. As the result the third party is only allowed to call the allowed methods with the allowed params.

Currently the Predicate that checks the caller address and the target contract function name is implemented. In the future more sophisticated checks could be added, such as:

- function params check (e.g. mint no more that 10 NFTs, or with the id greater than)
- expiration time
- revoking permissions

# Install

```
git clone https://github.com/DeFiMiami/subkey.git
cd subkey
npm i
mv .env.example .env
```

Put the appropriate values into the `.env` file.


# Run Tests

```
npx hardhat test
```

# Deploy

```
npx hardhat run --network <network name> scripts/deploy.ts
```

# Ideas for future improvements

- Create SDK to ease interaction with SubkeysWallet for developers
- Create UI to ease interaction with SubkeysWallet
- Move SubkeysWallet methods to a Library
- PredicateV2 with budget restrictions, method parameters restrictions
- Create SubkeysWallet proxy instead of contract
- Batch multiple transactions in one call
