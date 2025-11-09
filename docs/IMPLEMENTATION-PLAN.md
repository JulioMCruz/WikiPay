# WikiPay Anonymous - Implementation Plan

Complete 8-hour implementation plan for privacy-preserving article payments using ZK proofs + Arbitrum Stylus.

## 📁 Project Structure

```
apps/wikipay-anonymous/
├── frontend/                    # Next.js 14 App Router frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx        # Landing page
│   │   │   ├── publish/        # Create article
│   │   │   ├── article/[id]/   # View/unlock article
│   │   │   └── dashboard/      # Creator earnings
│   │   ├── components/
│   │   │   ├── ui/             # shadcn/ui components
│   │   │   ├── ArticleCard.tsx
│   │   │   ├── UnlockButton.tsx
│   │   │   └── ZKProofGenerator.tsx
│   │   └── lib/
│   │       ├── zk-proofs.ts    # Plonky2 WASM wrapper
│   │       ├── contracts.ts    # Contract ABIs/addresses
│   │       └── wagmi.ts        # Wagmi configuration
│   ├── package.json
│   └── next.config.ts
│
├── contracts/                   # Arbitrum Stylus smart contracts (Rust)
│   ├── src/
│   │   ├── lib.rs              # Main contract
│   │   ├── article.rs          # Article struct
│   │   └── verifier.rs         # ZK proof verifier
│   ├── Cargo.toml
│   └── stylus.toml
│
├── zk-circuits/                 # Plonky2 ZK circuits (Rust)
│   ├── src/
│   │   ├── lib.rs
│   │   ├── payment_circuit.rs  # Anonymous payment proof
│   │   └── utils.rs
│   ├── Cargo.toml
│   └── build.sh                # Build WASM target
│
├── scripts/
│   ├── deploy-contract.sh      # Deploy to Arbitrum Sepolia
│   ├── generate-abi.sh         # Export contract ABI
│   └── test-e2e.sh             # End-to-end tests
│
├── IMPLEMENTATION-PLAN.md      # This file
└── README.md                    # Project documentation
```

---

## 🎯 Phase 1: Smart Contracts (Hours 0-3)

### Step 1.1: Setup Arbitrum Stylus Dependencies (30 min)

**Directory**: `contracts/`

**Tasks**:
- [ ] Install Rust toolchain (if not installed)
- [ ] Install cargo-stylus CLI tool
- [ ] Add Arbitrum Stylus SDK dependencies
- [ ] Configure Cargo.toml for WASM target

**Files to create**:
```toml
# contracts/Cargo.toml
[package]
name = "wikipay-contracts"
version = "0.1.0"
edition = "2021"

[dependencies]
stylus-sdk = "0.6"
alloy-primitives = "0.8"
alloy-sol-types = "0.8"

[profile.release]
codegen-units = 1
strip = true
lto = true
panic = "abort"
opt-level = "z"
```

**Verification**: `cargo stylus check` passes

---

### Step 1.2: Create Article Storage Contract (60 min)

**File**: `contracts/src/lib.rs`

**Core features**:
- Article struct (creator, price, preview, content hash)
- Publish article function
- Nullifier tracking (prevent double-spend)
- Creator earnings mapping

**Key contract methods**:
```rust
pub fn publish_article(article_id: U256, preview: String) -> Result<()>
pub fn unlock_article_anonymous(article_id: U256, nullifier: FixedBytes<32>, proof: Bytes) -> Result<String>
pub fn withdraw_earnings() -> Result<U256>
```

**Verification**: Compiles with `cargo build --release`

---

### Step 1.3: Implement ZK Proof Verification (60 min)

**File**: `contracts/src/verifier.rs`

**Features**:
- Verify Plonky2 proof on-chain (simplified verifier)
- Check nullifier not reused
- Validate payment amount ($0.01)
- Extract public inputs from proof

**Simplified verification**:
```rust
pub fn verify_payment_proof(
    proof: &Bytes,
    article_id: U256,
    nullifier: FixedBytes<32>
) -> bool {
    // In production: Full Plonky2 verification
    // For MVP: Validate proof structure + signature
}
```

