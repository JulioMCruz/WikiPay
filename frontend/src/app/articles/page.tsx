"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { getTotalArticles, getArticle } from "@/lib/contract";
import { formatEther } from "viem";

interface Article {
  id: number;
  creator: string;
  price: bigint;
  unlocks: bigint;
  preview: string;
}

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    console.log("📖 Loading articles from blockchain...");
    setIsLoading(true);
    setError(null);

    try {
      // Get total number of articles
      const total = await getTotalArticles();
      console.log("Total articles:", total.toString());

      if (total === 0n) {
        console.log("No articles found");
        setArticles([]);
        setIsLoading(false);
        return;
      }

      // Fetch all articles
      const articlePromises: Promise<Article>[] = [];
      for (let i = 0n; i < total; i++) {
        articlePromises.push(
          getArticle(i).then((article) => ({
            id: Number(i),
            creator: article.creator,
            price: article.price,
            unlocks: article.unlocks,
            preview: article.preview
          }))
        );
      }

      const loadedArticles = await Promise.all(articlePromises);
      console.log("✅ Loaded", loadedArticles.length, "articles");
      console.log("Articles:", loadedArticles);

      setArticles(loadedArticles);
    } catch (err: any) {
      console.error("❌ Error loading articles:", err);
      setError(err.message || "Failed to load articles");
    } finally {
      setIsLoading(false);
    }
  };

  // Extract title from preview (assuming format: "# Title\n\nContent...")
  const extractTitle = (preview: string): string => {
    const lines = preview.split('\n');
    const firstLine = lines[0] || '';

    // Check if first line is markdown header
    if (firstLine.startsWith('# ')) {
      return firstLine.substring(2).trim();
    }

    // Otherwise use first 50 chars
    return preview.substring(0, 50) + (preview.length > 50 ? '...' : '');
  };

  // Get preview text (skip title if present)
  const getPreviewText = (preview: string): string => {
    const lines = preview.split('\n');

    // If starts with markdown header, skip it and get rest
    if (lines[0]?.startsWith('# ')) {
      const remaining = lines.slice(1).join('\n').trim();
      return remaining.substring(0, 200) + (remaining.length > 200 ? '...' : '');
    }

    return preview.substring(0, 200) + (preview.length > 200 ? '...' : '');
  };

  // Convert price from wei to USD
  // Note: Contract stores USD values as ETH denomination (e.g., $0.05 stored as 0.05 ETH worth of wei)
  const priceToUSD = (priceWei: bigint): string => {
    const priceETH = parseFloat(formatEther(priceWei));
    const priceUSD = priceETH * 3646.56; // Current ETH price: $3,646.56
    return priceUSD.toFixed(2);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-200/50 dark:border-slate-800/50 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
              <span className="text-xl">🔒</span>
            </div>
            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">zkWiki</span>
              <Badge variant="secondary" className="ml-2 text-xs">Anonymous</Badge>
            </div>
          </Link>
          <div className="flex gap-2 items-center">
            <Link href="/publish">
              <Button variant="ghost" className="hover:bg-blue-50 dark:hover:bg-slate-800">Publish</Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="ghost" className="hover:bg-purple-50 dark:hover:bg-slate-800">Dashboard</Button>
            </Link>
            <ConnectButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-5xl font-black mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Browse Articles
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400">
            Discover and unlock premium content anonymously
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-lg text-slate-600 dark:text-slate-400">Loading articles from blockchain...</p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <Card className="border-2 border-red-500 bg-red-50 dark:bg-red-950/30">
            <CardContent className="pt-6">
              <div className="flex gap-3 items-start">
                <span className="text-3xl">❌</span>
                <div>
                  <p className="font-bold text-xl text-red-900 dark:text-red-100 mb-2">
                    Error Loading Articles
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                  <Button onClick={loadArticles} className="mt-4" variant="outline">
                    Try Again
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!isLoading && !error && articles.length === 0 && (
          <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
            <CardContent className="pt-12 pb-12 text-center">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-2xl font-bold mb-2">No Articles Yet</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Be the first to publish an article!
              </p>
              <Link href="/publish">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600">
                  Publish Your First Article
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Articles Grid */}
        {!isLoading && !error && articles.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <Card
                key={article.id}
                className="group border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm hover:-translate-y-2"
              >
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                      ${priceToUSD(article.price)}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {article.unlocks.toString()} unlocks
                    </Badge>
                  </div>
                  <CardTitle className="text-2xl font-bold leading-tight line-clamp-2">
                    {extractTitle(article.preview)}
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                    by {article.creator.slice(0, 6)}...{article.creator.slice(-4)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-700 dark:text-slate-300 mb-4 line-clamp-3">
                    {getPreviewText(article.preview)}
                  </p>
                  <div className="flex gap-2">
                    <Link href={`/articles/${article.id}`} className="flex-1">
                      <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                        🔒 Unlock Anonymously
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Info Card */}
        {!isLoading && articles.length > 0 && (
          <Card className="mt-8 border-0 shadow-lg bg-blue-50 dark:bg-blue-950/30">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <span className="text-2xl">ℹ️</span>
                <div className="space-y-2">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">How to unlock articles</p>
                  <ul className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
                    <li>• Click "Unlock Anonymously" on any article</li>
                    <li>• Your wallet generates a zero-knowledge proof (1-2 seconds)</li>
                    <li>• Pay the unlock fee anonymously - no one can trace it to you</li>
                    <li>• Read the full article instantly</li>
                    <li>• Your payment goes directly to the creator</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
