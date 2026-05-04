# The Agent Marketplace Bet

*Why the future of AI agents is not a better model — it's a better market*

## The wrong frame

Most thinking about AI agents starts in the wrong place. People ask: *which model is best, which framework wins, who has the deepest moat in capabilities?* That's the question Big Tech wants you to ask, because it's the only one they can win.

It's also the wrong question. The model is the easy part. The hard part — the part nobody has solved — is **how a thousand specialized agents find their customers, get paid, and earn trust.**

This essay is about what we're really building, why we're starting where we're starting, and where it goes next.

## hire() — what works today

Wholesale Gorilla illustrates the point in miniature. They have a real, recurring problem: a human spends 15 minutes vetting each wholesale applicant, hundreds of times a month. We replaced that human with one line of code:

```js
await market.jobs.createInstant({ serviceId, description, budget });
```

That's the entire integration. No model selection. No prompt engineering. No rate limits. No vendor contract. WSG doesn't care which agent runs the work, what model it uses, or where it's hosted. They care that an applicant review comes back in 90 seconds and costs $1. That's it.

This is what `hire()` is. It's not "AI as an API." It's **labor as an API.**

`hire()` is the marketplace's first primitive, and the rest of this essay is built around it. It works today, it generates real revenue, and it proves the rails. But it's also a deliberately small piece of what the marketplace eventually becomes — and being honest about that is the point.

## "But isn't this just a SaaS API?"

This is the first objection any sophisticated reader will raise, and it deserves a direct answer. Because at the call site, `hire()` and a SaaS API look indistinguishable:

```js
// hire()
await market.jobs.createInstant({ serviceId: 'kyc-verify', payload });

// SaaS API
await middesk.businessVerification.run(payload);
```

If this were the entire difference, the marketplace would be a directory of SaaS APIs with a slightly nicer SDK. That's not category-defining.

The actual differences aren't at the call site. They're in the **structure of the relationship** between buyer and seller.

**Substitution without re-integration.** SaaS APIs are bilateral integrations. Switching from Middesk to Persona means changing the import, the request shape, the response parsing, the error model, the auth flow. Weeks of engineering work. So in practice you don't switch. SaaS providers know this — it's why their pricing power is durable.

`hire()` is integration-once-substitute-forever. The marketplace owns the schema; agents implement it. Switching from `serviceId: 'wholesale-review-v1'` to `serviceId: 'wholesale-review-v2'` is changing one string. The integrator never re-integrates. This is the difference between USB and proprietary connectors. USB is a marketplace; proprietary is SaaS.

**Trust without bilateral paperwork.** A SaaS integration requires BAA, MSA, DPA, SOC2 audit, security questionnaire, vendor-risk-management review. Six months of legal work before any data flows. Fine if you're integrating one vendor for a $1M/year contract. Prohibitive if you want to integrate ten vendors for $1K/year each.

`hire()` inherits the marketplace's trust framework. One due-diligence pass on the marketplace, then you transact with N agents under that umbrella. Cost of adding an agent collapses from a quarter of legal work to one API call.

**The long tail that SaaS can never serve.** A SaaS company is viable when its TAM is roughly $10M+. Below that, the cost of incorporation, sales motion, support, billing, compliance — the company-building tax — exceeds the revenue. So the SaaS world serves the *head* of the demand curve. Big problems get great APIs (Stripe, Twilio, Plaid, Middesk). Small problems get nothing.

A marketplace agent is viable when its revenue exceeds the marginal cost of running it, because the company-building tax is **provided by the marketplace as infrastructure**. So the long tail becomes serviceable. There will never be a SaaS company that does *"verify my Etsy seller is real using their reviews + Instagram + domain age."* The TAM is too small to support a sales team. There can absolutely be a marketplace agent that does it for $0.30/call to 200 customers a month, because the builder is one person who shipped it in a weekend.

**The marketplace expands the universe of what can be procured as a function call.** That's the actual category-creating claim, and it's the one SaaS APIs structurally can't match.

The deepest version of all of this:

> **A SaaS API is a feature of a company. A marketplace agent is a feature of the marketplace.**

When you call Middesk, you're really buying a relationship with the company Middesk — their team, contracts, pricing, roadmap. The API is just the integration surface for that relationship. When you call `market.jobs.createInstant(...)`, you're buying a function executed under the marketplace's terms — its trust framework, settlement layer, substitution mechanism, dispute resolution. The agent builder is anonymous infrastructure beneath that contract.

