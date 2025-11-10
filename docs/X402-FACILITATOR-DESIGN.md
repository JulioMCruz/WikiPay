# zkWiki x402 Facilitator Design

## Overview

The **zkWiki x402 Facilitator** is a backend service that processes HTTP 402 payment requests by submitting gasless USDC transactions to Arbitrum One on behalf of users.

## Architecture

```
┌─────────────┐           ┌──────────────────┐           ┌─────────────────┐
│   Browser   │  HTTP 402 │  zkWiki x402    │  Submit   │  Arbitrum One   │
│   (User)    │  ────────▶│   Facilitator    │  ────────▶│   (Blockchain)  │
│             │  Request  │   (Backend)      │   Tx      │                 │
└─────────────┘           └──────────────────┘           └─────────────────┘
      │                           │                              │
      │ 1. Request content        │                              │
      │ ◀─────────────────────────│ HTTP 402 Payment Required    │
      │                           │                              │
      │ 2. Sign USDC auth         │                              │
      │    (off-chain)            │                              │
      │ ──────────────────────────▶                              │
      │    POST /api/x402/unlock  │                              │
      │                           │ 3. Call unlockArticleX402()  │
      │                           │ ─────────────────────────────▶
      │                           │    (Facilitator pays gas)    │
      │                           │                              │
      │                           │ ◀─────────────────────────────
      │                           │    Transaction confirmed     │
      │ ◀─────────────────────────│                              │
      │    HTTP 200 OK            │                              │
      │    Content delivered      │                              │
```

## Component: zkWiki x402 Facilitator

### Identity
**Name**: zkWiki x402 Facilitator
**Type**: Backend API Service
**Protocol**: HTTP 402 Payment Required
**Blockchain**: Arbitrum One (Chain ID: 42161)
**Contract**: `0x5748ebAAA22421DE872ed8B3be61fc1aC66F3e92` (zkWikiX402)

### Responsibilities

1. **HTTP 402 Response Generation**
   - Return `402 Payment Required` status for paywalled content
   - Include `WWW-Authenticate: x402` headers with payment details
   - Provide payment instruction JSON

2. **Payment Authorization Validation**
   - Verify EIP-3009 USDC authorization signatures
   - Check nullifier uniqueness (prevent double-unlock)
   - Validate signature parameters (v, r, s)

3. **Gas Payment (Core Facilitator Role)**
   - Maintain funded wallet with ETH for Arbitrum gas
   - Submit `unlockArticleX402()` transactions on behalf of users
   - Pay gas fees (user only signs USDC authorization)

4. **Transaction Monitoring**
   - Monitor transaction confirmations
   - Handle reorgs and failed transactions
   - Retry logic for network issues

5. **Content Delivery**
   - Decrypt content from IPFS after payment confirmation
   - Return full content with `HTTP 200 OK`
   - Update unlock status

## Implementation Details

### API Endpoints

#### `GET /api/articles/:id`
**Purpose**: Request content, receive 402 if payment required

**Response (Unpaid)**:
```http
HTTP/1.1 402 Payment Required
WWW-Authenticate: x402 contract="0x5748ebAAA22421DE872ed8B3be61fc1aC66F3e92"
                       chain="42161"
                       usdc="0xaf88d065e77c8cC2239327C5EDb3A432268e5831"
                       price="10000"
Content-Type: application/json

{
  "error": "Payment Required",
  "protocol": "x402",
  "payment": {
    "contract": "0x5748ebAAA22421DE872ed8B3be61fc1aC66F3e92",
    "chainId": 42161,
    "usdc": "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    "articleId": 0,
    "price": "10000",
    "priceUSD": "0.01",
    "creator": "0x..."
  },
  "preview": "This is the free preview..."
}
```

#### `POST /api/x402/unlock`
**Purpose**: Submit USDC authorization, facilitator pays gas and unlocks content

**Request**:
```json
{
  "articleId": 0,
  "nullifier": "0x...",
  "proof": "0x...",
  "from": "0x...",
  "validAfter": 1699564800,
  "validBefore": 1699568400,
  "nonce": "0x...",
  "v": 27,
  "r": "0x...",
  "s": "0x..."
}
```

**Backend Process**:
```typescript
// 1. Validate signature
const isValid = await validateEIP3009Signature(payload);
if (!isValid) return { error: "Invalid signature" };

// 2. Check nullifier
const isUsed = await contract.read.nullifiersUsed([payload.nullifier]);
if (isUsed) return { error: "Payment already processed" };

// 3. Submit transaction (FACILITATOR PAYS GAS)
const facilitatorWallet = process.env.FACILITATOR_PRIVATE_KEY;
const hash = await walletClient.writeContract({
  address: WIKIPAY_CONTRACT,
  abi: WIKIPAY_ABI,
  functionName: 'unlockArticleX402',
  args: [
    payload.articleId,
    payload.nullifier,
    payload.proof,
    payload.from,
    payload.validAfter,
    payload.validBefore,
    payload.nonce,
    payload.v,
    payload.r,
    payload.s
  ],
  account: facilitatorWallet // FACILITATOR PAYS GAS
});

// 4. Wait for confirmation
const receipt = await publicClient.waitForTransactionReceipt({ hash });

// 5. Return content
return {
  success: true,
  transactionHash: hash,
  content: decryptedContent
};
```

