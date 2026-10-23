---
name: Investigate an incident and test a fix
tagline: Turn an incident packet into a reproduced bug, a focused patch, and a
  reviewable handoff.
summary: Give Codex Cloud a sanitized incident packet and a working test
  environment. Investigate the evidence, reproduce a supported code defect, and
  return a focused patch with regression-test evidence and a deployment and
  rollback handoff.
bestFor:
  - Small engineering teams investigating a stabilized incident.
  - Application defects with sanitized evidence and safe reproduction inputs.
  - Teams reviewing a focused fix in a working, isolated test environment.
starterPrompt:
  title: Investigate an incident
  body: >-
    Investigate [incident ID] in [repository/service] using [path to sanitized
    incident packet]. Work in the published cloud environment selected for this
    task.


    The packet identifies the incident time window, affected release SHA,
    expected behavior, observed behavior, relevant log and trace excerpts, and
    safe reproduction inputs. Read AGENTS.md and the repository's setup and
    testing instructions first. Check that the checkout matches the affected
    release, or explain the difference before drawing conclusions.


    Build a short timeline with file and line references to the packet and
    source code. Separate observations, hypotheses, and evidence gaps. Test the
    strongest hypothesis in the isolated test environment. If you cannot
    reproduce the failure or lack decisive evidence, return an investigation
    with the next diagnostic step; do not claim a confirmed root cause or make a
    speculative fix.


    If the evidence supports a code defect, add a regression test and run it
    against the original code to demonstrate the failure. Make the smallest fix,
    rerun that test, then run the relevant broader tests, lint, and type checks
    available in this repository. Record the commands, exit codes, and any
    checks you could not run.


    Prepare a branch diff, a draft pull-request description, test-evidence.md,
    and a deployment and rollback handoff. Include the supported cause,
    unresolved uncertainty, and behavior changed. Use one evidence row per
    criterion: revision and environment versions, baseline command/exit/log,
    final command/exit/log, actual result, and pass/fail/blocked/not-run status
    with limitations. Keep the PR description as a local draft for review.


    For this duplicate-webhook example, name the before-commit and after-commit
    failure points, prove duplicate contention with independent database
    connections, and state isolation, receipt-retention, and mixed-version
    rollout assumptions.


    For this duplicate-webhook example, before proposing that retained
    deliveries resume, identify legacy orders without matching receipts after
    old consumers have drained. Hold affected event keys using the existing
    queue or quarantine procedure. Add a seeded orphan-with-pending-retry test
    that proves no second order or success acknowledgment occurs while held.
    Reconcile only from trusted immutable event identity, canonical payload, and
    committed-order evidence; keep missing or conflicting evidence quarantined
    for owner review. Do not invent fingerprints, delete receipts, or replay an
    unresolved legacy event.


    Use only the supplied packet and repository unless I identify another
    approved source. Access only the explicitly approved read-only monitoring
    source, if supplied. Write code and task artifacts only in this repository;
    use only its isolated test database. Do not connect directly to production
    application or database hosts, or modify production systems. Do not replay
    production events, modify live data or monitoring, create or post external
    updates, merge, or deploy.
relatedLinks:
  - label: Cloud environments
    url: ../docs/environments/cloud-environments.html
---

> For the complete documentation index, see [llms.txt](/llms.txt). Markdown versions of documentation pages are available by appending `.md` to the page URL.

Give Codex one bounded incident to investigate in a prepared cloud environment. The goal is a result an engineer can review: a supported explanation, a regression test that fails before the fix, a focused patch, and evidence from the tests that ran.

This works well after the immediate incident has been stabilized and the remaining job is to understand and fix an application defect. If the available evidence cannot establish the cause, a useful result is a clear account of the investigation and the next diagnostic step.

## Prepare the environment and incident packet

1. In the web or desktop app, choose **Work in** > **Cloud** and select a published environment.

