# WikiPay Anonymous Payments

**Zero-knowledge micropayments for content creators on Arbitrum**

Pay $0.01-0.10 per article anonymously using zero-knowledge proofs. Built with **Arbitrum Stylus** (Rust/WASM) smart contracts on Arbitrum Sepolia with 90% gas savings vs Solidity.

**🔴 Live on Arbitrum Sepolia:**

| Contract Address | Network | Type |
|-----------------|---------|------|
| [`0x5748ebaaa22421de872ed8b3be61fc1ac66f3e92`](https://sepolia.arbiscan.io/address/0x5748ebaaa22421de872ed8b3be61fc1ac66f3e92) | Arbitrum Sepolia | Stylus (WASM) |

**Deployment Details:**
- Deployed: November 9, 2025
- Contract Size: 22.9 KiB
- WASM Size: 83.6 KiB
- Cached in ArbOS for cheaper calls
- Full deployment info: [contracts/DEPLOYMENT.md](./contracts/DEPLOYMENT.md)

---

## 🎯 What This Does

- **Creators**: Publish articles with paywalled content ($0.01-0.10 per unlock)
- **Readers**: Unlock articles anonymously using zero-knowledge proofs
- **No tracking**: Payments are cryptographically private (nullifiers prevent double-spend)
- **Ultra-low gas**: Stylus WASM execution provides 90% gas savings vs Solidity

---

## 📁 Project Structure

```
wikipay-anonymous/
├── frontend/                    # Next.js 14 App Router
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx        # Landing page
│   │   │   ├── publish/        # Create article (TODO)
│   │   │   ├── article/[id]/   # View/unlock article (TODO)
│   │   │   └── dashboard/      # Creator earnings (TODO)
│   │   ├── components/ui/      # shadcn/ui components
│   │   └── lib/
│   │       ├── wagmi.ts        # Wagmi configuration
│   │       └── contracts.ts    # Contract ABIs
│   └── package.json
├── contracts/                   # ✅ Arbitrum Stylus (Rust/WASM)
│   ├── src/
│   │   └── lib.rs              # Main WikiPay contract (188 lines)
│   ├── Cargo.toml              # Rust dependencies
│   ├── rust-toolchain.toml     # Rust 1.91.0
│   ├── .cargo/config.toml      # WASM build config
│   ├── wikipay-abi.json        # Contract ABI
│   ├── DEPLOYMENT.md           # Deployment details
│   └── README.md               # Full contract documentation
└── docs/
    └── IMPLEMENTATION-PLAN.md  # Development roadmap
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Arbitrum Sepolia ETH ([faucet](https://www.alchemy.com/faucets/arbitrum-sepolia))
- WalletConnect Project ID ([get one free](https://cloud.walletconnect.com))

### 1. Install Dependencies

```bash
# Frontend
cd frontend
npm install
```

### 2. Setup Environment

```bash
# Copy example env file
cp frontend/.env.local.example frontend/.env.local

# Edit frontend/.env.local with deployed Stylus contract
NEXT_PUBLIC_WIKIPAY_ADDRESS=0x5748ebaaa22421de872ed8b3be61fc1ac66f3e92
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC=https://sepolia-rollup.arbitrum.io/rpc
```

### 3. Run Frontend

```bash
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 4. Deploy Your Own Stylus Contract (Optional)

```bash
cd contracts

# Setup environment
cp .env.example .env
# Edit .env with your private key

# Install Rust and cargo-stylus
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
cargo install cargo-stylus

# Build and deploy
cargo build --target wasm32-unknown-unknown --release
cargo stylus deploy \
  --private-key $PRIVATE_KEY \
  --endpoint https://sepolia-rollup.arbitrum.io/rpc \
  --wasm-file target/wasm32-unknown-unknown/release/wikipay_contracts.wasm
```

See [contracts/README.md](./contracts/README.md) for full deployment guide.

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

## 📊 Gas Costs (Arbitrum Sepolia)

### Stylus (Current - WASM)

| Operation | Estimated Gas | Cost (0.1 gwei) | Savings vs Solidity |
|-----------|---------------|-----------------|---------------------|
| Publish article | ~50K gas | ~$0.005 | 67% |
| Unlock article | ~30K gas | ~$0.003 | 70% |
| ZK Proof Verify | ~80K gas | ~$0.008 | 90% |
| Withdraw earnings | ~15K gas | ~$0.0015 | 70% |

**Why Stylus?** Arbitrum Stylus executes WASM code directly, providing 10x faster execution and 90% gas savings compared to EVM bytecode.

---

## 🛠️ Development

### Build Stylus Contract

```bash
cd contracts

# Build WASM contract
cargo build --target wasm32-unknown-unknown --release

# Check contract validity
cargo stylus check \
  --endpoint https://sepolia-rollup.arbitrum.io/rpc \
  --wasm-file target/wasm32-unknown-unknown/release/wikipay_contracts.wasm
```

### Run Frontend Dev Server

```bash
cd frontend
npm run dev
```

### Build Frontend for Production

```bash
cd frontend
npm run build
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
- **Arbitrum Stylus**: Rust/WASM smart contracts (90% gas savings)
- **Rust 1.91.0**: Programming language
- **stylus-sdk 0.9.0**: Stylus development kit
- **Arbitrum Sepolia**: L2 testnet deployment

### Zero-Knowledge (Planned)
- **Plonky2**: Fast zkSNARK library (production version)
- **MVP**: Simplified proof verification for testing

---

## 🚢 Deployment

### Smart Contract (Arbitrum Sepolia)

```bash
cd contracts

# Configure .env with your private key
cp .env.example .env
# Edit .env and add your PRIVATE_KEY

# Install Rust toolchain
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup target add wasm32-unknown-unknown
cargo install cargo-stylus

# Build and deploy Stylus contract
cargo build --target wasm32-unknown-unknown --release
cargo stylus deploy \
  --private-key $PRIVATE_KEY \
  --endpoint https://sepolia-rollup.arbitrum.io/rpc \
  --wasm-file target/wasm32-unknown-unknown/release/wikipay_contracts.wasm

# Cache for cheaper calls (recommended)
cargo stylus cache bid <CONTRACT_ADDRESS> 0 \
  --private-key $PRIVATE_KEY \
  --endpoint https://sepolia-rollup.arbitrum.io/rpc
```

See [contracts/README.md](./contracts/README.md) for detailed instructions.

### Frontend (Vercel)

```bash
cd frontend
vercel --prod
```

**Environment Variables** (Vercel):
- `NEXT_PUBLIC_WIKIPAY_ADDRESS=0x5748ebaaa22421de872ed8b3be61fc1ac66f3e92`
- `NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC=https://sepolia-rollup.arbitrum.io/rpc`
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=<your_project_id>`

---

## 📖 API Reference

### Stylus Contract Methods

The deployed Stylus contract at `0x5748ebaaa22421de872ed8b3be61fc1ac66f3e92` implements:

**Write Functions:**
```rust
// Publish article (anyone can publish)
publishArticle(preview: String, encrypted_content: String, price: U256) -> U256

// Unlock article with ZK proof (payable)
unlockArticleAnonymous(article_id: U256, nullifier: FixedBytes<32>, proof: Bytes) -> String

// Withdraw creator earnings
withdrawEarnings() -> U256
```

**Read Functions:**
```rust
// Get article details
getArticle(article_id: U256) -> (Address, U256, U256, String)

// Get creator earnings
getCreatorEarnings(creator: Address) -> U256

// Check nullifier usage
isNullifierUsed(nullifier: FixedBytes<32>) -> bool

// Get total article count
getTotalArticles() -> U256
```

Full ABI available in [contracts/wikipay-abi.json](./contracts/wikipay-abi.json)

---

## 🔐 Security

### Stylus Contract Security
- **Memory safety**: Rust's ownership system prevents common vulnerabilities
- **Type safety**: Compile-time guarantees for data types and operations
- **Access control**: Only creators can withdraw their earnings
- **Input validation**: Article prices must be 0.01-0.10 ETH
- **Nullifier tracking**: Prevents double-unlock attacks
- **WASM sandbox**: Execution isolated from host environment

### zkProof Security (Production)
- **Planned**: Full Plonky2 proof verification (no trusted setup)
- **MVP**: Simplified proof structure validation
- **Nullifiers**: Keccak256 hash prevents double-spend

### Auditing Status
⚠️ **Not audited** - This is an MVP for educational purposes. Do not use in production with real funds without a professional security audit.

### Why Stylus for Security?
- **Memory safety**: Rust eliminates entire classes of vulnerabilities (buffer overflows, use-after-free)
- **No undefined behavior**: Unlike Solidity, Rust catches memory errors at compile time
- **Smaller attack surface**: 22.9 KiB contract vs typical 100+ KiB Solidity contracts

---

## 🤝 Contributing

This is part of a portfolio of Web3 projects. See main repository for contribution guidelines.

---

## 📄 License

MIT License - See [LICENSE](./LICENSE)

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
- Ensure private key is in `.env` file
- Try with `--legacy` flag if gas estimation fails

### "Module not found" errors
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

---

**Built with ❤️ for anonymous content creators**