**Verification**: Unit tests pass

---

### Step 1.4: Deploy to Arbitrum Sepolia (30 min)

**Script**: `scripts/deploy-contract.sh`

**Tasks**:
- [ ] Setup Arbitrum Sepolia RPC endpoint
- [ ] Fund deployer wallet with testnet ETH
- [ ] Deploy contract with cargo-stylus
- [ ] Verify contract on Arbiscan
- [ ] Export contract address

**Command**:
```bash
cargo stylus deploy \
  --private-key $PRIVATE_KEY \
  --endpoint https://sepolia-rollup.arbitrum.io/rpc
```

**Verification**: Contract deployed, address saved to `.env`

---

## 🔐 Phase 2: ZK Circuits (Hours 3-5)

### Step 2.1: Setup Plonky2 Project (30 min)

**Directory**: `zk-circuits/`

**Tasks**:
- [ ] Create Rust project for ZK circuits
- [ ] Add Plonky2 dependencies
- [ ] Setup WASM build target (for frontend)
- [ ] Create circuit builder utilities

**Files to create**:
```toml
# zk-circuits/Cargo.toml
[package]
name = "wikipay-zk-circuits"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib", "rlib"]

[dependencies]
plonky2 = "0.2"
plonky2_field = "0.2"
wasm-bindgen = "0.2"
serde = { version = "1.0", features = ["derive"] }
serde-wasm-bindgen = "0.6"
```

**Verification**: `cargo build` succeeds

---

### Step 2.2: Build Anonymous Payment Circuit (90 min)

**File**: `zk-circuits/src/payment_circuit.rs`

**Circuit constraints**:
1. **Payment amount = $0.01**: Prove payment is exactly 0.01 USDC
2. **Nullifier generation**: Hash(wallet + article_id + nonce) = nullifier
3. **No wallet reveal**: Wallet address is private input

**Circuit structure**:
```rust
Public inputs (on-chain):
- article_id: U256
- payment_amount: U256 (must equal 0.01)
- nullifier: Hash

Private inputs (off-chain):
- wallet_address: Address (secret)
- secret_nonce: [u8; 32] (random)

Constraints:
1. payment_amount == 10_000_000_000_000_000 wei
2. nullifier == Hash(wallet || article_id || nonce)
```

**Verification**: Circuit generates valid proofs locally

---

### Step 2.3: Build WASM for Frontend (30 min)

**Script**: `zk-circuits/build.sh`

**Tasks**:
- [ ] Compile Rust to WASM
- [ ] Generate JavaScript bindings
- [ ] Optimize WASM bundle size
- [ ] Copy to frontend/public directory

**Command**:
```bash
wasm-pack build --target web --out-dir ../frontend/public/zk
```

**Verification**: WASM files in `frontend/public/zk/`

---

## 💻 Phase 3: Frontend (Hours 5-7)

### Step 3.1: Setup Wagmi + RainbowKit (30 min)

**Directory**: `frontend/`

**Tasks**:
- [ ] Install wagmi, viem, @rainbow-me/rainbowkit
- [ ] Configure Arbitrum Sepolia network
- [ ] Setup wallet connectors
- [ ] Create contract hooks

**Files to create**:
```typescript
// src/lib/wagmi.ts
export const config = createConfig({
  chains: [arbitrumSepolia],
  transports: {
    [arbitrumSepolia.id]: http()
  }
})

// src/lib/contracts.ts
export const WIKIPAY_ADDRESS = "0x..." // From .env
export const WIKIPAY_ABI = [...]  // Exported from Rust contract
```

**Verification**: Can connect wallet on testnet

---

### Step 3.2: Create ZK Proof Generator Component (60 min)

**File**: `frontend/src/lib/zk-proofs.ts`

**Features**:
- Load Plonky2 WASM module
- Generate payment proof client-side
- Export proof + nullifier for contract call

