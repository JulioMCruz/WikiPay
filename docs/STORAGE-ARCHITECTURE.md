# zkWiki Storage Architecture

## Problem
Storing article content on-chain is prohibitively expensive:
- 3KB article = ~$143M gas fee on Arbitrum
- Storage costs: ~20,000 gas per 32 bytes

## Solution: Hybrid Storage

### Architecture

```
┌─────────────────┐
│   User Browser  │
│  (Encryption)   │
└────────┬────────┘
         │
         │ 1. Encrypt content locally
         ▼
┌─────────────────┐
│  IPFS/Pinata    │
│  (Storage)      │
└────────┬────────┘
         │
         │ 2. Get IPFS hash (CID)
         ▼
┌─────────────────┐
│ Stylus Contract │
│ (Hash only)     │
└─────────────────┘
```

### Storage Comparison

| Service | Cost | Permanence | Encryption | Best For |
|---------|------|------------|------------|----------|
| **Pinata** | Free-$20/mo | While pinned | Manual | MVP, Testing |
| **Web3.Storage** | Free | Filecoin backup | Manual | Production |
| **Lighthouse** | $0.0001/GB/mo | While paid | Built-in | Privacy content |
| **Arweave** | $0.005/MB once | Permanent | Manual | Immutable articles |

### Recommended: Pinata for MVP → Web3.Storage for Production

## Implementation Plan

### Phase 1: Pinata Integration (MVP)

1. **Frontend Encryption**
```typescript
import { encrypt } from '@/lib/encryption';

// Encrypt before upload
const encryptedContent = await encrypt(content, creatorPublicKey);
```

2. **Upload to Pinata**
```typescript
import { PinataSDK } from "pinata-web3";

const upload = await pinata.upload.json({
  title: encryptedTitle,
  content: encryptedContent,
  metadata: {
    creator: address,
    timestamp: Date.now()
  }
});

const ipfsHash = upload.IpfsHash; // QmXxxx...
```

3. **Store Hash On-Chain**
```typescript
// Only store 46-byte IPFS hash on-chain
await publishArticle({
  preview,
  ipfsHash,  // Instead of full content
  price
});
```

4. **Retrieve & Decrypt**
```typescript
// After unlocking, fetch from IPFS
const response = await fetch(`https://gateway.pinata.cloud/ipfs/${ipfsHash}`);
const encrypted = await response.json();

// Decrypt with private key
const decrypted = await decrypt(encrypted.content, privateKey);
```

### Phase 2: Web3.Storage (Production)

```typescript
import { create } from '@web3-storage/w3up-client';

const client = await create();
await client.login('user@example.com');

// Upload encrypted content
const cid = await client.uploadFile(encryptedBlob);

// Store CID on-chain (same as IPFS hash)
await publishArticle({ preview, ipfsHash: cid, price });
```

## Smart Contract Updates

### Current Contract (3KB storage)
```rust
pub struct zkWikiContract {
    mapping(uint256 => string) encrypted_content; // ❌ Expensive!
}
```

### Updated Contract (46 bytes storage)
```rust
pub struct zkWikiContract {
    mapping(uint256 => string) ipfs_hashes; // ✅ 98% cheaper!
}

pub fn publish_article(
    &mut self,
    preview: String,
    ipfs_hash: String,  // Only ~46 bytes
    price: U256,
) -> U256 {
    // Validate IPFS hash format
    assert!(ipfs_hash.starts_with("Qm") || ipfs_hash.starts_with("bafy"),
            "Invalid IPFS hash");
    assert!(ipfs_hash.len() >= 46 && ipfs_hash.len() <= 59,
            "Invalid hash length");

    // Store hash instead of content
    self.ipfs_hashes.setter(article_id).set_str(&ipfs_hash);

    article_id
}
```

## Gas Cost Comparison

| Storage Type | Data Size | Gas Cost | USD Cost @ 0.1 gwei |
|--------------|-----------|----------|---------------------|
| On-chain (current) | 3KB | ~2M gas | $0.70 |
| IPFS hash | 46 bytes | ~5K gas | $0.002 |
| **Savings** | **98%** | **99.75%** | **99.7%** |

## Security Considerations

### Encryption Flow

1. **Publishing**
   - Generate symmetric key for article
   - Encrypt content with symmetric key
   - Encrypt symmetric key with creator's public key
   - Upload to IPFS/Pinata
   - Store IPFS hash on-chain

2. **Unlocking**
   - Pay unlock fee (generates ZK proof)
   - Receive encrypted symmetric key
   - Decrypt symmetric key with private key
   - Fetch encrypted content from IPFS
   - Decrypt content with symmetric key

### Access Control

```typescript
// After unlocking, creator shares decryption key
interface UnlockProof {
  articleId: number;
  nullifier: string;
  proof: string; // ZK proof
  timestamp: number;
}

// Backend verifies proof and returns decryption key
const decryptionKey = await verifyAndGetKey(unlockProof);
```

## Migration Path

### Step 1: Add IPFS support (keep backward compatibility)
```typescript
// Support both old (on-chain) and new (IPFS) articles
if (article.ipfsHash) {
  content = await fetchFromIPFS(article.ipfsHash);
} else {
  content = await getEncryptedContent(articleId);
}
```

### Step 2: Deploy updated contract with IPFS hash field

### Step 3: Migrate existing articles (if any)

### Step 4: Remove on-chain content storage

## Environment Variables

```env
# Pinata (MVP)
NEXT_PUBLIC_PINATA_JWT=your_jwt_here
NEXT_PUBLIC_PINATA_GATEWAY=your-gateway.mypinata.cloud

# Web3.Storage (Production)
NEXT_PUBLIC_W3S_SPACE_DID=did:key:...
NEXT_PUBLIC_W3S_PROOF=...

# Lighthouse (Alternative)
NEXT_PUBLIC_LIGHTHOUSE_API_KEY=...
```

## Next Steps

1. ✅ Document storage architecture (this file)
2. ⬜ Install Pinata SDK: `npm install pinata-web3`
3. ⬜ Implement encryption utilities
4. ⬜ Update contract to use IPFS hashes
5. ⬜ Update frontend to upload to Pinata
6. ⬜ Test end-to-end flow
7. ⬜ Add IPFS gateway fallbacks for reliability

## Resources

- [Pinata Docs](https://docs.pinata.cloud/)
- [Web3.Storage Docs](https://web3.storage/docs/)
- [Lighthouse Docs](https://docs.lighthouse.storage/)
- [Arweave Docs](https://docs.arweave.org/)
