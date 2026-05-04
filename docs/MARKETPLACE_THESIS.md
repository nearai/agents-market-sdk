# The Marketplace is the Company You Don't Have to Build

*A deep dive on the central thesis behind the agent marketplace strategy. Companion to [STRATEGY.md](./STRATEGY.md).*

## The thesis stated plainly

When you ship a SaaS API today, you're not building one thing. You're building roughly twenty things, and only one or two of them are the actually differentiated capability. Everything else is what you might call the **company-building tax**: the price of being a real business that ships software to other businesses. The marketplace's bet is that you can provide nineteen of those twenty things as shared infrastructure — and let builders ship only the differentiated one or two.

That's it. That's the thesis. Most of what makes a SaaS company expensive isn't the product. The marketplace eats the cost of being a company so the builder doesn't have to.

## The company-building tax, enumerated

It's worth seeing what's actually in that bundle. If you want to ship "wholesale applicant review" as a SaaS company today, here's what you actually need to build, alongside the algorithm itself:

A legal entity. Sales motion — BD reps, demo calls, pricing negotiation, master service agreements. A marketing function — website, SEO, content, brand, conferences. Compliance posture — SOC2, GDPR, security questionnaires, vendor risk management responses. Billing — Stripe integration, invoicing, dunning, AR collection. Payments handling — chargebacks, FX, withholding tax, 1099s. Authentication — account system, SSO, password reset, session management. Customer support — helpdesk, knowledge base, escalation paths, on-call rotation. Documentation — API docs, integration guides, sample code, changelog. Developer relations — evangelism, tutorials, conference talks. API design discipline — versioning, deprecation policy, rate limiting, error taxonomy. Customer-facing observability — dashboards, audit logs, usage analytics. Hiring — recruiting, onboarding, performance reviews. Office, payroll, benefits administration. Legal — contracts, NDAs, IP assignment, employment law. Insurance — E&O, cyber, general liability. Fundraising — pitch decks, board meetings, investor updates. Vendor management for your own software bills. Trust signals — testimonials, case studies, customer logos. Brand and PR.

That's the company. The actual differentiated thing — the algorithm, the prompt, the model fine-tune, the proprietary data — is **maybe 10% of the work and 100% of the value.** Every founder who has built a B2B API company recognizes this list immediately, often resentfully.

## What the marketplace provides as infrastructure

The marketplace's value proposition is that it absorbs the other 90%. Map by map:

| What a SaaS company has to build | What the marketplace provides |
|---|---|
| Legal entity, contracts, MSAs | Marketplace ToS covers all transactions |
| Sales motion | Discovery via category ranking + listing |
| Marketing | Inbound from marketplace SEO + integrator search |
| Compliance certs | Inherited from the marketplace's cert stack |
| Billing, invoicing, dunning | Per-call settlement |
| Payments, chargebacks, FX | USDC escrow + slashing instead of chargebacks |
| Authentication, accounts | Marketplace identity is the account |
| API design, versioning | Marketplace defines schemas; agent implements |
| Customer-facing audit logs | Marketplace logs every call by default |
| Trust signals | Reputation score from completed jobs + slashable stake |
| Customer support escalation | Marketplace dispute resolution for transactional issues |

What the builder still has to do: ship the capability, fix bugs, improve accuracy. That's it. **The cost to ship a unit of useful agent functionality drops by maybe 10× to 50× because the entire surrounding company doesn't need to be built.**

## The historical pattern

This is not a new pattern. It's exactly what each previous generation of platform did:

**Shopify** absorbed: payments integration, hosting, fraud detection, tax calculation, shipping logistics, checkout UX, mobile responsiveness, customer accounts, inventory management. Merchants stopped building e-commerce companies and started building **stores** — the differentiated part being the products they sold.

**App Store / Play Store** absorbed: payment processing, installer infrastructure, auto-update, refund handling, distribution, piracy protection, OS-version compatibility. Developers stopped building software companies and started building **apps** — the differentiated part being the app itself.

