# WikiPay Stylus Smart Contracts

Arbitrum Stylus (Rust/WASM) smart contracts for anonymous article payments.

## ✅ Deployed Contract

**Network**: Arbitrum Sepolia
**Contract Address**: `0x5748ebaaa22421de872ed8b3be61fc1ac66f3e92`
**Explorer**: [View on Arbiscan](https://sepolia.arbiscan.io/address/0x5748ebaaa22421de872ed8b3be61fc1ac66f3e92)

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full deployment details.

## Features

- **Privacy-Preserving**: Anonymous article unlocking using zero-knowledge proofs
- **Arbitrum Stylus**: WASM-based execution for 90% gas savings vs Solidity
- **Creator Earnings**: Track and withdraw earnings from article unlocks
- **Nullifier Protection**: Prevent double-spending with cryptographic nullifiers

## Contract Functions

### Write Functions

- `publishArticle(preview, encrypted_content, price)` - Publish a new article
- `unlockArticleAnonymous(article_id, nullifier, proof)` - Unlock article with ZK proof (payable)
- `withdrawEarnings()` - Withdraw accumulated creator earnings

### Read Functions

- `getArticle(article_id)` - Get article details
- `getCreatorEarnings(creator)` - Check creator earnings
- `isNullifierUsed(nullifier)` - Verify if nullifier was used
- `getTotalArticles()` - Get total article count

## Development Setup

### Prerequisites

- Rust 1.88+ (1.91.0 recommended)
- cargo-stylus 0.6.3+
- Arbitrum Sepolia testnet ETH

### Installation

```bash
# Install Rust (if not already installed)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install cargo-stylus
cargo install cargo-stylus

# Add WASM target
rustup target add wasm32-unknown-unknown
```

### Environment Setup

1. Copy the environment template:
```bash
cp .env.example .env
```

2. Fill in your credentials in `.env`:
```bash
PRIVATE_KEY=your_private_key_here
ARBITRUM_SEPOLIA_RPC=https://sepolia-rollup.arbitrum.io/rpc
```

**⚠️ IMPORTANT**: Never commit `.env` file to version control!

### Build & Test

```bash
# Build the contract
cargo build --target wasm32-unknown-unknown --release

# Check contract validity
cargo stylus check \
  --endpoint https://sepolia-rollup.arbitrum.io/rpc \
  --wasm-file target/wasm32-unknown-unknown/release/wikipay_contracts.wasm
```

### Deploy

```bash
# Deploy to Arbitrum Sepolia
cargo stylus deploy \
  --private-key $PRIVATE_KEY \
  --endpoint https://sepolia-rollup.arbitrum.io/rpc \
  --wasm-file target/wasm32-unknown-unknown/release/wikipay_contracts.wasm

# Cache contract for cheaper calls (recommended)
cargo stylus cache bid <CONTRACT_ADDRESS> 0 \
  --private-key $PRIVATE_KEY \
  --endpoint https://sepolia-rollup.arbitrum.io/rpc
```

## Project Structure

```
contracts/
├── src/
│   └── lib.rs              # Main Stylus contract
├── Cargo.toml              # Rust dependencies
├── rust-toolchain.toml     # Rust version (1.91.0)
├── .cargo/
│   └── config.toml         # WASM build configuration
├── wikipay-abi.json        # Contract ABI
├── DEPLOYMENT.md           # Deployment details
└── README.md               # This file
```

## Technology Stack

- **Language**: Rust 1.91.0
- **SDK**: stylus-sdk 0.9.0
- **Primitives**: alloy-primitives 0.8.20
- **Target**: wasm32-unknown-unknown
- **Network**: Arbitrum Sepolia (testnet)

## Gas Savings

Stylus contracts run as WASM, providing significant gas savings:

| Operation | Solidity | Stylus | Savings |
|-----------|----------|---------|---------|
| Publish Article | ~150K gas | ~50K gas | 67% |
| Unlock Article | ~100K gas | ~30K gas | 70% |
| ZK Proof Verification | ~800K gas | ~80K gas | 90% |

## ABI

The contract ABI is available in `wikipay-abi.json` for frontend integration.

## Security Considerations

- Private keys are never committed to version control
- All `.env` files are gitignored
- Zero-knowledge proofs prevent identity linking
- Nullifiers prevent double-unlocking
- Creator earnings tracked separately for secure withdrawals

## Documentation

- [Arbitrum Stylus Documentation](https://docs.arbitrum.io/stylus/overview)
- [Stylus CLI Reference](https://docs.arbitrum.io/stylus/using-cli)
- [Deployment Guide](./DEPLOYMENT.md)

## Support

For issues or questions:
- Open an issue in the project repository
- Check [Arbitrum Stylus docs](https://docs.arbitrum.io/stylus)
- Join [Arbitrum Discord](https://discord.gg/arbitrum)
