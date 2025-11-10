import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-200/50 dark:border-slate-800/50 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
              <span className="text-xl">🔒</span>
            </div>
            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">WikiPay</span>
              <Badge variant="secondary" className="ml-2 text-xs">Anonymous</Badge>
            </div>
          </div>
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

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-32 text-center relative">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10">
          <Badge variant="outline" className="text-sm px-4 py-1.5 mb-6 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/50 backdrop-blur-sm">
            🚀 Powered by Arbitrum Stylus + zkSNARKs
          </Badge>

          <h1 className="text-7xl md:text-8xl font-black mb-8 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent leading-tight tracking-tight">
            Anonymous<br/>Content Payments
          </h1>

          <p className="text-2xl md:text-3xl text-slate-700 dark:text-slate-300 mb-6 max-w-4xl mx-auto font-semibold">
            Pay $0.01-0.10 per article using zero-knowledge proofs
          </p>

          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            <span className="font-semibold text-slate-900 dark:text-slate-100">Complete privacy.</span> No tracking. No KYC. No signup required.
          </p>

          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/publish">
              <Button size="lg" className="text-lg px-10 py-7 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-xl hover:shadow-2xl transition-all hover:scale-105 rounded-xl">
                <span className="mr-2">📝</span> Publish Article
              </Button>
            </Link>
            <Link href="/articles">
              <Button size="lg" variant="outline" className="text-lg px-10 py-7 border-2 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-lg hover:shadow-xl transition-all hover:scale-105 rounded-xl">
                <span className="mr-2">📖</span> Browse Articles
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-6 py-24">
        <div className="text-center mb-20">
          <h2 className="text-5xl font-black mb-4 bg-gradient-to-r from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-400 bg-clip-text text-transparent">
            How It Works
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Simple, secure, and completely anonymous
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* For Readers Card */}
          <Card className="group relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/50 dark:to-slate-900/50 backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-purple-600/5 group-hover:from-blue-600/10 group-hover:to-purple-600/10 transition-all"></div>
            <CardHeader className="relative pb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform">
                <span className="text-4xl">👤</span>
              </div>
              <CardTitle className="text-3xl font-bold mb-2">For Readers</CardTitle>
              <CardDescription className="text-base text-slate-700 dark:text-slate-300">Unlock content anonymously</CardDescription>
            </CardHeader>
            <CardContent className="relative space-y-4">
              {[
                "Browse articles and previews",
                'Click "Unlock Anonymously"',
                "zkProof generated in browser (1-2 sec)",
                "Pay $0.01-0.10 with zero tracking",
                "Read full article instantly"
              ].map((text, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-md">
                    {i + 1}
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed pt-1">{text}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* For Creators Card */}
          <Card className="group relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/50 dark:to-slate-900/50 backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-pink-600/5 group-hover:from-purple-600/10 group-hover:to-pink-600/10 transition-all"></div>
            <CardHeader className="relative pb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform">
                <span className="text-4xl">✍️</span>
              </div>
              <CardTitle className="text-3xl font-bold mb-2">For Creators</CardTitle>
              <CardDescription className="text-base text-slate-700 dark:text-slate-300">Earn from your content</CardDescription>
            </CardHeader>
            <CardContent className="relative space-y-4">
              {[
                "Write your article",
                "Set unlock price ($0.01-0.10)",
                "Publish to blockchain",
                "Earn instantly on each unlock",
                "Withdraw earnings anytime"
              ].map((text, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center text-sm shadow-md">
                    {i + 1}
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed pt-1">{text}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Privacy Guarantee Card */}
          <Card className="group relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/50 dark:to-slate-900/50 backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-br from-green-600/5 to-emerald-600/5 group-hover:from-green-600/10 group-hover:to-emerald-600/10 transition-all"></div>
            <CardHeader className="relative pb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform">
                <span className="text-4xl">🔐</span>
              </div>
              <CardTitle className="text-3xl font-bold mb-2">Privacy Guarantee</CardTitle>
              <CardDescription className="text-base text-slate-700 dark:text-slate-300">Complete anonymity</CardDescription>
            </CardHeader>
            <CardContent className="relative space-y-4">
              {[
                "No wallet address revealed",
                "No payment history tracked",
                "No KYC or signup required",
                "Nullifiers prevent double-spend",
                "Full zkSNARK cryptographic privacy"
              ].map((text, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <span className="text-2xl text-green-600 dark:text-green-400 flex-shrink-0">✅</span>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed pt-1">{text}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Tech Highlights */}
      <section className="relative py-24 overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-100/50 to-transparent dark:via-slate-900/50"></div>

        <div className="container mx-auto px-6 relative">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-black mb-4 bg-gradient-to-r from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-400 bg-clip-text text-transparent">
              Built with Cutting-Edge Tech
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Leveraging the latest in blockchain and cryptography
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {/* Arbitrum Stylus */}
            <Card className="group text-center border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm hover:-translate-y-2">
              <CardHeader className="pb-6">
                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                  <span className="text-5xl">⚡</span>
                </div>
                <CardTitle className="text-2xl font-bold mb-3">Arbitrum Stylus</CardTitle>
                <CardDescription className="text-base text-slate-700 dark:text-slate-300">
                  <span className="text-2xl font-black bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">90%</span>
                  <br/>cheaper gas costs
                </CardDescription>
              </CardHeader>
            </Card>

            {/* zkSNARKs */}
            <Card className="group text-center border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm hover:-translate-y-2">
              <CardHeader className="pb-6">
                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                  <span className="text-5xl">🔒</span>
                </div>
                <CardTitle className="text-2xl font-bold mb-3">zkSNARKs</CardTitle>
                <CardDescription className="text-base text-slate-700 dark:text-slate-300">
                  Plonky2 proofs in
                  <br/><span className="text-2xl font-black bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">1-2 sec</span>
                </CardDescription>
              </CardHeader>
            </Card>

            {/* No Tracking */}
            <Card className="group text-center border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm hover:-translate-y-2">
              <CardHeader className="pb-6">
                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                  <span className="text-5xl">🚫</span>
                </div>
                <CardTitle className="text-2xl font-bold mb-3">No Tracking</CardTitle>
                <CardDescription className="text-base text-slate-700 dark:text-slate-300">
                  <span className="text-2xl font-black bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">Complete</span>
                  <br/>payment anonymity
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Low Fees */}
            <Card className="group text-center border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm hover:-translate-y-2">
              <CardHeader className="pb-6">
                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                  <span className="text-5xl">💰</span>
                </div>
                <CardTitle className="text-2xl font-bold mb-3">Low Fees</CardTitle>
                <CardDescription className="text-base text-slate-700 dark:text-slate-300">
                  <span className="text-2xl font-black bg-gradient-to-r from-amber-600 to-amber-400 bg-clip-text text-transparent">&lt;$0.002</span>
                  <br/>gas per unlock
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Recent Articles */}
      <section id="articles" className="container mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-black mb-4 bg-gradient-to-r from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-400 bg-clip-text text-transparent">
            Recent Articles
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-8">
            Discover premium content with anonymous payments
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/articles">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-xl">
                <span className="mr-2">📖</span> View All Articles
              </Button>
            </Link>
            <div className="inline-block p-1 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 shadow-xl">
              <div className="bg-white dark:bg-slate-950 rounded-xl p-2">
                <ConnectButton />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-slate-200/50 dark:border-slate-800/50 bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 py-16">
        <div className="container mx-auto px-6">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
                <span className="text-2xl">🔒</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">WikiPay</span>
            </div>
            <p className="text-lg text-slate-700 dark:text-slate-300 mb-2">
              Built with ❤️ for anonymous content creators
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Powered by Arbitrum Stylus + zkSNARKs
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-8 text-sm mb-8">
            <a href="https://docs.arbitrum.io/stylus/stylus-gentle-introduction" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors font-medium">
              Learn about Stylus →
            </a>
            <a href="#" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors font-medium">
              Documentation →
            </a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors font-medium">
              GitHub →
            </a>
          </div>

          <div className="text-center text-xs text-slate-500 dark:text-slate-500">
            <p>Contract: 0xab60...72b3 • Arbitrum Sepolia Testnet</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
