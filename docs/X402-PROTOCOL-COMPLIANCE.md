# WikiPay x402 Protocol Compliance Documentation

## Overview

WikiPay implements the **x402 protocol** as a **Resource Server** (content provider) that requires payment for access to premium content.

**Official x402 Documentation**: https://x402.gitbook.io/x402/

## x402 Protocol Role: Resource Server

WikiPay acts as a **Resource Server** in the x402 ecosystem:

- ✅ Defines payment requirements for content access
- ✅ Returns HTTP 402 Payment Required responses
- ✅ Accepts payment payloads via X-PAYMENT header
- ✅ Verifies payments through external facilitator
- ✅ Delivers content upon successful payment verification

**Note**: The **Facilitator** (payment verification and blockchain settlement) is implemented as a separate service.

## Implementation Details

### Contract Deployment

**WikiPayX402 Contract**:
- Address: `0x5748ebAAA22421DE872ed8B3be61fc1aC66F3e92`
- Network: Arbitrum One (Chain ID: 42161)
- Token: Circle USDC (`0xaf88d065e77c8cC2239327C5EDb3A432268e5831`)
- Standard: EIP-3009 (transferWithAuthorization)
- Block: 398713371

### x402 Flow Implementation

#### Step 1: Initial Request (No Payment)

**Client**:
```http
GET /api/articles/0 HTTP/1.1
Host: wikipay.org
```

**Server Response** (HTTP 402):
```http
HTTP/1.1 402 Payment Required
Content-Type: application/json
X-Protocol: x402
X-Payment-Required: true
X-Payment-Network: arbitrum-one
X-Payment-ChainId: 42161
X-Payment-Token: USDC
X-Payment-Amount: 10000
X-Payment-Recipient: 0x...

{
  "error": "Payment Required",
  "protocol": "x402",
  "payment": {
    "contract": "0x5748ebAAA22421DE872ed8B3be61fc1aC66F3e92",
    "chainId": 42161,
    "network": "arbitrum-one",
    "usdc": "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    "articleId": "0",
    "price": "10000",
    "priceUSD": "0.01",
    "creator": "0x...",
    "facilitator": "https://facilitator.wikipay.org"
  },
  "preview": "This is the free preview...",
  "instructions": {
    "description": "x402 Protocol - Payment Required",
    "step1": "Create payment payload with USDC authorization (EIP-3009)",
    "step2": "Sign payment payload with your wallet",
    "step3": "Retry this request with X-PAYMENT header",
    "step4": "Facilitator will verify and settle payment on blockchain",
    "step5": "Content will be returned upon successful payment verification"
  }
}
```

