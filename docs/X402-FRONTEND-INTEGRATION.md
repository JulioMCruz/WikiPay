# WikiPay x402 Frontend Integration Guide

## Current Status

**Problem**: The frontend currently bypasses the x402 protocol by calling the smart contract directly.

**Location**: `/frontend/src/app/articles/[id]/page.tsx:122`

**Current Code**:
```typescript
const handleUnlock = async () => {
  // ❌ This bypasses x402 protocol - calls contract directly
  const result = await unlockArticle(BigInt(articleId), article.price);
}
```

## Required x402 Integration

### Step 1: Request Content (Get HTTP 402)

**Change**: Instead of calling `unlockArticle()`, call the API route first.

```typescript
const handleUnlock = async () => {
  try {
    setUnlocking(true);

    // Step 1: Request content (will get HTTP 402)
    const response = await fetch(`/api/articles/${articleId}`);

    if (response.status === 402) {
      // HTTP 402 Payment Required received
      const paymentDetails = await response.json();
      console.log("💳 Payment required:", paymentDetails);

      // Step 2: Create payment payload
      await processX402Payment(paymentDetails);
    } else if (response.ok) {
      // Already unlocked
      const data = await response.json();
      setFullContent(data.content.ipfsHash);
      setIsUnlocked(true);
    }
  } catch (error) {
    console.error("Error:", error);
  }
}
```

### Step 2: Create Payment Payload

```typescript
async function processX402Payment(paymentDetails: any) {
  // Generate ZK proof and nullifier
  const { nullifier, proof } = await generateZkProof(BigInt(articleId));

  // Get user wallet
  const walletClient = await getWalletClient();
  const [account] = await walletClient.getAddresses();

  // Set validity window (1 hour)
  const validAfter = BigInt(Math.floor(Date.now() / 1000));
  const validBefore = validAfter + BigInt(3600);
  const nonce = nullifier; // Use nullifier as unique nonce

  // Generate EIP-3009 USDC authorization signature
  const { v, r, s } = await generateTransferAuthorization(
    account,
    paymentDetails.payment.creator,
    BigInt(paymentDetails.payment.price),
    validAfter,
    validBefore,
    nonce
  );

  // Create payment payload
  const paymentPayload = {
    articleId: Number(articleId),
    nullifier,
    proof,
    from: account,
    validAfter: Number(validAfter),
    validBefore: Number(validBefore),
    nonce,
    v, r, s
  };

  // Step 3: Retry request with X-PAYMENT header
  await retryWithPayment(paymentPayload);
}
```

### Step 3: Retry with X-PAYMENT Header

```typescript
async function retryWithPayment(paymentPayload: any) {
  // Retry request with payment in X-PAYMENT header
  const response = await fetch(`/api/articles/${articleId}`, {
    method: 'GET',
    headers: {
      'X-PAYMENT': JSON.stringify(paymentPayload)
    }
  });

  if (response.status === 200) {
    // Payment verified, content returned
    const data = await response.json();

    console.log("✅ Payment verified!");
    console.log("Transaction:", data.payment.transactionHash);

    // Decrypt content using nullifier
    const decryptedContent = await decryptContent(
      data.content.ipfsHash,
      paymentPayload.nullifier
    );

    setFullContent(decryptedContent);
    setIsUnlocked(true);
    setUnlockResult({
      transactionHash: data.payment.transactionHash,
      blockNumber: data.payment.blockNumber,
      gasUsed: 0 // User didn't pay gas
    });
    setShowSuccessDialog(true);

  } else if (response.status === 402) {
    // Payment verification failed
    const error = await response.json();
    throw new Error(error.details || "Payment verification failed");
  }
}
```

## Complete Updated Component

**File**: `/frontend/src/app/articles/[id]/page.tsx`

Replace the `handleUnlock` function (lines 115-165) with:

