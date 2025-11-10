"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { getArticle, unlockArticle, checkIfUnlocked } from "@/lib/contract";
import { simpleDecrypt } from "@/lib/encryption";
import { useAccount } from "wagmi";
import { formatEther } from "viem";

export default function ArticlePage() {
  const params = useParams();
  const articleId = params.id as string;
  const { isConnected } = useAccount();

  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unlocking, setUnlocking] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);

  // Dialog states
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [showContentDialog, setShowContentDialog] = useState(false);
  const [unlockResult, setUnlockResult] = useState<any>(null);
  const [fullContent, setFullContent] = useState<string>("");

  useEffect(() => {
    loadArticle();
  }, [articleId]);

  useEffect(() => {
    // Check unlock status when wallet connects or article loads
    if (isConnected && article) {
      checkUnlockStatus();
    }
  }, [isConnected, article]);

  const checkUnlockStatus = async () => {
    if (!isConnected || !article) {
      setIsUnlocked(false);
      return;
    }

    try {
      console.log("🔍 Checking if article is unlocked...");

      // Check on-chain if this wallet has unlocked this article
      const unlocked = await checkIfUnlocked(BigInt(articleId));
      console.log("Unlocked status:", unlocked);

      setIsUnlocked(unlocked);

      // If unlocked, load content from IPFS
      if (unlocked) {
        console.log("📥 Loading content from IPFS:", article.ipfsHash);
        const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${article.ipfsHash}`;
        const response = await fetch(ipfsUrl);

        if (response.ok) {
          const data = await response.json();
          console.log("📄 IPFS data loaded:", data);

          // Decrypt content if encrypted, otherwise use plaintext
          let content = "";
          if (data.encrypted && data.iv && data.encryptionKey) {
            console.log("🔓 Decrypting content...");
            content = await simpleDecrypt(data.encrypted, data.iv, data.encryptionKey);
            console.log("✅ Content decrypted successfully");
          } else {
            content = data.content || data.fullContent || "";
          }

          setFullContent(content);
        } else {
          console.error("Failed to fetch IPFS content:", response.status);
        }
      }
    } catch (err) {
      console.error("Error checking unlock status:", err);
      setIsUnlocked(false);
    }
  };

  const loadArticle = async () => {
    try {
      setLoading(true);
      setError(null);

      const articleData = await getArticle(BigInt(articleId));
      setArticle(articleData);

    } catch (err: any) {
      console.error("Error loading article:", err);
      setError(err.message || "Failed to load article");
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = async () => {
    if (!article) return;

    try {
      setUnlocking(true);

      // Call unlock with ZK proof
      const result = await unlockArticle(BigInt(articleId), article.price);

      // Fetch IPFS content using article's ipfsHash
      const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${article.ipfsHash}`;

      console.log("📥 Fetching content from IPFS:", ipfsUrl);

      // Fetch full article from IPFS
      const response = await fetch(ipfsUrl);

      if (!response.ok) {
        throw new Error(`Failed to fetch IPFS content: ${response.statusText}`);
      }

      const data = await response.json();

      console.log("📄 IPFS data:", data);

      // Decrypt content if encrypted, otherwise use plaintext
      let content = "";
      if (data.encrypted && data.iv && data.encryptionKey) {
        console.log("🔓 Decrypting content...");
        content = await simpleDecrypt(data.encrypted, data.iv, data.encryptionKey);
        console.log("✅ Content decrypted successfully");
      } else {
        content = data.content || data.fullContent || "Content structure not recognized";
      }

      setUnlockResult(result);
      setFullContent(content);
      setIsUnlocked(true);
      setShowSuccessDialog(true);

      // Reload article to update unlock count
      await loadArticle();

    } catch (err: any) {
      console.error("Error unlocking article:", err);
      setError(err.message || "Failed to unlock article");
      setShowErrorDialog(true);
    } finally {
      setUnlocking(false);
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
            <Link href="/publish">
              <Button variant="ghost" className="hover:bg-purple-50 dark:hover:bg-slate-800">Publish</Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="ghost" className="hover:bg-purple-50 dark:hover:bg-slate-800">Dashboard</Button>
            </Link>
            <ConnectButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-slate-600 dark:text-slate-400">Loading article...</p>
          </div>
        )}

        {error && (
          <Card className="border-red-200 bg-red-50 dark:bg-red-950/30">
            <CardContent className="pt-6">
              <p className="text-red-600 dark:text-red-400">❌ {error}</p>
              <Link href="/">
                <Button className="mt-4">← Back to Articles</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {article && !loading && !error && (
          <div className="space-y-6">
            {/* Article Header */}
            <div>
              <Link href="/">
                <Button variant="ghost" className="mb-4">← Back to Articles</Button>
              </Link>
              <h1 className="text-4xl font-black mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Article #{articleId}
              </h1>
            </div>

            {/* Article Preview Card */}
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-2xl">Preview</CardTitle>
                  <Badge variant="secondary" className="text-lg px-4 py-2">
                    {formatEther(article.price)} ETH
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="prose dark:prose-invert max-w-none">
                  <p className="text-slate-700 dark:text-slate-300 text-lg leading-relaxed">
                    {article.preview}
                  </p>
                </div>

                {/* Article Info */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Creator</p>
                    <p className="font-mono text-sm">{article.creator.slice(0, 10)}...{article.creator.slice(-8)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Unlocks</p>
                    <p className="font-semibold">{article.unlocks.toString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">IPFS</p>
                    <a
                      href={`https://gateway.pinata.cloud/ipfs/${article.ipfsHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-sm text-blue-600 hover:underline"
                    >
                      {article.ipfsHash.slice(0, 15)}...
                    </a>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Published</p>
                    <p className="text-sm">{new Date(Number(article.timestamp) * 1000).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Unlock Button / Already Unlocked */}
                <div className="border-t pt-6">
                  {isUnlocked ? (
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 p-6 rounded-lg">
                      <h3 className="text-xl font-bold mb-2 text-green-600">✅ Article Unlocked</h3>
                      <p className="text-slate-600 dark:text-slate-400 mb-4">
                        You have already unlocked this article
                      </p>
                      <Button
                        onClick={() => setShowContentDialog(true)}
                        size="lg"
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                      >
                        📖 Read Full Article
                      </Button>
                    </div>
                  ) : (
                    <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 p-6 rounded-lg">
                      <h3 className="text-xl font-bold mb-2">🔒 Full Article Locked</h3>
                      <p className="text-slate-600 dark:text-slate-400 mb-4">
                        Unlock the full content anonymously for {formatEther(article.price)} ETH
                      </p>
                      {!isConnected ? (
                        <div>
                          <p className="text-sm text-amber-600 dark:text-amber-400 mb-3">
                            Please connect your wallet to unlock
                          </p>
                          <ConnectButton />
                        </div>
                      ) : (
                        <Button
                          onClick={handleUnlock}
                          size="lg"
                          disabled={unlocking}
                          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        >
                          {unlocking ? "🔓 Unlocking..." : `🔓 Unlock Anonymously for ${formatEther(article.price)} ETH`}
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {/* Privacy Features */}
                <div className="border-t pt-6">
                  <h4 className="font-semibold mb-3">🛡️ Privacy Features</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-green-600 border-green-600">✓</Badge>
                      <span className="text-sm">Zero-knowledge proof</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-green-600 border-green-600">✓</Badge>
                      <span className="text-sm">Wallet hidden</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-green-600 border-green-600">✓</Badge>
                      <span className="text-sm">No tracking</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-green-600 border-green-600">✓</Badge>
                      <span className="text-sm">Instant access</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <span className="text-2xl">🎉</span>
              Article Unlocked Successfully!
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-lg space-y-3">
              <p className="font-semibold text-sm">Transaction Details</p>
              {unlockResult && (
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">Transaction:</span>
                    <a
                      href={`https://sepolia.arbiscan.io/tx/${unlockResult.transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline font-mono"
                    >
                      {unlockResult.transactionHash.slice(0, 10)}...{unlockResult.transactionHash.slice(-8)}
                    </a>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">Block:</span>
                    <span className="font-mono">{unlockResult.blockNumber?.toString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">Gas Used:</span>
                    <span className="font-mono">{unlockResult.gasUsed?.toString()}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-purple-50 dark:bg-purple-950/30 p-4 rounded-lg space-y-2">
              <p className="font-semibold text-sm">🛡️ Privacy Confirmed</p>
              <div className="text-xs space-y-1">
                <p className="text-slate-600 dark:text-slate-400">✓ Your wallet address is hidden from the public</p>
                <p className="text-slate-600 dark:text-slate-400">✓ Zero-knowledge proof verified on-chain</p>
                <p className="text-slate-600 dark:text-slate-400">✓ Payment processed anonymously</p>
              </div>
            </div>

            <Button
              onClick={() => {
                setShowSuccessDialog(false);
                setShowContentDialog(true);
              }}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              📖 Read Full Article
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Error Dialog */}
      <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <span className="text-2xl">❌</span>
              Unlock Failed
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-4">
            <div className="bg-red-50 dark:bg-red-950/30 p-4 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
            <Button
              onClick={() => setShowErrorDialog(false)}
              variant="outline"
              className="w-full"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Full Content Dialog */}
      <Dialog open={showContentDialog} onOpenChange={setShowContentDialog}>
        <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-2xl">📖</span>
              Article #{articleId} - Full Content
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-lg border border-slate-200 dark:border-slate-800">
              <article className="prose prose-slate dark:prose-invert max-w-none
                prose-headings:font-bold prose-headings:tracking-tight
                prose-h1:text-4xl prose-h1:mb-6 prose-h1:mt-0 prose-h1:border-b prose-h1:border-slate-200 dark:prose-h1:border-slate-800 prose-h1:pb-4
                prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-h2:border-b prose-h2:border-slate-100 dark:prose-h2:border-slate-800 prose-h2:pb-2
                prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3
                prose-p:text-base prose-p:leading-7 prose-p:text-slate-700 dark:prose-p:text-slate-300 prose-p:mb-4
                prose-strong:font-semibold prose-strong:text-slate-900 dark:prose-strong:text-slate-100
                prose-code:text-sm prose-code:bg-purple-50 dark:prose-code:bg-purple-950/30 prose-code:text-purple-700 dark:prose-code:text-purple-300 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-code:before:content-[''] prose-code:after:content-['']
                prose-pre:bg-slate-900 dark:prose-pre:bg-slate-950 prose-pre:border prose-pre:border-slate-700 dark:prose-pre:border-slate-800 prose-pre:rounded-lg prose-pre:p-4 prose-pre:overflow-x-auto
                prose-pre:shadow-lg
                prose-ul:my-4 prose-ul:list-disc prose-ul:pl-6 prose-li:text-slate-700 dark:prose-li:text-slate-300 prose-li:my-1
                prose-ol:my-4 prose-ol:list-decimal prose-ol:pl-6
                prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
                prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-slate-600 dark:prose-blockquote:text-slate-400
                prose-hr:border-slate-200 dark:prose-hr:border-slate-800 prose-hr:my-8
                prose-table:border prose-table:border-slate-200 dark:prose-table:border-slate-800
                prose-th:bg-slate-50 dark:prose-th:bg-slate-800 prose-th:font-semibold
                prose-td:border prose-td:border-slate-200 dark:prose-td:border-slate-800
              ">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code: ({ node, inline, className, children, ...props }: any) => {
                      if (inline) {
                        return <code className={className} {...props}>{children}</code>
                      }
                      return (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      )
                    }
                  }}
                >
                  {fullContent}
                </ReactMarkdown>
              </article>
            </div>

            {article && (
              <div className="flex items-center justify-between pt-4 border-t">
                <Badge variant="secondary">Unlocked with ZK Proof</Badge>
                <a
                  href={`https://gateway.pinata.cloud/ipfs/${article.ipfsHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  View on IPFS →
                </a>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
