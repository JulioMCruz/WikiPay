import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔒</span>
            <span className="text-xl font-bold">WikiPay</span>
            <Badge variant="secondary" className="ml-2">Anonymous</Badge>
          </div>
          <div className="flex gap-4 items-center">
            <Link href="/publish">
              <Button variant="ghost">Publish</Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="ghost">Dashboard</Button>
            </Link>
            <ConnectButton />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Anonymous Content Payments
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-400 mb-8 max-w-2xl mx-auto">
          Pay $0.01-0.10 per article using zero-knowledge proofs.
          <br />
          <strong>Complete privacy.</strong> No tracking. No KYC.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/publish">
            <Button size="lg" className="text-lg">
              📝 Publish Article
            </Button>
          </Link>
          <Link href="#articles">
            <Button size="lg" variant="outline" className="text-lg">
              📖 Browse Articles
            </Button>
          </Link>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-16 bg-slate-100 dark:bg-slate-900 rounded-lg mb-16">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">👤</span>
                For Readers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p>1. Browse articles and previews</p>
              <p>2. Click &ldquo;Unlock Anonymously&rdquo;</p>
              <p>3. zkProof generated in browser (1-2 sec)</p>
              <p>4. Pay $0.01-0.10 with <strong>zero tracking</strong></p>
              <p>5. Read full article instantly</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">✍️</span>
                For Creators
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p>1. Write your article</p>
              <p>2. Set unlock price ($0.01-0.10)</p>
              <p>3. Publish to blockchain</p>
              <p>4. Earn instantly on each unlock</p>
              <p>5. Withdraw earnings anytime</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">🔐</span>
                Privacy Guarantee
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p>✅ No wallet address revealed</p>
              <p>✅ No payment history tracked</p>
              <p>✅ No KYC or signup required</p>
              <p>✅ Nullifiers prevent double-spend</p>
              <p>✅ Full zkSNARK cryptographic privacy</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Tech Highlights */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Built with Cutting-Edge Tech</h2>
        <div className="grid md:grid-cols-4 gap-6">
          <Card className="text-center">
            <CardHeader>
              <CardTitle>⚡ Arbitrum</CardTitle>
              <CardDescription>90% cheaper gas costs</CardDescription>
            </CardHeader>
          </Card>
          <Card className="text-center">
            <CardHeader>
              <CardTitle>🔒 zkSNARKs</CardTitle>
              <CardDescription>Plonky2 proofs in 1-2 sec</CardDescription>
            </CardHeader>
          </Card>
          <Card className="text-center">
            <CardHeader>
              <CardTitle>🚫 No Tracking</CardTitle>
              <CardDescription>Complete payment anonymity</CardDescription>
            </CardHeader>
          </Card>
          <Card className="text-center">
            <CardHeader>
              <CardTitle>💰 Low Fees</CardTitle>
              <CardDescription>&lt;$0.002 gas per unlock</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Recent Articles */}
      <section id="articles" className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Recent Articles</h2>
        <div className="text-center text-slate-600 dark:text-slate-400">
          <p className="mb-4">Connect your wallet to browse and unlock articles</p>
          <ConnectButton />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-slate-100 dark:bg-slate-900 py-8 mt-16">
        <div className="container mx-auto px-4 text-center text-slate-600 dark:text-slate-400">
          <p>Built with ❤️ for anonymous content creators</p>
          <p className="text-sm mt-2">Powered by Arbitrum + zkSNARKs</p>
        </div>
      </footer>
    </div>
  );
}
