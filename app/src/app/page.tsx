import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation */}
      <nav className="flex justify-between items-center px-6 py-4 max-w-7xl mx-auto">
        <div className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
          OwnerExit.ai
        </div>
        <div className="flex gap-4">
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
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-32 text-center">
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
          Sell Your Business.
          <br />
          <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
            Skip the Broker.
          </span>
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
          Australia&apos;s first AI-powered platform for selling your business yourself.
          Save 5-10% on broker commissions with intelligent tools that do the heavy lifting.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/signup"
            className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white text-lg px-8 py-4 rounded-xl transition font-semibold"
          >
            List Your Business Free
          </Link>
          <Link
            href="#how-it-works"
            className="border border-slate-600 text-slate-300 hover:bg-slate-800 text-lg px-8 py-4 rounded-xl transition"
          >
            See How It Works
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-white text-center mb-16">
          AI-Powered Tools That Sell
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700">
            <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center mb-4">
              <span className="text-2xl">💰</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">AI Price Guide</h3>
            <p className="text-slate-400">
              Get an instant price range based on your financials, industry benchmarks, and market conditions.
            </p>
          </div>
          <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700">
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4">
              <span className="text-2xl">✍️</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Smart Descriptions</h3>
            <p className="text-slate-400">
              AI generates compelling listing descriptions that highlight your business strengths.
            </p>
          </div>
          <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700">
            <div className="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center mb-4">
              <span className="text-2xl">📄</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Info Memo Generator</h3>
            <p className="text-slate-400">
              Professional information memorandums created automatically for serious buyers.
            </p>
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
            <div className="text-4xl font-bold text-white mb-4">$199</div>
            <ul className="space-y-3 text-slate-300 mb-8">
              <li>✓ AI Price Guide</li>
              <li>✓ Basic listing page</li>
              <li>✓ Email inquiries</li>
              <li>✓ 90-day listing</li>
            </ul>
            <button className="w-full border border-slate-600 text-slate-300 py-3 rounded-lg hover:bg-slate-800 transition">
              Coming Soon
            </button>
          </div>
          <div className="bg-gradient-to-b from-purple-900/50 to-slate-800/50 rounded-2xl p-8 border border-purple-500/50 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-sm px-3 py-1 rounded-full">
              Popular
            </div>
            <h3 className="text-lg font-semibold text-purple-400 mb-2">Growth</h3>
            <div className="text-4xl font-bold text-white mb-4">$499</div>
            <ul className="space-y-3 text-slate-300 mb-8">
              <li>✓ Everything in Starter</li>
              <li>✓ AI Description Writer</li>
              <li>✓ Featured placement</li>
              <li>✓ 180-day listing</li>
            </ul>
            <button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg transition">
              Coming Soon
            </button>
          </div>
          <div className="bg-slate-800/30 rounded-2xl p-8 border border-slate-700">
            <h3 className="text-lg font-semibold text-slate-400 mb-2">Premium</h3>
            <div className="text-4xl font-bold text-white mb-4">$899</div>
            <ul className="space-y-3 text-slate-300 mb-8">
              <li>✓ Everything in Growth</li>
              <li>✓ Info Memo Generator</li>
              <li>✓ NDA Management</li>
              <li>✓ 365-day listing</li>
            </ul>
            <button className="w-full border border-slate-600 text-slate-300 py-3 rounded-lg hover:bg-slate-800 transition">
              Coming Soon
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-6 text-center text-slate-500">
          <p>© 2026 OwnerExit.ai — Sell smarter, not harder.</p>
        </div>
      </footer>
    </main>
  );
}
