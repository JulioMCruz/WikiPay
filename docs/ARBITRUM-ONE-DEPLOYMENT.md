# zkWikiX402 Arbitrum One Mainnet Deployment Guide

## Overview

Deploy **zkWikiX402** to **Arbitrum One** with **Circle USDC** (EIP-3009) for strict x402 protocol compliance.

## Prerequisites

### 1. Wallet Setup

✅ **Wallet with ETH on Arbitrum One** (for gas fees)
- Deployer address needs ~0.005 ETH ($10-15)
- Gas costs on Arbitrum One: ~$0.05-0.10 per deployment

✅ **Get Arbitrum One ETH**:
- Bridge from Ethereum: https://bridge.arbitrum.io/
- Buy directly: https://app.uniswap.org/ (on Arbitrum One)
- CEX withdrawal: Binance, Coinbase → Arbitrum One

### 2. Environment Setup

Update `contracts-solidity/.env`:

```bash
# Arbitrum One RPC (choose one)
ARBITRUM_ONE_RPC=https://arb1.arbitrum.io/rpc

# Your private key (NEVER commit this!)
PRIVATE_KEY=your_private_key_here

# Arbiscan API key for verification (optional)
ARBISCAN_API_KEY=your_arbiscan_api_key
```

**Get Arbiscan API Key** (for contract verification):
1. Go to https://arbiscan.io/myapikey
2. Sign up / login
3. Create API key
4. Add to `.env`

### 3. Verify Configuration

```bash
cd contracts-solidity

# Check network config
npx hardhat network --network arbitrumOne

# Verify private key is loaded
npx hardhat accounts --network arbitrumOne
```

## Deployment Steps

### Step 1: Compile Contract

```bash
cd contracts-solidity

# Clean previous build
npx hardhat clean

# Compile zkWikiX402
npx hardhat compile

# Verify compilation
ls artifacts/contracts/zkWikiX402.sol/zkWikiX402.json
```

Expected output:
```
✓ Compiled 1 Solidity file successfully
```

### Step 2: Deploy to Arbitrum One

```bash
# Deploy zkWikiX402 to Arbitrum One mainnet
npx hardhat run scripts/deploy-mainnet-x402.js --network arbitrumOne
```

**Expected Output**:
```
🚀 Deploying zkWikiX402 to Arbitrum One Mainnet...

📝 Deploying with account: 0x...
💰 Account balance: 0.005 ETH

🌐 Network: arbitrum-one
🔗 Chain ID: 42161
✅ Network verified: Arbitrum One

📦 Deploying zkWikiX402 contract...
✅ zkWikiX402 deployed to: 0x... [NEW ADDRESS]
💵 USDC Address: 0xaf88d065e77c8cC2239327C5EDb3A432268e5831
✅ USDC verified: Circle USDC with EIP-3009 support

============================================================
🎉 DEPLOYMENT SUCCESSFUL!
============================================================

📋 Contract Information:
   Contract: zkWikiX402
   Address: 0x... [YOUR CONTRACT ADDRESS]
   Network: Arbitrum One (Mainnet)
   Chain ID: 42161
   USDC: Circle USDC with EIP-3009
   Protocol: x402 (HTTP 402 Payment Required)
```

**IMPORTANT**: Copy the contract address!

### Step 3: Verify Contract on Arbiscan

```bash
# Verify contract (replace with YOUR address)
npx hardhat verify --network arbitrumOne 0xYOUR_CONTRACT_ADDRESS
```

This makes your contract source code public and verifiable on Arbiscan.

### Step 4: Save Deployment Info

The deployment script automatically saves deployment info to:
```
contracts-solidity/deployments/arbitrum-one-mainnet.json
```

Verify it contains:
```json
{
  "contract": "zkWikiX402",
  "address": "0x...",
  "network": "Arbitrum One",
  "chainId": 42161,
  "usdc": "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
  "protocol": "x402"
}
```

## Post-Deployment Configuration

### Update Frontend Environment

Update `frontend/.env.local`:

```bash
# Arbitrum One Mainnet
NEXT_PUBLIC_CHAIN_ID=42161
NEXT_PUBLIC_RPC_URL=https://arb1.arbitrum.io/rpc

# zkWikiX402 Contract (REPLACE WITH YOUR ADDRESS)
NEXT_PUBLIC_WIKIPAY_CONTRACT=0xYOUR_CONTRACT_ADDRESS_HERE

# Circle USDC on Arbitrum One
NEXT_PUBLIC_USDC_ADDRESS=0xaf88d065e77c8cC2239327C5EDb3A432268e5831

# Pinata (unchanged)
NEXT_PUBLIC_PINATA_JWT=your_pinata_jwt
NEXT_PUBLIC_PINATA_GATEWAY=https://gateway.pinata.cloud
```

### Update RainbowKit Configuration

The frontend is already configured for Arbitrum One in `wagmi.config.ts`, but verify:

```typescript
import { arbitrum } from 'wagmi/chains';

export const config = createConfig({
  chains: [arbitrum], // Arbitrum One mainnet
  // ...
});
```

## Testing the Deployment

### 1. Verify Contract on Arbiscan

Visit: `https://arbiscan.io/address/YOUR_CONTRACT_ADDRESS`

Verify:
- ✅ Contract verified (green checkmark)
- ✅ Contract name: zkWikiX402
- ✅ Solidity version: 0.8.20
- ✅ No errors in code

### 2. Test Contract Calls (Read)

```bash
# Get total articles (should be 0)
npx hardhat console --network arbitrumOne

# In console:
const contract = await ethers.getContractAt("zkWikiX402", "YOUR_ADDRESS");
await contract.getTotalArticles(); // Should return 0n

# Verify USDC address
await contract.getUSDCAddress(); // Should return Circle USDC address
```