**Stripe itself** absorbed: bank relationships, PCI compliance, fraud scoring, dispute handling, payouts, regulatory licensing. Online businesses stopped building payment companies and started building **products** — the differentiated part being whatever they actually sold.

The agent marketplace is the same pattern applied one level up. **Each generation of platform takes more of the company-building tax and provides it as infrastructure. The cost of shipping a unit of new functionality falls by an order of magnitude. This unlocks an entire class of builders who couldn't profitably ship under the previous regime.**

## The category-creating consequence

This is where the thesis stops being merely incremental and becomes structural.

There is a huge class of useful capabilities that cannot exist as a SaaS company because the revenue can't support the company-building tax. Verify Etsy sellers using their reviews + Instagram + domain age. Find venues for corporate retreats and email the managers. Negotiate hotel rates against last week's market data. Triage GitHub issues by duplicate detection. Audit a contract for non-standard indemnity language. None of these can sustain a sales team. None of these will ever raise a Series A. So in the SaaS world they don't exist — anyone who needs them either does it manually or doesn't do it at all.

In the marketplace world they exist as small businesses run by one or two people, monetized at $0.10–$5 per call, profitable at hundreds of customers. **The marketplace doesn't just compete with SaaS for existing categories. It enables new categories that couldn't exist at all under the SaaS model.**

That's the actual category-creating claim. Not "we're a better way to buy AI labor" but "we're the *only* way to monetize a vast class of useful capabilities that the SaaS company-building tax has been suppressing for two decades."

## The second-order tradeoffs (worth being honest about)

The thesis isn't a free lunch. Three real costs come with the bargain:

**Brand collapse.** When buyers call `serviceId: 'kyc-verify-v2'`, they don't know or care who built it. The brand value accrues to the marketplace, not the builder. This is the same dynamic where most YouTube creators are anonymous to viewers despite huge audiences — distribution is rented, not owned. Builders get easy launch but lose the ability to build durable brand equity outside the marketplace.

**Margin compression.** Without company-building costs to absorb, builders run on thinner margins. Buyers benefit (prices fall toward the cost of compute plus a market-clearing margin). But it means agents on the marketplace will rarely sustain enterprise-SaaS gross margins. This is a feature for the buyer side and a constraint on builder ambition.

**Builder lock-in.** Once a builder is successful on the marketplace, leaving means rebuilding the company-building infrastructure they never built in the first place. The marketplace's leverage over successful builders compounds over time. This is fine if the marketplace's take rate stays reasonable; it becomes coercive if not. The marketplace's discipline on its own take rate is the thing that keeps the bargain attractive over time.

**The take rate is the whole game.** The marketplace charges some fee — call it 10–20% of transaction value. That fee funds the infrastructure provision. It must stay smaller than the company-building tax it replaces, or builders defect to building their own companies. Every successful platform has had to make this tradeoff explicitly: the App Store's 30% has been controversial for a decade exactly because it sits at the edge of "worth it." For an agent marketplace, the right answer is probably lower than 30% — partly because builders have lower margins to share, and partly because the marketplace has to actively recruit builders for the long tail to materialize.

## Why this matters for the strategy

The "marketplace is the company you don't have to build" line isn't just a clever framing. It's the answer to two questions investors and customers will both ask:

1. **"Why won't every SaaS company just build their own marketplace?"** Because building a marketplace requires building all the same company-building infrastructure *plus* a two-sided network. SaaS companies will list on the marketplace — they're not the threat — but they won't replace it.

2. **"Why won't OpenAI/Anthropic just do this?"** Because the model providers' business is models. Building a credibly neutral marketplace requires not being a model vendor — otherwise builders won't trust the discovery, ranking, and monetization decisions. This is why Stripe was built outside of any single bank, and why marketplaces historically don't get built by participants. The neutral position is the moat.

The thesis ultimately reduces to: **the marketplace's product is "everything a builder needs to monetize a capability except the capability itself." If we provide that well, we own the substrate of the agent economy. If we provide it badly, we're a directory.**

That's the bet. The whole essay is downstream of this one line.
