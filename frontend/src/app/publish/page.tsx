"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ConnectButton } from "@rainbow-me/rainbowkit";

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
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [preview, setPreview] = useState("");
  const [price, setPrice] = useState("0.05");
  const [isPublishing, setIsPublishing] = useState(false);

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

    try {
      setIsPublishing(true);
      console.log("📝 Publishing state set to true");

      // TODO: Implement blockchain publish logic
      console.log("⏳ Simulating blockchain transaction...");

      await new Promise((resolve) => {
        setTimeout(() => {
          console.log("✅ Blockchain transaction simulated");
          resolve(undefined);
        }, 2000);
      });

      console.log("🎉 Article published successfully!");
      alert("Article published successfully!");

    } catch (error) {
      console.error("❌ Error publishing article:", error);
      alert("Error publishing article. Check console for details.");
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
                    📝 X402 Article (Detailed)
                  </Button>
                  <Button
                    onClick={() => loadExample("quickTest")}
                    variant="outline"
                    className="bg-white dark:bg-slate-900"
                  >
                    ⚡ Quick Test (Short)
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
          <div className="flex justify-center">
            <Button
              size="lg"
              onClick={handlePublish}
              disabled={!title || !preview || !content || isPublishing}
              className="text-xl px-12 py-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-xl hover:shadow-2xl transition-all hover:scale-105 rounded-xl"
            >
              {isPublishing ? (
                <>
                  <span className="mr-2">⏳</span> Publishing...
                </>
              ) : (
                <>
                  <span className="mr-2">🚀</span> Publish to Blockchain
                </>
              )}
            </Button>
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
    </div>
  );
}
