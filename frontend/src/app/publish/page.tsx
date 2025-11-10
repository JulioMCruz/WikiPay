"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { publishArticle } from "@/lib/contract";
import { useAccount } from "wagmi";
import { simpleEncrypt } from "@/lib/encryption";
import { uploadToPinata } from "@/lib/pinata";

const exampleArticles = {
  x402: {
    title: "X402: The Future of Cross-Chain Interoperability",
    preview: "X402 protocol is revolutionizing how blockchains communicate. By introducing a novel state verification mechanism, it enables trustless cross-chain transactions without bridges or wrapped tokens. Learn how this breakthrough technology works and why it matters for the future of Web3.",
    content: `The blockchain ecosystem has long struggled with fragmentation. Bitcoin, Ethereum, Solana, and hundreds of other chains operate in isolation, creating a fractured user experience and limiting the potential of decentralized applications.

Enter X402 - a groundbreaking protocol that solves cross-chain interoperability without the vulnerabilities of traditional bridges.

## How X402 Works

X402 introduces a revolutionary approach called "State Proof Relaying" (SPR). Instead of locking assets in smart contracts (which creates honeypots for hackers), X402 enables chains to directly verify each other's state through cryptographic proofs.

Here's the magic:

1. **Native Verification**: Each participating blockchain runs an X402 light client that can verify state proofs from other chains
2. **Zero Trust**: No intermediaries, no wrapped tokens, no bridge contracts to exploit
3. **Atomic Swaps**: True atomic cross-chain transactions with finality guarantees
4. **Composability**: Smart contracts can natively call functions across chains

## Real-World Applications

The possibilities are extraordinary:

**DeFi Unification**: Imagine borrowing on Ethereum using Solana NFTs as collateral, or providing liquidity across chains in a single transaction. X402 makes this possible without wrapped tokens or centralized custodians.

**Cross-Chain DAOs**: Governance tokens on one chain can control treasuries on another. A DAO on Arbitrum could manage investments on Base, Optimism, and Polygon simultaneously.

**Universal Identity**: Your on-chain identity and reputation can follow you across all blockchains. NFTs, credentials, and social graphs become truly portable.

**Gaming & Metaverse**: In-game assets can move seamlessly between different blockchain games. Your sword from a Polygon game could be used in an Avalanche metaverse.

## Technical Innovation

X402's breakthrough comes from three key innovations:

1. **Succinct State Proofs**: Using zero-knowledge proofs to compress blockchain state into tiny, verifiable packages
2. **Consensus Adapters**: Modular adapters that work with any consensus mechanism (PoW, PoS, PoA, etc.)
3. **Incentive Alignment**: Economic guarantees that make it profitable to relay proofs honestly

## Security Advantages

Unlike bridges that have lost billions to hacks, X402 offers:

- No locked liquidity pools to attack
- Mathematical finality guarantees
- No trusted relayers or validators
- Resistance to 51% attacks through multi-chain verification

## The Road Ahead

X402 is currently in testnet with mainnet launch planned for Q2 2025. Early partners include major DeFi protocols, NFT marketplaces, and L2 solutions.

The protocol is open-source and designed to be blockchain-agnostic. Any EVM-compatible chain can integrate X402 in under 100 lines of code.

## Conclusion

X402 represents a paradigm shift in blockchain architecture. By enabling true cross-chain composability without bridges, it unlocks the next generation of decentralized applications.

The future isn't multi-chain - it's omnichain. And X402 is building that future today.

---

*Disclaimer: This article is for informational purposes only and does not constitute financial advice.*`,
    price: "0.05"
  },
  eip8004: {
    title: "EIP-8004: Universal Token Bridge Standard",
    preview: "EIP-8004 proposes a standardized approach to token bridging across EVM-compatible chains. By establishing a common interface and security framework, it aims to eliminate the fragmentation in current bridge implementations and reduce the risk of exploits. Discover how this proposal could reshape the multi-chain ecosystem.",
    content: `The Ethereum ecosystem has evolved into a complex multi-chain landscape. With dozens of Layer 2 solutions and sidechains, users face a fragmented experience when moving assets between networks. Each bridge implementation differs, creating security risks and poor user experiences.

EIP-8004 aims to solve this fundamental problem.

## The Bridge Fragmentation Problem

Today's landscape is chaotic:

- **50+ Bridge Implementations**: Each with different security models, interfaces, and trust assumptions
- **$2.5B+ Lost to Exploits**: Bridge vulnerabilities have become the #1 attack vector in DeFi
- **Inconsistent UX**: Users must learn different interfaces for each bridge
- **Liquidity Fragmentation**: Assets are split across incompatible bridge implementations

EIP-8004 addresses these issues through standardization.

## Core Components of EIP-8004

### 1. Universal Bridge Interface

A standardized smart contract interface that all bridges must implement:

\`\`\`solidity
interface IEIP8004Bridge {
    function lockAndBridge(
        address token,
        uint256 amount,
        uint256 targetChainId,
        address recipient
    ) external returns (bytes32 bridgeId);

    function claimBridgedTokens(
        bytes32 bridgeId,
        bytes calldata proof
    ) external returns (bool);

    function emergencyWithdraw(
        bytes32 bridgeId
    ) external returns (bool);
}
\`\`\`

### 2. Security Framework

EIP-8004 mandates specific security requirements:

**Multi-Validator Consensus**: Minimum 7 independent validators must sign bridge transactions
**Timelock Mechanism**: All bridging operations have a 24-hour challenge period
**Insurance Pool**: Bridges must maintain reserves equal to 10% of TVL
**Emergency Pause**: Circuit breakers that halt operations if suspicious activity detected

### 3. Proof Verification Standard

The proposal introduces a standardized proof system for cross-chain verification:

- **Merkle Proofs**: Standard format for state verification
- **Finality Requirements**: Minimum block confirmations based on chain security
- **Fraud Proof Window**: 7-day challenge period for optimistic bridges

## Benefits for the Ecosystem

### For Users

**Simplified Experience**: One interface to bridge between all supported chains
**Enhanced Security**: Standardized security requirements reduce exploit risks
**Better Transparency**: Uniform monitoring and auditing across all bridges
**Guaranteed Liquidity**: Standardized liquidity pools eliminate fragmentation

### For Developers

**Reduced Integration Work**: Build once, support all EIP-8004 bridges
**Interoperability**: Tokens bridged through any compliant implementation are compatible
**Security Guarantees**: Compliance means meeting minimum security standards
**Innovation Space**: Standard interface allows for competing implementations

## Technical Implementation

The bridging flow operates through a multi-step process:

1. **Lock Phase**: User locks tokens on source chain
2. **Proof Generation**: Validators create merkle proof of lock transaction
3. **Consensus**: Minimum validator threshold must sign proof
4. **Challenge Period**: 24-hour window for fraud proofs
5. **Claim Phase**: User claims tokens on destination chain using proof

## Real-World Impact

If widely adopted, EIP-8004 could:

- Eliminate bridge fragmentation through universal compatibility
- Reduce exploits by 80%+ via standardized security
- Lower bridging costs through competitive pressure
- Enable new cross-chain applications

## Current Status & Adoption

EIP-8004 is currently in "Review" status (as of November 2024):

**Supporting Projects**:
- Arbitrum: Committed to implementation in Q1 2025
- Optimism: Evaluating for OP Stack chains
- Polygon: zkEVM integration planned
- Base: Coinbase exploring native support

## Conclusion

The multi-chain future is inevitable. EIP-8004 offers a path toward secure, interoperable, and user-friendly cross-chain value transfer. The next phase of blockchain adoption depends on solving the bridge problem - and this proposal might be the solution.

---

*Disclaimer: This article is for educational purposes. Always do your own research before using any bridge protocol.*`,
    price: "0.03"
  },
  quickTest: {
    title: "Quick Test Article: Hello Web3",
    preview: "This is a short test article to verify the WikiPay publishing system. It demonstrates the anonymous payment flow and content unlocking mechanism.",
    content: `This is a test article for the WikiPay anonymous payment system.

## Purpose

Testing the following features:
- Article publishing to blockchain
- Anonymous payment with zkSNARKs
- Content unlocking mechanism

## How It Works

1. Reader sees the preview (this section is always visible)
2. Reader pays anonymously using zero-knowledge proofs
3. Full content is unlocked instantly
4. Creator earns payment directly

## Privacy Features

- No wallet tracking
- No payment history
- Complete anonymity
- Powered by Arbitrum Stylus

Thank you for testing WikiPay! 🚀`,
    price: "0.01"
  }
};

