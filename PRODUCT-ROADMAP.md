# HospitalityForSale — Product Roadmap

**Vision:** The slickest AI-powered FSBO platform for hospitality business sales in Australia.

**Tagline:** *"Sell your hospitality business yourself. Broker-quality tools, zero commission."*

---

## 🎯 Target User

**Primary:** Hospitality business owners wanting to sell without a broker
- Café owners
- Restaurant owners
- Bar/pub owners
- Food truck operators
- Catering businesses

**Why FSBO?**
- Save 5-10% broker commission ($25K-$100K on typical sale)
- Stay in control of the process
- Know their business better than any broker

**Their Pain Points:**
- Don't know how to value their business
- Can't write a professional sales document
- Waste time on tyre-kickers
- Don't know the sales process
- Feel unprofessional compared to broker listings

---

## 🚀 MVP (Now → 4 weeks)

**Goal:** Working FSBO platform with basic AI features

### Core Features

**1. Simple Listing Creation**
- [ ] 5-minute listing flow
- [ ] Guided form (business type, location, financials, lease details)
- [ ] Photo upload (hero + gallery)
- [ ] Auto-generate professional description from inputs
- [ ] Preview before publish
- [ ] Edit anytime

**2. Professional Listing Display**
- [ ] Blind listing view (identity hidden until NDA)
- [ ] Beautiful, mobile-responsive pages
- [ ] Key metrics displayed clearly (asking price, revenue, rent, lease term)
- [ ] Photo gallery
- [ ] "Request Info" CTA

**3. Built-in NDA Flow**
- [ ] Buyer must agree to NDA before seeing details
- [ ] Morgan-quality legal terms (already integrated)
- [ ] NDA tracked per buyer
- [ ] Owner notified of each NDA signature

**4. Enquiry Management (Basic CRM)**
- [ ] Owner dashboard
- [ ] List of all enquiries
- [ ] Buyer details (name, email, phone)
- [ ] NDA status (pending/signed)
- [ ] Quick actions (email buyer, mark as contacted)
- [ ] Notes per buyer

**5. Email Notifications**
- [ ] New enquiry alert to owner
- [ ] NDA signed alert
- [ ] Weekly summary of activity

### AI Features (MVP)

**6. AI Business Description Generator**
- [ ] Owner inputs: type, location, years trading, unique selling points
- [ ] AI generates professional 200-word description
- [ ] Owner can edit/regenerate
- [ ] Multiple tone options (professional, warm, exciting)

**7. Basic AI Valuation Indicator**
- [ ] Input: annual revenue, profit, lease term, location
- [ ] Output: estimated range (e.g., "$350K - $450K")
- [ ] Based on industry multiples + comparable sales
- [ ] Disclaimer: "Indicative only, not a formal valuation"

### Pricing (MVP)

| Tier | Price | Features |
|------|-------|----------|
| **Basic** | $299 | 3-month listing, NDA, basic CRM, 10 photos |
| **Standard** | $499 | 6-month listing, AI description, valuation indicator, 20 photos |
| **Premium** | $799 | List until sold, all AI features, priority support, featured placement |

---

## 🔧 V2 (Months 2-3)

**Goal:** Full CRM + advanced AI = owner feels like they have a broker

### Enhanced CRM

**8. Pipeline Management**
- [ ] Kanban board view
- [ ] Stages: New → NDA Signed → Viewing Scheduled → Offer Received → Due Diligence → Sold
- [ ] Drag-and-drop between stages
- [ ] Stage timestamps

**9. Communication Hub**
- [ ] Email templates (intro, follow-up, viewing confirmation, offer response)
- [ ] Send emails from platform
- [ ] Email history per buyer
- [ ] SMS notifications (optional)

**10. Follow-up Reminders**
- [ ] Auto-remind if no contact in X days
- [ ] Task list for owner
- [ ] Calendar integration (Google/Outlook)

**11. Document Management**
- [ ] Upload financials (password protected)
- [ ] Lease summary
- [ ] Equipment list
- [ ] Only visible to NDA-signed buyers

### Advanced AI Features

**12. AI Information Memorandum Generator**
- [ ] Comprehensive 10-15 page sales document
- [ ] Sections: Executive Summary, Business Overview, Financials, Operations, Growth Opportunities, Assets, Lease Details
- [ ] Professional formatting (PDF export)
- [ ] Owner reviews and approves

