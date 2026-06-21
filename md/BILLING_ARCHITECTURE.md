# BILLING_ARCHITECTURE.md — MimoNotes Billing & Subscription

**Date:** 2026-06-16
**Status:** Architecture Complete — Ready for Go-Live
**Current State:** Stripe integration built, NOT configured (no env vars)

---

## 1. Current State Assessment

### What EXISTS (Already Built)

| Component | Status | File |
|-----------|--------|------|
| Stripe SDK | ✅ Installed | `stripe` + `@stripe/stripe-js` in package.json |
| Checkout API | ✅ Built | `app/api/billing/checkout/route.ts` |
| Portal API | ✅ Built | `app/api/billing/portal/route.ts` |
| Webhook Handler | ✅ Built | `app/api/billing/webhook/route.ts` |
| Stripe Library | ✅ Built | `lib/stripe.ts` (lazy-init, price mapping, validation) |
| Billing Service | ✅ Built | `lib/billing.ts` (invoices, payments, plan changes) |
| Subscription Models | ✅ Seeded | `subscription_plans` table (Free/$0, Pro/$29, Enterprise/$99) |
| Invoice/Payment Models | ✅ In schema | `invoices`, `invoice_line_items`, `payments`, `subscription_events` |
| Entitlements | ✅ Active | 12 features gated by plan (Free/Pro/Enterprise) |
| Usage Tracking | ✅ Active | `workspace_usage` table, `trackChatMessage()`, `trackDocumentUpload()` |
| Plan Limits | ✅ Enforced | Free: 10 docs/100MB/1000 msgs/3 members; Pro: configurable; Enterprise: unlimited |
| Billing Dashboard UI | ✅ Built | `components/workspace/billing-dashboard.tsx` |
| Billing Settings Page | ✅ Built | `app/(admin)/settings/billing/page.tsx` |
| Webhook Idempotency | ✅ Built | `StripeWebhookEvent` table for DB-level dedup |

### What's MISSING (Blocking Go-Live)

| Gap | Severity | Effort |
|-----|----------|--------|
| Stripe env vars not set | **CRITICAL** | 5 min |
| Stripe products/prices not created | **CRITICAL** | 15 min |
| Webhook endpoint not registered | **CRITICAL** | 5 min |
| Checkout flow not tested | **HIGH** | 30 min |
| Customer Portal not configured | **MEDIUM** | 15 min |
| Invoice PDF generation | **LOW** | 2 hours |
| Dunning emails (payment failure) | **LOW** | Stripe handles |

---

## 2. Go-Live Architecture

### 2.1 Stripe Product Setup

```
Stripe Dashboard → Products:

Product 1: "MimoNotes Pro"
├── Price: $29/month (recurring)
├── Price: $290/year (recurring, ~17% discount)
└── Features: MCP, Widget, API, Analytics, Custom Branding, Team (20), Priority Support, Lead Capture, WhatsApp

Product 2: "MimoNotes Enterprise"  
├── Price: $99/month (recurring)
├── Price: $990/year (recurring, ~17% discount)
└── Features: Everything in Pro + SSO + Unlimited + Dedicated Support
```

### 2.2 Environment Variables

```env
# Stripe API Keys (from Stripe Dashboard → Developers → API Keys)
STRIPE_SECRET_KEY=sk_live_...           # Production key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...  # For client-side

# Stripe Webhook Secret (from Stripe Dashboard → Webhooks → Signing secret)
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs (from Stripe Dashboard → Products → Price)
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_PRO_YEARLY=price_...
STRIPE_PRICE_ENTERPRISE_MONTHLY=price_...
STRIPE_PRICE_ENTERPRISE_YEARLY=price_...
```

### 2.3 Payment Flow

```
User clicks "Upgrade" →
  POST /api/billing/checkout →
    Create Stripe Checkout Session →
      Redirect to Stripe hosted checkout →
        User enters payment details →
          Stripe processes payment →
            Webhook: checkout.session.completed →
              Create/Update subscription in DB →
                Upgrade workspace plan →
                  Clear entitlement cache →
                    Redirect to /settings/billing (success)

Webhook Events Handled:
├── checkout.session.completed → Create subscription
├── customer.subscription.updated → Update plan/status
├── customer.subscription.deleted → Downgrade to free
├── invoice.payment_succeeded → Record payment
├── invoice.payment_failed → Mark past_due, notify
└── customer.subscription.trial_will_end → Trial reminder
```