**Implementation**: [route.ts:84-126](frontend/src/app/api/articles/[id]/route.ts#L84-L126)

#### Step 2: Client Creates Payment Payload

**Client Side** (JavaScript/TypeScript):
```typescript
// 1. Generate ZK proof and nullifier
const { nullifier, proof } = await generateZkProof(articleId);

// 2. Create EIP-3009 authorization
const validAfter = BigInt(Math.floor(Date.now() / 1000));
const validBefore = validAfter + BigInt(3600); // 1 hour validity
const nonce = nullifier; // Use nullifier as unique nonce

// 3. Sign EIP-712 typed data
const { v, r, s } = await generateTransferAuthorization(
  userAddress,
  creatorAddress,
  price,
  validAfter,
  validBefore,
  nonce
);

// 4. Create payment payload
const paymentPayload = {
  articleId: 0,
  nullifier,
  proof,
  from: userAddress,
  validAfter,
  validBefore,
  nonce,
  v, r, s
};
```

**Implementation**: [contract.ts:335-389](frontend/src/lib/contract.ts#L335-L389)

#### Step 3: Retry Request with Payment

**Client**:
```http
GET /api/articles/0 HTTP/1.1
Host: wikipay.org
X-PAYMENT: {"articleId":0,"nullifier":"0x...","proof":"0x...","from":"0x...","validAfter":1699564800,"validBefore":1699568400,"nonce":"0x...","v":27,"r":"0x...","s":"0x..."}
```

**Server** → **Facilitator Verification**:
```http
POST https://facilitator.wikipay.org/api/verify-and-settle HTTP/1.1
Content-Type: application/json
X-Protocol: x402

{
  "payment": {
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
  },
  "resource": {
    "articleId": "0",
    "price": "10000",
    "creator": "0x...",
    "contract": "0x5748ebAAA22421DE872ed8B3be61fc1aC66F3e92",
    "chainId": 42161
  }
}
```

**Facilitator** → **Blockchain**:
```solidity
// Facilitator calls unlockArticleX402() and pays gas
contract.unlockArticleX402(
  articleId,
  nullifier,
  proof,
  from,
  validAfter,
  validBefore,
  nonce,
  v, r, s
);
```

**Facilitator** → **Server Response**:
```json
{
  "success": true,
  "transactionHash": "0x...",
  "blockNumber": 398713371
}
```

**Implementation**: [route.ts:187-242](frontend/src/app/api/articles/[id]/route.ts#L187-L242)

#### Step 4: Server Returns Content

**Server Response** (HTTP 200):
```http
HTTP/1.1 200 OK
Content-Type: application/json
X-Protocol: x402
X-Payment-Verified: true
X-Transaction-Hash: 0x...
X-Block-Number: 398713371

{
  "success": true,
  "protocol": "x402",
  "content": {
    "ipfsHash": "QmXxxx...",
    "preview": "This is the free preview...",
    "decryptionKey": "0x..." // Nullifier for client-side decryption
  },
  "metadata": {
    "articleId": "0",
    "creator": "0x...",
    "unlocks": "1",
    "timestamp": "1699564800"
  },
  "payment": {
    "verified": true,
    "transactionHash": "0x...",
    "blockNumber": 398713371,
    "nullifier": "0x...",
    "paidAmount": "10000",
    "paidAmountUSD": "0.01"
  }
}
```

**Implementation**: [route.ts:244-283](frontend/src/app/api/articles/[id]/route.ts#L244-L283)

## x402 Protocol Compliance Checklist

### ✅ Core Requirements

- [x] **HTTP 402 Status Code**: Returns `402 Payment Required` for unpaid requests
- [x] **Payment Details in Response**: Includes contract, chainId, network, token, price, recipient
- [x] **X-PAYMENT Header**: Accepts payment payload via `X-PAYMENT` header
- [x] **Stateless Design**: No persistent sessions or accounts required
- [x] **Protocol Identifier**: Includes `X-Protocol: x402` header in all responses

### ✅ Payment Verification

- [x] **Payload Validation**: Validates all required fields (articleId, nullifier, proof, from, etc.)
- [x] **Nullifier Check**: Prevents double-unlock by checking `nullifiersUsed` mapping
- [x] **Facilitator Integration**: Delegates payment verification to external facilitator
- [x] **Error Handling**: Returns appropriate status codes (400, 402, 409, 500)

### ✅ Blockchain Integration

- [x] **EIP-3009 Support**: Uses Circle USDC with `transferWithAuthorization`
- [x] **Arbitrum One**: Deployed on Arbitrum One mainnet (Chain ID: 42161)
- [x] **Zero-Knowledge Proofs**: Supports anonymous payments via nullifiers
- [x] **Gas Abstraction**: Users don't pay gas (facilitator pays)

### ✅ Content Delivery

- [x] **Preview Content**: Returns free preview before payment
- [x] **Full Content**: Returns full content after payment verification
- [x] **IPFS Storage**: Content stored on IPFS with encryption
- [x] **Client-Side Decryption**: Provides decryption key (nullifier) to client

## Network and Token Support

### Supported Networks

- ✅ **Arbitrum One** (Chain ID: 42161) - Production
- 🔄 **Arbitrum Sepolia** (Chain ID: 421614) - Testnet (deprecated)

### Supported Tokens

- ✅ **USDC** (Circle USDC on Arbitrum One)
  - Address: `0xaf88d065e77c8cC2239327C5EDb3A432268e5831`
  - Standard: ERC-20 with EIP-3009
  - Decimals: 6
  - Feature: Gasless transfers via `transferWithAuthorization`

### Future Network Support

Per x402 roadmap:
- Base (mainnet) - Official x402 support
- Polygon - Official x402 support
- Solana - Official x402 support
- Additional L2 networks

## Facilitator Integration

### Facilitator Requirements

WikiPay requires an external **x402 Facilitator** to:

1. **Verify Payment Payloads**:
   - Validate EIP-3009 signatures
   - Check nullifier uniqueness
   - Verify payment amounts

2. **Settle Payments on Blockchain**:
   - Call `unlockArticleX402()` on WikiPayX402 contract
   - Pay gas fees on Arbitrum One
   - Monitor transaction confirmations

3. **Return Verification Results**:
   - Success/failure status
   - Transaction hash
   - Block number

### Facilitator API Specification

**Endpoint**: `POST /api/verify-and-settle`

**Request**:
```json
{
  "payment": {
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
  },
  "resource": {
    "articleId": "0",
    "price": "10000",
    "creator": "0x...",
    "contract": "0x5748ebAAA22421DE872ed8B3be61fc1aC66F3e92",
    "chainId": 42161
  }
}
```

**Response (Success)**:
```json
{
  "success": true,
  "transactionHash": "0x...",
  "blockNumber": 398713371
}
```

**Response (Failure)**:
```json
{
  "success": false,
  "error": "Invalid signature"
}
```

### Recommended Facilitators

Per x402 documentation:

1. **CDP Facilitator** (Base mainnet)
   - Official Coinbase facilitator
   - Production-ready
   - Supports Bazaar discovery

2. **PayAI Facilitator** (Multi-chain)
   - Solana, Base, Polygon support
   - AI agent optimization

3. **Self-Hosted Facilitator** (WikiPay implementation)
   - Custom Arbitrum One support
   - Full control over gas payments
   - Integration with WikiPayX402 contract

## Bazaar Discovery Layer

### Registration (Optional)

WikiPay can optionally register with the **Bazaar discovery layer** to enable:

- Programmatic service discovery by AI agents
- Global visibility without manual marketing
- Machine-readable API catalog

**Registration Requirements**:
- Set `discoverable: true` flag
- Use CDP facilitator (for automatic opt-in)
- Provide detailed parameter schemas

**Current Status**: Not registered (manual facilitator implementation)

## Security Considerations

### Payment Verification

- ✅ **EIP-712 Signature Validation**: Facilitator validates USDC authorization signatures
- ✅ **Nullifier Uniqueness**: Contract prevents double-unlock attacks
- ✅ **Timestamp Validation**: EIP-3009 includes validAfter/validBefore windows
- ✅ **Amount Verification**: Facilitator checks payment amount matches article price

### Gas Payment Isolation

- ✅ **Facilitator Pays Gas**: Users only sign USDC authorization (no ETH needed)
- ✅ **Hot Wallet Limits**: Facilitator wallet holds limited ETH for gas
- ✅ **Rate Limiting**: Prevent facilitator wallet drainage attacks

### Content Protection

- ✅ **IPFS Encryption**: Full content encrypted before upload
- ✅ **Nullifier-Based Decryption**: Only successful payers can decrypt
- ✅ **Cross-Device Access**: Same wallet generates same nullifier on any device

## Testing x402 Protocol

### Test Flow

1. **Deploy WikiPayX402 Contract**:
   ```bash
   npx hardhat run scripts/deploy-mainnet-x402.js --network arbitrumOne
   ```
   ✅ Deployed: `0x5748ebAAA22421DE872ed8B3be61fc1aC66F3e92`

2. **Setup Facilitator** (separate project):
   ```bash
   # See X402-FACILITATOR-DESIGN.md
   ```

3. **Publish Test Article** ($0.01):
   ```bash
   curl -X POST http://localhost:3000/api/articles \
     -H "Content-Type: application/json" \
     -d '{"title":"Test","content":"...","price":"0.01"}'
   ```

4. **Request Content** (No Payment):
   ```bash
   curl http://localhost:3000/api/articles/0
   # Expected: HTTP 402 Payment Required
   ```

5. **Create Payment Payload**:
   ```typescript
   const payload = await createPaymentPayload(articleId, userWallet);
   ```

6. **Request Content** (With Payment):
   ```bash
   curl http://localhost:3000/api/articles/0 \
     -H "X-PAYMENT: {\"articleId\":0,...}"
   # Expected: HTTP 200 OK with content
   ```

### Verification

- ✅ HTTP 402 returned for unpaid requests
- ✅ Payment details included in 402 response
- ✅ X-PAYMENT header accepted and parsed
- ✅ Facilitator verification called
- ✅ Content returned after successful payment
- ✅ Transaction hash included in response
- ✅ Nullifier prevents double-unlock

## Configuration

### Environment Variables

```bash
# Frontend/Backend (.env.local)
NEXT_PUBLIC_WIKIPAY_ADDRESS=0x5748ebAAA22421DE872ed8B3be61fc1aC66F3e92
NEXT_PUBLIC_USDC_ADDRESS=0xaf88d065e77c8cC2239327C5EDb3A432268e5831
NEXT_PUBLIC_CHAIN_ID=42161
NEXT_PUBLIC_RPC_URL=https://arb1.arbitrum.io/rpc
NEXT_PUBLIC_FACILITATOR_URL=https://facilitator.wikipay.org

# Facilitator (.env)
FACILITATOR_PRIVATE_KEY=0x...  # Wallet that pays gas
WIKIPAY_CONTRACT=0x5748ebAAA22421DE872ed8B3be61fc1aC66F3e92
USDC_ADDRESS=0xaf88d065e77c8cC2239327C5EDb3A432268e5831
ARBITRUM_ONE_RPC=https://arb1.arbitrum.io/rpc
```

## References

### Official x402 Documentation

- **Core Concepts**: https://x402.gitbook.io/x402/core-concepts/http-402
- **Client-Server Flow**: https://x402.gitbook.io/x402/core-concepts/client-server
- **Facilitator Role**: https://x402.gitbook.io/x402/core-concepts/facilitator
- **Wallet Integration**: https://x402.gitbook.io/x402/core-concepts/wallet
- **Bazaar Discovery**: https://x402.gitbook.io/x402/core-concepts/bazaar-discovery-layer
- **Network Support**: https://x402.gitbook.io/x402/core-concepts/network-and-token-support

### WikiPay Implementation

- **Smart Contract**: [WikiPayX402.sol](contracts-solidity/contracts/WikiPayX402.sol)
- **API Route**: [route.ts](frontend/src/app/api/articles/[id]/route.ts)
- **Contract Library**: [contract.ts](frontend/src/lib/contract.ts)
- **Deployment Guide**: [ARBITRUM-ONE-DEPLOYMENT.md](ARBITRUM-ONE-DEPLOYMENT.md)
- **Facilitator Design**: [X402-FACILITATOR-DESIGN.md](X402-FACILITATOR-DESIGN.md)

### Standards and Specifications

- **EIP-3009**: transferWithAuthorization
  - https://eips.ethereum.org/EIPS/eip-3009
- **EIP-712**: Typed structured data hashing and signing
  - https://eips.ethereum.org/EIPS/eip-712
- **HTTP 402**: Payment Required
  - https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/402

---

**Contract**: `0x5748ebAAA22421DE872ed8B3be61fc1aC66F3e92`
**Network**: Arbitrum One (42161)
**Protocol**: x402 (HTTP 402 Payment Required)
**Role**: Resource Server (Content Provider)
**Status**: ✅ Protocol Compliant