**13. AI Buyer Qualification Chatbot**
- [ ] Embedded on listing page
- [ ] Asks qualifying questions before owner contact:
  - "Do you have experience in hospitality?"
  - "What's your budget range?"
  - "Are you pre-approved for finance?"
  - "When are you looking to buy?"
- [ ] Scores buyer quality (Hot/Warm/Cold)
- [ ] Filters out tyre-kickers

**14. AI Comparable Sales**
- [ ] "Similar businesses sold recently:"
- [ ] Show anonymized comparables
- [ ] Helps justify asking price

**15. AI Negotiation Assistant**
- [ ] Owner inputs: offer received, terms
- [ ] AI suggests: accept/counter/reject
- [ ] Provides counter-offer language
- [ ] Explains reasoning

---

## 🚀 V3 (Months 4-6)

**Goal:** Market leader, network effects, data moat

### Buyer Features

**16. Buyer Accounts**
- [ ] Buyers can create profiles
- [ ] Save favorite listings
- [ ] Get alerts for new listings matching criteria
- [ ] Track their enquiries

**17. Buyer Verification**
- [ ] Verified funds badge
- [ ] Pre-approved finance badge
- [ ] Previous business owner badge
- [ ] Builds trust for sellers

### Platform Growth

**18. Syndication (Outbound)**
- [ ] Auto-post to SEEK Business, Bsale (if we partner)
- [ ] Or manual export for owner to post elsewhere

**19. Syndication (Inbound)**
- [ ] Accept broker listings (separate section)
- [ ] Become Arosoftware destination
- [ ] "Broker Listings" vs "Owner Direct" filters

**20. Success Stories**
- [ ] Sold listings showcase
- [ ] Testimonials
- [ ] "Sold in X days" badges

### AI Superchargers

**21. AI Due Diligence Checklist**
- [ ] Auto-generated checklist based on business type
- [ ] Tracks completion
- [ ] Suggests documents needed

**22. AI Marketing Copy**
- [ ] Social media posts
- [ ] Email campaign to potential buyers
- [ ] Google Ads copy

**23. AI Price Optimization**
- [ ] "Your listing has been viewed 500 times with 3 enquiries"
- [ ] "Consider adjusting price to $X for faster sale"
- [ ] Market feedback loop

**24. AI Settlement Assistant**
- [ ] Checklist: contract, deposit, finance approval, lease transfer, licenses, settlement date
- [ ] Timeline view
- [ ] Reminders for both parties

---

## 💰 Revenue Model

### Phase 1: Listing Fees
- $299 - $799 per listing
- Target: 100 listings/month = $50K MRR

### Phase 2: Premium Features
- Featured placement: +$199
- AI Info Memo: +$149
- Buyer lead alerts: $49/month subscription

### Phase 3: Transaction Success Fee (Optional)
- 1% success fee on completed sales
- Only if seller opts in for "full service" tier
- Still 80% cheaper than broker

### Phase 4: Data & Insights
- Market reports for buyers
- Valuation API for accountants/lawyers
- Anonymized transaction data

---

## 🏗️ Technical Stack

**Current (MVP):**
- Next.js 14 (App Router)
- PostgreSQL + Prisma
- Tailwind CSS
- Nodemailer (email)
- PM2 on VPS

**To Add:**
- OpenAI API (GPT-4 for AI features)
- Stripe (payments)
- Cloudinary or S3 (image storage)
- SendGrid or Resend (transactional email)
- Twilio (SMS, optional)
- Google Analytics + Mixpanel

---

## 📅 Timeline

| Phase | Timeframe | Focus |
|-------|-----------|-------|
| **MVP** | Now → Week 4 | Core FSBO + basic AI |
| **V2** | Weeks 5-12 | Full CRM + advanced AI |
| **V3** | Months 4-6 | Buyer features + syndication |
| **Scale** | Month 6+ | Marketing push, partnerships |

---

## 🎯 Success Metrics

**MVP:**
- 10 paid listings in month 1
- 50 buyer enquiries
- 1 successful sale

**V2:**
- 50 paid listings/month
- NPS > 50 from sellers
- 5 successful sales

**V3:**
- 200 listings/month
- $100K MRR
- 20+ sales/month
- Recognized as #1 hospitality FSBO in Australia

---

## 🔥 Competitive Advantage

1. **Hospitality-specific** — No one else focuses here
2. **AI-first** — First mover in AI-driven business sales
3. **FSBO-friendly** — Tools that make owners look professional
4. **Fair pricing** — Flat fee, no commission
5. **Data moat** — Every listing = training data for better valuations

---

*Draft v1.0 — February 7, 2026*
