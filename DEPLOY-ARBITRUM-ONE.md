# Deploy WikiPayX402 to Arbitrum One Mainnet

## Contract Location
`contracts/solidity/WikiPayX402.sol`

## Deployment Steps Using Remix

### 1. Open Remix IDE
Go to: https://remix.ethereum.org/

### 2. Upload Contract
- Create new file: `WikiPayX402.sol`
- Copy the contract code from `contracts/solidity/WikiPayX402.sol`
- Paste into Remix

### 3. Compile Contract
- Click "Solidity Compiler" tab (left sidebar)
- Select compiler version: `0.8.20` or higher
- Click "Compile WikiPayX402.sol"
- Verify no errors

### 4. Connect Wallet to Arbitrum One
- Click "Deploy & Run Transactions" tab
- Environment: Select "Injected Provider - MetaMask"
- MetaMask will popup - connect your wallet
- **IMPORTANT**: Switch MetaMask to **Arbitrum One Mainnet**
  - Network Name: Arbitrum One
  - Chain ID: 42161
  - RPC URL: https://arb1.arbitrum.io/rpc
  - Currency Symbol: ETH
  - Block Explorer: https://arbiscan.io

### 5. Deploy Contract
- Contract: Select `WikiPayX402`
- Constructor Parameters:
  - `_usdcAddress`: `0xaf88d065e77c8cC2239327C5EDb3A432268e5831`
    (This is Circle USDC on Arbitrum One with EIP-3009 support)
- Click "Deploy"
- Confirm transaction in MetaMask
- **Gas cost**: ~$0.50-1.00 on Arbitrum One

### 6. Copy Contract Address
- After deployment, copy the contract address from Remix
- It will look like: `0x...` (42 characters)
- **Save this address!** You'll need it in the next step

---

## Alternative: Deploy Using Cast (CLI)

If you prefer command line:

```bash
# Deploy contract
cast send --create \
  $(cat contracts/solidity/WikiPayX402.sol | solc --bin - | tail -1) \
  "constructor(address)" \
  "0xaf88d065e77c8cC2239327C5EDb3A432268e5831" \
  --private-key <YOUR_PRIVATE_KEY> \
  --rpc-url https://arb1.arbitrum.io/rpc
```

---

## After Deployment

### Update Environment Variables

Edit `frontend/.env.local`:

```bash
# Replace OLD contract address with NEW contract address
NEXT_PUBLIC_WIKIPAY_ADDRESS=<NEW_CONTRACT_ADDRESS_FROM_REMIX>
```

### Verify on Arbiscan

1. Go to: https://arbiscan.io/address/<YOUR_CONTRACT_ADDRESS>
2. Click "Contract" tab
3. Click "Verify and Publish"
4. Enter contract details:
   - Compiler: 0.8.20
   - License: MIT
   - Paste contract source code
5. Verify contract

---

## Contract Details

**Network**: Arbitrum One Mainnet
**Chain ID**: 42161
**USDC Address**: 0xaf88d065e77c8cC2239327C5EDb3A432268e5831
**Explorer**: https://arbiscan.io

**Contract Functions**:
- `publishArticle(ipfsHash, preview, price)` - Publish new article
- `getArticle(articleId)` - Get article data
- `getTotalArticles()` - Get total articles count
- `unlockArticleX402(...)` - Unlock article via x402 facilitator
- `nullifiersUsed(nullifier)` - Check if nullifier already used
- `getUSDCAddress()` - Get USDC contract address

**Key Features**:
- ✅ Stores article metadata on-chain
- ✅ Content encrypted and stored on IPFS (Pinata)
- ✅ Zero-knowledge nullifiers prevent double-spend
- ✅ x402 protocol compatible
- ✅ USDC payments handled by facilitator
- ✅ Access control via nullifier verification