2. To create one, select **Create environment**, choose the GitHub repositories, and ask Codex to prepare the runtime, dependencies, and isolated test services.

3. Review the setup report, resolve failed checks, and **Publish** before starting a new task.

- Follow the [current Cloud environment guide](../docs/environments/cloud-environments.html).
- Keep repository guidance in [AGENTS.md](../docs/agent-configuration/agents-md.html).

If dependencies change or service setup changes, edit the reusable environment, test it, and **Republish**; then validate the updated environment in a new task.

Repository refresh does not rerun install/start commands, and existing tasks retain their own state.

Configure required network destinations and test credentials separately; allowing a destination does not grant service access.

Confirm that the affected checkout, dependencies, checks, and disposable test database work in the new task. Record the starting commit and test baseline.

Keep the initial investigation self-contained. Place a sanitized packet in the repository or make its files available to the task. An engineer should assemble and check it before starting:

| Input               | What to include                                                                                                                                    |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Incident summary    | Incident ID, UTC time window, expected and observed behavior, known impact, and current status. Distinguish confirmed counts from estimates.       |
| Release identity    | The deployed commit SHA, deployment time, relevant configuration values without secrets, and the last known good release if available.             |
| Correlated evidence | Log and trace excerpts with timestamps, event IDs, request IDs, trace IDs, and file references. Preserve identifiers consistently when sanitizing. |
| Safe reproduction   | Test request bodies, relevant fixtures, and instructions for exercising the suspected path without calling live services.                          |
| Repository guidance | Relevant paths, database engine, test commands, permitted changes, and the engineer who will review the result.                                    |

Do not include access tokens, customer payloads, or personal data in the packet.

A monitoring integration is optional. If you use one, grant read-only access to the relevant project and time window; the file-based workflow does not require it. Repository instructions should keep test credentials separate from production configuration.

## Run the starter prompt

Use the starter prompt on this page and replace its placeholders with your incident ID, repository, and packet path. The first result should connect the evidence to the affected code, explain what can be reproduced, and identify missing information.

Ask Codex to continue through implementation only when the evidence supports a code defect. Otherwise, review the investigation and provide the missing input. A plausible explanation, a recent code change, or a successful test on a different release is not enough to establish the cause.

## Example: A retried webhook creates a duplicate order