**Response (Success)**:
```http
HTTP/1.1 200 OK
Content-Type: application/json
X-Transaction-Hash: 0x...

{
  "success": true,
  "content": "Full article content...",
  "transactionHash": "0x...",
  "blockNumber": 398713371
}
```

### Facilitator Wallet Management

**Wallet Setup**:
```bash
# Generate facilitator wallet
npx hardhat run scripts/generate-facilitator-wallet.js

# Fund wallet with ETH for gas
# Recommended: 0.01 ETH (~10,000 transactions on Arbitrum)
```

**Environment Variables**:
```bash
# Backend .env
FACILITATOR_PRIVATE_KEY=0x...  # Wallet that pays gas
FACILITATOR_MIN_BALANCE=0.001  # Alert threshold
WIKIPAY_CONTRACT=0x5748ebAAA22421DE872ed8B3be61fc1aC66F3e92
USDC_ADDRESS=0xaf88d065e77c8cC2239327C5EDb3A432268e5831
ARBITRUM_ONE_RPC=https://arb1.arbitrum.io/rpc
```

**Gas Cost Estimation**:
- Arbitrum One average gas price: ~0.1 gwei
- `unlockArticleX402()` gas: ~150,000 gas
- Cost per transaction: ~0.000015 ETH (~$0.00004)
- 0.01 ETH = ~666 transactions
- 1 ETH = ~66,666 transactions

### Security Considerations

1. **Rate Limiting**
   - Limit unlock requests per IP/wallet
   - Prevent facilitator wallet drainage

2. **Signature Validation**
   - Verify EIP-712 signatures off-chain before submission
   - Check validAfter/validBefore timestamps

3. **Nullifier Verification**
   - Query contract to ensure nullifier not already used
   - Prevent double-unlock attacks

4. **Facilitator Wallet Protection**
   - Hot wallet with limited funds
   - Auto-refill from cold wallet when balance low
   - Monitoring and alerts

5. **Transaction Monitoring**
   - Monitor for failed transactions
   - Implement retry logic with exponential backoff
   - Alert on suspicious patterns

## Gas Economics

### Cost Analysis

**Arbitrum One (Mainnet)**:
- Base gas price: ~0.1 gwei
- Transaction gas: ~150,000
- Cost per unlock: ~$0.00004

**Monthly Volume Estimates**:
| Unlocks/Month | ETH Required | USD Cost (@ $2500/ETH) |
|---------------|--------------|------------------------|
| 100           | 0.0015       | $3.75                  |
| 1,000         | 0.015        | $37.50                 |
| 10,000        | 0.15         | $375.00                |
| 100,000       | 1.5          | $3,750.00              |

**Revenue Model**:
- Option 1: Add small fee to article price (e.g., $0.001 gas fee)
- Option 2: Creators pay facilitator fee (1-2% of price)
- Option 3: Subsidize gas as marketing cost

### Alternatives to Self-Hosted Facilitator

#### 1. Gelato Network
**Website**: https://www.gelato.network/relay

**Pros**:
- No wallet management
- Auto-scaling
- Pay per transaction

**Cons**:
- 3rd party dependency
- Higher cost (~$0.0002/tx)

#### 2. Biconomy
**Website**: https://www.biconomy.io/

**Pros**:
- Meta-transaction infrastructure
- Dashboard for monitoring

**Cons**:
- Complex integration
- Monthly fees

#### 3. OpenZeppelin Defender
**Website**: https://defender.openzeppelin.com/

**Pros**:
- Secure relayer infrastructure
- Automatic key rotation

**Cons**:
- Premium pricing
- Overkill for simple use case

**Recommendation**: Start with self-hosted zkWiki x402 Facilitator for cost and control, migrate to Gelato if volume exceeds 100K/month.

## Deployment Checklist

- [ ] Deploy zkWikiX402 contract (✅ Done: `0x5748ebAAA22421DE872ed8B3be61fc1aC66F3e92`)
- [ ] Generate facilitator wallet
- [ ] Fund facilitator wallet with 0.01 ETH
- [ ] Implement `/api/x402/unlock` endpoint
- [ ] Add EIP-3009 signature validation
- [ ] Implement nullifier checking
- [ ] Add rate limiting (10 requests/minute per IP)
- [ ] Setup monitoring and alerts
- [ ] Test complete x402 flow on mainnet
- [ ] Document API for frontend integration

## Next Steps

1. **Implement Backend API** (`/api/x402/unlock`)
2. **Generate Facilitator Wallet** (fund with 0.01 ETH)
3. **Update Frontend** to call facilitator API instead of direct contract
4. **Test x402 Flow** with $0.01 article
5. **Monitor Gas Usage** and optimize
6. **Scale** based on volume

---

**Contract**: `0x5748ebAAA22421DE872ed8B3be61fc1aC66F3e92`
**Network**: Arbitrum One (42161)
**Protocol**: HTTP 402 Payment Required (x402)
**Facilitator**: zkWiki Backend (pays gas for users)