```typescript
const handleUnlock = async () => {
  if (!article) return;

  try {
    setUnlocking(true);

    // x402 Step 1: Request content (will get HTTP 402)
    console.log("🔓 Starting x402 payment flow...");
    const initialResponse = await fetch(`/api/articles/${articleId}`);

    if (initialResponse.status !== 402) {
      throw new Error("Expected HTTP 402 Payment Required");
    }

    const paymentDetails = await initialResponse.json();
    console.log("💳 Payment details received:", paymentDetails);

    // x402 Step 2: Create payment payload with EIP-3009 signature
    console.log("📝 Generating ZK proof and USDC authorization...");

    const { nullifier, proof } = await generateZkProof(BigInt(articleId));
    const walletClient = await getWalletClient();
    const [account] = await walletClient.getAddresses();

    const validAfter = BigInt(Math.floor(Date.now() / 1000));
    const validBefore = validAfter + BigInt(3600); // 1 hour validity
    const nonce = nullifier;

    const { v, r, s } = await generateTransferAuthorization(
      account,
      paymentDetails.payment.creator as `0x${string}`,
      BigInt(paymentDetails.payment.price),
      validAfter,
      validBefore,
      nonce
    );

    const paymentPayload = {
      articleId: Number(articleId),
      nullifier,
      proof,
      from: account,
      validAfter: Number(validAfter),
      validBefore: Number(validBefore),
      nonce,
      v, r, s
    };

    // x402 Step 3: Retry request with X-PAYMENT header
    console.log("🚀 Sending payment to facilitator...");

    const paymentResponse = await fetch(`/api/articles/${articleId}`, {
      method: 'GET',
      headers: {
        'X-PAYMENT': JSON.stringify(paymentPayload),
        'Content-Type': 'application/json'
      }
    });

    if (!paymentResponse.ok) {
      const error = await paymentResponse.json();
      throw new Error(error.details || error.error || "Payment failed");
    }

    // x402 Step 4: Content delivered after payment verification
    const data = await paymentResponse.json();

    console.log("✅ Payment verified by facilitator!");
    console.log("Transaction:", data.payment.transactionHash);

    // Decrypt content from IPFS
    const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${data.content.ipfsHash}`;
    const ipfsResponse = await fetch(ipfsUrl);

    if (!ipfsResponse.ok) {
      throw new Error(`Failed to fetch IPFS content: ${ipfsResponse.statusText}`);
    }

    const ipfsData = await ipfsResponse.json();

    let content = "";
    if (ipfsData.encrypted && ipfsData.iv && ipfsData.encryptionKey) {
      console.log("🔓 Decrypting content...");
      content = await simpleDecrypt(ipfsData.encrypted, ipfsData.iv, ipfsData.encryptionKey);
    } else {
      content = ipfsData.content || ipfsData.fullContent || "";
    }

    setUnlockResult({
      transactionHash: data.payment.transactionHash,
      blockNumber: data.payment.blockNumber,
      gasUsed: 0 // Facilitator paid gas, not user
    });
    setFullContent(content);
    setIsUnlocked(true);
    setShowSuccessDialog(true);

    await loadArticle();

  } catch (err: any) {
    console.error("❌ x402 payment error:", err);
    setError(err.message || "Failed to unlock article");
    setShowErrorDialog(true);
  } finally {
    setUnlocking(false);
  }
};
```

## Additional Required Imports

Add to top of file:

```typescript
import { generateZkProof, generateTransferAuthorization } from "@/lib/contract";
```

## Price Display Changes

**Current**: Displays price in ETH (line 231, 289, 305)

**Required**: Display price in USDC

```typescript
// OLD
<Badge variant="secondary" className="text-lg px-4 py-2">
  {formatEther(article.price)} ETH
</Badge>

// NEW (add helper function)
const formatUSDC = (amount: bigint) => {
  return `$${(Number(amount) / 1_000_000).toFixed(2)}`;
};

<Badge variant="secondary" className="text-lg px-4 py-2">
  {formatUSDC(article.price)} USDC
</Badge>
```

**Update all price displays**:
- Line 231: Card header
- Line 289: Unlock description
- Line 305: Unlock button text

## Explorer Links

**Current**: Uses Arbitrum Sepolia (line 357)

**Required**: Use Arbitrum One mainnet

```typescript
// OLD
href={`https://sepolia.arbiscan.io/tx/${unlockResult.transactionHash}`}

// NEW
href={`https://arbiscan.io/tx/${unlockResult.transactionHash}`}
```

## Summary of Changes

### Files to Update:
1. ✅ `/frontend/src/app/articles/[id]/page.tsx` - Add x402 payment flow
2. ✅ `/frontend/src/lib/contract.ts` - Already has `generateTransferAuthorization()`
3. ✅ `/frontend/src/app/api/articles/[id]/route.ts` - Already x402 compliant

### Key Changes:
- Replace direct `unlockArticle()` call with x402 API flow
- Add HTTP 402 detection and payment payload creation
- Add X-PAYMENT header to retry request
- Change price display from ETH → USDC
- Update explorer links from Sepolia → Arbitrum One
- Remove gas cost display (facilitator pays gas)

### Benefits:
- ✅ Users don't need ETH for gas (only USDC for payment)
- ✅ Gasless transactions via EIP-3009
- ✅ x402 protocol compliant
- ✅ Facilitator handles blockchain complexity
- ✅ Anonymous payments via ZK nullifiers

## Testing Checklist

- [ ] Request article without payment → Get HTTP 402
- [ ] Payment payload generated with EIP-3009 signature
- [ ] X-PAYMENT header sent to API
- [ ] API calls facilitator at `http://localhost:3005`
- [ ] Facilitator verifies and submits transaction
- [ ] Content returned after payment verification
- [ ] Price displayed in USDC, not ETH
- [ ] Explorer links point to Arbitrum One mainnet
- [ ] No gas fees shown (facilitator paid)

---

**Next Step**: Update the frontend component to use the x402 API flow instead of direct contract calls.
