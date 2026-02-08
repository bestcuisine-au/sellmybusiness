import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation */}
      <nav className="flex justify-between items-center px-6 py-4 max-w-7xl mx-auto">
        <div className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
          OwnerExit.ai
        </div>
        <div className="flex gap-4 items-center">
          <Link href="/price-guide" className="text-slate-300 hover:text-white transition">
            Free Price Guide
          </Link>
          <Link href="/login" className="text-slate-300 hover:text-white transition">
            Login
          </Link>
          <Link
            href="/signup"
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-block mb-6 px-4 py-2 bg-purple-500/20 rounded-full">
          <span className="text-purple-300 text-sm font-medium">🚀 Australia&apos;s First AI-Powered FSBO Platform</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
          Sell Your Business.
          <br />
          <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
            Keep the Commission.
          </span>
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
          Why pay a broker $50,000+ to sell your business? Our AI tools give you 
          everything you need to sell it yourself — professional listings, price guides, 
          and buyer management at a fraction of the cost.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Link
            href="/price-guide"
            className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white text-lg px-8 py-4 rounded-xl transition font-semibold"
          >
            Get Your Free Price Guide →
          </Link>
          <Link
            href="#how-it-works"
            className="border border-slate-600 text-slate-300 hover:bg-slate-800 text-lg px-8 py-4 rounded-xl transition"
          >
            See How It Works
          </Link>
        </div>
        
        {/* Trust Badges */}
        <div className="flex flex-wrap justify-center gap-8 text-slate-500">
          <div className="flex items-center gap-2">
            <span className="text-green-400">✓</span>
            <span>No listing fees</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-400">✓</span>
            <span>No commissions</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-400">✓</span>
            <span>AI-powered tools</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-400">✓</span>
            <span>Australian owned</span>
          </div>
        </div>
      </section>

      {/* How It Works - Video Section */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-white text-center mb-4">
          How It Works
        </h2>
        <p className="text-slate-400 text-center mb-12 max-w-2xl mx-auto">
          Watch how easy it is to list and sell your business without a broker
        </p>
        
        {/* Video Placeholder */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="aspect-video bg-slate-800/50 rounded-2xl border border-slate-700 flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-cyan-500/10"></div>
            <div className="text-center z-10">
              <div className="w-20 h-20 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 cursor-pointer hover:bg-purple-700 transition">
                <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                </svg>
              </div>
              <p className="text-slate-300 text-lg">Video Coming Soon</p>
              <p className="text-slate-500 text-sm mt-2">See the platform in action</p>
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold">1</div>
            <h3 className="text-lg font-semibold text-white mb-2">Get Your Price Guide</h3>
            <p className="text-slate-400 text-sm">Our AI analyzes your financials and gives you an instant price range.</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold">2</div>
            <h3 className="text-lg font-semibold text-white mb-2">Create Your Listing</h3>
            <p className="text-slate-400 text-sm">AI writes your description and generates a professional information memo.</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold">3</div>
            <h3 className="text-lg font-semibold text-white mb-2">Manage Buyers</h3>
            <p className="text-slate-400 text-sm">Handle inquiries, send NDAs, and track prospects all in one place.</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold">4</div>
            <h3 className="text-lg font-semibold text-white mb-2">Close the Deal</h3>
            <p className="text-slate-400 text-sm">Negotiate directly with buyers and keep 100% of your sale price.</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-white text-center mb-16">
          AI-Powered Tools That Sell
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700 hover:border-cyan-500/50 transition">
            <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center mb-4">
              <span className="text-2xl">💰</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">AI Price Guide</h3>
            <p className="text-slate-400 mb-4">
              Get an instant price range based on your financials, industry benchmarks, and market conditions.
            </p>
            <Link href="/price-guide" className="text-cyan-400 hover:text-cyan-300 font-medium">
              Try it free →
            </Link>
          </div>
          <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700 hover:border-purple-500/50 transition">
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4">
              <span className="text-2xl">✍️</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Smart Descriptions</h3>
            <p className="text-slate-400 mb-4">
              AI generates compelling listing descriptions that highlight your business strengths and attract qualified buyers.
            </p>
            <span className="text-purple-400 font-medium">Included in all plans</span>
          </div>
          <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700 hover:border-pink-500/50 transition">
            <div className="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center mb-4">
              <span className="text-2xl">📄</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Info Memo Generator</h3>
            <p className="text-slate-400 mb-4">
              Professional information memorandums created automatically — the same quality brokers charge thousands for.
            </p>
            <span className="text-pink-400 font-medium">Premium feature</span>
          </div>
        </div>
      </section>

      {/* Comparison - Why Not Use a Broker */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-white text-center mb-4">
          Why Sell It Yourself?
        </h2>
        <p className="text-slate-400 text-center mb-12 max-w-2xl mx-auto">
          Brokers charge 5-10% commission. On a $500K business, that&apos;s $25,000-$50,000 in fees.
        </p>
        
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8">
            <h3 className="text-xl font-semibold text-red-400 mb-4">Traditional Broker</h3>
            <ul className="space-y-3 text-slate-300">
              <li className="flex items-start gap-2"><span className="text-red-400">✗</span> 5-10% commission ($25K-$50K on $500K sale)</li>
              <li className="flex items-start gap-2"><span className="text-red-400">✗</span> Locked into 6-12 month contracts</li>
              <li className="flex items-start gap-2"><span className="text-red-400">✗</span> Limited control over your listing</li>
              <li className="flex items-start gap-2"><span className="text-red-400">✗</span> Broker represents multiple sellers</li>
              <li className="flex items-start gap-2"><span className="text-red-400">✗</span> You still do most of the work</li>
            </ul>
          </div>
          <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-8">
            <h3 className="text-xl font-semibold text-green-400 mb-4">OwnerExit.ai</h3>
            <ul className="space-y-3 text-slate-300">
              <li className="flex items-start gap-2"><span className="text-green-400">✓</span> Flat fee from $499 (save $24,801+)</li>
              <li className="flex items-start gap-2"><span className="text-green-400">✓</span> No lock-in, cancel anytime</li>
              <li className="flex items-start gap-2"><span className="text-green-400">✓</span> Full control over your sale</li>
              <li className="flex items-start gap-2"><span className="text-green-400">✓</span> AI tools work just for you</li>
              <li className="flex items-start gap-2"><span className="text-green-400">✓</span> Professional results, DIY pricing</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-white text-center mb-4">Simple Pricing</h2>
        <p className="text-slate-400 text-center mb-16">No commissions. No hidden fees. Just results.</p>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-slate-800/30 rounded-2xl p-8 border border-slate-700">
            <h3 className="text-lg font-semibold text-slate-400 mb-2">Starter</h3>
            <div className="text-4xl font-bold text-white mb-4">$499</div>
            <ul className="space-y-3 text-slate-300 mb-8">
              <li>✓ AI Price Guide</li>
              <li>✓ Basic listing page</li>
              <li>✓ AI description writer</li>
              <li>✓ Email inquiries</li>
              <li>✓ 90-day listing</li>
            </ul>
            <Link 
              href="/signup"
              className="block w-full text-center border border-slate-600 text-slate-300 py-3 rounded-lg hover:bg-slate-800 transition"
            >
              Get Started
            </Link>
          </div>
          <div className="bg-gradient-to-b from-purple-900/50 to-slate-800/50 rounded-2xl p-8 border border-purple-500/50 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-sm px-3 py-1 rounded-full">
              Most Popular
            </div>
            <h3 className="text-lg font-semibold text-purple-400 mb-2">Growth</h3>
            <div className="text-4xl font-bold text-white mb-4">$999</div>
            <ul className="space-y-3 text-slate-300 mb-8">
              <li>✓ Everything in Starter</li>
              <li>✓ Featured placement</li>
              <li>✓ Buyer CRM dashboard</li>
              <li>✓ NDA management</li>
              <li>✓ 180-day listing</li>
            </ul>
            <Link 
              href="/signup"
              className="block w-full text-center bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg transition"
            >
              Get Started
            </Link>
          </div>
          <div className="bg-slate-800/30 rounded-2xl p-8 border border-slate-700">
            <h3 className="text-lg font-semibold text-slate-400 mb-2">Premium</h3>
            <div className="text-4xl font-bold text-white mb-4">$1,999</div>
            <ul className="space-y-3 text-slate-300 mb-8">
              <li>✓ Everything in Growth</li>
              <li>✓ Info Memo Generator</li>
              <li>✓ Priority support</li>
              <li>✓ 3 months marketing included</li>
              <li>✓ 365-day listing</li>
            </ul>
            <Link 
              href="/signup"
              className="block w-full text-center border border-slate-600 text-slate-300 py-3 rounded-lg hover:bg-slate-800 transition"
            >
              Get Started
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <h2 className="text-4xl font-bold text-white mb-4">
          Ready to Sell Your Business?
        </h2>
        <p className="text-xl text-slate-400 mb-8">
          Start with a free AI price guide. No signup required.
        </p>
        <Link
          href="/price-guide"
          className="inline-block bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white text-lg px-10 py-4 rounded-xl transition font-semibold"
        >
          Get Your Free Price Guide →
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent mb-4">
                OwnerExit.ai
              </div>
              <p className="text-slate-500 text-sm">
                Australia&apos;s first AI-powered platform for selling your business yourself.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><Link href="/price-guide" className="hover:text-white transition">Free Price Guide</Link></li>
                <li><Link href="/signup" className="hover:text-white transition">List Your Business</Link></li>
                <li><Link href="#how-it-works" className="hover:text-white transition">How It Works</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><Link href="/about" className="hover:text-white transition">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-white transition">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-center text-slate-500 text-sm">
            <p>© 2026 OwnerExit.ai — Sell smarter, not harder. Australian owned and operated.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
