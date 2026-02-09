# OwnerExit.ai — Technical Architecture

**Last updated:** 2026-02-09 (reverse-engineered from production code)

---

## Stack

- **Framework:** Next.js 16.1.6 (App Router, TypeScript)
- **Database:** PostgreSQL + Prisma ORM 6.19
- **Auth:** NextAuth 4.24 (credentials provider, JWT sessions, bcrypt)
- **AI:** OpenAI API (gpt-4o for IM sections, gpt-4o-mini for descriptions/memos)
- **Payments:** Stripe (checkout sessions, webhook for fulfillment)
- **Styling:** Tailwind CSS 4 + @tailwindcss/typography
- **Markdown:** react-markdown for memo rendering
- **Hosting:** VPS 72.62.253.204, port 3004, PM2, Nginx reverse proxy, Let's Encrypt SSL

---

## Database Schema (15 Models)

### Core
| Model | Purpose |
|-------|---------|
| **User** | Account (email/password, NextAuth) |
| **Account** | OAuth accounts (NextAuth adapter) |
| **Session** | Auth sessions |
| **VerificationToken** | Email verification |

### Business Listings
| Model | Purpose |
|-------|---------|
| **Business** | The business for sale (name, industry, financials, status, tier) |
| **Inquiry** | Legacy inquiry model (name, email, message, NDA status) |

### Info Memo System
| Model | Purpose |
|-------|---------|
| **InfoMemo** | AI-generated information memorandum per business |
| **InfoMemoSection** | Section-by-section IM content (8 sections, lockable) |
| **InfoMemoData** | Rich structured data for IM generation (60+ fields) |
| **MemoAccess** | Buyer access codes with tier (TIER_1/TIER_2), revocable |
| **MemoViewLog** | Tracks when buyers view memos (IP, user agent) |
| **MemoDocument** | Confidential documents (financials, tax, lease, licenses) |

### CRM
| Model | Purpose |
|-------|---------|
| **Prospect** | Buyer CRM (status pipeline, NDA tracking, source tracking) |
| **ProspectNote** | Timestamped activity log per prospect |
| **Lead** | Price Guide lead capture (pre-signup, UTM tracking) |
| **Waitlist** | Email waitlist |

### Enums
- **BusinessStatus:** DRAFT → PENDING_REVIEW → ACTIVE → SOLD/EXPIRED/WITHDRAWN
- **PricingTier:** STARTER / GROWTH / PREMIUM
- **ProspectStatus:** NEW → CONTACTED → NDA_SIGNED → QUALIFIED → NEGOTIATING → CLOSED_WON/LOST
- **NdaStatus:** PENDING → SENT → SIGNED / DECLINED
- **AccessTier:** TIER_1 (basic memo) / TIER_2 (full confidential)
- **DocumentCategory:** FINANCIALS / TAX / LEASE / LICENSES / CONTRACTS / OTHER

---

## API Routes (13)

### Authentication
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/auth/[...nextauth]` | GET/POST | NextAuth handler (login, session) |
| `/api/auth/signup` | POST | User registration (bcrypt hash) |

### Business Management
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/businesses` | POST | Create new business listing |
| `/api/businesses` | GET | List user's businesses |

### AI Tools
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/ai-description` | POST | Generate listing description (gpt-4o-mini) |
| `/api/ai-infomemo` | POST | Generate full info memo (gpt-4o-mini) |
| `/api/im-sections` | POST | Generate single IM section (gpt-4o, 8 templates) |
| `/api/im-sections` | GET | Get all sections for a business |
| `/api/price-guide` | POST | Free price guide (no auth, industry multiples) |
| `/api/price-guide/detailed` | POST | Detailed guide (auth required, assets, lease, licenses) |

### Deal Room & CRM
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/memo` | POST | Generate full memo |
| `/api/memo` | GET | Get memo with access codes |
| `/api/memo/[id]/access` | POST | Grant buyer access (generates unique code) |
| `/api/memo/[id]/access` | GET | List access codes |
| `/api/memo/[id]/access` | DELETE | Revoke buyer access |
| `/api/memo/[id]/access` | PATCH | Update tier, buyer details, add notes |
| `/api/memo-data` | POST | Save rich IM data (60+ fields) |
| `/api/prospects` | GET | List prospects (with business filter) |
| `/api/prospects` | PATCH | Update prospect status/details |
| `/api/prospects` | POST | Add note to prospect |
| `/api/inquiry` | POST | Webhook for incoming buyer inquiries |
| `/api/leads` | POST | Capture price guide leads |
| `/api/leads` | GET | List leads (admin) |