**Key function**:
```typescript
export async function generatePaymentProof(
  wallet: Address,
  articleId: bigint,
  secretNonce: Uint8Array
): Promise<{ proof: Hex, nullifier: Hex }> {
  // Load WASM
  const { generate_proof } = await import('/zk/wikipay_zk_circuits')

  // Generate proof
  const proofBytes = generate_proof(wallet, articleId, secretNonce)

  // Calculate nullifier
  const nullifier = keccak256(concat([wallet, toBytes(articleId), secretNonce]))

  return { proof: bytesToHex(proofBytes), nullifier }
}
```

**Verification**: Generates proofs in <2 seconds

---

### Step 3.3: Build Article Pages (90 min)

**Pages to create**:

1. **Landing Page** (`src/app/page.tsx`)
   - Hero section
   - Featured articles grid
   - "How it works" section
   - Anonymous payment explanation

2. **Article View** (`src/app/article/[id]/page.tsx`)
   - Show article preview (first 200 words)
   - "Unlock for $0.01" button
   - ZK proof generation on click
   - Full content reveal after unlock

3. **Publish Page** (`src/app/publish/page.tsx`)
   - Markdown editor
   - Preview generator
   - Publish to blockchain

4. **Dashboard** (`src/app/dashboard/page.tsx`)
   - Creator earnings
   - Published articles list
   - Withdraw button

**Verification**: All pages render correctly

---

### Step 3.4: Implement Unlock Flow (60 min)

**Component**: `UnlockButton.tsx`

**Flow**:
1. User clicks "Unlock for $0.01"
2. Generate zkProof in browser (1-2 sec)
3. Call contract: `unlock_article_anonymous(id, nullifier, proof)`
4. Wait for transaction confirmation
5. Reveal full article content

**Code**:
```typescript
const handleUnlock = async () => {
  setLoading(true)

  try {
    // 1. Generate ZK proof
    const nonce = crypto.getRandomValues(new Uint8Array(32))
    const { proof, nullifier } = await generatePaymentProof(
      address!,
      BigInt(articleId),
      nonce
    )

    // 2. Submit to contract
    const tx = await writeContract({
      address: WIKIPAY_ADDRESS,
      abi: WIKIPAY_ABI,
      functionName: 'unlock_article_anonymous',
      args: [BigInt(articleId), nullifier, proof],
      value: parseEther('0.01')
    })

    // 3. Wait for confirmation
    await waitForTransaction(tx.hash)

    // 4. Reveal content
    setUnlocked(true)
  } catch (error) {
    console.error('Unlock failed:', error)
  } finally {
    setLoading(false)
  }
}
```

**Verification**: Can unlock articles with zkProofs

---

## 🧪 Phase 4: Testing & Polish (Hours 7-8)

### Step 4.1: E2E Testing (30 min)

**Script**: `scripts/test-e2e.sh`

**Test scenarios**:
- [ ] Publish article → Check on-chain
- [ ] Unlock with zkProof → Verify payment
- [ ] Try double-spend → Should fail (nullifier reuse)
- [ ] Withdraw earnings → Check balance

**Verification**: All tests pass

---

### Step 4.2: UI Polish (20 min)

**Tasks**:
- [ ] Add loading states
- [ ] Add error messages
- [ ] Add success toasts
- [ ] Polish article cards
- [ ] Add privacy badges

**Verification**: UI feels smooth and professional

---

### Step 4.3: Documentation (10 min)

**Files to update**:
- [ ] README.md - Project overview
- [ ] Frontend README - How to run frontend
- [ ] Contracts README - How to deploy contracts
- [ ] .env.example - Environment variables template

**Verification**: Can onboard new developer in 5 minutes

---

## ✅ Deliverables Checklist

After 8 hours, you will have:

### Smart Contracts
- [x] Arbitrum Stylus contract deployed (Rust)
- [x] Article storage + nullifier tracking
- [x] ZK proof verifier
- [x] Creator earnings system
- [x] Deployed to Arbitrum Sepolia

### ZK Circuits
- [x] Plonky2 payment circuit (Rust)
- [x] WASM build for frontend
- [x] Proof generation <2 seconds
- [x] Anonymity guarantee (no wallet linkage)

