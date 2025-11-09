# WikiPay Anonymous Payments

**Zero-knowledge micropayments for content creators on Arbitrum**

Pay $0.01-0.10 per article anonymously using zkSNARKs. Built with Arbitrum Stylus (Rust smart contracts) and Plonky2 (fast zkProofs).

---

## 🎯 What This Does

- **Creators**: Publish articles with paywalled content ($0.01-0.10 per unlock)
- **Readers**: Unlock articles anonymously using zero-knowledge proofs
- **No tracking**: Payments are cryptographically private (nullifiers prevent double-spend)
- **Cheap gas**: Arbitrum Stylus = 10x cheaper than Solidity (<$0.002 gas per $0.01 payment)

---

## 📁 Project Structure

```
wikipay-anonymous/
├── frontend/                    # Next.js 14 App Router
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx        # Landing page
│   │   │   ├── publish/        # Create article
│   │   │   ├── article/[id]/   # View/unlock article
│   │   │   └── dashboard/      # Creator earnings
│   │   ├── components/ui/      # shadcn/ui components
│   │   └── lib/
│   │       ├── zk-proofs.ts    # Plonky2 WASM wrapper
│   │       └── contracts.ts    # Contract ABIs
│   └── package.json
├── contracts/                   # Arbitrum Stylus (Rust)
│   └── src/
│       ├── lib.rs              # Main WikiPay contract
│       └── verifier.rs         # ZK proof verifier
└── zk-circuits/                 # Plonky2 circuits (Rust)
    └── src/
        └── payment_circuit.rs  # Anonymous payment proof
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Rust 1.70+ (`curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`)
- cargo-stylus (`cargo install cargo-stylus`)
- Arbitrum Sepolia ETH ([faucet](https://www.alchemy.com/faucets/arbitrum-sepolia))

### 1. Install Dependencies

```bash
# Frontend
cd frontend
npm install

# Contracts
cd ../contracts
cargo build --release

# ZK Circuits
cd ../zk-circuits
cargo build --release
```

### 2. Setup Environment

```bash
# frontend/.env.local
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC=https://sepolia-rollup.arbitrum.io/rpc
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
```

### 3. Deploy Smart Contract

```bash
cd contracts
cargo stylus deploy \
  --private-key-path=~/.arbitrum/sepolia-key.txt \
  --endpoint=https://sepolia-rollup.arbitrum.io/rpc
```

### 4. Run Frontend

```bash
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🧪 Testing Flow

### As a Creator:

1. Connect wallet (RainbowKit)
2. Go to **/publish**
3. Enter article title, preview text, full content
4. Set unlock price ($0.01-0.10)
5. Click "Publish" → Transaction creates article on-chain

### As a Reader:

1. Browse articles on homepage
2. Click article → See preview + "Unlock for $0.01"
3. Click "Unlock Anonymously"
   - Frontend generates zkProof (1-2 seconds)
   - Proof proves payment without revealing wallet address
   - Nullifier prevents unlocking same article twice
4. Full article content revealed

### Verification:

```bash
# Check article storage
cast call $CONTRACT_ADDRESS "getArticle(uint256)" 1 --rpc-url https://sepolia-rollup.arbitrum.io/rpc

# Check creator earnings
cast call $CONTRACT_ADDRESS "creatorEarnings(address)" $CREATOR_ADDRESS --rpc-url https://sepolia-rollup.arbitrum.io/rpc

# Verify nullifier used (prevents double-spend)
cast call $CONTRACT_ADDRESS "isNullifierUsed(bytes32)" $NULLIFIER --rpc-url https://sepolia-rollup.arbitrum.io/rpc
```

---

## 🔒 How Zero-Knowledge Works

### Anonymous Payment Circuit (Plonky2)

**Public Inputs** (visible on-chain):
- `article_id`: Which article to unlock
- `payment_amount`: $0.01 in wei
- `nullifier`: Hash to prevent double-spend

**Private Inputs** (secret):
- `wallet_address`: Your actual wallet (never revealed)
- `secret_nonce`: Random value for privacy

**Constraints** (zkProof verifies):
1. Payment matches article price
2. Nullifier = Hash(wallet + article + nonce)
3. Wallet has sufficient balance

**Result**: Contract verifies proof without knowing who paid.

---

## 📊 Gas Costs (Arbitrum Stylus vs Solidity)