### Payments
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/checkout` | POST | Create Stripe checkout session |
| `/api/webhook` | POST | Stripe webhook (activate listing on payment) |

---

## Pages (11)

| Page | Purpose |
|------|---------|
| `/` | Landing page (hero, how it works, pricing, broker comparison) |
| `/price-guide` | Free AI price guide (lead capture funnel, multi-step) |
| `/price-guide/detailed` | Detailed price guide (authenticated) |
| `/pricing` | Pricing tiers display |
| `/login` | Login form |
| `/signup` | Registration form |
| `/list-business` | Business listing creation form |
| `/dashboard` | Main dashboard (list businesses, status, actions) |
| `/dashboard/[id]/im-builder` | IM Builder (multi-tab data entry + section generation) |
| `/dashboard/[id]/memo` | Memo viewer + deal room (access codes, buyer tracking) |
| `/dashboard/prospects` | Prospect CRM dashboard |
| `/memo/[code]` | Public memo view (buyer accesses via unique code) |

---

## AI Price Guide Engine

The price guide uses **real Australian market transaction data** with EBITDA multiples:

### Industry Coverage (28 categories)
**Hospitality:** Coffee Shop, Cafe, Restaurant, Fine Dining, Pub/Bar, Fast Food, Fish & Chips, Bakery, Catering, Hotel/Motel
**Healthcare:** Healthcare, Dental, Medical, Pharmacy, Childcare
**Professional:** Professional Services, Accounting, Legal
**Other:** Retail, E-commerce, Trades, Manufacturing, Transport, Wholesale, Beauty/Hair, Gym, Automotive

### Adjustment Factors
- **State:** NSW +5%, VIC +3%, QLD baseline, SA -5%, TAS -8%, NT -10%
- **Years:** <2yr = 0.75x, 2-3yr = 0.85x, 3-5yr = 0.95x, 5-10yr = 1.0x, 10-20yr = 1.05x, 20+ = 1.1x
- **Margin quality:** Low margin penalty, high margin premium
- **Management:** Manager in place = +10-15%
- **Lease:** 5+ years = +10%, <2 years = -15%
- **Licenses:** Liquor = +10%, Gaming = +15%
- **Franchise:** Known brand = +5%

### Detailed vs Free
- **Free:** Basic EBITDA multiple, no auth required, captures lead first
- **Detailed:** Auth required, adds asset breakdown, lease analysis, franchise assessment, goodwill calculation

---

## Stripe Integration

### Pricing (in checkout route, AUD)
| Tier | Price | Duration |
|------|-------|----------|
| STARTER | $199 | 90 days |
| GROWTH | $499 | 180 days |
| PREMIUM | $899 | 365 days |

*Note: Landing page shows $499/$999/$1,999 — checkout route has $199/$499/$899. Landing page prices may be aspirational/updated.*

### Flow
1. User selects tier → `/api/checkout` creates Stripe session
2. Stripe redirects to checkout
3. On success → webhook fires → business status set to ACTIVE, tier updated, expiration set

---

## Info Memo Builder (8 Sections)

Each section is generated independently via GPT-4o with business-specific prompts:

1. **Executive Summary** — Compelling overview of the opportunity
2. **Business Overview** — Entity details, location, lease, operations
3. **Financial Performance** — Revenue, EBITDA, trends, margins, add-backs (Tier 2 content)
4. **Operations & Systems** — POS, accounting, suppliers, processes
5. **Team & Management** — Staff structure, owner involvement, training
6. **Assets Included** — FFE, stock, vehicles, IP, licenses
7. **Growth & Opportunity** — Competitive advantages, growth paths
8. **Investment Summary** — Closing pitch with call to action

Sections can be individually regenerated, locked (approved), and edited.

---

## Security Model

- **Auth:** NextAuth JWT sessions, bcrypt password hashing
- **Authorization:** All API routes verify session + ownership (user can only access their own businesses)
- **Memo Access:** Unique hex codes per buyer, revocable, time-expirable, view logging
- **Document Tiers:** TIER_1 (basic memo) vs TIER_2 (full confidential access)
- **Inquiry Webhook:** API key authentication for external sources
- **Middleware:** NextAuth middleware for route protection

---

## Environment Variables Required

```
DATABASE_URL=postgresql://...
NEXTAUTH_URL=https://ownerexit.ai
NEXTAUTH_SECRET=...
OPENAI_API_KEY=...
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
INQUIRY_API_KEY=...
```

---

## What's Built vs What's Planned

### ✅ Built & Working
- Full auth system (signup, login, JWT)
- Business listing CRUD
- AI Description Generator
- AI Info Memo Generator (full + section-by-section)
- IM Builder UI with rich data entry (60+ fields)
- AI Price Guide (free + detailed, 28 industries)
- Lead capture funnel
- Prospect CRM (status pipeline, notes, NDA tracking)
- Deal Room (memo access codes, view tracking, tier access)
- Stripe checkout + webhook
- Landing page with broker comparison
- Mobile-responsive Tailwind UI

### 🔲 Not Yet Built (from roadmap)
- Email notifications (seller alerts on inquiry/payment)
- NDA auto-send (stub exists, TODO noted)
- Kanban pipeline view for prospects
- Email templates for buyer communication
- Document vault (upload UI — model exists)
- AI Buyer Screening Chatbot
- AI Negotiation Assistant
- Buyer accounts & saved searches
- Blog / SEO content
- Referral program
- Industry directory network (Phase 4)
