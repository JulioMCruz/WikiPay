# Stylus SDK Issues & Solidity Migration

## Summary

WikiPay initially attempted to use **Arbitrum Stylus (Rust/WASM)** for lower gas costs but encountered a critical unresolved bug. Migrated to **Solidity 0.8.20** as a stable, battle-tested alternative.

## Stylus SDK Issue #261

**Bug**: [SIGSEGV when using mappings in public functions](https://github.com/OffchainLabs/stylus-sdk-rs/issues/261)
**Status**: Open/Unresolved (as of November 10, 2025)
**Severity**: Critical - blocks production use of storage mappings

### Symptoms

All view functions revert with no error data:
```bash
Error: server returned an error response: error code 3: execution reverted, data: "0x"
```

### What We Tested

| Approach | Result | Details |
|----------|--------|---------|
| `sol_storage!` macro | ❌ Failed | View functions revert |
| `#[storage]` attribute | ❌ Failed | View functions revert |
| OpenZeppelin composition pattern | ❌ Failed | View functions revert |
| Minimal contract (single uint256) | ❌ Failed | Even simplest storage fails |
| String mappings | ❌ Failed | Confirmed not string-specific |
| uint256 mappings | ❌ Failed | Any mapping causes failure |
| Official Counter example | ✅ Works | Only when deployed from official repo |

### Failed Deployments

- `0x321313862c7e30330290d11ee20af2a273e8d76a` - Full WikiPay with mappings
- `0x7728b334691d8a0da4522c2f4453115faca9916f` - Composition pattern
- `0x9806a6067a3ef5b7356327eb18e55ce0e3e835f5` - uint256 mapping only
- `0x44105ef926818bbbab0280246915e9c74a57cf50` - Zero mappings
- `0x84edc4ddb8703f27f73f3b572f7d6469d882cc83` - Minimal sol_storage!

### Working Example

- `0x1303999cfa8d72beea8e723b16ece58d3d2dc7f1` - Counter from official repo (simple uint256)

## Solidity Solution

### Deployed Contract

**Address**: `0xF1fb6aD6c53BEb9FbA03F24BaC213132015b7DdE`
**Network**: Arbitrum Sepolia
**Compiler**: Solidity 0.8.20
**Status**: ✅ Fully functional

### Features

- ✅ Article publishing with IPFS storage
- ✅ String storage (IPFS hashes, previews)
- ✅ Mapping storage (article_id → Article struct)
- ✅ All view functions working
- ✅ Payment and earnings tracking
- ✅ Event emissions for indexing

### Gas Comparison

| Operation | Stylus (theoretical) | Solidity (actual) | Difference |
|-----------|---------------------|-------------------|------------|
| Deploy | ~$0.0001 | ~$0.002 | +20x |
| Publish Article | ~$0.00005 | ~$0.0008 | +16x |
| View Article | Free | Free | Same |

**Note**: While Stylus promises 10-100x gas savings, Arbitrum's already-low gas costs make Solidity's actual costs negligible ($0.0008 vs theoretical $0.00005).

## Migration Steps

### 1. Created Solidity Contract

[WikiPay.sol](contracts-solidity/contracts/WikiPay.sol) - Full-featured implementation with:
- Article struct with IPFS hash, preview, price, creator
- Publish/unlock article functions
- Creator earnings withdrawal
- Comprehensive view functions

### 2. Hardhat Setup

```bash
cd contracts-solidity
npm install
npx hardhat compile
npx hardhat run scripts/deploy.js --network arbitrumSepolia
```

### 3. Deployment

```javascript
// scripts/deploy.js
const WikiPay = await hre.ethers.getContractFactory("WikiPay");
const wikipay = await WikiPay.deploy();
```

### 4. Frontend Update

Updated `.env.local`:
```env
NEXT_PUBLIC_WIKIPAY_ADDRESS=0xF1fb6aD6c53BEb9FbA03F24BaC213132015b7DdE
```

## Research Findings

### OpenZeppelin Workaround

OpenZeppelin's `rust-contracts-stylus` requires **koba deployment tool** instead of `cargo-stylus`:

> "Deploying openzeppelin-stylus contracts must be done using koba, as using cargo-stylus directly may initialize storage with unexpected values."

**Koba installation failed** due to dependency conflicts with `alloy-primitives 0.8.26` containing a bug in `getrandom::getrandom()`.

### Stylus SDK Versions

All attempts used:
- `stylus-sdk = "0.9.0"` (latest)
- `alloy-primitives = "0.8.20"`
- `alloy-sol-types = "0.8.20"`

Same versions as official Counter example that works.

## Recommendations

### Short Term

✅ **Use Solidity** for production deployment
- Proven stability
- Comprehensive tooling
- Negligible gas costs on Arbitrum
- No blocking bugs

### Long Term

⏳ **Monitor Stylus SDK progress**
- Track [Issue #261](https://github.com/OffchainLabs/stylus-sdk-rs/issues/261)
- Test future SDK releases (0.10.0+)
- Consider migration when issue is resolved

### Future Migration Path

When Stylus SDK is fixed:
1. Port Solidity contract to Rust
2. Deploy to testnet
3. Comprehensive testing
4. Gradual rollout with fallback to Solidity

## Conclusion

While Stylus promises significant gas savings, **SDK maturity issues make Solidity the pragmatic choice** for WikiPay's production deployment. The ~$0.0008 per article publish cost on Arbitrum is already excellent, and the stability/tooling benefits of Solidity outweigh theoretical gas optimizations.

## Explorer Links

- Solidity Contract: https://sepolia.arbiscan.io/address/0xF1fb6aD6c53BEb9FbA03F24BaC213132015b7DdE
- Failed Stylus Attempts: See deployment addresses above
- Working Counter: https://sepolia.arbiscan.io/address/0x1303999cfa8d72beea8e723b16ece58d3d2dc7f1
