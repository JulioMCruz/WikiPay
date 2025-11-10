# WikiPay Contract Deployment Guide

## Quick Deployment

### Step 1: Build Contract

```bash
cd apps/wikipay-anonymous/contracts

# Build for WASM target with optimizations
cargo build --release --target wasm32-unknown-unknown
```

### Step 2: Deploy to Arbitrum Sepolia

```bash
# Set your private key
export PRIVATE_KEY=your_private_key_here

# Deploy with WASM file
cargo stylus deploy \
  --private-key $PRIVATE_KEY \
  --endpoint https://sepolia-rollup.arbitrum.io/rpc \
  --wasm-file ./target/wasm32-unknown-unknown/release/wikipay_contracts.wasm
```

**Expected Output:**
```
deployed code at address: 0x...
deployment tx hash: 0x...
contract activated and ready onchain with tx hash: 0x...
```

### Step 3: Cache Contract (Optional but Recommended)

```bash
# Replace CONTRACT_ADDRESS with your deployed address
cargo stylus cache bid CONTRACT_ADDRESS 0
```

**Benefits**: Cheaper contract calls, better gas efficiency

### Step 4: Update Frontend

Update `apps/wikipay-anonymous/frontend/.env.local`:

```env
NEXT_PUBLIC_WIKIPAY_ADDRESS=0xYOUR_NEW_CONTRACT_ADDRESS
```

## Important Notes

### Docker Issues

If you see "a bin target must be available for `cargo run`" error:

✅ **Solution**: Use `--wasm-file` flag with pre-built WASM file

❌ **Don't use**: `cargo stylus deploy` without `--wasm-file`

### Private Key Methods

**Method 1: Environment Variable (Recommended)**
```bash
export PRIVATE_KEY=your_key_here
cargo stylus deploy --private-key $PRIVATE_KEY ...
```

**Method 2: From .env file**
```bash
# Load from .env
source .env
cargo stylus deploy --private-key $PRIVATE_KEY ...
```

**Method 3: Direct (Not Recommended)**
```bash
cargo stylus deploy --private-key your_key_here ...
```

## Deployment History

### v4 (November 10, 2025) - IPFS Storage ✅
**Address**: `0x321313862c7e30330290d11ee20af2a273e8d76a`
- **Changed**: `encrypted_content` → `ipfs_hashes` mapping
- **Added**: IPFS hash validation (Qm... or bafy...)
- **Gas Savings**: 99.7% (stores 46 bytes vs 3KB)
- **Deployment TX**: `0xa7a08fe320fbe201173abf808f1c54981b6ca321e8cdc0e88e511fa68e896d3c`
- **Activation TX**: `0x65d80ea023dae33072ebc91625565cfda83bf617e15e55a981451bcd3802d31a`

### v3 (November 9, 2025) - On-Chain Storage ✅
**Address**: `0xab60b91ecb1281Ff9B53A9a3FBBfe8C93afB72b3`
- Used `encrypted_content` for full storage
- Fixed `FixedBytes<32>` for proof parameter
- Gas cost: **$143M for 3KB article** ❌

## Contract Comparison

| Version | Storage Method | Gas Cost (3KB) | Contract Size |
|---------|----------------|----------------|---------------|
| **v4 (Current)** | IPFS hash | **$0.002** ✅ | 21.9 KiB |
| v3 (Old) | On-chain | **$143M** ❌ | 22.8 KiB |
| **Savings** | - | **99.9999%** | - |

## Troubleshooting

### Error: "could not open private key file"
**Solution**: Use `export PRIVATE_KEY=...` instead of file path

### Error: "a bin target must be available for cargo run"
**Solution**: Add `--wasm-file ./target/wasm32-unknown-unknown/release/wikipay_contracts.wasm`

### Error: "stream did not contain valid UTF-8"
**Solution**: Use environment variable instead of file: `export PRIVATE_KEY=...`

### Docker Platform Warning
```
WARNING: The requested image's platform (linux/amd64) does not match...
```
**Impact**: None, this is normal on ARM Macs
**Action**: Ignore this warning

## Verification

After deployment:

1. **Check Contract on Explorer**:
   https://sepolia.arbiscan.io/address/YOUR_CONTRACT_ADDRESS

2. **Test Basic Functions**:
```bash
# Get total articles (should return 0 initially)
cast call YOUR_CONTRACT_ADDRESS \
  "get_total_articles()(uint256)" \
  --rpc-url https://sepolia-rollup.arbitrum.io/rpc
```

3. **Update ABI** (if needed):
```bash
cargo stylus export-abi
```

## Gas Cost Estimates

| Function | v3 (On-chain) | v4 (IPFS) | Savings |
|----------|---------------|-----------|---------|
| `publish_article` | $143M | **$0.002** | 99.9999% |
| `get_total_articles` | ~5K gas | ~5K gas | Same |
| `get_article` | ~10K gas | ~10K gas | Same |
| `unlock_article_anonymous` | ~118K gas | ~118K gas | Same |

**Key Insight**: Only publishing is affected. Reading and unlocking costs remain the same.

## Next Steps

After successful deployment:

1. ✅ Contract deployed to Arbitrum Sepolia
2. ✅ Update `.env.local` with new address
3. ⬜ Restart frontend dev server
4. ⬜ Test publishing with Pinata
5. ⬜ Verify gas cost is ~$0.002
6. ⬜ Test article retrieval from IPFS

## Resources

- [Stylus Docs](https://docs.arbitrum.io/stylus)
- [Cargo Stylus CLI](https://github.com/OffchainLabs/cargo-stylus)
- [IPFS Integration](../docs/PINATA-SETUP.md)
- [Contract Source](./src/lib.rs)
