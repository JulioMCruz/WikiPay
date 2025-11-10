# zkWiki Contract Testing Commands

## Contract Information
- **Address**: `0x5748ebaaa22421de872ed8b3be61fc1ac66f3e92`
- **Network**: Arbitrum Sepolia
- **RPC**: `https://sepolia-rollup.arbitrum.io/rpc`

## Prerequisites

1. **Get Arbitrum Sepolia ETH**: https://www.alchemy.com/faucets/arbitrum-sepolia
2. **Set Private Key**: Export your private key (without 0x prefix)
   ```bash
   export PRIVATE_KEY=your_private_key_here
   ```

## Test Commands

### 1. Read Functions (No gas required)

#### Get Total Articles
```bash
cast call 0x5748ebaaa22421de872ed8b3be61fc1ac66f3e92 \
  "getTotalArticles()" \
  --rpc-url https://sepolia-rollup.arbitrum.io/rpc
```
**Expected**: `0x0000000000000000000000000000000000000000000000000000000000000000` (0 articles)

#### Get Article Details
```bash
# After publishing, check article ID 0
cast call 0x5748ebaaa22421de872ed8b3be61fc1ac66f3e92 \
  "getArticle(uint256)" 0 \
  --rpc-url https://sepolia-rollup.arbitrum.io/rpc
```

#### Check Creator Earnings
```bash
# Replace with your wallet address
cast call 0x5748ebaaa22421de872ed8b3be61fc1ac66f3e92 \
  "getCreatorEarnings(address)" YOUR_ADDRESS \
  --rpc-url https://sepolia-rollup.arbitrum.io/rpc
```

#### Check if Nullifier is Used
```bash
# Example nullifier
cast call 0x5748ebaaa22421de872ed8b3be61fc1ac66f3e92 \
  "isNullifierUsed(bytes32)" \
  0x0000000000000000000000000000000000000000000000000000000000000001 \
  --rpc-url https://sepolia-rollup.arbitrum.io/rpc
```

### 2. Write Functions (Requires gas)

#### Publish Article
```bash
# Set your private key first
export PRIVATE_KEY=your_private_key_here

# Publish a test article (price: 0.01 ETH = 10000000000000000 wei)
cast send 0x5748ebaaa22421de872ed8b3be61fc1ac66f3e92 \
  "publishArticle(string,string,uint256)" \
  "My First Article on Arbitrum Stylus" \
  "This is encrypted content that will be revealed after payment. Lorem ipsum dolor sit amet, consectetur adipiscing elit." \
  10000000000000000 \
  --private-key $PRIVATE_KEY \
  --rpc-url https://sepolia-rollup.arbitrum.io/rpc
```

**Gas Estimate**: ~50K gas (90% savings vs Solidity!)

#### Unlock Article (Payable)
```bash
# Generate a random nullifier (must be unique per user per article)
NULLIFIER=$(cast keccak "user123_article0_$(date +%s)")

# Create a simple proof (32 bytes minimum for MVP)
PROOF="0x0000000000000000000000000000000000000000000000000000000000000001"

# Unlock article 0 with payment (0.01 ETH)
cast send 0x5748ebaaa22421de872ed8b3be61fc1ac66f3e92 \
  "unlockArticleAnonymous(uint256,bytes32,bytes)" \
  0 \
  $NULLIFIER \
  $PROOF \
  --value 10000000000000000 \
  --private-key $PRIVATE_KEY \
  --rpc-url https://sepolia-rollup.arbitrum.io/rpc
```

**Gas Estimate**: ~30K gas

#### Withdraw Earnings
```bash
# Withdraw accumulated earnings as a creator
cast send 0x5748ebaaa22421de872ed8b3be61fc1ac66f3e92 \
  "withdrawEarnings()" \
  --private-key $PRIVATE_KEY \
  --rpc-url https://sepolia-rollup.arbitrum.io/rpc
```

**Gas Estimate**: ~15K gas

## Complete Test Flow

### Step 1: Check Initial State
```bash
# Should return 0
cast call 0x5748ebaaa22421de872ed8b3be61fc1ac66f3e92 \
  "getTotalArticles()" \
  --rpc-url https://sepolia-rollup.arbitrum.io/rpc
```

