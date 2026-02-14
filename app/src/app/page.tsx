import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">

      {/* ═══════════ NAVIGATION ═══════════ */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/50">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
          <a href="/" className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-green-400 bg-clip-text text-transparent">
            OwnerExit.ai
          </a>
          <div className="flex items-center gap-6">
            <a href="#how-it-works" className="text-sm text-slate-400 hover:text-white transition hidden sm:inline">How It Works</a>
            <a href="#pricing" className="text-sm text-slate-400 hover:text-white transition hidden sm:inline">Pricing</a>
            <a href="/price-guide" className="text-sm text-slate-400 hover:text-white transition hidden sm:inline">Free Appraisal</a>
            <a href="/login" className="text-sm px-4 py-2 rounded-lg border border-slate-600 text-white hover:border-cyan-400 transition">Log In</a>
            <a href="/signup" className="text-sm px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-green-500 text-white font-medium hover:opacity-90 transition">Sign Up</a>
          </div>
        </div>
      </nav>

      {/* ═══════════ HERO ═══════════ */}
      <section className="relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-green-500/10 rounded-full blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-6 pt-40 pb-24 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6">
            Sell Your Business Like a Pro
            <br />
            <span className="bg-gradient-to-r from-cyan-400 to-green-400 bg-clip-text text-transparent">
              Without the Broker Commission
            </span>
          </h1>

          <p className="max-w-3xl mx-auto text-lg md:text-xl text-slate-300 mb-10">
            Australia&apos;s first AI-powered FSBO platform. Build stunning Information
            Memorandums, syndicate to SEEK&nbsp;Business and major portals, and manage
            buyers&nbsp;&mdash;&nbsp;all for a flat fee.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-14">
            <Link
              href="/price-guide"
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-green-500 text-white font-semibold text-lg hover:opacity-90 transition shadow-lg shadow-cyan-500/20"
            >
              Get Your Free Appraisal
            </Link>
            <a
              href="#how-it-works"
              className="px-8 py-4 rounded-xl border border-slate-600 text-slate-200 font-semibold text-lg hover:border-cyan-400 hover:text-white transition"
            >
              See How It Works
            </a>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-400">
            <span className="flex items-center gap-2">
              <span className="text-xl">🇦🇺</span> Australian Owned
            </span>
            <span className="hidden sm:inline text-slate-700">·</span>
            <span className="flex items-center gap-2">
              <span className="text-xl">🧠</span> AI-Powered
            </span>
            <span className="hidden sm:inline text-slate-700">·</span>
            <span className="flex items-center gap-2">
              <span className="text-xl">🌐</span> Syndicated to Major Portals
            </span>
          </div>
        </div>
      </section>

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      <section id="how-it-works" className="py-24 bg-slate-900/60">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            How It Works
          </h2>
          <p className="text-slate-400 text-center mb-16 max-w-2xl mx-auto">
            Five simple steps from appraisal to sold — with AI doing the heavy lifting.
          </p>

          <div className="space-y-12 md:space-y-0 md:grid md:grid-cols-3 md:gap-8">
            {[
              {
                num: "1",
                icon: "📊",
                title: "Get Your Free AI Appraisal",
                desc: "Instantly know what your business is worth. Our AI analyses your industry, revenue, and market to provide an indicative price range.",
              },
              {
                num: "2",
                icon: "📝",
                title: "Build Your Information Memorandum",
                desc: "Our AI WYSIWYG builder creates a professional, multimedia IM as a live web page. Watch it come together section by section. What you see is what buyers see.",
              },
              {
                num: "3",
                icon: "📋",
                title: "Create Your Listing",
                desc: "AI generates a compelling public listing with optimised copy for each platform. You review and approve before anything goes live.",
              },
              {
                num: "4",
                icon: "🚀",
                title: "Distribute Everywhere",
                desc: "One click syndicates your listing to SEEK Business, BizBuySell, Commercial Real Estate, and more. Your IM stays private — only the listing goes public.",
              },
              {
                num: "5",
                icon: "🔐",
                title: "Manage Buyers Securely",
                desc: "Send NDAs, grant password-protected IM access, track who\u2019s viewing what sections, and auto-chase unresponsive buyers.",
              },
              {
                num: "6",
                icon: "🤝",
                title: "Close the Deal",
                desc: "Review buyer notes, manage negotiations in the deal room, and get real-time analytics on buyer engagement.",
              },
            ].map((step) => (
              <div key={step.num} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-green-500/20 border border-cyan-500/30 mb-4 text-3xl">
                  {step.icon}
                </div>
                <div className="text-xs font-bold text-cyan-400 mb-2 tracking-widest uppercase">
                  Step {step.num}
                </div>
                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ FEATURE SHOWCASE ═══════════ */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Everything You Need to Sell&nbsp;Smarter
          </h2>
          <p className="text-slate-400 text-center mb-16 max-w-2xl mx-auto">
            Tools that were previously locked behind expensive broker agreements —
            now available to every business owner.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: "🧠",
                title: "AI-Powered WYSIWYG Information Memorandums",
                desc: "Not a PDF — a living, breathing web page. Our AI writes compelling content for each section. You edit inline, drag-drop photos, embed video. Buyers see a professional, multimedia document with password-protected access and full view tracking.",
              },
              {
                icon: "🌐",
                title: "Syndicated to Major Business-for-Sale Portals",
                desc: "For the first time, FSBO sellers can distribute to the same platforms brokers use — SEEK Business, BizBuySell, Commercial Real Estate, and more. Previously only available through expensive broker agreements.",
              },
              {
                icon: "📊",
                title: "P&L Normalisation & Benchmarking",
                desc: "Upload your financials and watch AI normalise your profits — removing owner salary, personal expenses, and one-offs to reveal the true earning power of your business. Compare against industry benchmarks.",
              },
              {
                icon: "🔐",
                title: "Buyer Management & NDA Tracking",
                desc: "Send NDAs, grant and revoke IM access per buyer, track viewing analytics (who viewed, which sections, how long), and auto-nag buyers who haven\u2019t opened their IM.",
              },
              {
                icon: "📈",
                title: "Real-Time Analytics Dashboard",
                desc: "See who\u2019s engaging with your listing. Map overlay of buyer locations, section-by-section interest heatmaps, and cumulative engagement charts. Know which buyers are serious.",
              },
              {
                icon: "✍️",
                title: "AI Ad Generation for Every Portal",
                desc: "Each platform has different requirements and character limits. Our AI automatically writes optimised ad copy tailored to SEEK Business, BizBuySell, and every other portal — so you always look your best.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-8 hover:border-cyan-500/40 transition group"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-3 group-hover:text-cyan-300 transition">
                  {feature.title}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ BROKER COMPARISON ═══════════ */}
      <section className="py-24 bg-slate-900/60">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Why Pay a Broker?
          </h2>
          <p className="text-slate-400 text-center mb-16 max-w-2xl mx-auto">
            On a $500K business sale at 5-10% commission, that&apos;s $25,000–$50,000 in
            fees. Here&apos;s what you get instead.
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Traditional Broker */}
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8">
              <h3 className="text-xl font-semibold text-red-400 mb-6">
                Traditional Broker
              </h3>
              <ul className="space-y-3 text-slate-300">
                {[
                  "5-10% commission ($25K-$50K on $500K sale)",
                  "Locked into 6-12 month contracts",
                  "Basic PDF information memorandum",
                  "Broker controls buyer access",
                  "Limited visibility on buyer engagement",
                  "No real-time analytics",
                  "Broker represents multiple sellers",
                  "You still do most of the work",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-red-400 mt-0.5">✗</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* OwnerExit */}
            <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-8">
              <h3 className="text-xl font-semibold text-green-400 mb-6">
                OwnerExit.ai
              </h3>
              <ul className="space-y-3 text-slate-300">
                {[
                  "AI-generated Information Memorandum",
                  "Syndicated to SEEK Business, BizBuySell, CRE",
                  "Password-protected buyer access",
                  "Real-time viewing analytics",
                  "NDA management",
                  "AI ad generation for each platform",
                  "P&L normalisation & benchmarking",
                  "Full control, flat fee from $199",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-green-400 mt-0.5">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ PRICING ═══════════ */}
      <section id="pricing" className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-slate-400 text-center mb-16 max-w-2xl mx-auto">
            No commissions. No lock-in contracts. Just a flat fee to sell your business like a pro.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Starter */}
            <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-8 flex flex-col">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold text-slate-200">Starter</h3>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">EARLY ADOPTER</span>
              </div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-4xl font-extrabold">$199</span>
                <span className="text-lg text-slate-500 line-through">$499</span>
              </div>
              <p className="text-slate-500 text-sm mb-6">One-time fee · Limited time</p>
              <ul className="space-y-3 text-slate-300 text-sm mb-8 flex-1">
                {[
                  "AI business appraisal",
                  "Web IM builder (3 AI sections)",
                  "Buyer management",
                  "NDA tracking",
                  "Email support",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-green-400">✓</span> {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="block text-center px-6 py-3 rounded-xl border border-slate-600 text-white font-semibold hover:border-cyan-400 transition"
              >
                Get Started
              </Link>
            </div>

            {/* Professional — highlighted */}
            <div className="bg-gradient-to-b from-cyan-500/10 to-green-500/10 border-2 border-cyan-500/50 rounded-2xl p-8 flex flex-col relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-cyan-500 to-green-500 rounded-full text-xs font-bold uppercase tracking-wider text-slate-950">
                Most Popular
              </div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold text-white">Professional</h3>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">EARLY ADOPTER</span>
              </div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-4xl font-extrabold">$499</span>
                <span className="text-lg text-slate-500 line-through">$999</span>
              </div>
              <p className="text-cyan-400/80 text-sm mb-6">One-time fee · Limited time</p>
              <ul className="space-y-3 text-slate-300 text-sm mb-8 flex-1">
                {[
                  "Everything in Starter",
                  "Unlimited AI-generated sections",
                  "Portal syndication (SEEK, BizBuySell, CRE)",
                  "AI ad generation for each platform",
                  "P&L normalisation & benchmarking",
                  "Full analytics dashboard",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-cyan-400">✓</span> {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="block text-center px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-green-500 text-white font-semibold hover:opacity-90 transition shadow-lg shadow-cyan-500/20"
              >
                Get Started
              </Link>
            </div>

            {/* Premium */}
            <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-8 flex flex-col">
              <h3 className="text-lg font-semibold text-slate-200 mb-1">Premium</h3>
              <div className="text-4xl font-extrabold mb-1">
                $1,999
              </div>
              <p className="text-slate-500 text-sm mb-6">One-time fee</p>
              <ul className="space-y-3 text-slate-300 text-sm mb-8 flex-1">
                {[
                  "Everything in Professional",
                  "Deal room for negotiations",
                  "Video integration",
                  "Priority support",
                  "Dedicated account manager",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-green-400">✓</span> {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="block text-center px-6 py-3 rounded-xl border border-slate-600 text-white font-semibold hover:border-cyan-400 transition"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ SOCIAL PROOF / TRUST ═══════════ */}
      <section className="py-24 bg-slate-900/60">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-12">
            Built by People Who&apos;ve Sold Businesses
          </h2>

          <div className="grid sm:grid-cols-3 gap-8 mb-16">
            {[
              {
                icon: "🇦🇺",
                title: "Australian Owned & Operated",
                desc: "Built in Australia, for Australian business owners. Your data stays onshore.",
              },
              {
                icon: "🏢",
                title: "30+ Years Experience",
                desc: "Created by business sales professionals who\u2019ve been in the trenches.",
              },
              {
                icon: "🔒",
                title: "Your Data Stays in Australia",
                desc: "Hosted on Australian infrastructure. We take privacy and data sovereignty seriously.",
              },
            ].map((item) => (
              <div key={item.title} className="flex flex-col items-center">
                <div className="text-5xl mb-4">{item.icon}</div>
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-slate-400 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Placeholder testimonial area */}
          <div className="bg-slate-800/40 border border-slate-700/40 rounded-2xl p-8 max-w-2xl mx-auto">
            <p className="text-slate-400 italic text-lg mb-4">
              &ldquo;Testimonials coming soon — we&apos;re just getting started, but our early
              users are already seeing the difference.&rdquo;
            </p>
            <p className="text-slate-500 text-sm">— The OwnerExit Team</p>
          </div>
        </div>
      </section>

      {/* ═══════════ FINAL CTA ═══════════ */}
      <section className="py-24">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Sell Your Business
            <br />
            <span className="bg-gradient-to-r from-cyan-400 to-green-400 bg-clip-text text-transparent">
              Without Giving Away the Commission?
            </span>
          </h2>
          <p className="text-slate-400 text-lg mb-10">
            Join Australian business owners who are taking control of their sale.
            Start with a free AI appraisal — no obligation, no credit card.
          </p>
          <Link
            href="/price-guide"
            className="inline-block px-10 py-5 rounded-xl bg-gradient-to-r from-cyan-500 to-green-500 text-white font-bold text-lg hover:opacity-90 transition shadow-lg shadow-cyan-500/20"
          >
            Get Your Free Appraisal
          </Link>
        </div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="border-t border-slate-800 bg-slate-950 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div>
              <div className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-green-400 bg-clip-text text-transparent mb-4">
                OwnerExit.ai
              </div>
              <p className="text-slate-500 text-sm">
                Australia&apos;s first AI-powered platform for selling your business yourself.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li>
                  <Link href="/price-guide" className="hover:text-white transition">
                    Free Appraisal
                  </Link>
                </li>
                <li>
                  <Link href="/signup" className="hover:text-white transition">
                    P&amp;L Normaliser
                  </Link>
                </li>
                <li>
                  <Link href="/signup" className="hover:text-white transition">
                    IM Builder
                  </Link>
                </li>
                <li>
                  <Link href="#how-it-works" className="hover:text-white transition">
                    How It Works
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li>
                  <Link href="/about" className="hover:text-white transition">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-white transition">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li>
                  <Link href="/privacy" className="hover:text-white transition">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-white transition">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 text-center text-slate-500 text-sm">
            <p>
              © 2026 OwnerExit.ai — Sell smarter, not harder. Australian owned and
              operated.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