export default function PublishPage() {
  const { address, isConnected } = useAccount();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [preview, setPreview] = useState("");
  const [price, setPrice] = useState("0.05");
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<any>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const loadExample = (exampleKey: keyof typeof exampleArticles) => {
    const example = exampleArticles[exampleKey];
    setTitle(example.title);
    setPreview(example.preview);
    setContent(example.content);
    setPrice(example.price);
  };

  const handlePublish = async () => {
    console.log("🚀 Starting publish...");
    console.log("Title:", title);
    console.log("Preview:", preview.substring(0, 100) + "...");
    console.log("Content length:", content.length);
    console.log("Price:", price);

    // Check wallet connection
    if (!isConnected) {
      setErrorMessage("Please connect your wallet first!");
      setShowErrorDialog(true);
      return;
    }

    try {
      setIsPublishing(true);
      setPublishResult(null);
      setShowSuccessDialog(false);
      setShowErrorDialog(false);
      console.log("📝 Publishing state set to true");

      // Step 1: Encrypt content
      console.log("🔐 Encrypting content...");
      const fullContent = `# ${title}\n\n${content}`;
      const { encrypted, iv, key } = await simpleEncrypt(fullContent);
      console.log("✅ Content encrypted");

      // Step 2: Upload to Pinata IPFS
      console.log("📤 Uploading to Pinata IPFS...");
      const ipfsHash = await uploadToPinata({
        title,
        encrypted,
        iv,
        encryptionKey: key,
        creator: address || "",
        timestamp: Date.now(),
        preview
      });
      console.log("✅ Uploaded to IPFS:", ipfsHash);

      // Step 3: Publish to blockchain (only IPFS hash)
      console.log("📡 Publishing to Arbitrum Stylus contract...");
      const result = await publishArticle({
        title,
        preview,
        content, // Not used anymore, but kept for compatibility
        priceUSD: price,
        ipfsHash
      });

      console.log("🎉 Article published successfully!");
      console.log("Transaction hash:", result.transactionHash);
      console.log("Block number:", result.blockNumber);
      console.log("Gas used:", result.gasUsed.toString());
      console.log("IPFS hash:", ipfsHash);

      setPublishResult({ ...result, ipfsHash });
      setShowSuccessDialog(true);

    } catch (error: any) {
      console.error("❌ Error publishing article:", error);
      setErrorMessage(error.message || "Unknown error occurred");
      setShowErrorDialog(true);
    } finally {
      setIsPublishing(false);
      console.log("📝 Publishing state set to false");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-200/50 dark:border-slate-800/50 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
              <span className="text-xl">🔒</span>
            </div>
            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">WikiPay</span>
              <Badge variant="secondary" className="ml-2 text-xs">Anonymous</Badge>
            </div>
          </Link>
          <div className="flex gap-2 items-center">
            <Link href="/dashboard">
              <Button variant="ghost" className="hover:bg-purple-50 dark:hover:bg-slate-800">Dashboard</Button>
            </Link>
            <ConnectButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-5xl font-black mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Publish Article
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400">
            Create and monetize your content with complete privacy
          </p>
        </div>

        {/* Example Templates */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-orange-50/50 dark:from-amber-950/30 dark:to-orange-950/30 backdrop-blur-sm mb-8">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3 mb-4">
              <span className="text-2xl">💡</span>
              <div className="flex-1">
                <p className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Try Example Articles</p>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  Load pre-written examples to test the publishing system
                </p>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    onClick={() => loadExample("x402")}
                    variant="outline"
                    className="bg-white dark:bg-slate-900"
                  >
                    📝 X402 Article (0.05 ETH)
                  </Button>
                  <Button
                    onClick={() => loadExample("eip8004")}
                    variant="outline"
                    className="bg-white dark:bg-slate-900"
                  >
                    🌉 EIP-8004 Article (0.03 ETH)
                  </Button>
                  <Button
                    onClick={() => loadExample("quickTest")}
                    variant="outline"
                    className="bg-white dark:bg-slate-900"
                  >
                    ⚡ Quick Test (0.01 ETH)
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-8">
          {/* Article Form */}
          <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-2xl">Article Details</CardTitle>
              <CardDescription>Fill in your article information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-base font-semibold">Article Title</Label>
                <Input
                  id="title"
                  placeholder="Enter an engaging title for your article"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-lg py-6"
                />
              </div>

              {/* Preview */}
              <div className="space-y-2">
                <Label htmlFor="preview" className="text-base font-semibold">
                  Preview Text <span className="text-sm font-normal text-slate-500">(shown to all readers)</span>
                </Label>
                <Textarea
                  id="preview"
                  placeholder="Write a compelling preview to entice readers (2-3 sentences)"
                  value={preview}
                  onChange={(e) => setPreview(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
                <p className="text-sm text-slate-500">{preview.length} characters</p>
              </div>

              {/* Full Content */}
              <div className="space-y-2">
                <Label htmlFor="content" className="text-base font-semibold">
                  Full Article <span className="text-sm font-normal text-slate-500">(unlocked after payment)</span>
                </Label>
                <Textarea
                  id="content"
                  placeholder="Write your full article here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={12}
                  className="resize-none font-mono text-sm"
                />
                <p className="text-sm text-slate-500">{content.length} characters</p>
              </div>

              {/* Price */}
              <div className="space-y-2">
                <Label htmlFor="price" className="text-base font-semibold">Unlock Price (USD)</Label>
                <div className="flex gap-2">
                  <Input
                    id="price"
                    type="number"
                    min="0.01"
                    max="0.10"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="text-lg py-6 max-w-xs"
                  />
                  <div className="flex gap-2">
                    {["0.01", "0.05", "0.10"].map((p) => (
                      <Button
                        key={p}
                        variant={price === p ? "default" : "outline"}
                        onClick={() => setPrice(p)}
                      >
                        ${p}
                      </Button>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-slate-500">Recommended: $0.01 - $0.10 per article</p>
              </div>
            </CardContent>
          </Card>

          {/* Preview Card */}
          <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-purple-50/50 dark:from-blue-950/50 dark:to-purple-950/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-2xl">Article Preview</CardTitle>
              <CardDescription>How readers will see your article</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-lg">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-2xl font-bold">{title || "Your Article Title"}</h3>
                  <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                    ${price}
                  </Badge>
                </div>
                <p className="text-slate-700 dark:text-slate-300 mb-4">
                  {preview || "Your preview text will appear here..."}
                </p>
                <div className="flex gap-2">
                  <Button disabled className="bg-gradient-to-r from-blue-600 to-purple-600">
                    🔒 Unlock Anonymously
                  </Button>
                  <Button variant="outline" disabled>
                    More Info
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Publish Button */}
          <div className="flex flex-col items-center gap-4">
            {!isConnected && (
              <Card className="border-2 border-amber-500 bg-amber-50 dark:bg-amber-950/30">
                <CardContent className="pt-6">
                  <div className="flex gap-3 items-center">
                    <span className="text-2xl">⚠️</span>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      Please connect your wallet to publish articles
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            <Button
              size="lg"
              onClick={handlePublish}
              disabled={!title || !preview || !content || isPublishing || !isConnected}
              className="text-xl px-12 py-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-xl hover:shadow-2xl transition-all hover:scale-105 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPublishing ? (
                <>
                  <span className="mr-2">⏳</span> Publishing to Arbitrum...
                </>
              ) : (
                <>
                  <span className="mr-2">🚀</span> Publish to Blockchain
                </>
              )}
            </Button>

            {publishResult && (
              <Card className="border-2 border-green-500 bg-green-50 dark:bg-green-950/30 w-full max-w-2xl">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex gap-3 items-start">
                      <span className="text-3xl">✅</span>
                      <div className="flex-1">
                        <p className="font-bold text-xl text-green-900 dark:text-green-100 mb-2">
                          Article Published Successfully!
                        </p>
                        <div className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
                          <p>
                            <span className="font-semibold">Transaction:</span>{" "}
                            <a
                              href={`https://sepolia.arbiscan.io/tx/${publishResult.transactionHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-700 underline"
                            >
                              {publishResult.transactionHash.slice(0, 20)}...
                            </a>
                          </p>
                          <p>
                            <span className="font-semibold">Block:</span> {publishResult.blockNumber.toString()}
                          </p>
                          <p>
                            <span className="font-semibold">Gas Used:</span> {publishResult.gasUsed.toString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Info Card */}
          <Card className="border-0 shadow-lg bg-green-50 dark:bg-green-950/30">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <span className="text-2xl">ℹ️</span>
                <div className="space-y-2">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">What happens when you publish?</p>
                  <ul className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
                    <li>• Your article is stored on IPFS (decentralized storage)</li>
                    <li>• Article metadata is published to Arbitrum blockchain</li>
                    <li>• You earn instantly each time someone unlocks your article</li>
                    <li>• Gas costs: ~$0.002 (paid once)</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <span className="text-2xl">✅</span>
              Article Published Successfully!
            </DialogTitle>
            <DialogDescription className="space-y-3 pt-4">
              <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-lg space-y-2">
                <p className="font-semibold text-sm">Transaction Details</p>
                {publishResult && (
                  <>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Transaction:</span>
                        <a
                          href={`https://sepolia.arbiscan.io/tx/${publishResult.transactionHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline font-mono"
                        >
                          {publishResult.transactionHash.slice(0, 10)}...
                        </a>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">IPFS Hash:</span>
                        <a
                          href={`https://gateway.pinata.cloud/ipfs/${publishResult.ipfsHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline font-mono"
                        >
                          {publishResult.ipfsHash.slice(0, 15)}...
                        </a>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Gas Used:</span>
                        <span className="font-mono">{publishResult.gasUsed?.toString()}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Your article is now live and ready to earn! Readers can discover and unlock it anonymously.
              </p>
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 mt-4">
            <Button onClick={() => setShowSuccessDialog(false)} className="flex-1">
              Close
            </Button>
            <Link href="/" className="flex-1">
              <Button variant="outline" className="w-full">
                View Articles
              </Button>
            </Link>
          </div>
        </DialogContent>
      </Dialog>

      {/* Error Dialog */}
      <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <span className="text-2xl">❌</span>
              Publishing Failed
            </DialogTitle>
            <DialogDescription className="space-y-3 pt-4">
              <div className="bg-red-50 dark:bg-red-950/30 p-4 rounded-lg">
                <p className="text-sm text-red-900 dark:text-red-100 font-mono">
                  {errorMessage}
                </p>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Please try again or contact support if the issue persists.
              </p>
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => setShowErrorDialog(false)}>
            Close
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