### Frontend
- [x] Next.js 14 + App Router
- [x] Tailwind + shadcn/ui
- [x] Wagmi + RainbowKit wallet connection
- [x] ZK proof generation in browser
- [x] Article publish/unlock flow
- [x] Creator dashboard

### Documentation
- [x] Complete README
- [x] Deployment guide
- [x] API documentation
- [x] Architecture diagrams

---

## 🚀 Deployment

### Prerequisites
```bash
# 1. Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# 2. Install cargo-stylus
cargo install cargo-stylus

# 3. Get Arbitrum Sepolia testnet ETH
# Faucet: https://faucet.quicknode.com/arbitrum/sepolia

# 4. Setup environment variables
cp .env.example .env
# Add: PRIVATE_KEY, NEXT_PUBLIC_CONTRACT_ADDRESS, etc.
```

### Deploy Contracts
```bash
cd contracts
cargo stylus deploy --private-key $PRIVATE_KEY
```

### Deploy Frontend
```bash
cd frontend
npm install
npm run build
vercel --prod
```

---

## 📊 Success Metrics

### Technical Metrics
- ✅ Contract deployed to Arbitrum Sepolia
- ✅ ZK proof generation <2 seconds
- ✅ Gas cost <$0.01 per unlock
- ✅ 100% anonymity (no wallet traces)

### User Experience
- ✅ Article unlock in 3 clicks
- ✅ No KYC or signup required
- ✅ Creator receives payment instantly
- ✅ Reading history stays private

### Business Metrics
- ✅ 10 test articles published
- ✅ 100 test unlocks completed
- ✅ $1 in creator earnings distributed
- ✅ 0 double-spend attempts succeeded

---

## 🎯 Next Steps (Post-MVP)

### Week 2: Mainnet Launch
- [ ] Deploy to Arbitrum One
- [ ] Add USDC payment support
- [ ] Onboard 100 creators
- [ ] 1000 articles published

### Week 3: Advanced Features
- [ ] Contributor tracking (zkProof for edits)
- [ ] Quadratic funding for creators
- [ ] Anonymous donations
- [ ] Multi-language support

### Week 4: Scale
- [ ] 10,000 active readers
- [ ] 100,000 article unlocks
- [ ] $1000 creator earnings
- [ ] <$0.001 gas per unlock

---

## 🛠️ Development Commands

```bash
# Smart Contracts
cd contracts
cargo stylus check              # Verify contract compiles
cargo stylus deploy             # Deploy to Arbitrum Sepolia
cargo stylus export-abi         # Export ABI for frontend

# ZK Circuits
cd zk-circuits
cargo build --release           # Build Rust library
./build.sh                      # Build WASM for frontend
cargo test                      # Run circuit tests

# Frontend
cd frontend
npm install                     # Install dependencies
npm run dev                     # Start dev server
npm run build                   # Production build
npm run lint                    # Check code quality
```

---

## ❓ FAQ

**Q: Why Arbitrum Stylus instead of regular Arbitrum?**
A: 90% cheaper gas costs for ZK proof verification. Rust cryptography libraries are faster than Solidity.

**Q: Why Plonky2 instead of Groth16 or SNARK.js?**
A: Fastest proof generation (1-2 sec). No trusted setup. Better Rust tooling.

**Q: Can payments be traced to my wallet?**
A: No. The zkProof proves you paid without revealing your address. Nullifiers prevent linking payments.

**Q: What if I lose my private key?**
A: Your reading history is tied to the wallet. Unlocked articles are stored off-chain with proof of payment.

**Q: How does the creator get paid?**
A: Creator address is public. Payment goes directly to them (70%). No intermediary custody.

---

## 📚 Resources

- **Arbitrum Stylus Docs**: https://docs.arbitrum.io/stylus
- **Plonky2 GitHub**: https://github.com/mir-protocol/plonky2
- **Wagmi Docs**: https://wagmi.sh/
- **shadcn/ui**: https://ui.shadcn.com/

---

**Ready to build?** Review each phase, then execute hour-by-hour. Questions before starting? 🚀