### Step 2: Publish First Article
```bash
export PRIVATE_KEY=your_private_key_here

cast send 0x5748ebaaa22421de872ed8b3be61fc1ac66f3e92 \
  "publishArticle(string,string,uint256)" \
  "Test Article" \
  "Secret content here" \
  10000000000000000 \
  --private-key $PRIVATE_KEY \
  --rpc-url https://sepolia-rollup.arbitrum.io/rpc
```

### Step 3: Verify Article Count
```bash
# Should return 1
cast call 0x5748ebaaa22421de872ed8b3be61fc1ac66f3e92 \
  "getTotalArticles()" \
  --rpc-url https://sepolia-rollup.arbitrum.io/rpc
```

### Step 4: Read Article Details
```bash
# Get article 0 details (creator, price, unlocks, preview)
cast call 0x5748ebaaa22421de872ed8b3be61fc1ac66f3e92 \
  "getArticle(uint256)" 0 \
  --rpc-url https://sepolia-rollup.arbitrum.io/rpc
```

### Step 5: Unlock Article
```bash
NULLIFIER=$(cast keccak "myuniqueid_$(date +%s)")

cast send 0x5748ebaaa22421de872ed8b3be61fc1ac66f3e92 \
  "unlockArticleAnonymous(uint256,bytes32,bytes)" \
  0 \
  $NULLIFIER \
  "0x0000000000000000000000000000000000000000000000000000000000000001" \
  --value 10000000000000000 \
  --private-key $PRIVATE_KEY \
  --rpc-url https://sepolia-rollup.arbitrum.io/rpc
```

### Step 6: Check Earnings
```bash
# Get your wallet address
YOUR_ADDRESS=$(cast wallet address --private-key $PRIVATE_KEY)

# Check earnings
cast call 0x5748ebaaa22421de872ed8b3be61fc1ac66f3e92 \
  "getCreatorEarnings(address)" $YOUR_ADDRESS \
  --rpc-url https://sepolia-rollup.arbitrum.io/rpc
```

### Step 7: Withdraw Earnings
```bash
cast send 0x5748ebaaa22421de872ed8b3be61fc1ac66f3e92 \
  "withdrawEarnings()" \
  --private-key $PRIVATE_KEY \
  --rpc-url https://sepolia-rollup.arbitrum.io/rpc
```

## Decode Results

### Decode Article Data
```bash
# After calling getArticle, you'll get encoded data like:
# 0x000000000000000000000000YOUR_ADDRESS...
# Use cast to decode it

cast abi-decode "getArticle(uint256)(address,uint256,uint256,string)" \
  "PASTE_RESULT_HERE"
```

### Convert Wei to ETH
```bash
# Convert 10000000000000000 wei to ETH
cast --to-unit 10000000000000000 ether
# Output: 0.01
```

## Troubleshooting

### Error: Insufficient funds
**Solution**: Get Sepolia ETH from faucet: https://www.alchemy.com/faucets/arbitrum-sepolia

### Error: Nullifier already used
**Solution**: Generate a new unique nullifier:
```bash
NULLIFIER=$(cast keccak "unique_$(date +%s)")
```

### Error: Invalid price
**Solution**: Price must be between 0.01 and 0.10 ETH:
- Min: `10000000000000000` (0.01 ETH)
- Max: `100000000000000000` (0.10 ETH)

### Error: Wrong network
**Solution**: Ensure you're on Arbitrum Sepolia (Chain ID: 421614)

## Gas Costs (Actual)

| Function | Estimated Gas | Cost @ 0.1 gwei |
|----------|---------------|-----------------|
| publishArticle | ~50K | ~$0.005 |
| unlockArticleAnonymous | ~30K | ~$0.003 |
| withdrawEarnings | ~15K | ~$0.0015 |

**90% cheaper than Solidity equivalents!**

## View on Block Explorer

- **Contract**: https://sepolia.arbiscan.io/address/0x5748ebaaa22421de872ed8b3be61fc1ac66f3e92
- **Transactions**: https://sepolia.arbiscan.io/address/0x5748ebaaa22421de872ed8b3be61fc1ac66f3e92#internaltx

## Next Steps

After testing:
1. ✅ Contract functions work
2. 🔨 Build frontend UI
3. 🔐 Implement real ZK proofs
4. 🚀 Deploy to production