### 3. Publish Test Article

Use the frontend or Hardhat console:

```javascript
// Price: 10000 = $0.01 (USDC has 6 decimals)
const tx = await contract.publishArticle(
  "bafkreiexample", // IPFS hash
  "Test article preview for x402 protocol...",
  10000 // $0.01 in USDC
);

await tx.wait();
console.log("Article published! ID:", 0);
```

### 4. Verify Article Data

```javascript
const article = await contract.getArticle(0);
console.log("Article:", article);

// Get formatted price
const [priceUSDC, formatted] = await contract.getPriceFormatted(0);
console.log("Price:", formatted); // Should show "0.01"
```

## x402 Protocol Testing

### Test HTTP 402 Responses

```bash
# Start frontend
cd frontend
npm run dev

# Visit article page
open http://localhost:3000/articles/0

# Should see:
# 1. Free preview (HTTP 200 OK)
# 2. "Unlock for $0.01" button
# 3. Clicking shows MetaMask with USDC approval
```

### Test EIP-3009 Flow

1. **User has USDC** on Arbitrum One
2. **Click "Unlock"** → Signs authorization (off-chain, no gas)
3. **Contract calls** `transferWithAuthorization()`
4. **USDC transferred** from user → creator
5. **Content unlocked** → Full article shown

### Verify x402 Headers

```bash
curl -i https://your-domain.com/api/articles/0?full=true

# Should return:
HTTP/1.1 402 Payment Required
WWW-Authenticate: Ethereum-ZK realm="zkWiki", contract="0x..."
X-Payment-Required: true
X-Payment-Amount: 10000 USDC
X-Payment-Network: arbitrum-one
X-Payment-ChainId: 42161
```

## Pricing Guide

USDC uses **6 decimals** (not 18 like ETH):

| Human Price | USDC Value | Contract Value |
|-------------|------------|----------------|
| $0.01       | 0.01 USDC  | 10000          |
| $0.10       | 0.10 USDC  | 100000         |
| $1.00       | 1.00 USDC  | 1000000        |
| $5.00       | 5.00 USDC  | 5000000        |
| $10.00      | 10.00 USDC | 10000000       |

### Examples

```javascript
// Publish with different prices

// $0.01 article
await contract.publishArticle(ipfsHash, preview, 10000);

// $0.50 article
await contract.publishArticle(ipfsHash, preview, 500000);

// $2.99 article
await contract.publishArticle(ipfsHash, preview, 2990000);
```

## Security Checklist

Before going live:

- ✅ **Contract verified** on Arbiscan
- ✅ **USDC address correct**: `0xaf88d065e77c8cC2239327C5EDb3A432268e5831`
- ✅ **EIP-3009 tested** with real USDC transfers
- ✅ **Nullifiers working** (prevent double-unlock)
- ✅ **Frontend updated** with correct contract address
- ✅ **x402 headers implemented** in API routes
- ✅ **Private keys secured** (not in .env.local, use .env files)

## Troubleshooting

### "Insufficient funds for gas"

**Solution**: Bridge more ETH to Arbitrum One
- Use: https://bridge.arbitrum.io/

### "USDC transfer failed"

**Causes**:
1. User doesn't have USDC on Arbitrum One
2. Authorization signature expired
3. Nonce already used

**Solution**:
- Check USDC balance on Arbiscan
- Regenerate authorization with new nonce
- Ensure `validBefore` timestamp is in the future

### "Nullifier already used"

**Cause**: User already unlocked this article

**Solution**: This is expected behavior! Check:
```javascript
const used = await contract.isNullifierUsed(nullifier);
console.log("Already paid:", used); // true
```

### "Contract not verified"

**Solution**:
```bash
npx hardhat verify --network arbitrumOne YOUR_ADDRESS
```

If verification fails, manually verify on Arbiscan using Solidity code.

## Cost Analysis

### Deployment Costs (One-time)

| Item | Estimated Cost |
|------|---------------|
| Contract deployment | $0.05 - $0.10 |
| Contract verification | Free |
| **Total** | **~$0.10** |

### Per-Transaction Costs

| Transaction | Gas Cost (Arbitrum One) |
|-------------|------------------------|
| Publish article | $0.01 - $0.02 |
| Unlock (EIP-3009) | $0.01 - $0.02 |
| Withdraw earnings | $0.01 - $0.02 |

**Note**: EIP-3009 is "gasless" for the *user* - relayer pays gas, but for MVP, user pays their own gas.

## Next Steps

1. ✅ Deploy contract to Arbitrum One
2. ✅ Verify on Arbiscan
3. ✅ Update frontend environment variables
4. ✅ Test article publishing
5. ✅ Test USDC unlocking with EIP-3009
6. ✅ Verify x402 HTTP responses
7. ✅ Test cross-device access
8. ✅ Go live!

## Production Checklist

Before launching to users:

- ✅ Contract audited (or at least reviewed)
- ✅ Frontend deployed (Vercel/Netlify)
- ✅ Domain configured with HTTPS
- ✅ x402 API routes working
- ✅ Pinata IPFS configured
- ✅ Analytics setup (optional)
- ✅ Error monitoring (Sentry/LogRocket)
- ✅ User documentation written
- ✅ Test with real users (friends/colleagues)
- ✅ Marketing materials ready

## Support

**Arbitrum Documentation**: https://docs.arbitrum.io/
**Circle USDC**: https://www.circle.com/en/usdc
**EIP-3009 Spec**: https://eips.ethereum.org/EIPS/eip-3009
**x402 Protocol**: See X402-IMPLEMENTATION.md

Good luck with your mainnet deployment! 🚀
