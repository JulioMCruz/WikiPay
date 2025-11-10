# Contract Address Verification

## Current Contract (v5 - CIDv1 Support)
**Address:** `0x3b44bf1d0d9b7b3aad596031a89406c906ef8155`
**Deployed:** November 10, 2025
**Network:** Arbitrum Sepolia

## How to Verify the Correct Contract is Being Used

### 1. Hard Refresh Browser
Clear all cached JavaScript:
- **Chrome/Edge:** `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
- **Firefox:** `Cmd+Shift+R` (Mac) or `Ctrl+F5` (Windows)
- **Safari:** `Cmd+Option+R`

### 2. Check in Browser Console
Open Developer Tools → Console and run:
```javascript
console.log("Contract Address:", process.env.NEXT_PUBLIC_WIKIPAY_ADDRESS);
```

Should show: `0x3b44bf1d0d9b7b3aad596031a89406c906ef8155`

### 3. Verify Transaction Data
Before clicking "Confirm" in MetaMask:
- Click "Hex" tab in the transaction details
- The hex data should be **small** (~300 bytes)
- Should contain IPFS hash (bafkrei...) NOT full article text
- Gas fee should be ~$0.002 NOT $143M

### 4. Check Network Fee
**Correct:** ~0.0000055 ETH (~$0.02)
**Wrong:** 39406.4967 ETH ($143M) ← means using old contract!

## Troubleshooting

### If Still Seeing $143M Gas Fee:

**Option 1: Restart Dev Server**
```bash
cd apps/wikipay-anonymous/frontend
# Kill the current dev server (Ctrl+C)
npm run dev
```

**Option 2: Clear Next.js Cache**
```bash
cd apps/wikipay-anonymous/frontend
rm -rf .next
npm run dev
```

**Option 3: Verify .env.local**
```bash
cat .env.local | grep WIKIPAY_ADDRESS
```
Should show: `NEXT_PUBLIC_WIKIPAY_ADDRESS=0x3b44bf1d0d9b7b3aad596031a89406c906ef8155`

**Option 4: Clear Browser Data**
1. Open DevTools → Application → Storage
2. Click "Clear site data"
3. Reload page

## Contract Version History

| Version | Address | IPFS Support | Gas Cost |
|---------|---------|--------------|----------|
| v3 | `0x321...76a` | ❌ On-chain storage | $143M |
| v4 | `0x321...76a` | ✅ Qm only | $143M (validation failed) |
| **v5** | **`0x3b4...155`** | **✅ Qm + baf** | **$0.002** |

## Expected Publishing Flow

1. Enter article details
2. Click "Publish Article"
3. Console shows:
   ```
   🔐 Encrypting content...
   ✅ Content encrypted
   📤 Uploading to Pinata IPFS...
   ✅ Uploaded to IPFS: bafkrei...
   📡 Publishing to Arbitrum Stylus contract...
   ```
4. MetaMask opens with **~$0.02 gas fee** (NOT $143M)
5. Confirm transaction
6. Success! Article published to IPFS + blockchain
