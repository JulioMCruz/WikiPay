# zkWiki Payment System - Current Status

**Date**: November 10, 2025
**Status**: ✅ **Browsing Works** | ❌ **Payment Requires Facilitator**

## What's Working ✅

### 1. Article Browsing (FIXED)
- Contract deployed: `0x5748ebAAA22421DE872ed8B3be61fc1aC66F3e92`
- Articles can be browsed successfully
- Preview text displays correctly
- Prices show correctly ($0.05 USD)
- ABI decoding issue resolved

### 2. Article Publishing (Working)
- Users can publish articles to blockchain
- IPFS integration with Pinata works
- Articles stored on-chain with metadata

### 3. Smart Contract (Deployed)
- Network: Arbitrum One (42161)
- USDC Address: `0xaf88d065e77c8cC2239327C5EDb3A432268e5831`
- All contract functions operational
- Access controls and ZK nullifiers working

## What's NOT Working ❌

### Payment Unlock Feature - Missing Facilitator Backend

**Error When Attempting to Pay**:
```
❌ x402 payment error: Error: Facilitator error
GET http://localhost:3005/api/verify-and-settle
```

**Root Cause**: The x402 facilitator backend service doesn't exist yet.

## Architecture Overview

```
┌─────────────┐      ┌──────────────────┐      ┌─────────────────┐
│   Browser   │      │  zkWiki x402    │      │  Arbitrum One   │
│   (User)    │─────▶│   Facilitator    │─────▶│   (Blockchain)  │
│             │ 402  │   (MISSING!)     │ Tx   │                 │
└─────────────┘      └──────────────────┘      └─────────────────┘
                              ↓
                      ⚠️ NOT IMPLEMENTED
```

### Current Flow (Broken)

1. ✅ User clicks "Unlock Article"
2. ✅ Frontend generates ZK proof and USDC authorization signature (EIP-3009)
3. ✅ Frontend sends payment to `/api/articles/0` with `X-PAYMENT` header
4. ✅ Next.js API route receives payment
5. ❌ **API tries to verify with facilitator at `localhost:3005`**
6. ❌ **Facilitator doesn't exist → Error**

## What is the x402 Facilitator?

The **x402 Facilitator** is a backend service that:

1. **Receives Payment Signatures** from frontend
2. **Validates EIP-3009 Signatures** off-chain
3. **Pays Gas Fees** for users (submits blockchain transaction)
4. **Calls `unlockArticleX402()`** on smart contract
5. **Returns Success** after transaction confirms
6. **Delivers Content** back to user

### Why We Need It

- **Gasless Payments**: Users only sign USDC authorization, facilitator pays ETH gas
- **x402 Protocol Compliance**: Implements HTTP 402 Payment Required standard
- **User Experience**: No need for users to have ETH for gas

### Gas Economics

- Cost per transaction: ~$0.00004 (150,000 gas @ 0.1 gwei on Arbitrum)
- 0.01 ETH = ~666 transactions
- Monthly cost for 1,000 unlocks: ~$37.50

## Implementation Options

### Option 1: Self-Hosted Facilitator (Recommended for MVP)

**Pros**:
- Full control
- Minimal cost ($37.50/month for 1,000 transactions)
- Simple implementation

**Cons**:
- Need to maintain backend service
- Need to manage hot wallet with ETH

**Implementation Steps**:
1. Create Express/Fastify backend
2. Implement `/api/verify-and-settle` endpoint
3. Generate facilitator wallet and fund with 0.01 ETH
4. Add EIP-3009 signature validation
5. Add rate limiting and security
6. Deploy to server

### Option 2: Use Gelato Relay (Production-Ready)

**Pros**:
- No backend maintenance
- Auto-scaling
- Enterprise-grade security

**Cons**:
- Higher cost (~$0.0002/tx = 5x more expensive)
- 3rd party dependency

**Website**: https://www.gelato.network/relay

### Option 3: Bypass Facilitator (Direct Payment - Not Recommended)

**Pros**:
- No backend needed
- Simplest implementation

**Cons**:
- Users must pay gas fees (poor UX)
- Not true x402 protocol
- Users need ETH on Arbitrum

**Changes Required**:
- Remove facilitator integration from frontend
- Have users call `unlockArticleX402()` directly
- Users pay both USDC + gas fees

## Recommended Next Steps

### Immediate (Get Payment Working)

1. **Option A - Quick Test**: Create minimal facilitator with hardcoded wallet
2. **Option B - Production**: Integrate Gelato Relay
3. **Option C - Temporary**: Bypass facilitator and use direct payments

