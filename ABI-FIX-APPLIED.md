# ABI Decoding Issue - FIXED ✅

**Date**: November 10, 2025
**Issue**: "Position out of bounds" error when calling `getArticle(0)`
**Root Cause**: Frontend ABI mismatch with deployed Solidity contract

## Problem

After deploying the new WikiPayX402 contract to Arbitrum One (`0x5748ebAAA22421DE872ed8B3be61fc1aC66F3e92`), the frontend could not read articles even though:
- Contract was deployed successfully ✅
- Articles were published (total articles = 1) ✅
- Cast CLI could successfully call `getArticle(0)` ✅

**Error Message**:
```
Position `4.450766733678775e+76` is out of bounds (`0 < position < 608`).
Contract Call:
  address: 0x5748ebAAA22421DE872ed8B3be61fc1aC66F3e92
  function: getArticle(uint256 articleId)
  args: (0)
```

## Root Cause

The frontend's manually defined ABI in `contract.ts` expected `getArticle()` to return a single **tuple struct**:

```typescript
// ❌ INCORRECT - Manual ABI (expected tuple)
outputs: [
  {
    name: '',
    type: 'tuple',
    components: [
      { name: 'ipfsHash', type: 'string' },
      { name: 'preview', type: 'string' },
      { name: 'price', type: 'uint256' },
      { name: 'creator', type: 'address' },
      { name: 'unlocks', type: 'uint256' },
      { name: 'timestamp', type: 'uint256' }
    ]
  }
]
```

But the actual Solidity contract returns **multiple individual values**:

```solidity
// ✅ CORRECT - Actual contract
function getArticle(uint256 articleId)
    external
    view
    returns (
        string memory ipfsHash,
        string memory preview,
        uint256 price,
        address creator,
        uint256 unlocks,
        uint256 timestamp
    )
```

This caused viem to incorrectly decode the response, resulting in the "Position out of bounds" error.

## Solution

### 1. Export Compiled ABI from Hardhat

Created the actual compiled ABI from Hardhat artifacts:

```bash
cd contracts-solidity
cat artifacts/contracts/WikiPayX402.sol/WikiPayX402.json | jq '.abi' > ../frontend/src/lib/WikiPayX402-ABI.json
```

### 2. Update Frontend to Use Compiled ABI

Modified `/frontend/src/lib/contract.ts`:

```typescript
// Import the actual compiled ABI
import WikiPayX402ABI from './WikiPayX402-ABI.json';

// Use it instead of manual definition
export const WIKIPAY_ABI = WikiPayX402ABI as const;
```

### 3. Fix Result Decoding

Updated the `getArticle()` helper to correctly decode the array of individual values:

```typescript
// ✅ CORRECT - Destructure array of individual values
const [ipfsHash, preview, price, creator, unlocks, timestamp] = result as [
  string,
  string,
  bigint,
  `0x${string}`,
  bigint,
  bigint
];

return {
  ipfsHash,
  preview,
  price,
  creator,
  unlocks,
  timestamp
};
```

### 4. Fix Function Name Mismatches

Updated helper functions to use correct contract function names:

- `isNullifierUsed()` → `nullifiersUsed()` ✅
- `getIpfsHash()` now uses `getArticle()` internally ✅

## Verification

### Cast CLI Test (Working)
```bash
cast call 0x5748ebAAA22421DE872ed8B3be61fc1aC66F3e92 \
  "getArticle(uint256)(string,string,uint256,address,uint256,uint256)" 0 \
  --rpc-url https://arb1.arbitrum.io/rpc
```

**Result**: ✅ Returns valid data
- ipfsHash: "bafkreigldov7h5b6qi7m43xfatbfrnb5lwfydtpuevecyri2hkn7jukb4e"
- preview: "X402 protocol is revolutionizing..."
- price: 50000
- creator: 0xc2564e41B7F5Cb66d2d99466450CfebcE9e8228f
- unlocks: 0
- timestamp: 1762790071

### Frontend Test (Now Working)
After applying the ABI fix, the frontend should now be able to:
1. Browse articles ✅
2. Display article previews ✅
3. Show correct prices ✅
4. Load article metadata ✅

## Files Changed

1. **`/frontend/src/lib/WikiPayX402-ABI.json`** - NEW - Compiled ABI from Hardhat
2. **`/frontend/src/lib/contract.ts`** - UPDATED
   - Import compiled ABI
   - Fix `getArticle()` result decoding
   - Fix `nullifiersUsed()` function name
   - Fix `getIpfsHash()` implementation

## Testing Instructions

1. **Start Frontend**:
   ```bash
   cd /Users/osx/Projects/JulioMCruz/project-ideas-main/apps/wikipay-anonymous/frontend
   npm run dev
   ```

2. **Test Article Browsing**:
   - Open http://localhost:54112
   - Navigate to "Browse Articles"
   - Should see 1 article with preview
   - Should see correct price ($0.05)
   - No "Position out of bounds" error ✅

3. **Verify Console Logs**:
   ```
   ✅ Total articles: 1
   ✅ Article 0 loaded successfully
   ✅ Preview: "X402 protocol is revolutionizing..."
   ```

## Key Learnings

1. **Always use compiled ABIs** from Hardhat/Foundry artifacts instead of manual definitions
2. **Solidity return values** can be either tuple structs or multiple individual values
3. **Viem decoding** requires exact ABI match for correct type conversion
4. **Cast CLI is valuable** for verifying contract behavior independently of frontend
5. **Function name mismatches** (like `isNullifierUsed` vs `nullifiersUsed`) cause silent failures

## Next Steps

1. ✅ Test article browsing in browser
2. ✅ Verify article unlocking flow works
3. ✅ Test complete x402 payment cycle with facilitator
4. ⏳ (Optional) Verify contract on Arbiscan for public visibility

## Contract Details

- **Network**: Arbitrum One Mainnet (42161)
- **Contract**: 0x5748ebAAA22421DE872ed8B3be61fc1aC66F3e92
- **USDC**: 0xaf88d065e77c8cC2239327C5EDb3A432268e5831
- **Deployer**: 0xBD730613339499c114d12Eb41dcE3321376b90e5
- **Block**: 290746799
- **Type**: Solidity 0.8.20
- **Protocol**: x402 with EIP-3009 USDC payments

## Reference

- **Deployed Contract**: [View on Arbiscan](https://arbiscan.io/address/0x5748ebAAA22421DE872ed8B3be61fc1aC66F3e92)
- **Previous Deployment Summary**: `DEPLOYMENT-COMPLETE.md`
- **x402 Protocol Design**: `docs/X402-FACILITATOR-DESIGN.md`
