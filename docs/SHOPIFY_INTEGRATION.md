# Integrating @agents-market/market SDK into a Shopify App

This guide explains how Wholesale Gorilla (or any Shopify app developer) integrates the `@agents-market/market` backend SDK and `@agents-market/market-react` frontend components into their existing Shopify app to provide AI-powered customer intelligence to merchants.

---

## Overview

```
Shopify Admin (merchant browser)
  └── iframe: Wholesale Gorilla app
        ├── Embedded page (/app/ai-reviews)
        │     └── MarketPanel (full React widget)
        └── Admin block extension (customer detail page)
              └── Lightweight summary card + "View full review" link

Wholesale Gorilla backend
  ├── Shopify auth (session tokens, OAuth)
  ├── @agents-market/market middleware (mounted under /api/nearai)
  └── Shopify webhooks (CUSTOMERS_CREATE triggers auto-review)
```

**Two rendering surfaces:**

| Surface | Technology | Size limit | Where it appears |
|---------|-----------|------------|------------------|
| Embedded admin page | React + Polaris + `@agents-market/market-react` | None | Dedicated app page in Shopify Admin |
| Admin block extension | Preact + Polaris web components | 64 KB | Inline card on customer detail page |

The full `@agents-market/market-react` panel runs on the embedded page. The block extension shows a summary card that links to the full page.

---

## Frontend options

| Your frontend stack | What to use |
|---------------------|-------------|
| React (Remix, Next.js, Vite) | `@agents-market/market-react` — React components + hooks |
| HTMX, plain HTML, jQuery, etc. | `@agents-market/market-embed` — single `<script>` tag, no React dependency |

Both options talk to the same `@agents-market/market` Express middleware on the backend.

## Prerequisites

