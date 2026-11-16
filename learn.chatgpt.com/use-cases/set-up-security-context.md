---
name: Set up security context
tagline: Define what to protect, which rules to check, and what to report.
summary: Learn how to prepare and configure the context Codex needs for security
  reviews and scans.
skills:
  - token: $codex-security:threat-model
    url: /codex/security/threat-model
    description: Create a threat model of your application’s assets, entry points,
      security boundaries, and assumptions.
  - token: $codex-security:define-security-policy
    url: /codex/security/plugin/changelog#define-repository-security-policy
    description: Generate and seed a security policy within your repository.
bestFor:
  - Developers preparing a repository for security reviews and scans.
  - Application security teams documenting system risks, security requirements,
    and reporting criteria.
  - Teams making architecture, engineering, and operational knowledge available
    to security agents.
relatedLinks:
  - label: Add threat-model context to security reviews
    url: /codex/security/security-review#add-threat-model-context
  - label: Configure SECURITY.md guidance for scans
    url: /codex/security/plugin/scans#configure-the-scan
  - label: Customize engineering instructions with AGENTS.md
    url: /codex/agent-configuration/agents-md
  - label: Supply architecture and security documents to CLI scans
    url: /codex/security/cli/reference#add-security-context
---

> For the complete documentation index, see [llms.txt](/llms.txt). Markdown versions of documentation pages are available by appending `.md` to the page URL.

## Differences among threat models, AGENTS.md, SECURITY.md, and knowledge bases

