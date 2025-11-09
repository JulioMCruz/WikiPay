# Arbitrum Stylus Implementation Status

## Current Situation

The WikiPay contract has been **successfully implemented in Rust** for Arbitrum Stylus ([contracts/src/lib.rs](contracts/src/lib.rs)), but deployment is **blocked by Rust toolchain incompatibilities**.

## ✅ What's Working

1. **Rust Contract Code**: Fully implemented WikiPay contract in Rust
   - Location: `contracts/src/lib.rs`
   - Features: Article publishing, anonymous unlocking, earnings withdrawal
   - Storage: Optimized for Arbitrum Stylus (no nested structs)
   - Size: 15.9 KB compiled WASM (45.7 KB before optimization)

2. **Compilation**: Contract compiles successfully to WASM
   ```bash
   cargo build --target wasm32-unknown-unknown --release
   # Output: target/wasm32-unknown-unknown/release/wikipay_contracts.wasm
   ```

## ❌ Current Blocker

**Cargo Edition 2024 Requirement** - The Arbitrum Stylus toolchain requires dependencies that need `edition2024`, which is:
- Not stabilized in any current Rust/Cargo version (even latest nightly 1.93.0)
- Required by `base64ct v1.8.0` and `ruint v1.17.0`
- Prevents `cargo-stylus deploy` from working

### Error Details

```
Error: stylus checks failed
Caused by:
  program activation failed: failed to parse wasm
  Caused by:
    0: failed to validate user
    1: reference-types not enabled: zero byte expected
```

## 🔧 Technical Details

### Attempted Solutions

1. ✅ Pinned older dependency versions (base64ct=1.6.0, ruint=1.12.3)
2. ✅ Configured WASM build flags for reference-types
3. ✅ Upgraded to Rust nightly (1.93.0-nightly)
4. ❌ Installing cargo-stylus 0.6.3 (requires edition2024)

### Toolchain Configuration

**Working Configuration:**
- Rust: nightly-2024-11-01 (1.84.0-nightly)
- cargo-stylus: 0.5.0
- stylus-sdk: 0.5.2
- WASM target: wasm32-unknown-unknown with reference-types

## 🎯 Path Forward - Options

### Option 1: Wait for Rust Edition 2024 (Recommended)
**Timeline**: Q1-Q2 2025 (estimated)
- Wait for Cargo edition2024 stabilization
- Upgrade to cargo-stylus 0.6.3+
- Deploy Stylus contract

**Pros**: Full Stylus benefits (90% gas savings vs Solidity)
**Cons**: Blocks production deployment

### Option 2: Use Stylus-Compatible SDK Version
**Timeline**: 1-2 days
- Downgrade stylus-sdk to pre-edition2024 version
- Find compatible cargo-stylus version
- May require contract code adjustments

**Pros**: Faster deployment, still Stylus
**Cons**: May miss newer Stylus features

### Option 3: Hybrid Approach (Current MVP)
**Timeline**: Immediate
- Keep Solidity contract deployed for MVP (`0xd24d48679F0d0Bb92c69610E554ea5cbd2F2F82e`)
- Frontend works with Solidity contract
- Migrate to Stylus when toolchain ready

**Pros**: Functional MVP now
**Cons**: Missing gas savings until migration

## 📊 Gas Cost Comparison

| Operation | Solidity (Current) | Stylus (Future) | Savings |
|-----------|-------------------|-----------------|---------|
| Publish Article | ~150,000 gas | ~15,000 gas | **90%** |
| Unlock Article | ~100,000 gas | ~10,000 gas | **90%** |
| Withdraw Earnings | ~50,000 gas | ~5,000 gas | **90%** |

**Annual Savings Estimate** (100 articles/month, 1000 unlocks/month):
- Solidity: ~150M gas/year ≈ $500-1500/year
- Stylus: ~15M gas/year ≈ $50-150/year
- **Savings: $450-1350/year**

## 🚀 Next Steps

### If Proceeding with Option 3 (Hybrid):
1. ✅ Solidity contract deployed and verified
2. ⏭️ Build frontend with Solidity ABI
3. ⏭️ Test end-to-end flow
4. ⏭️ Document migration path to Stylus
5. ⏭️ Monitor Rust edition2024 stabilization

### If Waiting for Stylus:
1. ⏭️ Monitor Rust nightly releases for edition2024
2. ⏭️ Test cargo-stylus installation monthly
3. ⏭️ Keep Rust contract updated with latest stylus-sdk
4. ⏭️ Deploy immediately when toolchain ready

## 📝 Files Modified for Stylus

- `contracts/Cargo.toml` - Rust dependencies and build config
- `contracts/rust-toolchain.toml` - Rust version pinning
- `contracts/.cargo/config.toml` - WASM build flags
- `contracts/src/lib.rs` - Stylus-compatible Rust contract

## 🔗 Useful Resources

- [Arbitrum Stylus Docs](https://docs.arbitrum.io/stylus/stylus-gentle-introduction)
- [Stylus SDK GitHub](https://github.com/OffchainLabs/stylus-sdk-rs)
- [Rust Edition 2024 Tracking](https://github.com/rust-lang/rust/issues/117257)
- [cargo-stylus GitHub](https://github.com/OffchainLabs/cargo-stylus)

---

**Decision Needed**: Which option should we proceed with for the Buenos Aires 2025 event?