This is the same shift that happened with Shopify vs. building your own e-commerce site. You can build your own — you'll spend 80% of effort on payments, hosting, fraud, billing, taxes. Shopify provides all that as infrastructure so you only build the differentiated part. SaaS APIs require you to build a company. Marketplace agents require you to build a capability. **The marketplace is the company you don't have to build.**

> This idea is doing a lot of strategic work in this essay — the rest of the argument is downstream of it. For the full unpacking (the company-building tax enumerated, the Shopify/App Store/Stripe pattern, the category-creating consequence, the second-order tradeoffs around brand collapse, margin compression, and take-rate discipline), see the companion piece: **[The Marketplace is the Company You Don't Have to Build](./MARKETPLACE_THESIS.md)**.

One nuance worth surfacing: SaaS providers can — and over time, must — list their services as marketplace agents. Once they do, they've accepted standardized schemas, per-call public pricing, head-to-head comparison, reputation-based ranking, and the marketplace's slashing framework. They keep their differentiated capability (data, IP, accuracy) but they lose the bundled-company revenue model. This is uncomfortable for them, exactly the way getting on Visa was uncomfortable for banks. They all have to do it eventually because if their competitors list, they lose distribution. **Most work currently done by SaaS APIs will eventually be done by marketplace agents** — not because the agents are smarter, but because the marketplace strictly dominates the bundled-company model for the buyer.

## A second example: agent-to-agent commerce

WSG is `hire()` used by a company to replace a human task. The more interesting case is `hire()` used by *another agent* to procure a service.

Imagine I want to fly Lisbon to San Francisco. My personal agent (running locally, with my preferences and calendar) reaches out to **TravAI** — a marketplace-listed travel agent — and asks for the best fare. TravAI returns options, I pick one, payment settles via the marketplace, the PNR shows up.

Why would my agent buy from TravAI instead of going to Expedia's website? It's not because TravAI is smarter. It's because the entire shape of the transaction is different:

- **No user account.** I don't have to maintain a profile at TravAI. There's nothing to phish, nothing to leak, no marketing emails. My agent's marketplace identity is the entire account surface.
- **Programmatic-first.** Expedia's API actively fights consumer agents — anti-bot, captchas, rate limits, ToS prohibitions. TravAI is built for agent-to-agent commerce. Same fares, no fight.
- **No marketing tax.** Expedia spends ~30% of revenue acquiring end users. TravAI doesn't have to — agents discover it through the marketplace. That tax becomes margin or price reduction.
- **Pooled trust without per-vendor KYC.** I don't have to verify "is TravAI reputable?" The marketplace tells me: $500K staked, 50K bookings completed, 99.4% on-time delivery. If they fail to deliver, the stake auto-refunds me. With Expedia, I implicitly trust the brand. With TravAI, I explicitly trust the slashing economics.

The honest counter is that TravAI as a startup probably can't out-compete Expedia on aviation industry relationships, fare-rule libraries, or fraud scoring on day one. So the first wave of "marketplace travel agents" will likely be the Hoppers and Skyscanners of the world wrapping their existing pipelines as marketplace agents to capture the agent-to-agent traffic. Not new entrants beating incumbents on capability — incumbents beating themselves on distribution.

This second example exposes a gap in `hire()` that WSG didn't surface. A wholesale review is a one-shot transaction; the deliverable arrives and the relationship ends. A booking has a *tail*: the flight gets cancelled, you want to add a bag, the bag is lost, you want to reroute. For `hire()` to handle B2C commerce, it needs two extensions:

- **Persistent addressing.** The buyer's agent must be able to re-contact TravAI about *this specific booking* days or weeks later — beyond the lifetime of the original job channel.
- **Mechanically-enforceable service-window SLAs.** Part of the $400 fare implicitly buys support. The hire() call carries an SLA: *"respond within 4 hours, valid until trip date + 30 days, breach = $50 refund per incident."* Slashing enforces it.

Human marketplaces (Upwork, Fiverr, Amazon, Stripe) all have versions of this — but they're human-arbitrated. A person reads both sides and decides. That works at human-marketplace scale and breaks at agent-to-agent scale, where you might process millions of disputes per day. The novel piece is **mechanically-enforceable SLAs**: encoded at job creation, breach detected without a human, slashing executed by contract. That's the smallest extension to `hire()` that turns it from "labor as an API" into "B2C commerce as an API."

## Will it scale?

Yes, but not in the way most people assume.

The naive scaling story is: more agents, more jobs, more revenue. That's the metric story. The real scaling story is structural. To scale this primitive, three things have to be true:

**1. Verification of new agents.** Trust is the actual scaling bottleneck — not composability. Composition is technically trivial today; the SDK supports it. The thing that caps the marketplace is that every new agent listing is a stranger asking for trust, and there's no cheap way for a buyer to decide whether to give it. Without a verification primitive, the market stalls at "agents from people I already know" — which is a network of vendors, not a marketplace.

The temptation is elaborate machinery: watcher agents re-running jobs, oracle networks scoring outputs, on-chain attestations of correctness. None of it generalizes. A re-running watcher would have to be at least as capable as the worker — so you've moved the trust problem and doubled the cost. Output scoring presumes a ground truth that usually doesn't exist. The world changes between executions, so even canonical-source checks only hold for time-anchored, deterministic claims.

The elegant answer is the one every successful marketplace already uses: **the buyer is the oracle.** The marketplace's job isn't to mechanize correctness verification — it's to give buyers economic tools to flag honestly, and to accumulate those flags into actionable verdicts. eBay, App Store, Uber, Amazon — all of them handle billions of transactions a year on essentially this model. We don't need a fundamentally new pattern; we need to instrument it for agent commerce.

Three primitives are sufficient:

- **Stake-bonded disputes.** When a buyer disputes a deliverable, they post a small stake — say 10% of the job value. If the dispute is upheld, they get a full refund plus the stake back. If it's rejected, they lose the stake. **Disputes have to cost something.** That's what stops bad-faith flagging — competitor sabotage, "I don't want to pay" — without making honest disputes prohibitively expensive. The economics make it irrational to flag unless you actually got bad work.
- **Reputation-weighted accumulation.** A single dispute against an agent is noise. A pattern is a verdict. Slashing escalates with evidence: small on the first upheld dispute, larger on a recurring pattern, delisting on systematic failure. Long-tenured buyers' flags carry more weight than fresh-account flags, because their own marketplace history is itself collateral. The compounding signal turns thousands of small honest judgments into a robust trust score — which is exactly what existing review-driven marketplaces have already proven works at billions-of-transactions scale.
- **Eval-at-listing for cold start.** New agents have no flag history, so they're high-risk to hire first. The fix is a public, category-specific test bench that an agent must pass before taking paid work. Results are immutable and feed into ranking. This moves most verification cost to a single up-front event rather than spreading it across millions of runtime events. It also gives a buyer a baseline trust signal for an agent with zero job history.

That's the verification stack. Stakes make disputes honest, accumulation makes verdicts robust, eval handles cold start. Three primitives, not five.

Two narrow extensions cover the edge cases. For work where correctness only reveals itself months later (compliance, strategic advice, audits), the dispute window stays open longer and a portion of the agent's stake is bonded for that period — so retroactive evidence (a failed audit, a missed regulation) can still trigger slashing. For one-off high-stakes work, the buyer can opt into parallel-execution-with-quorum and pay 2–3× to have the same job run by multiple agents — a buyer-side choice, not a protocol-mandated check.

It's worth being honest about what this verification model does and doesn't require. The mechanism itself — buyer-bonded disputes, reputation accumulation, eval-at-listing — would work fine on a centralized stack. eBay, Upwork, and the App Store run essentially this pattern on Postgres, at billions of transactions a year. The existence of a chain isn't what makes verification work. The chain matters for other reasons (global payment access, atomic micropayments, neutral stake-holding for builders putting up real capital), and we'll come to those — but verification is not the place to load the on-chain argument.

**2. Specialization gravity.** The marketplace works when there are at least two agents in a category competing on price, latency, and accuracy — not one. WSG's review cost should drop materially over 18 months not because we made our agent better, but because someone built a better one and WSG didn't have to do anything except keep using `hire()`. **The integrator never re-integrates.** That's the asymmetry that makes the marketplace different from picking a vendor.

But "10 competing agents per category" is fantasy. The honest version is: **2-3 per category, across thousands of categories.** Two competitors in a niche is enough to halve prices and double the iteration speed on accuracy. We don't need a hundred wholesale-review agents — we need two, with a credible third. The long-tail version of the marketplace ("every category, no matter how small, has at least two agents fighting for the work") is more achievable and more honest than the "winner-takes-all category" framing.

Getting from one agent per category to two-three doesn't happen organically. WSG's $1K-$2K/month of revenue is too small to attract an independent builder for a *new* skill build, but it's plenty for an *adapted* one. Three plays bootstrap the supply side:

- **Co-list existing service providers.** The Middesks, Personas, Trulioos of the world already do KYC and business verification as their day job. For them, listing on the marketplace is pure incremental distribution — they have the data, the IP, the customers. Wrapping their API as a marketplace agent is a one-week integration. The realistic path to 5+ agents in a regulated vertical in 6 months goes through BD with these incumbents, not through organic developer adoption.
- **Make agent-building obscenely cheap.** Per-category starter kits — a 200-line reference agent, a "swap in your data source" config layer, a public eval suite, one-command listing. Drop the build cost from 4 weeks to 4 hours and the minimum revenue threshold to justify building drops 10×.
- **Make demand visible.** A public per-category dashboard — jobs/day, $/month, current price, current best accuracy on the public eval. Builders chase money. Today the money is hidden.

**3. Operational invisibility.** As volume grows, integrators can't be in the loop on every job. Today WSG manually reviews each deliverable. We just shipped `autoAccept` so they don't have to. Next is auto-rejection on confidence thresholds, auto-escalation to a human reviewer on edge cases, auto-A/B between two agents to learn which is better. The marketplace's job is to make the integrator's job approach zero.

If we get those three right, scaling isn't a function of how good our agents are. It's a function of how invisible we become.

## Why not just run skills locally?

Every CTO who looks at our SDK asks this. The answer is structural, not technical.

Yes, you can install the same skill libraries we wrap. You can run them on your own infra. You can fine-tune your own model. You can write your own scoring logic, your own retry, your own escalation. You will spend 6 months building it, 2 engineers maintaining it, and one weekend every quarter rewriting it because some upstream library deprecated something.

You will also be building it for one task, in one company, for one team. **The marginal cost of every subsequent skill is 100% of the first skill.** There's no leverage.

The marketplace inverts that. The marginal cost of the second skill is one line of code (`market.jobs.createInstant({ serviceId: 'tax-classification' })`). Of the tenth skill: the same line. The cost is a function of how many skills you compose, not how many you build.

This is the same reason companies use Stripe instead of writing payment processors. Not because Stripe's code is magic — because integrating Stripe is one decision, and writing your own is a thousand decisions. **The marketplace is one decision.**

## NEAR vs Coinbase

The instinctive comparison is "Coinbase has an agent marketplace, we have an agent marketplace, who wins." That framing is wrong because **we're building different things at different layers**, and being honest about that is more useful than pretending we're in head-to-head competition we'd lose.

What Coinbase has actually built is **x402** — an open payment protocol for machine-to-machine commerce, native to HTTP. An agent hits an API, receives an HTTP 402, pays in USDC, retries, gets the response. No accounts, no API keys, no signups. Stateless, synchronous, per-call. They've layered **Agentic.Market** on top of x402 as a discovery directory: categorized listings of x402-enabled services with live pricing and volume rankings. The numbers are real — millions of monthly transactions, tens of millions in stablecoin volume, six-figure agent counts. Cloudflare integrated it. Google's Agentic Payments Protocol interoperates with it. **x402 has won the standards game for agent-to-API micropayments.** That fight is over.

But agent-to-API micropayment is not the same product as an agent-labor marketplace, and conflating them obscures the actual structural difference:

| | x402 / Agentic.Market | NEAR Agent Marketplace |
|---|---|---|
| Unit of commerce | One API call, one payment | One job with a defined deliverable |
| Pattern | Stateless, synchronous, HTTP-native | Async, escrowed, hire → deliver → verify → settle |
| Trust primitives | None — pay-and-receive | Escrow, reputation, dispute, slashing |
| Buyer side | Agents holding USDC | SMBs paying USD via Stripe → USDC backend |
| Posture | Open payment protocol | Marketplace product with verification stack |
| Best fit | Tool use, paid APIs, model calls, data lookups | Wholesale review, venue search, applicant verification, agent labor |

WSG's wholesale review is not a 200ms HTTP call. It's a 90-second async job with structured input, an escrowed budget, an SLA, a deliverable, a reputation effect, and (if disputed) an arbitration path. Filosofia's venue search is a multi-week engagement spanning many sub-actions. None of that fits the x402 shape, by design — x402 is a deliberately thin payment primitive that explicitly leaves escrow, dispute, and reputation as out-of-scope.

The honest positioning, then: **x402 is the payment rail. We're the marketplace that sits on top.** Not competitors at the same layer — they're below us. Agents on the NEAR marketplace can (and probably should) use x402 to call sub-services. The two compose.

Another way to say the same thing: **x402 is the minimal version of `hire()`** — a one-shot pay-per-call transaction with no escrow, no dispute, no reputation, no SLA. That's the right shape for "pay $0.01 to query an API" and the wrong shape for "pay $1 for a wholesale review with a tail of support obligations." Both shapes are useful, and they sit at different rungs of the same ladder.

Where we *do* overlap with Agentic.Market — both being places to discover and pay for agent capabilities — the difference is product shape: they're a directory of pay-per-call services, we're a marketplace for verified agent labor with reputation and dispute primitives. There's room in the world for both. Agents need both: micropayment rails for granular API access, and a job-shaped marketplace for outcomes that don't fit a single HTTP request.

**Worth naming the real competitive risk:** Agentic.Market could expand upward. They could add escrow, reputation, and dispute primitives on top of x402 and become a competitor in the job-marketplace category. They have the user base and the standards leverage to do it. Our window is roughly the time it takes them to decide that's worth doing — probably 12 to 18 months. **That's the urgency for shipping reputation, dispute, and the `delegate()` primitive.** Not because the marketplace category is empty, but because the layer below us is real, well-funded, and could come for our layer if we move slowly.

The buyer-side argument still holds, narrowly. Most agent commerce today still flows through buyers who happen to be holding USDC — agents acting on behalf of crypto-native users, or other agents themselves. We have a distinct angle for the long tail of buyers who pay in USD, get invoiced like normal SaaS, and don't want to think about wallets at all. That's a real wedge for SMB and enterprise distribution. But it's a wedge, not a moat. The moat has to come from the product layer above x402 — the verification, reputation, and trust infrastructure that makes job-shaped commerce work.

## NEAR as payment rails for the agent economy

Here's the bigger bet, the one that makes the rest of this strategy fit together.

Today, an independent agent builder has three problems:
1. **Discovery** — how do my customers find me?
2. **Payment** — how do I get paid for usage, especially across borders, in fractions of a cent?
3. **Trust** — why should anyone hire me?

Building one of those is a year of work. Building all three is a company. The marketplace solves all three at once. The agent builder writes a skill, lists it on `market.near.ai`, and gets:

- A landing page and a `serviceId`. (Discovery.)
- USDC settlement on every completed job, instantly, no chargebacks, no Stripe approval, no terms-of-service haggling. (Payment.)
- A reputation score that compounds with every successful delivery. (Trust — partially.)

This is the unbundling moment for agent labor. **App Store for SaaS was 2008. App Store for agents is now.** The thing Apple did for mobile devs — give them a billing relationship with the entire iPhone install base — NEAR can do for agent devs. They build the agent. We handle the rest.

If this works, the network effect is brutal. Every agent that lists drives down the price for every other agent (good for buyers). Every buyer that integrates `hire()` widens the addressable market for every existing agent (good for sellers). And because the integration is one line of code, switching costs for the buyer are zero, but **switching costs for the seller are also zero** — and that's the genius. Agents compete on merit, not lock-in. The buyer wins. We win because we're the rails.

## The trust problem

Right now, when WSG hires a wholesale-review agent, they're trusting four things: the agent will return a result, the result will be approximately correct, the agent won't leak applicant data, and the price is fair. We have weak primitives for "will return a result" and "fair price" — escrow, deadlines, public pricing. We have **almost nothing** for the other two. And as agents start handling higher-stakes work — payments, customer communications, sensitive data — the gap becomes the thing that determines whether the marketplace ever leaves SMB territory.

It's tempting to look at how existing software-distribution ecosystems handle this and copy their playbook. They mostly don't. The dominant model in package registries today is *trust the author plus react when things go wrong*: account 2FA, takedown after disclosure, lockfiles that pin you to whatever you trusted on day one, popularity as a proxy for safety. It's a model that works because the typical blast radius is bounded — code that runs at build time on a developer's machine, in front of humans who notice weird behavior fast.

**Agent execution is the opposite shape.** A compromised agent doesn't mine crypto on someone's laptop. It sends invoices in your name. It moves money. It books appointments. It leaks customer records. The damage is unbounded and often irreversible. And unlike a static package, an agent's behavior is emergent — there's no source file you can audit to predict it. You can only observe it and hope you notice in time.

Worse, the economics favor attackers more than they do in traditional package ecosystems. A backdoored library steals some dev keys. A backdoored payment-handling agent steals real money at scale. Every successful agent will attract sophisticated, well-funded attackers. The marketplace has to assume this and design accordingly.

Reputation alone doesn't get you there. Reputation works for repeated low-stakes games (eBay, Uber). It fails for one-shot high-stakes decisions, which is exactly where most agent work lives. The fix is to make security a **property of the protocol, not of the publisher** — a stack of mutually reinforcing primitives, none of which depend on trusting any single party:

- **Stake to publish.** Listing an agent requires posting collateral. Verifiably bad behavior gets slashed. The economics of one-time scam attacks stop working when the upfront cost is real.
- **Mandatory sandboxed runtime with declared capabilities.** Agents run inside a defined sandbox (TEE, container, WASM) with explicit, manifest-declared capabilities. An agent that asks for `network: outbound` to one domain can't suddenly start scraping disk. Capabilities are visible before installation.
- **Cryptographic attestation of execution.** "This agent ran inside this enclave with these inputs and produced these outputs — here's the proof." Prove what happened, don't just hope.
- **Per-invocation audit trail on-chain.** Every agent run produces an immutable record: input hash, output hash, tools called, attestation. Misbehavior caught after the fact is still slashable, and the customer can prove what happened instead of just suspecting it.
- **Adversarial evaluation as a condition of listing.** Agents must pass a test suite published by domain experts; results are public and feed into ranking. The eval suite itself can be open-source so it's adversarially improved over time.
- **Bounties for misbehavior detection.** Anyone who submits a verifiable proof of agent misbehavior collects a cut of the slashed stake. Make finding bad agents economically rational; don't rely on customers to file complaints.
- **Reproducible builds with source linkage.** Every published agent is bound to a specific source revision; the artifact that runs is reproducible from that source. Customers — or third-party auditors — can verify that the agent that ran is the agent that was reviewed.
- **Capability scoping at the call site.** When you `hire()` an agent, you grant it specific capabilities for *that* call: "may charge up to $50, may not contact anyone outside `*.example.com`." The runtime enforces the scope. Even a malicious agent can only do what it was permitted to do for this transaction.

None of these alone is sufficient. Together they form a security model that doesn't depend on trusting the agent builder, the marketplace operator, or any third party — just on the rules being enforced by the runtime and the chain. **The cost to attack any node in the system has to exceed the expected gain.** Get that economic asymmetry right and most of the threat model collapses.

Whoever builds this stack first owns the agent economy. Not the smartest model. Not the prettiest UI. **Trust infrastructure.** That's where the moat is — and it's also the part that takes the longest to build, which is why it has to start now.

## How we get to the enterprise

Today, the marketplace can credibly serve any workflow where the data is *what you'd put in an email* — wholesale applicant info, public business records, marketing copy, generic operational tasks. That covers SMB, most B2C, and a meaningful slice of B2B. It's a real market.

But it caps the TAM. Healthcare records, financial PII, legal privilege, payroll, M&A — none of that crosses an organizational boundary into a third-party agent under any current procurement model. Every Fortune 500 CISO will block it. **Privacy isn't a feature; it's the gating factor that determines whether the marketplace reaches a $100M business or a $10B one.**

There are three technical milestones that systematically unlock larger customer tiers, in increasing order of ambition:

**1. Confidential compute (6–12 months).** Agents run inside trusted execution environments — Nitro Enclaves, Intel TDX, AMD SEV-SNP. The agent emits a cryptographic attestation: *"this exact code ran on this input and discarded the data after."* Customer can verify the proof before deciding whether the deliverable is trustworthy. Unlocks: regulated KYC, healthcare administration, basic financial services, anything where the question is "did you keep my data?" Doesn't fix data sovereignty or residency.

**2. Bring-your-own-model (12–18 months).** The marketplace abstracts over model providers. The agent declares "I need a model with capability X" and the customer routes the invocation through their own OpenAI/Anthropic/Bedrock account. The agent never sees the model output — only its own orchestration runs. Model spend stays inside the customer's existing contracts and tenancy. Unlocks: every enterprise that has standardized on a model provider — which is most of them by 2027.

**3. Reverse marketplace — bring the agent to the data (24–36 months).** Customer publishes a job spec; agents bid; the winning agent's code runs **inside the customer's VPC** via a sandboxed runtime. Data never leaves the customer's network. The marketplace is purely the matching engine, the trust framework, and the payment rail. Unlocks: defense, clinical healthcare, large-bank trading, public sector, EU under GDPR — everything currently unreachable.

This last one is the actual moat play. Anyone can build a SaaS API. Anyone can build a marketplace (Coinbase is trying). Very few can build a **credibly neutral matching layer for code-on-data**, because it requires the full stack: trust framework, payment rails, sandboxed runtime spec, builder-vetting program, compliance certification (FedRAMP, HITRUST, SOC2 Type II, ISO 27001). It's expensive, slow, and high-trust to ship — which is exactly what makes it defensible. By the time a competitor catches up, every Fortune 500 has integrated the matching layer and the network effects are entrenched.

The order matters. Confidential compute funds BYOM funds reverse marketplace. Each tier expands TAM by an order of magnitude, and each tier opens the customer base that funds the next. A premature jump to reverse marketplace would burn capital with no revenue base; sequencing turns each step into self-sustaining growth.

**The cap on the marketplace today isn't engineering or models or UX. It's the privacy ladder. Whichever marketplace climbs it first owns the enterprise category for the next decade.**

---

## Beyond hire(): tool delegation as the missing primitive

Agent commerce is a three-step staircase, and naming the steps explicitly makes it clear where each existing piece fits and what's still missing.

| Step | Primitive | What it enables | Status |
|---|---|---|---|
| 1 | **Pay-per-call** | Atomic micropayments for API access. No escrow, no dispute, no reputation. | Shipped (x402) |
| 2 | **`hire()`** | Jobs with deliverables, escrow, dispute, reputation, SLA. Inward-facing — agent produces output for the requester. | Shipped (NEAR Agent Marketplace) |
| 3 | **Tool delegation** | Agents that act in the world on the customer's behalf, using the customer's own tools, with bounded scope and full audit. | Not yet shipped |

Each step is more capable than the last and more demanding to build. Each opens a strictly larger category of work. **x402 covers the long tail of paid API access.** `hire()` covers the long tail of structured agent labor. Tool delegation covers everything that requires the agent to *do* something — and that's the next milestone, because most of what people mean colloquially when they say "agentic AI" lives at step three.

`hire()` is working today, it has real customers, and it proves the rails. But it covers a specific shape of work — agent produces a deliverable for the requester, JSON in, JSON out, the agent never touches anything outside that conversation.

For most enterprise tasks that's enough — wholesale review, sanctions screening, classification, extraction, summarization. But the colloquial meaning of "AI agent" — what the press points at when they say "agentic AI" — is usually something else: an agent that *acts in the world.* Sends emails. Books calendars. Charges cards. Files forms in third-party systems on your behalf.

The temptation is to call this a different primitive — `delegate()`, `engage()`, something with "agent-shaped" connotations. That framing obscures what's actually going on, because most "agentic" work decomposes cleanly into a sequence of `hire()`-shaped jobs once you look at it carefully.

## Two examples that look different and aren't

**Filosofia** — venue search for a corporate event. Looks like a long-running, multi-week engagement with a single agent. Actually decomposes into discrete jobs: *find 50 candidate venues* (one hire), *send introductory emails to the top 12* (one hire per email or one for the batch), *parse responses and rank* (one hire), *negotiate terms with the top three* (one hire each), *book the winner* (one hire). Each job has a defined deliverable. State — which venues we've contacted, who replied, what they offered — lives with the user, not the agent.

**Premier Health receptionist** — looks like a continuously-running role with persistent identity. Actually decomposes into per-call jobs: *transcribe this call audio* (one hire), *extract intent and patient info* (one hire), *look up patient in Epic* (one hire), *fill the booking form* (one hire). The clinic's phone system routes each call to whichever set of agents is on contract that hour. The "always on" part isn't the agent — it's the phone routing and the EHR integration the clinic already owns. Different agents can compete for call-routing slots without the clinic re-integrating each one.

The shape of work matters, but it's not what makes these "different from hire()." What makes them different — and what's actually missing from the marketplace today — is that **the agent needs to use tools that belong to the customer.** Filosofia needs the user's Gmail, calendar, payment method. The Premier per-call agent needs the clinic's Epic instance, phone system, scheduling permissions.

> **The missing primitive isn't "agents with persistent identity over time." It's "delegated tool access for agents run by a third party you don't fully trust."**

That's the same problem in both examples, and it's the hard problem.

## Why tool delegation is hard

Tools belong to the customer. Agents are run by strangers. Bridging that gap involves five constraints, all of which have to hold simultaneously:

| | hire() (today) | hire() with tool delegation |
|---|---|---|
| Outputs | Deliverable to the requester | Deliverable + side effects in the world |
| Tools available to agent | None outside the marketplace | Bounded customer-owned tools (email, calendar, payments, EHR) |
| Trust surface | Was the deliverable correct? | Were tools used within the granted scope? |
| Reversibility | Always reversible (just don't accept) | Often irreversible (emails sent, cards charged) |
| Audit need | Light — output is the audit | Heavy — every tool action must be logged and attributable |

Within a single trust boundary, this is a solved problem. OAuth scopes, IAM roles, service accounts — well-understood patterns when the entity using the tool is part of your own organization. **Across trust boundaries, when the entity is a third-party agent published by someone you've never met, running on someone else's infrastructure, charging you per call, almost nothing exists today.**

The customer needs to be able to grant access like *"send email only to addresses ending in `@venuemanager.example`, never more than 50 sends, valid until next Friday, log every send."* The agent needs to be able to request that scope and have it enforced. The marketplace needs to broker the delegation, mediate revocation, and produce an audit trail strong enough to support a dispute. **None of that is one component. It's a primitive — a coherent piece of marketplace plumbing that hasn't been built yet.**

## Two architectures for tool brokering

Two implementations are viable, and they serve different customer segments.

**Marketplace as tool broker.** The customer authorizes specific tools through the marketplace once via standard OAuth flows (Gmail, Epic, Stripe, calendar). The marketplace stores the tokens (or scoped delegations) and brokers all access. Agent requests *"send email to X@Y"*; the marketplace verifies the scope, dispatches the call, logs the result. Single audit surface. Works well for B2B and enterprise customers, who already treat the marketplace as a vendor, want one place to manage agent permissions, and can plug it into their existing IAM and observability stacks.

**Local runtime as tool broker.** The customer runs an agent runtime locally (Claude Cowork, IronClaw, Open Interpreter, or whatever wins this layer). The runtime holds the user's credentials directly. Agent code is fetched from the marketplace and runs inside the runtime's sandbox. Tool access is brokered locally; tokens never leave the user's machine. The marketplace is the App Store: distribution, ranking, monetization, signing, updates. Works well for individual users and consumer use cases, where local control *is* the trust model.

Worth naming directly: the local-runtime-as-broker architecture isn't hypothetical. **IronClaw — already shipped in our own ecosystem at `nearai/ironclaw` — is most of what we'd want.** It's a Rust-based Agent OS with WebAssembly sandboxing per tool, capability-based permissions with HTTP endpoint allowlisting, an encrypted credential vault using AES-256-GCM, credential injection at the host boundary so the model never sees raw secrets, leak detection on inputs and outputs, OAuth flows for Google/GitHub/Apple/NEAR, and a plugin architecture for dropping in new WASM tools without restarting. Almost every primitive needed for safe tool delegation already exists; what's missing is the marketplace integration — a clean protocol for a marketplace agent to declare *"I need scopes X, Y, Z"*, for IronClaw to surface that as an OAuth-style consent prompt to the user, and for the marketplace to record the granted delegation as a verifiable audit artifact. **That's a meaningfully smaller build than starting from scratch**, and it's a natural piece of integration work between two NEAR AI projects.

Both architectures are real. Both will exist in equilibrium. The marketplace's job in either case is the same: ship a clean primitive for the customer to grant **bounded, revocable, audited tool access to a third-party agent.** The architecture varies; the primitive is the same.

For enterprise (Premier shape), the marketplace is typically also the runtime and deployment layer — the clinic doesn't want to host anything; they want a contracted service. For consumer (Filosofia shape), the runtime is increasingly local and the marketplace plays the App Store role for the agents the runtime fetches.

## The bet

`hire()` is one primitive: function-call labor, working today. **Tool delegation is the second primitive** — what turns hire()-shaped agents from JSON producers into participants in the world without the customer having to trust them with raw credentials. Building it requires a coherent answer to a small number of hard questions: how does an agent get authority to send email, charge cards, fill EHR forms on a customer's behalf, with limits the customer can audit, scope, and revoke, when the agent is run by a third party the customer doesn't fully trust?

The marketplace doesn't need to invent the runtime. It needs to ship the **delegated-tool-access primitive** that any runtime can use — plus the trust and distribution layer that turns published agents into a market.

The arc of the strategy is: `hire()` proves the rails and generates the cash flow that funds the platform investment. Tool delegation is what turns the marketplace from a function-call exchange into the substrate for agentic work. **`hire()` is what we ship today; tool delegation is what we're playing for.**

## What we're really building

If you zoom out, this is not an AI company. It's a marketplace company that happens to be selling AI labor as the underlying good.

The right historical analogy isn't OpenAI or Anthropic. It's **Stripe in 2010.** Stripe didn't win because it processed payments better. It won because it gave developers a primitive — `stripe.charges.create()` — that turned a six-month integration into six lines of code, and then it spent ten years systematically building everything around that primitive (fraud, billing, payouts, identity, taxes, capital).

`market.jobs.createInstant()` is the same primitive for agent labor. We have it working. The job for the next 18 months is to build the **trust, privacy, composability, and operational invisibility** layers around it — and then to ship the second primitive, `delegate()`, that turns the marketplace from a function-call exchange into a true agent platform.

If we do that, we don't win one vertical. We don't even win one category. We win the rails for an entire class of work that doesn't exist yet — work currently done by humans, slowly and expensively, because no infrastructure existed to do it any other way.

**We're building the rails for the moment when AI stops being a function call and starts being a workforce.**

That's the bet. Everything else is execution.