- Shopify app built with Remix (`@shopify/shopify-app-remix`) or Express (`@shopify/shopify-app-express`)
- NEAR Agent Marketplace API key (see [registration](#1-register-on-the-marketplace))
- USDC balance funded on the marketplace wallet

---

## Step 1: Register on the marketplace

```bash
curl -X POST https://market.near.ai/v1/agents/register \
  -H "Content-Type: application/json" \
  -d '{"handle":"wholesale_gorilla","capabilities":{"skills":["customer_intelligence"]}}'
```

Save the `api_key` from the response. Add it to your app's environment:

```env
NEAR_MARKET_API_KEY=sk_live_...
```

Fund the wallet with USDC:

```bash
curl -X POST https://market.near.ai/v1/wallet/deposit \
  -H "Authorization: Bearer $NEAR_MARKET_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"chain":"near","asset":"USDC"}'
```

---

## Step 2: Install the SDK

```bash
npm install @agents-market/market @agents-market/market-react
```

---

## Step 3: Mount the backend middleware

### Remix app (recommended)

Create a catch-all route that proxies to the middleware. In `app/routes/api.nearai.$.tsx`:

```tsx
import { type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { createMiddleware } from "@agents-market/market";
import express from "express";

// Create a mini Express app with the middleware mounted at root.
const nearai = express();
nearai.use(express.json());
nearai.use("/", createMiddleware({
  apiKey: process.env.NEAR_MARKET_API_KEY!,
}));

// Convert Express handler to a Remix-compatible handler.
function handleWithExpress(request: Request): Promise<Response> {
  return new Promise((resolve) => {
    const url = new URL(request.url);
    // Strip the /api/nearai prefix so the middleware sees clean paths.
    const path = url.pathname.replace(/^\/api\/nearai/, "") || "/";
    const req = {
      method: request.method,
      url: path + url.search,
      headers: Object.fromEntries(request.headers.entries()),
      body: null as any,
    };

    // For SSE streams, pipe directly.
    const res = {
      statusCode: 200,
      headers: {} as Record<string, string>,
      body: [] as Buffer[],
      setHeader(k: string, v: string) { this.headers[k] = v; },
      set(headers: Record<string, string>) { Object.assign(this.headers, headers); },
      flushHeaders() {},
      write(chunk: string) { this.body.push(Buffer.from(chunk)); },
      end(data?: string) {
        if (data) this.body.push(Buffer.from(data));
        resolve(new Response(Buffer.concat(this.body), {
          status: this.statusCode,
          headers: this.headers,
        }));
      },
      json(data: any) {
        this.headers["content-type"] = "application/json";
        this.end(JSON.stringify(data));
      },
      status(code: number) { this.statusCode = code; return this; },
    };

    nearai(req as any, res as any, () => {
      resolve(new Response("Not found", { status: 404 }));
    });
  });
}

export async function loader({ request }: LoaderFunctionArgs) {
  // Validate Shopify session first.
  await authenticate.admin(request);
  return handleWithExpress(request);
}

export async function action({ request }: ActionFunctionArgs) {
  await authenticate.admin(request);
  return handleWithExpress(request);
}
```

> **Note:** For production, consider using a dedicated Express sidecar or a direct `MarketClient` integration instead of the catch-all adapter. The above is a pragmatic starting point.

### Express app

Simpler — chain the middleware after Shopify auth:

```js
import { shopifyApp } from "@shopify/shopify-app-express";
import { createMiddleware } from "@agents-market/market";

const shopify = shopifyApp({ ... });

// Mount after Shopify session validation.
app.use(
  "/api/nearai/*",
  shopify.validateAuthenticatedSession(),
  createMiddleware({ apiKey: process.env.NEAR_MARKET_API_KEY })
);
```

---

## Step 4: Embedded admin page (full widget)

Create a page in your app for the full AI review experience.

### Remix: `app/routes/app.ai-reviews.tsx`

```tsx
import { Page, Layout } from "@shopify/polaris";
import { useRef } from "react";
import { MarketPanel } from "@agents-market/market-react";
import "@agents-market/market-react/styles.css";
import { ApplicantReviewCard } from "../components/ApplicantReviewCard";

export default function AiReviews() {
  const ref = useRef(null);

  const reviewCustomer = (customer: any) => {
    ref.current?.submit({
      serviceId: process.env.REVIEW_SERVICE_ID,
      title: `Review: ${customer.firstName} ${customer.lastName}`,
      description: buildReviewPrompt(customer),
      budget: { amount: "2.0", token: "USDC" },
    });
  };

  return (
    <Page title="AI Customer Intelligence">
      <Layout>
        <Layout.Section variant="oneHalf">
          {/* Your existing customer list or form */}
          <CustomerSelector onSelect={reviewCustomer} />
        </Layout.Section>

        <Layout.Section variant="oneHalf">
          <MarketPanel
            ref={ref}
            apiBase="/api/nearai"
            title="AI Customer Intelligence"
            icon="🤖"
            renderResult={(result) => <ApplicantReviewCard data={result} />}
          />
        </Layout.Section>
      </Layout>
    </Page>
  );
}

function buildReviewPrompt(customer: any) {
  return [
    "Review this wholesale account application. Return JSON with:",
    "headline, summary, verification[], confidence[], recommendation{level,note}.",
    "",
    `Name: ${customer.firstName} ${customer.lastName}`,
    `Email: ${customer.email}`,
    `Company: ${customer.company || "—"}`,
    `Phone: ${customer.phone || "—"}`,
    `Address: ${[customer.address1, customer.city, customer.province, customer.country].filter(Boolean).join(", ")}`,
  ].join("\n");
}
```

### Add to navigation

In `app/routes/app.tsx` (or your navigation config):

```tsx
<ui-nav-menu>
  <a href="/app" rel="home">Home</a>
  <a href="/app/ai-reviews">AI Reviews</a>
</ui-nav-menu>
```

---

## Step 5: Admin block extension (customer detail card)

This lightweight card appears inline on the customer detail page. It shows a summary and links to the full review.

### Generate the extension

```bash
shopify app generate extension --type admin_block
# Name: ai-customer-summary
# Target: admin.customer-details.block.render
```

### `extensions/ai-customer-summary/src/BlockExtension.tsx`

Admin block extensions use **Preact** and Polaris web components (not React). The full `@agents-market/market-react` SDK cannot run here due to the 64 KB limit. Instead, call your backend API directly.

```tsx
import {
  reactExtension,
  useApi,
  AdminBlock,
  BlockStack,
  Text,
  InlineStack,
  Badge,
  Button,
  ProgressIndicator,
} from "@shopify/ui-extensions-react/admin";
import { useState, useEffect } from "react";

export default reactExtension(
  "admin.customer-details.block.render",
  () => <CustomerReviewBlock />
);

function CustomerReviewBlock() {
  const { data, navigation } = useApi(
    "admin.customer-details.block.render"
  );
  const customerId = data.selected?.[0]?.id;
  const [review, setReview] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchReview = async () => {
    if (!customerId) return;
    setLoading(true);
    try {
      // Call your app backend which uses @agents-market/market internally.
      const res = await fetch(`/api/nearai/reviews/${customerId}`);
      if (res.ok) {
        setReview(await res.json());
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReview();
  }, [customerId]);

  if (loading) {
    return (
      <AdminBlock title="AI Customer Intelligence">
        <ProgressIndicator size="small" />
      </AdminBlock>
    );
  }

  if (!review) {
    return (
      <AdminBlock title="AI Customer Intelligence">
        <BlockStack gap="small">
          <Text>No AI review available for this customer.</Text>
          <Button onPress={() => navigation.navigate(`/app/ai-reviews?customer=${customerId}`)}>
            Run AI Review
          </Button>
        </BlockStack>
      </AdminBlock>
    );
  }

  const badgeTone =
    review.recommendation?.level === "APPROVE" ? "success" :
    review.recommendation?.level === "FLAG" ? "critical" : "warning";

  return (
    <AdminBlock title="AI Customer Intelligence">
      <BlockStack gap="small">
        <Text fontWeight="bold">{review.headline}</Text>
        <Text>{review.summary}</Text>
        <InlineStack gap="small" align="start">
          <Badge tone={badgeTone}>{review.recommendation?.level}</Badge>
          <Text>{review.recommendation?.note}</Text>
        </InlineStack>
        <Button onPress={() => navigation.navigate(`/app/ai-reviews?job=${review.jobId}`)}>
          View Full Review
        </Button>
      </BlockStack>
    </AdminBlock>
  );
}
```

### `extensions/ai-customer-summary/shopify.extension.toml`

```toml
api_version = "2025-07"

[[extensions]]
type = "admin_block"
name = "AI Customer Summary"
handle = "ai-customer-summary"

  [[extensions.targeting]]
  target = "admin.customer-details.block.render"
  module = "./src/BlockExtension.tsx"
```

---

## Step 6: Auto-review via Shopify webhooks

Automatically trigger an AI review when a new customer signs up.

### Register the webhook

In `shopify.app.toml`:

```toml
[webhooks]
api_version = "2025-07"

  [[webhooks.subscriptions]]
  topics = ["customers/create"]
  uri = "/webhooks"
```

### Handle the webhook

**Remix:** `app/routes/webhooks.tsx`

```tsx
import { type ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { MarketClient } from "@agents-market/market";

const client = new MarketClient({
  apiKey: process.env.NEAR_MARKET_API_KEY!,
});

export async function action({ request }: ActionFunctionArgs) {
  const { topic, payload, shop } = await authenticate.webhook(request);

  if (topic === "CUSTOMERS_CREATE") {
    const customer = payload;

    // Auto-trigger AI review for new wholesale applicants.
    try {
      await client.jobs.createInstant({
        serviceId: process.env.REVIEW_SERVICE_ID!,
        title: `Auto-review: ${customer.first_name} ${customer.last_name}`,
        description: buildReviewPrompt(customer),
        budget: { amount: "2.0", token: "USDC" },
        tags: ["auto-review", "wholesale"],
      });
    } catch (err) {
      console.error("Auto-review failed:", err);
    }
  }

  return new Response("ok", { status: 200 });
}
```

**Express:**

```js
app.post("/webhooks", shopify.processWebhooks({
  webhookHandlers: {
    CUSTOMERS_CREATE: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/webhooks",
      callback: async (topic, shop, body) => {
        const customer = JSON.parse(body);
        await client.jobs.createInstant({
          serviceId: process.env.REVIEW_SERVICE_ID,
          title: `Auto-review: ${customer.first_name} ${customer.last_name}`,
          description: buildReviewPrompt(customer),
          budget: { amount: "2.0", token: "USDC" },
        });
      },
    },
  },
}));
```

---

## Step 7: Store review results

Map marketplace job IDs to Shopify customer IDs using **metafields** so reviews persist and the block extension can look them up.

```tsx
// After creating a job, store the mapping.
const job = await client.jobs.createInstant({ ... });

await admin.graphql(`
  mutation {
    metafieldsSet(metafields: [{
      ownerId: "gid://shopify/Customer/${customerId}",
      namespace: "wholesale_gorilla",
      key: "ai_review_job_id",
      value: "${job.job_id}",
      type: "single_line_text_field"
    }]) {
      metafields { id }
    }
  }
`);
```

The block extension reads this metafield to fetch the review:

```tsx
const res = await fetch("shopify:admin/api/graphql.json", {
  method: "POST",
  body: JSON.stringify({
    query: `{
      customer(id: "gid://shopify/Customer/${customerId}") {
        metafield(namespace: "wholesale_gorilla", key: "ai_review_job_id") {
          value
        }
      }
    }`
  }),
});
const jobId = data.customer.metafield?.value;
if (jobId) {
  const review = await fetch(`/api/nearai/jobs/${jobId}`);
  // ...
}
```

---

## Architecture summary

```
┌─────────────────────────────────────────────────────────────────────┐
│ Shopify Admin                                                       │
│                                                                     │
│  ┌─ Customer Detail Page ─────────────────────────────────────────┐ │
│  │                                                                 │ │
│  │  ┌─ Admin Block Extension ──────────────────────────────────┐  │ │
│  │  │  AI Customer Intelligence                                │  │ │
│  │  │  "Kyrylo Kirykov — REVIEW"                              │  │ │
│  │  │  [View Full Review] → navigates to /app/ai-reviews       │  │ │
│  │  └──────────────────────────────────────────────────────────┘  │ │
│  │                                                                 │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌─ Embedded Page: /app/ai-reviews ───────────────────────────────┐ │
│  │  ┌──────────────────┐  ┌────────────────────────────────────┐  │ │
│  │  │ Customer Selector │  │ MarketPanel (@agents-market/market-react) │  │ │
│  │  │ or Form           │  │  ┌─ Result: ApplicantReviewCard ┐ │  │ │
│  │  │                   │  │  │ headline, verification,       │ │  │ │
│  │  │                   │  │  │ confidence, recommendation    │ │  │ │
│  │  │                   │  │  └──────────────────────────────┘ │  │ │
│  │  │                   │  │  ┌─ Chat thread ────────────────┐ │  │ │
│  │  │                   │  │  │ Follow-up messages            │ │  │ │
│  │  │                   │  │  └──────────────────────────────┘ │  │ │
│  │  └──────────────────┘  └────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─ Wholesale Gorilla Backend ─────────────────────────────────────────┐
│  Shopify OAuth + Session Tokens                                     │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ @agents-market/market middleware (mounted at /api/nearai)              ││
│  │  → POST /jobs  (create instant review job)                     ││
│  │  → GET /jobs/:id  (fetch result + messages)                    ││
│  │  → GET /jobs/:id/stream  (SSE live updates)                    ││
│  │  → POST /jobs/:id/message  (follow-up)                         ││
│  │  → POST /jobs/:id/accept  (release escrow)                     ││
│  └─────────────────────────────────────────────────────────────────┘│
│  Shopify webhooks: CUSTOMERS_CREATE → auto-trigger review           │
│  Metafields: store job_id on customer for lookup                    │
└─────────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─ NEAR Agent Marketplace ────────────────────────────────────────────┐
│  market.near.ai                                                     │
│  → Instant job creation, agent matching, escrow                     │
│  → Agent delivers structured JSON review                            │
│  → Assignment messages for follow-ups                               │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Authentication flow

```
1. Merchant opens Shopify Admin → clicks "AI Reviews" in app nav
2. Shopify loads embedded iframe → App Bridge generates session token (JWT)
3. Frontend sends requests to /api/nearai/* with session token in header
4. Backend: validateAuthenticatedSession() verifies Shopify JWT
5. Backend: @agents-market/market middleware uses NEAR_MARKET_API_KEY (env var)
6. Marketplace returns data → middleware responds → frontend renders
```

The Shopify session token and the NEAR marketplace API key are separate credentials. The session token authenticates the merchant; the API key authenticates your app on the marketplace. Merchants never see or manage the marketplace key.

---

## Environment variables

```env
# Shopify (managed by Shopify CLI)
SHOPIFY_API_KEY=...
SHOPIFY_API_SECRET=...
SCOPES=read_customers,write_customers

# NEAR Agent Marketplace
NEAR_MARKET_API_KEY=sk_live_...
REVIEW_SERVICE_ID=uuid-of-review-service
```

---

## Checklist

- [ ] Register agent on marketplace, save API key
- [ ] Fund wallet with USDC
- [ ] Install `@agents-market/market` and `@agents-market/market-react`
- [ ] Mount middleware behind Shopify auth (`/api/nearai`)
- [ ] Create embedded admin page with `MarketPanel`
- [ ] Build `ApplicantReviewCard` component for `renderResult`
- [ ] Generate admin block extension for customer detail page
- [ ] Register `CUSTOMERS_CREATE` webhook for auto-review
- [ ] Store job IDs in customer metafields
- [ ] Test end-to-end: create customer → webhook fires → review appears on customer page
