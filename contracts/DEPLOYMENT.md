# zkWiki Stylus Contract Deployment

## Deployment Information

- **Network**: Arbitrum Sepolia
- **Contract Address**: `0x5748ebaaa22421de872ed8b3be61fc1ac66f3e92`
- **Deployment Transaction**: `0xa5103673fa8286158145d6e96742b5716c73258c36323c4dc74236ee2acb84e9`
- **Activation Transaction**: `0x14995ea8c2c9aa1878ffb908a5262482cb8d791d8bcf627efa308d2227e41b65`
- **Cache Bid Transaction**: `0x3030d6ac543091ceec4b8b932e3ffa8348463738052ec945650c6375086e77b6`
- **Deployment Date**: November 9, 2025

## Contract Details

- **Size**: 22.9 KiB (23,481 bytes)
- **WASM Size**: 83.6 KiB (85,600 bytes)
- **Data Fee**: 0.000127 ETH (with 20% bump)
- **Status**: Deployed, activated, and cached

## Technology Stack

- **Rust Version**: 1.91.0
- **Stylus SDK**: 0.9.0
- **cargo-stylus**: 0.6.3
- **alloy-primitives**: 0.8.20
- **alloy-sol-types**: 0.8.20

## Contract Functions

The zkWiki contract implements the following functions:

1. `publishArticle(string preview, string encrypted_content, uint256 price) → uint256` - Publish a new article
2. `unlockArticleAnonymous(uint256 article_id, bytes32 nullifier, bytes proof) payable → string` - Unlock article with zero-knowledge proof
3. `withdrawEarnings() → uint256` - Withdraw creator earnings
4. `getArticle(uint256 article_id) view → (address creator, uint256 price, uint256 totalUnlocks, string preview)` - Get article information
5. `getCreatorEarnings(address creator) view → uint256` - Check creator earnings
6. `isNullifierUsed(bytes32 nullifier) view → bool` - Verify nullifier usage
7. `getTotalArticles() view → uint256` - Get total article count

## Verification

To verify the deployment:

```bash
# Check contract activation
cargo stylus check \
  --endpoint https://sepolia-rollup.arbitrum.io/rpc \
  --contract-address 0x5748ebaaa22421de872ed8b3be61fc1ac66f3e92

# View on Arbiscan Sepolia
https://sepolia.arbiscan.io/address/0x5748ebaaa22421de872ed8b3be61fc1ac66f3e92
```

## ABI

The contract ABI is available in `wikipay-abi.json`.

## Notes

- Contract is cached in ArbOS for cheaper function calls
- Uses Arbitrum Stylus WASM execution environment
- Implements privacy-preserving article unlocking with zero-knowledge proofs