[`AGENTS.md`](https://developers.openai.com/codex/agent-configuration/agents-md) keeps shared engineering instructions that establish consistent expectations. `SECURITY.md` tells Codex how your organization wants that reality evaluated and reported. A threat model describes the security reality of the system. They overlap, but the threat model is usually one part of the broader policy.

For example, a threat model would include details about assets, entry points, attacker-controlled inputs, trust boundaries, authentication assumptions, privileged operations, and risky components.

```markdown
# Threat Model

The public API accepts untrusted JSON and file uploads.
Requests cross from the internet-facing API into internal billing and
identity services. Attackers are unauthenticated users or compromised
tenant accounts. Protect tenant data, billing mutations, and service credentials.
```

The `security.md` tells Codex how your organization wants that reality evaluated and reported.

```markdown
# Security Policy

## Security Invariants

- Every billing mutation must be authorized for the active tenant.
- Uploaded content must be parsed within explicit size and resource limits.
- Service credentials must never be returned to clients.

## Reportable Findings

Report realistic violations of tenant isolation, authentication bypass,
unsafe parsing, secret exposure, or unauthorized billing mutations.

## Severity Context

Cross-tenant access is Critical.
Single-tenant unauthorized mutation is High.

## Out of Scope

Development-only tools that cannot be included in production builds.
```

Finally, a knowledge base supplies supporting documents to particular scans. This can include architecture documents, policies, additional threat models, or operational context that the CLI scanner should consider. Here’s an example of a Markdown architecture document seeded for the CLI scanner.

```markdown
# Payment Service Security Context

## Purpose

The payment service creates charges, issues refunds, and stores references
to payment-provider customers. It does not store full card numbers or CVVs.

## Deployment and Exposure

- `POST /api/payments` is internet-facing through the API gateway.
- `POST /internal/refunds` is reachable only from the support service.
- Background workers consume messages from the `payment-events` queue.
- The service runs with access to the payment-provider API and billing database.

## Authentication and Authorization

- Public endpoints use JWTs issued by the identity service.
- The API gateway validates signatures, issuer, and expiration.
- This service remains responsible for tenant authorization.
- Internal requests use workload identity; network location alone is not trusted.
- Refunds above £1,000 require a previously recorded approval.

## Trust Boundaries

1. Internet client → API gateway
2. API gateway → payment service
3. Payment service → payment provider
4. Payment service → billing database
5. Message producers → `payment-events` consumer

Inputs crossing any of these boundaries must be treated as untrusted unless
the receiving component performs the documented validation.

## Sensitive Assets and Operations

- Payment-provider API credentials
- Customer-to-provider identifier mappings
- Charge creation
- Refund issuance
- Webhook signature secrets
- Tenant billing history

## Important Data Flows

### Creating a charge

1. The API receives an authenticated request containing an order identifier.
2. The service retrieves the order using both tenant ID and order ID.
3. The service calculates the amount from server-side order data.
4. The service creates the provider charge with an idempotency key.
5. The resulting provider identifier is stored in the billing database.

Client-supplied amounts must never be passed directly to the provider.

### Processing a webhook

1. The raw request body is retained.
2. The provider signature is verified over the raw bytes.
3. The event timestamp must be within five minutes.
4. Duplicate event IDs are ignored.
5. State changes occur only after all validation succeeds.

## Relevant Code

- `src/http/payments.ts`: public payment endpoints
- `src/http/refunds.ts`: refund endpoints
- `src/webhooks/provider.ts`: webhook validation
- `src/workers/payment-events.ts`: asynchronous event processing
- `src/auth/tenant.ts`: tenant authorization
- `src/provider/client.ts`: provider API wrapper

## Security Assumptions

- The identity service is trusted to authenticate users, but not to authorize
  access to payment records.
- Queue publishers may be compromised; consumers must validate message content.
- API-gateway authentication does not replace service-level tenant checks.
- Provider webhook payloads are attacker-controlled until signature validation
  completes.

## Known Limitations

- Legacy refunds created before 2025 do not have idempotency keys.
- Webhook replay protection is local to one region.
- The development payment-provider emulator does not validate signatures.
```

It can be supplied to the scan using the following command:

```bash
codex-security scan . \
  --knowledge-base /path/to/security-policies
```

Putting it all together, a useful arrangement could look like the following:

```text
SECURITY.md
docs/security/
├── threat-model.md
├── architecture.md
├── authentication.md
└── deployment-boundaries.md
```

## Seed a threat model

Committing a threat model is a core component of informing how Codex should review security reviews. You can initialize a threat model by invoking the threat model skill within Codex and committing it.

![Example threat-model draft in a Codex repository project.](https://developers.openai.com/images/codex/secure-sdlc/threat-model.webp)


You can invoke the threat model skill through Codex by simply typing `$threat-model`. Once a threat model has been created, commit it to the repository under `/docs/security` and then link to the threat model within the Codex Cloud settings for the selected repo. If a threat model is not specified, Codex will regenerate the threat model for every security review.

![Example Security Review settings for a demo repository.](https://developers.openai.com/images/codex/secure-sdlc/cloud-settings.webp)

## Seed a SECURITY.md

You can use the `$define-security-policy` skill to generate a seeded security policy within the repository.

![Prompt to define a security policy for the North Star Bank example.](https://developers.openai.com/images/codex/secure-sdlc/define-security-policy.webp)

A strong security policy should include thorough details about how the application operates. Here’s an example of prompt that provides those details for Codex to enumerate and establish:

```markdown
### Authentication and Authorization

- Every non-public endpoint must authenticate the caller.
- Sessions and tokens must be validated for issuer, audience, signature, expiry, revocation, and intended authentication context.
- Authentication failures must fail closed.
- Sensitive operations must require recent or stronger authentication where appropriate.
- Password-reset, account-recovery, MFA, and identity-linking flows must not permit account takeover.
- Authentication secrets and tokens must never appear in logs, URLs, analytics, or error responses.
- Authorization must occur before every read, mutation, transaction, export, or administrative action.
- Possession of a valid account or resource identifier never proves authorization.
- Customer, account, and tenant isolation must hold across list, detail, search, bulk, export, and indirect-reference endpoints.
- Server-side authorization must not rely on client-supplied roles, ownership fields, prices, balances, or approval state.
- Administrative and service-to-service permissions must use least privilege.
- Failures allowing cross-customer access are reportable even when only one endpoint is affected.

### Transaction and ledger integrity

- Transactions must be authorized against the authenticated customer and eligible source account.
- Amounts, currencies, destinations, fees, limits, and approval state must be validated server-side.
- Transaction requests must be protected against replay, duplication, race conditions, and idempotency-key confusion.
- Balance checks and ledger updates must be atomic.
- Posted ledger entries must be immutable or corrected through auditable compensating entries.
- High-risk transactions must enforce applicable limits, step-up authentication, approval, or fraud controls.
- No failure path may produce an ambiguous transaction state without reconciliation.

### Data protection

- Sensitive data must be encrypted in transit and at rest using approved controls.
- Secret material must come from an approved secret-management system rather than source code or ordinary configuration files.
- Logs, traces, metrics, support tooling, and security artifacts must exclude credentials and minimize personal and financial data.
- Data exports and backups must receive equivalent authorization and protection to primary data.
- Error responses must not expose internals, sensitive records, credentials, or authorization details.
- Retention and deletion behavior must follow the system’s approved data-governance requirements.

### Input and output handling

- Treat headers, paths, query parameters, bodies, uploaded files, webhook payloads, third-party responses, and stored customer content as untrusted.
- Apply schema, type, range, length, and format validation before security-sensitive use.
- Database access must use parameterized queries.
- Outbound requests must restrict destinations, protocols, redirects, DNS behavior, and response sizes.
- Parsers, uploads, decompression, and serialization must be bounded against resource exhaustion.
- Customer-controlled content must be safely encoded for its output context.
  \
```