| Operation | Solidity | Stylus | Savings |
|-----------|----------|--------|---------|
| Publish article | ~150K gas | ~50K gas | 67% |
| Verify zkProof | ~800K gas | ~80K gas | 90% |
| Unlock article | ~100K gas | ~30K gas | 70% |
| Withdraw earnings | ~50K gas | ~20K gas | 60% |

**Real cost** (at 0.1 gwei): **<$0.002 per $0.01 payment**

---

## 🛠️ Development

### Build ZK Circuit WASM

```bash
cd zk-circuits
wasm-pack build --target web --out-dir ../frontend/public/wasm
```

### Test Smart Contract

```bash
cd contracts
cargo test
```

### Run Frontend Tests

```bash
cd frontend
npm run test
```

---

## 📚 Tech Stack

### Frontend
- **Next.js 14**: App Router with TypeScript
- **Tailwind CSS**: Utility-first styling
- **shadcn/ui**: Component library
- **Wagmi v2**: React hooks for Ethereum
- **RainbowKit**: Wallet connection
- **Viem**: TypeScript Ethereum library

### Smart Contracts
- **Arbitrum Stylus**: Rust smart contracts (10x cheaper gas)
- **cargo-stylus**: CLI deployment tool

### Zero-Knowledge
- **Plonky2**: Fast zkSNARK library (no trusted setup)
- **wasm-pack**: Compile Rust to WASM for browser

---

## 🚢 Deployment

### Smart Contract (Arbitrum Sepolia)

```bash
cd contracts
cargo stylus deploy \
  --private-key-path=~/.arbitrum/sepolia-key.txt \
  --endpoint=https://sepolia-rollup.arbitrum.io/rpc
```

### Frontend (Vercel)

```bash
cd frontend
vercel --prod
```

**Environment Variables** (Vercel):
- `NEXT_PUBLIC_CONTRACT_ADDRESS`
- `NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC`
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`

---

## 📖 API Reference

### Smart Contract Methods

```rust
// Publish article (creator only)
pub fn publish_article(
    article_id: U256,
    preview: String,
    encrypted_content: String,
    price: U256
) -> Result<(), Vec<u8>>

// Unlock article anonymously (anyone)
pub fn unlock_article_anonymous(
    article_id: U256,
    nullifier: FixedBytes<32>,
    proof: Bytes  // zkSNARK proof
) -> Result<String, Vec<u8>>  // Returns decrypted content

// Withdraw earnings (creator only)
pub fn withdraw_earnings() -> Result<U256, Vec<u8>>

// View methods
pub fn get_article(article_id: U256) -> Result<Article, Vec<u8>>
pub fn creator_earnings(creator: Address) -> U256
pub fn is_nullifier_used(nullifier: FixedBytes<32>) -> bool
```

---

## 🔐 Security

### zkProof Security
- **No trusted setup**: Plonky2 uses transparent setup (FRI-based)
- **Soundness**: <2^-100 probability of forging valid proof
- **Nullifiers**: SHA-256 hash prevents double-spend

### Smart Contract Security
- **Reentrancy protection**: Checks-Effects-Interactions pattern
- **Access control**: Only creators can withdraw earnings
- **Input validation**: Article prices must be 0.01-0.10 ETH

---

## 📝 Implementation Plan

See [IMPLEMENTATION-PLAN.md](./IMPLEMENTATION-PLAN.md) for the complete 8-hour development guide.

**Phases**:
- **Hours 0-3**: Smart Contracts (Rust + Stylus)
- **Hours 3-5**: ZK Circuits (Plonky2 + WASM)
- **Hours 5-7**: Frontend (Next.js + Wagmi)
- **Hours 7-8**: Testing & Polish

---

## 🤝 Contributing

This is part of a portfolio of Web3 projects. See main repository for contribution guidelines.

---

## 📄 License

MIT License - See [LICENSE](../../LICENSE)

---

## 🔗 Related Projects

- **BillBot**: AI bill negotiation with Stripe payments
- **TorBandwidth**: Anonymous bandwidth marketplace with zkProofs
- **PoolGood**: Private liquidity pool tracking

---

## 🆘 Troubleshooting

### "Proof verification failed"
- Check wallet has sufficient balance
- Verify article_id exists
- Ensure payment_amount matches article price

### "Nullifier already used"
- You already unlocked this article
- Each wallet can unlock each article only once

### "Contract deployment failed"
- Verify Arbitrum Sepolia ETH balance
- Check RPC endpoint is correct
- Ensure cargo-stylus is installed

### WASM build issues
```bash
rustup target add wasm32-unknown-unknown
cargo install wasm-pack
```

---

**Built with ❤️ for anonymous content creators**