### 2.4 Subscription Lifecycle

```
┌─────────┐    ──►   ┌─────────┐    ──►   ┌─────────┐
│  Trial   │  expire  │ Active  │  cancel  │Canceled │
│ (14 days)│ ──────── │ ($29/mo)│ ──────── │(free)   │
└─────────┘          └─────────┘          └─────────┘
                          │                    │
                          │ payment fails      │ re-subscribe
                          ▼                    ▼
                     ┌─────────┐          ┌─────────┐
                     │Past Due │          │ Active  │
                     │(7 days) │          │         │
                     └─────────┘          └─────────┘
                          │
                          │ still fails after 7 days
                          ▼
                     ┌─────────┐
                     │Canceled │
                     │(auto)   │
                     └─────────┘
```

### 2.5 Database State

```sql
-- Current plan pricing (already seeded)
SELECT * FROM subscription_plans;
-- Free: $0, Pro: $29/mo ($290/yr), Enterprise: $99/mo ($990/yr)

-- Current workspaces (all on free plan)
SELECT w.name, sp.name as plan 
FROM workspaces w 
LEFT JOIN workspace_subscriptions ws ON w.id = ws.workspace_id
LEFT JOIN subscription_plans sp ON ws.plan_id = sp.id;
-- All showing "Free" plan

-- Usage tracking (active)
SELECT workspace_id, period, chat_messages, document_uploads 
FROM workspace_usage 
ORDER BY updated_at DESC LIMIT 5;
```

---

## 3. Implementation Steps (Ordered)

### Phase 1: Stripe Account Setup (15 min)
1. Create Stripe account at stripe.com
2. Complete business verification
3. Get API keys (test mode first)
4. Create products and prices in Stripe Dashboard

### Phase 2: Environment Configuration (5 min)
1. Add Stripe env vars to `.env`
2. Add to `docker-compose.yml` environment block
3. Restart app container

### Phase 3: Webhook Registration (5 min)
1. Stripe Dashboard → Webhooks → Add endpoint
2. URL: `https://mimotes.ekohomelab.online/api/billing/webhook`
3. Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`
4. Copy webhook signing secret to `.env`

### Phase 4: Test Checkout Flow (30 min)
1. Use Stripe test card: `4242 4242 4242 4242`
2. Click "Upgrade to Pro" in billing settings
3. Complete checkout
4. Verify subscription created in DB
5. Verify entitlements updated
6. Verify webhook received

### Phase 5: Customer Portal (15 min)
1. Stripe Dashboard → Settings → Customer Portal → Enable
2. Configure: update payment, cancel, view invoices
3. Test: "Manage Subscription" button in billing settings

### Phase 6: Production Switch (10 min)
1. Switch from test keys to live keys
2. Update webhook endpoint for production
3. Test with real card (small amount)
4. Monitor Stripe dashboard

---

## 4. Pricing Strategy

| Plan | Monthly | Annual | Per User/Month |
|------|---------|--------|----------------|
| Free | $0 | $0 | - |
| Pro | $29 | $290 | ~$1.45 (20 users) |
| Enterprise | $99 | $990 | ~$0.99 (100 users) |

### Value Proposition
- **Free**: 10 documents, 1000 chat messages, 3 team members
- **Pro**: 100 documents, 50,000 messages, 20 members, MCP, Widget, API, WhatsApp
- **Enterprise**: Unlimited, SSO, dedicated support, custom branding

### Revenue Projections (Conservative)
| Month | Free Users | Pro Users | Enterprise | MRR |
|-------|-----------|-----------|------------|-----|
| 1 | 50 | 3 | 0 | $87 |
| 3 | 200 | 15 | 1 | $534 |
| 6 | 500 | 40 | 5 | $1,655 |
| 12 | 1000 | 100 | 15 | $4,385 |

---

## 5. Security Checklist

- [x] Stripe webhook HMAC-SHA256 verification
- [x] DB-level idempotency (StripeWebhookEvent table)
- [x] Unknown price IDs → reject
- [x] Unknown Stripe statuses → default to `past_due` (restrictive)
- [x] Access token never exposed in API responses
- [x] Entitlement cache cleared on plan change
- [ ] Rate limiting on checkout endpoint (deferred)
- [ ] Invoice PDF generation (deferred)

---

*Architecture by Hermes Agent — Ready for Stripe account setup.*