Use the [runnable incident sample](https://developers.openai.com/codex/use-cases/incident-to-tested-fix/sample.zip) to practice the investigation. It includes a prepared incident packet, a handler with a reproducible defect, the corrected handler, and PostgreSQL tests.

The service receives an `order.created` webhook, writes an order, and records that the event has been processed. During an incident, a retry appears to create a second order. The team has already stabilized the service and wants a patch for review.

The sample uses JavaScript, Node.js's test runner, and PostgreSQL. Its disposable fixture has an `event_receipts` table with non-null identity columns and a non-deferrable unique key on `(provider, account_id, event_id)`.

The schema permits a receipt claim before the order exists and retains the canonical payload fingerprint needed to detect conflicting reuse of the same event key.

If your application instead requires an order foreign key at claim time or lacks this conflict evidence, stop for a separate schema/design decision.

Record the exact runtime, dependency lock, PostgreSQL version, transaction isolation level, and receipt schema in the evidence. The downloadable fixture pins Node.js 24.19.0, PostgreSQL 17.6, and `pg` 8.23.1.

For the supplied Compose setup, prepare an environment with a working Docker daemon and verify `docker info` before publishing it. Its database accepts only public test credentials and is bound to the local loopback interface. Use your application's database engine and relevant settings when adapting the test.

This example assumes PostgreSQL READ COMMITTED, stable provider event IDs, and receipt retention covering the provider's retry/replay window.

The fixed handler places receipt and order writes in one database transaction. The fixture provisions a disposable database and a `delivery_holds` table to model an existing queue's quarantine procedure; that table is test infrastructure, not a proposed application migration.

The application fix adds no queue, database service, schema migration, or monitoring integration. If those assumptions do not hold, stop and revise the scope.

### Run the sample

Extract the ZIP, open its directory, and use Docker with Compose:

```bash
docker compose -p codex-incident-rehearsal up -d --wait postgres
docker compose -p codex-incident-rehearsal run --rm runner node main.mjs baseline
docker compose -p codex-incident-rehearsal run --rm runner node main.mjs regression
docker compose -p codex-incident-rehearsal run --rm runner
docker compose -p codex-incident-rehearsal down --volumes
```

The baseline command must exit with code `1`: the retry assertion observes two orders and one receipt instead of one of each. The regression command runs the same assertion against the corrected handler and must exit with code `0`.

The final test command exercises the full matrix, including independent connections, database lock contention, and legacy-orphan quarantine.

If your installation provides `docker-compose`, use that spelling in place of `docker compose`. Run these commands sequentially; the suite resets only its marked test schema.

### Inspect the transaction handler

This excerpt comes from `main.mjs` in the download. Run the complete files after extracting the ZIP; the tests and fixture setup are included there.

<details>
  <summary>Receipt claim and order transaction</summary>
```javascript
async function fixed(client, input, hook = async (_boundary) => {}) {
  await assertNotHeld(client, input);
  await hook("beforeClaim");
  await client.query("BEGIN ISOLATION LEVEL READ COMMITTED");
  let committed = false;
  try {
    const claimed = await client.query(
      `INSERT INTO event_receipts(provider, account_id, event_id, payload_fingerprint)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (provider, account_id, event_id) DO NOTHING RETURNING event_id`,
      [...key(input), fingerprint(input)]
    );
    trace("receipt-claim-result", client, input, {
      inserted: claimed.rowCount === 1,
    });
    if (claimed.rowCount === 1) {
      await hook("afterClaim");
      await writeOrder(client, input);
      await hook("afterOrder");
    } else {
      // A new READ COMMITTED statement sees the winner after its commit.
      await checkReceipt(client, input);
    }
    await client.query("COMMIT");
    committed = true;
    trace("transaction-committed", client, input);
    await hook("afterCommit");
    trace("acknowledged", client, input, acknowledgment);
    return acknowledgment;
  } catch (error) {
    if (!committed) {
      await client.query("ROLLBACK");
      trace("transaction-rolled-back-no-ack", client, input);
    } else {
      trace("committed-response-lost-no-ack", client, input);
    }
    throw error;
  }
}
```

</details>

### 1. Provide a compact packet

Use these files as the packet outline:

```text
incidents/INC-DEMO-014/incident.md
incidents/INC-DEMO-014/logs.ndjson
incidents/INC-DEMO-014/release.json
incidents/INC-DEMO-014/order-created.sanitized.json
```

In this scenario, `release.json` identifies the example release SHA `4a1c9e7d2b6f8a0c3d5e7f9012a4b6c8d0e2f413`, deployed at `2026-09-22T11:58:00Z`. The incident window is `12:03:00Z–12:05:00Z` on the same day. The packet reports two internal orders associated with one provider event. When preparing your own packet, include confirmed impact counts and identify any estimates.

The sanitized logs contain these correlated observations:

| UTC time     | Correlation                                                                              | Observation                                                                                                                  |
| ------------ | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| 12:03:04.110 | Event `evt_demo_042`, account `acct_demo_01`, request `req_demo_a`, trace `trace_demo_a` | First delivery enters the webhook handler.                                                                                   |
| 12:03:04.145 | Same event and first trace                                                               | Order `ord_demo_101` is committed.                                                                                           |
| 12:03:04.150 | Same worker                                                                              | Worker exits before a receipt-write success or response is recorded. The excerpt alone does not prove the receipt is absent. |
| 12:03:14.203 | Same provider/account/event, request `req_demo_b`, trace `trace_demo_b`                  | A retry enters the handler. The handler logs that no matching receipt was found.                                             |
| 12:03:14.241 | Same event and second trace                                                              | Order `ord_demo_102` is committed and a receipt is recorded.                                                                 |

Keep a stable event ID across deliveries and distinct request and trace IDs per delivery. A per-request identifier would hide the relationship between the retry and the original event.

### 2. Trace the evidence and test the hypothesis

The incident report proposes that a retry storm caused the duplicate. Codex should treat that as a hypothesis. Two observed deliveries do not establish a storm, and retries are a normal condition a webhook handler must tolerate.

In the sample’s affected implementation, source inspection reveals this sequence: look up a receipt, commit the order, then write the receipt in a separate transaction. The gap between the two commits is a stronger explanation. A worker failure in that gap can leave an order without a receipt, so a retry can create another order. Concurrent deliveries can also both pass a separate check before either writes its receipt.

Have Codex trace the actual handler and transaction boundaries and cite the relevant lines. It should confirm the packet's release matches the code under test, or explain why testing a different commit limits the conclusion.

### 3. Reproduce before changing the handler

Add a regression test using the sample webhook and the isolated PostgreSQL database. Put a test-only failure hook immediately after the order write and before the receipt-write step in the original handler.

Confirm from the real transaction boundaries that the original order has committed at that point. Retry the same provider/account/event and assert exactly one order and one matching receipt; the seeded implementation should fail with two orders.

After the fix, exercise the corresponding hook after the order statement but before the shared transaction commits; the failed attempt must leave zero orders and zero receipts.

Retry and assert one of each. Keep the same business assertion across revisions and record the hook location on each revision.

Run the new test on the original implementation first. For the seeded defect in this sample, the expected failure is two orders instead of one. Save the command, starting commit, exit code, and assertion output. If that failure does not occur, investigate the mismatch before editing the handler.

An injected exception exercises the application's transaction behavior. Record that it does not reproduce every possible host, network, or database failure.

### 4. Make the smallest supported fix

For this specific defect, claim the event receipt and write the order within one transaction on one database connection. Use the existing unique key with `INSERT ... ON CONFLICT (provider, account_id, event_id) DO NOTHING RETURNING ...`.

Only the delivery that inserts the receipt may write the order; acknowledge success only after commit. A failed transaction rolls back both writes. Do not catch a uniqueness error and continue using an aborted transaction.

A competing delivery may wait for the first transaction. If the first commits, the second claim inserts nothing: issue a fresh SELECT under READ COMMITTED, verify the stored event identity/payload policy, and return the existing duplicate acknowledgment without writing an order.

If the first transaction rolls back, the competitor can claim and process the event. A missing receipt after a skipped insert, an identity conflict, or a transient database error must follow the documented retry/error path, not a fabricated success.

Under stricter isolation, serialization failures require the repository's bounded whole-transaction retry policy. See PostgreSQL's [INSERT conflict behavior](https://www.postgresql.org/docs/current/sql-insert.html) and [transaction isolation](https://www.postgresql.org/docs/current/transaction-iso.html).

Neither an in-memory set nor a separate “check then insert” protects against concurrent workers or restarts. Scope the key to the provider's event-identity contract. If a supposedly identical event carries conflicting identity or payload information, surface that inconsistency rather than silently treating it as a valid duplicate.

The demo's business mutation is entirely within the same database. If the real handler also sends email, charges a card, or calls another service, this transaction alone does not make those external effects idempotent. Identify that boundary and the system's existing delivery or idempotency mechanism before expanding the fix.

### 5. Verify the changed behavior

Ask for both the original failure and the post-fix result. Use test-only hooks at named transaction boundaries and inspect committed state from a separate connection. The sample passes eleven local PostgreSQL tests; `test-evidence.md` in the download records those results and the checks still needed for Cloud execution and deployment. Run the suite in your published environment and test actual connection loss during commit before relying on that recovery path.

| Check / failure point                              | Required behavior                                                                                                                                                                                                                                                                                                                   |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| First delivery and committed duplicate             | The first creates one order and one receipt; a repeated event returns the agreed acknowledgment and leaves counts unchanged. Record exact status/body.                                                                                                                                                                              |
| Before receipt claim                               | Failure creates neither row and returns no success acknowledgment. A retry creates one of each.                                                                                                                                                                                                                                     |
| After claim, before order write                    | Failure rolls back the receipt; no order exists. A retry can claim and process normally.                                                                                                                                                                                                                                            |
| After order write, before commit                   | Failure rolls back both rows. This is the fixed-code counterpart of the original committed-order/missing-receipt defect; a retry leaves one of each.                                                                                                                                                                                |
| After commit, before acknowledgment                | Simulate a lost response. Both rows remain committed. A retry returns the duplicate acknowledgment without another order.                                                                                                                                                                                                           |
| Commit outcome unknown                             | Model a connection loss around commit separately from an ordinary exception. Return no unsupported success claim; a retry with the same stable event key must be safe whether the first transaction committed or rolled back. If this transport case was not exercised, mark it not run.                                            |
| Concurrent duplicate: first transaction commits    | Two independent connections/workers contend on the same event key. Hold the winner after claim; start the competitor before releasing it. Verify the competitor actually contends, then release the winner. Both complete through the expected acknowledgment path; exactly one order and one receipt exist.                        |
| Concurrent duplicate: first transaction rolls back | Repeat the controlled overlap, but fail the claimant before commit. The competitor claims after rollback and creates one order and one receipt. Check both responses and final state.                                                                                                                                               |
| Event identity and payload conflict                | Different events and the same event ID under different accounts/providers remain independent. For an event with the same scoped ID but a conflicting canonical payload, follow the agreed conflict path; do not create a second order or silently acknowledge different work.                                                       |
| Legacy order without receipt and pending retry     | Seed a committed legacy order without a receipt. Identify and hold its event key before retries resume. A held retry returns no success acknowledgment and creates no row. Trusted reconciliation permits the duplicate acknowledgment with one existing order and one receipt; missing or conflicting evidence keeps the key held. |
| Broader service checks                             | Run relevant integration tests, lint, and type checking. Separate new failures, pre-existing failures, and checks that could not run.                                                                                                                                                                                               |

Coordinate concurrency with barriers/latches and bounded timeouts, not sleeps or a bare pair of promises. Release blocked workers in test cleanup and use disposable fixtures. An exception test alone does not prove abrupt process death, transport loss, or production concurrency behavior.

The sample uses `node main.mjs baseline`, `node main.mjs regression`, and `node main.mjs` inside the pinned runner. Its structured output records transaction boundaries, committed row counts, acknowledgment status/body, and observed blocking backend IDs.

When adapting the workflow, use the commands actually defined by your repository and report their real results. A skipped check or unavailable dependency belongs in the handoff, with its impact on confidence.

## Review the handoff

### Shared evidence record

Use the incident workflow's evidence format for each acceptance criterion. Populate it from observed output; the fields below are a template, not passing results. For a new test that does not exist at baseline, distinguish “not yet present” from a failed existing check.

```text
Criterion / test: [specific behavior and test location]
Environment: [published setup reference; runtime, database and dependency versions]
Before: [revision + test-only diff ID; command; exit code; observed assertion; log path]
After: [final revision or base + diff ID; command; exit code; observed assertion; log path]
Status: [pass / fail / blocked / not run]
Limits / reviewer action: [untested behavior, blocker, or decision required]
```

Keep red and green runs tied to their actual tested states, including test-only changes on the original revision. Keep the logs, response fixtures, and final diff with the handoff. A changed final revision needs updated evidence; checks that were not run or were blocked cannot count as passing.

Ask Codex to leave the code diff and these review artifacts in the repository:

- `incident-investigation.md`: timeline, evidence references, hypotheses tested, supported cause, and remaining uncertainty.
- `test-evidence.md`: baseline commit, failing regression output, fix commit or diff, passing targeted checks, broader checks, and limitations.
- `pr-draft.md`: a concise explanation of the defect, changed behavior, test evidence, and remaining risk.
- `deployment-handoff.md`: verified schema/isolation/receipt-retention assumptions, named rollout owner, pre-deployment checks, duplicate-order and acknowledgment/error metrics, and the rollout/rollback gates below.

Before accepting the patch, verify that the original code fails the new test, the fix passes it, and the diff addresses the demonstrated defect. In the webhook example, inspect event-key scope, transaction boundaries, concurrency coverage, and any effects outside the transaction. Review existing duplicate orders separately; preventing new duplicates does not repair historical records.

### Plan deployment and rollback

A code patch protects only workers running the corrected handler. Old workers can still write an order before claiming a receipt, so a mixed-version canary is not evidence that the defect is eliminated.

The deployment owner must choose either a tested mixed-version strategy or an existing runbook that pauses ingestion, drains in-flight old workers, updates every consumer, and resumes retained deliveries without loss.

Confirm the provider/queue retry and retention behavior before choosing the latter; do not assume pausing is lossless.

Before resuming retained deliveries, identify committed legacy orders with no matching receipt. Pausing and draining old consumers prevents new legacy writes; it does not repair those existing orders. Hold every affected event key with the existing queue or quarantine procedure. If legacy records cannot establish a complete event identity, keep the affected deliveries or those from the affected time window paused for owner review rather than declaring the scan complete.

Reconcile a held key only when trusted immutable provider/account/event identity, canonical payload evidence, and the committed business record establish what already happened.

Under the approved reconciliation procedure, record the matching receipt without repeating the business mutation, then release that key's hold.

Keep affected keys quarantined for owner review when evidence is missing, payloads conflict, or multiple business records exist. A retry payload cannot substitute for trusted evidence of the original event when reconstructing its fingerprint.

The pre-resume gate passes only when each affected key is reconciled or its hold remains enforced across all consumers.

Seed a legacy order and its pending retry in staging. Verify the hold prevents another order and any success acknowledgment; after trusted reconciliation, the retry may receive the duplicate acknowledgment while the existing order count stays at one. Rehearse an unresolved case too: it must remain held without a fabricated receipt. Keep this gate in the deployment handoff alongside pause/drain, consumer-version, retention, and rollback checks.

Before rollout, verify the existing unique constraint is present and valid, the receipt key/payload policy is consistent across all consumers, receipt cleanup cannot reopen the replay window, and external effects remain outside this patch.

In staging, rehearse the selected sequence and failed-worker retry. Record the owner's observation window and stop thresholds for duplicate orders, webhook errors, acknowledgment latency, lock waits, and retry backlog; do not invent production thresholds.

Reverting to the old handler can reintroduce duplicate orders. The rollback handoff must name the containment step (for example, the approved pause/drain procedure), the safe revision, and the owner who decides when processing can resume. Preserve receipts; do not delete them to unblock retries. Historical duplicate orders require a separately reviewed remediation.

The engineer owns the deployment decision and any production remediation. A passing isolated test is evidence for review, not proof that production is healthy. Create the pull request, run your normal CI and review process, and deploy through your team's established controls after reviewing the draft.

## Continue in the same task

Use a focused follow-up to resolve uncertainty or improve the handoff:

```text
Review the patch against two concurrent deliveries and a retry after a worker failure. Show which behaviors the tests establish and which remain untested. Keep the change limited to this handler and its regression tests; update the handoff with any remaining risk.
```

If the first run could not reproduce the incident:

```text
Stop implementation. List the hypotheses the evidence rules out, the strongest remaining hypothesis, and the smallest additional sanitized input or isolated experiment needed to distinguish it. Keep the root cause unconfirmed.
```