### Short-Term (Production Ready)

1. Implement full x402 facilitator backend
2. Deploy facilitator to cloud (Vercel, Railway, etc.)
3. Fund facilitator wallet with 0.1 ETH
4. Add monitoring and alerting
5. Implement rate limiting
6. Add transaction retry logic

### Long-Term (Scale)

1. Migrate to Gelato Relay if volume > 100K/month
2. Implement subscription tiers
3. Add creator payout automation
4. Implement analytics dashboard

## Files That Reference Facilitator

### Frontend Files
- `/frontend/.env.local` - Line 17: `NEXT_PUBLIC_FACILITATOR_URL=http://localhost:3005`
- `/frontend/src/app/api/articles/[id]/route.ts` - Lines 188-217: Facilitator integration
- `/frontend/src/app/articles/[id]/page.tsx` - Payment flow logic

### Documentation Files
- `/docs/X402-FACILITATOR-DESIGN.md` - Complete facilitator specification
- `/docs/X402-PROTOCOL-COMPLIANCE.md` - Protocol requirements
- `/docs/ARBITRUM-X402-FACILITATOR.md` - Implementation guide

## Environment Variables Needed

### Frontend (.env.local) - ✅ Already Configured
```bash
NEXT_PUBLIC_FACILITATOR_URL=http://localhost:3005  # Change to production URL
```

### Facilitator Backend (.env) - ⚠️ NOT CREATED YET
```bash
FACILITATOR_PRIVATE_KEY=0x...           # Hot wallet with 0.01+ ETH
FACILITATOR_MIN_BALANCE=0.001           # Alert threshold
WIKIPAY_CONTRACT=0x5748ebAAA22421DE872ed8B3be61fc1aC66F3e92
USDC_ADDRESS=0xaf88d065e77c8cC2239327C5EDb3A432268e5831
ARBITRUM_ONE_RPC=https://arb1.arbitrum.io/rpc
PORT=3005
```

## Quick Test Solution (Temporary)

To test the payment flow without building a full facilitator:

### 1. Create Mock Facilitator
```bash
# Create simple Express server that returns success
mkdir -p facilitator
cd facilitator
npm init -y
npm install express cors
```

### 2. Mock Server Code
```javascript
// facilitator/server.js
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

app.post('/api/verify-and-settle', async (req, res) => {
  console.log('Payment received:', req.body);

  // TODO: Actually submit transaction here
  // For now, return mock success
  res.json({
    success: true,
    transactionHash: '0x' + '1'.repeat(64),
    blockNumber: 12345
  });
});

app.listen(3005, () => {
  console.log('Mock facilitator running on http://localhost:3005');
});
```

### 3. Run Mock Server
```bash
node server.js
```

**WARNING**: This mock server doesn't actually unlock content on blockchain. It only lets you test the frontend flow.

## Testing Checklist

### Before Facilitator
- [x] Browse articles page loads
- [x] Articles display with previews
- [x] Prices show correctly
- [x] "Unlock Article" button appears

### After Facilitator
- [ ] Click "Unlock Article" opens payment dialog
- [ ] User can approve USDC authorization
- [ ] Payment submits to facilitator
- [ ] Transaction confirms on blockchain
- [ ] Content unlocks and displays
- [ ] Error handling works correctly

## Summary

**Current Status**:
- ✅ Smart contract deployed and working
- ✅ Article browsing fixed (ABI issue resolved)
- ✅ Publishing articles works
- ❌ Payment unlock needs facilitator backend

**To Enable Payments**:
1. Create facilitator backend service (or use Gelato Relay)
2. Generate and fund facilitator wallet
3. Implement `/api/verify-and-settle` endpoint
4. Update `NEXT_PUBLIC_FACILITATOR_URL` to point to facilitator
5. Test complete payment flow

**Estimated Time**:
- Quick mock facilitator: 30 minutes
- Production facilitator: 4-8 hours
- Gelato Relay integration: 2-4 hours

## References

- **Contract**: `0x5748ebAAA22421DE872ed8B3be61fc1aC66F3e92`
- **Network**: Arbitrum One (42161)
- **Protocol**: x402 (HTTP 402 Payment Required)
- **Facilitator Design**: `/docs/X402-FACILITATOR-DESIGN.md`
- **Implementation Guide**: `/docs/X402-IMPLEMENTATION.md`

---

**Next Action**: Choose implementation option and create facilitator backend.
