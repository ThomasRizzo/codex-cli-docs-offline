---
name: Turn an issue into a tested pull request
tagline: Hand off a small feature with acceptance criteria and review the evidence.
summary: Give Codex a scoped issue, a prepared cloud environment, and explicit
  checks. Get an implementation, tests, documentation, and a reviewable change
  with evidence for each acceptance criterion.
bestFor:
  - Startup engineers implementing a scoped API issue.
  - Reviewers who need implementation and validation evidence together.
  - Teams with acceptance criteria and a working test environment.
starterPrompt:
  title: Implement a scoped issue
  body: >-
    Implement [issue ID and title] in [repository] at [base branch and commit],

    using the prepared cloud environment I selected for this task.


    Input packet: [paste or attach the issue, acceptance criteria, relevant

    files, public success/error schemas, authorization and pagination contract,

    test fixtures, and approved validation commands].

    Repository instructions: [AGENTS.md and any relevant nested instructions].

    Scope: [files or component boundaries].

    Out of scope: [explicit exclusions].

    Required checks: [focused tests, relevant regression tests, type check,

    lint, and any required CI checks].

    Output: [create a draft PR in this repository if the available integration

    supports it and I authorize it here / return a diff and draft PR
    description].


    First read the instructions and relevant code. Confirm the starting commit

    and run the existing baseline checks using the execution tools available

    in this environment. Record any new test files as still to be created.

    If the baseline fails, access is missing, or a

    required check cannot run, report the exact blocker before implementing.


    State a short plan, then implement the smallest change that meets the

    acceptance criteria. Follow existing auth, error, pagination, and testing

    patterns. Add tests that distinguish the required behavior from the old

    behavior. For this pagination example, require tied timestamps across a

    page boundary, bounded traversal and replay on fixed fixtures, partial and

    exact-full final pages, authorization before cursor validation, invalid

    cursor cases, and success/error schema checks. Update the affected API

    documentation to match the implemented public response exactly.


    After implementation, run the required checks again. For every acceptance

    criterion, point to the test or other evidence that verifies it. Record

    commands, results, the tested commit or working-tree state, and any checks

    that were not run. Separate pre-existing failures from new failures.

    Never describe an unrun check as passing.


    Deliver the diff or authorized draft PR, a concise change summary, the

    acceptance-criteria evidence table, remaining risks, and reviewer actions.

    Do not merge, deploy, use production data, change permissions, add new

    dependencies, or expand the agreed scope. Stop for a decision if the

    contract conflicts with the repository or the work needs a schema change.
relatedLinks:
  - label: Download the runnable sample
    url: /codex/use-cases/issue-to-tested-pr/sample.zip
  - label: Cloud environments
    url: ../docs/environments/cloud-environments.html
  - label: Keep documentation up-to-date
    url: update-documentation.html
---

> For the complete documentation index, see [llms.txt](/llms.txt). Markdown versions of documentation pages are available by appending `.md` to the page URL.

Hand Codex a small, well-defined issue and ask for a change a teammate can review: implementation, tests, documentation, and evidence that the requested behavior works. Keep the task in one prepared cloud environment so the code and validation use the same repository setup.

1. In the web or desktop app, choose **Work in** > **Cloud** and select a published environment.

2. To create one, select **Create environment**, choose the GitHub repositories, and ask Codex to prepare the runtime, dependencies, and isolated test services.

3. Review the setup report, resolve failed checks, and **Publish** before starting a new task.

- Follow the [current Cloud environment guide](../docs/environments/cloud-environments.html).
- Keep repository guidance in [AGENTS.md](../docs/agent-configuration/agents-md.html).

If dependencies change or service setup changes, edit the reusable environment, test it, and **Republish**, then verify the changes in a new task.

Repository refresh does not rerun install/start commands, and existing tasks keep their own state.

Configure required network destinations and test credentials separately; allowing a destination does not grant service access.

If required checks cannot run, finish setup before using this workflow.

## When to use it

Choose a feature with a written contract and a clear stopping point: a new API endpoint, a validation rule, or a small addition to an existing service. The issue should fit in one pull request and have checks that can run without production access.

The example adds pagination to a project's activity feed. The runnable Node.js sample includes authentication, project access, signed cursors, and an existing project-detail route. It uses fixed test records in memory, so you can check the pagination contract without a database or external service.

## Try the runnable sample

[Download the sample](https://developers.openai.com/codex/use-cases/issue-to-tested-pr/sample.zip), extract it, and open its `issue-to-tested-pr` folder. Use **Node 22.6 or later**. The sample uses the standard library and needs no package installation or API key.

```bash
node --version
node api.mjs
node test.mjs --seeded
node test.mjs
node reproduce.mjs ./evidence
```

`node api.mjs` starts a local HTTP server, requests the first page, prints its public IDs, and closes the server.

The `--seeded` test run deliberately exits nonzero: its timestamp-only continuation skips two events tied at the first page boundary. The same tests pass with the corrected timestamp-and-ID tuple continuation.

The reproduction command succeeds only if the seeded state fails and the corrected state passes.

The corrected traversal with `limit=2` returns these pages in three requests:

```text
[evt_105, evt_104]
[evt_103, evt_102]
[evt_101]
```

The first two pages have a continuation cursor; the final page has `next_cursor: null`.

The seeded state returns `[evt_105, evt_104]`, then `[evt_101]`, losing `evt_103` and `evt_102`.

A successful run passes all 36 tests in the corrected state. The seeded state fails three assertions that expose the pagination defect.

To verify your environment, put the files in your selected repository, prepare and publish an environment with a supported Node runtime, then run the commands in a new Cloud task and record its results.

`reproduce.mjs` saves `red.log`, `green.log`, `observed-http.json`, and `run-manifest.json` in the requested evidence directory. The manifest identifies the runtime, commands, exit codes, seeded defect, correction, and SHA-256 source hashes.

It does not record session tokens or the signing key. Read `README.md` and `openapi.json` for the sample's setup and public contract.

### Inspect the runnable sample

These excerpts come from the files in the download. Run the complete files after extracting the ZIP.

<details>
  <summary>Cursor and ordering implementation</summary>
```javascript
export function createApi({
  sessions,
  projects,
  events,
  signingKey,
  seededBug = false,
}) {
  return createServer((request, response) => {
    const send = (status, body) => {
      response.writeHead(status, { "content-type": "application/json" });
      response.end(JSON.stringify(body));
    };
    const fail = (code) => {
      const [status, message] = errors[code];
      send(status, { error: { code, message } });
    };
    // Authenticate, then authorize. Malformed parameters must not change these results.
    const authorization = request.headers.authorization ?? "";
    const bearer = /^Bearer ([A-Za-z0-9_-]+)$/.exec(authorization);
    const tenantId = bearer ? sessions.get(bearer[1]) : undefined;
    if (!tenantId) return fail("unauthenticated");

    const url = new URL(request.url ?? "/", "http://127.0.0.1");
    const route = /^\/v1\/projects\/([^/]+)(\/events)?$/.exec(url.pathname);
    let projectId;
    try {
      projectId = route ? decodeURIComponent(route[1]) : undefined;
    } catch {
      return fail("not_found");
    }
    const project = projectId ? projects.get(projectId) : undefined;
    if (
      request.method !== "GET" ||
      !project ||
      project.tenant_id !== tenantId
    ) {
      return fail("not_found");
    }
    // Existing project-detail behavior remains independent of pagination parameters.
    if (!route[2]) return send(200, { id: projectId, name: project.name });

    const rawLimit = url.searchParams.get("limit");
    const limit = rawLimit === null ? 25 : Number(rawLimit);
    if (
      url.searchParams.getAll("limit").length > 1 ||
      (rawLimit !== null && !/^\d+$/.test(rawLimit)) ||
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 100
    ) {
      return fail("invalid_limit");
    }
    let cursor;
    if (url.searchParams.has("cursor")) {
      try {
        if (url.searchParams.getAll("cursor").length !== 1)
          throw new Error("Invalid cursor");
        cursor = decodeCursor(
          url.searchParams.get("cursor"),
          tenantId,
          projectId,
          signingKey
        );
      } catch {
        return fail("invalid_cursor");
      }
    }

    const matching = events
      .filter(
        (event) =>
          event.tenant_id === tenantId && event.project_id === projectId
      )
      .sort(compareEvents)
      .filter((event) => {
        if (!cursor) return true;
        // Deliberate baseline defect: timestamp-only continuation loses tied rows.
        if (seededBug)
          return (
            timestampValue(event.created_at) < timestampValue(cursor.created_at)
          );
        return compareEvents(event, cursor) > 0;
      });
    const selected = matching.slice(0, limit);
    const items = selected.map(({ id, created_at, type, summary }) => ({
      id,
      created_at,
      type,
      summary,
    }));
    const nextCursor =
      matching.length > limit
        ? encodeCursor(selected.at(-1), tenantId, projectId, signingKey)
        : null;
    return send(200, { items, next_cursor: nextCursor });
  });
}

export async function startApi(fixtures, options = {}) {
  const server = createApi({ ...fixtures, ...options });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve(undefined));
  });
  const address = server.address();
  if (!address || typeof address === "string")
    throw new Error("No listening address");
  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: () =>
      new Promise((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve(undefined)))
      ),
  };
}
```

</details>

<details>
  <summary>Seeded records and project access fixtures</summary>
```javascript
export function createFixtures() {
  const tokenA = randomBytes(24).toString("base64url");
  const tokenB = randomBytes(24).toString("base64url");
  const sessions = new Map([
    [tokenA, "tenant_a"],
    [tokenB, "tenant_b"],
  ]);
  const projects = new Map([
    ["feed", { tenant_id: "tenant_a", name: "Activity feed" }],
    ["empty", { tenant_id: "tenant_a", name: "Empty feed" }],
    ["exact", { tenant_id: "tenant_a", name: "Four events" }],
    ["large", { tenant_id: "tenant_a", name: "Large feed" }],
    ["precision", { tenant_id: "tenant_a", name: "Precise timestamps" }],
    ["other", { tenant_id: "tenant_a", name: "Another project" }],
    ["private", { tenant_id: "tenant_b", name: "Private project" }],
  ]);
  const event = (id, created_at, project_id, tenant_id = "tenant_a") => ({
    id,
    created_at,
    project_id,
    tenant_id,
    type: "deployment",
    summary: `Synthetic event ${id}`,
    internal_note: "This field must never enter the HTTP response.",
    raw_payload: { synthetic: true },
  });
  const feed = [
    event("evt_105", "2026-01-15T12:00:03.123456Z", "feed"),
    event("evt_104", "2026-01-15T12:00:02.123456Z", "feed"),
    event("evt_103", "2026-01-15T12:00:02.123456Z", "feed"),
    event("evt_102", "2026-01-15T12:00:02.123456Z", "feed"),
    event("evt_101", "2026-01-15T12:00:01.123456Z", "feed"),
  ];
  const events = [
    ...feed,
    ...feed.slice(0, 4).map((item) => ({ ...item, project_id: "exact" })),
    ...Array.from({ length: 105 }, (_, index) =>
      event(
        `large_${String(index).padStart(3, "0")}`,
        new Date(Date.UTC(2026, 0, 15, 12, 0, index))
          .toISOString()
          .replace(".000Z", ".123456Z"),
        "large"
      )
    ),
    // Reverse ID order makes timestamp precision observable in the tests.
    event("precise_a", "2026-01-15T12:00:00.123999Z", "precision"),
    event("precise_z", "2026-01-15T12:00:00.123001Z", "precision"),
    event("other_1", "2026-01-15T12:00:00.123456Z", "other"),
    event("other_2", "2026-01-15T11:59:59.123456Z", "other"),
    event("private_1", "2026-01-15T12:00:00.123456Z", "private", "tenant_b"),
    event("private_2", "2026-01-15T11:59:59.123456Z", "private", "tenant_b"),
  ];
  return {
    sessions,
    projects,
    events,
    signingKey: randomBytes(32),
    tokenA,
    tokenB,
  };
}
```

</details>

<details>
  <summary>HTTP contract and regression tests</summary>
```javascript
test("five-event traversal crosses a timestamp tie and replays the same continuation", async () => {
  const expected = ["evt_105", "evt_104", "evt_103", "evt_102", "evt_101"];
  const pages = await traverse("feed", 2, expected);
  assert.deepEqual(pages.map(ids), [
    ["evt_105", "evt_104"],
    ["evt_103", "evt_102"],
    ["evt_101"],
  ]);
  assert.equal(pages.length, 3);
  assert.ok(pages[0].next_cursor);
  assert.ok(pages[1].next_cursor);
  assert.equal(pages[2].next_cursor, null);
  const replay = await request("feed", {
    limit: "2",
    cursor: pages[0].next_cursor,
  });
  assert.deepEqual(replay.body.items, pages[1].items);
  const next = await request("feed", {
    limit: "2",
    cursor: replay.body.next_cursor,
  });
  assert.deepEqual(next.body.items, pages[2].items);
  assert.equal(next.body.next_cursor, null);
  console.log(
    JSON.stringify({
      fixture: "five-event-tie",
      pages: pages.map(ids),
      requests: pages.length,
      replay: ids(replay.body),
    })
  );
});

test("the same tie group traverses correctly with limit three", async () => {
  const pages = await traverse("feed", 3, [
    "evt_105",
    "evt_104",
    "evt_103",
    "evt_102",
    "evt_101",
  ]);
  assert.deepEqual(pages.map(ids), [
    ["evt_105", "evt_104", "evt_103"],
    ["evt_102", "evt_101"],
  ]);
});

test("timestamp ordering and continuation preserve submillisecond precision", async () => {
  const pages = await traverse("precision", 1, ["precise_a", "precise_z"]);
  assert.equal(pages[0].items[0].created_at, "2026-01-15T12:00:00.123999Z");
  assert.equal(pages[1].items[0].created_at, "2026-01-15T12:00:00.123001Z");
});

test("omitted, minimum, and maximum limits return 25, 1, and 100 of 105 events", async () => {
  for (const [parameters, expected] of [
    [{}, 25],
    [{ limit: "1" }, 1],
    [{ limit: "100" }, 100],
  ]) {
    const result = await request("large", parameters);
    assert.equal(result.status, 200);
    assert.equal(result.body.items.length, expected);
    assert.ok(result.body.next_cursor);
  }
  const pages = await traverse(
    "large",
    100,
    Array.from(
      { length: 105 },
      (_, index) => `large_${String(104 - index).padStart(3, "0")}`
    )
  );
  assert.deepEqual(
    pages.map((page) => page.items.length),
    [100, 5]
  );
});

test("invalid and repeated limits return the documented generic error", async (context) => {
  for (const limit of [
    "0",
    "101",
    "-1",
    "1.5",
    "many",
    "",
    "1e2",
    "Infinity",
  ]) {
    await context.test(`limit ${JSON.stringify(limit)}`, async () => {
      const result = await request("feed", { limit });
      assert.equal(result.status, 400);
      assert.deepEqual(
        result.body,
        expectedError(
          "invalid_limit",
          "Limit must be an integer from 1 through 100."
        )
      );
    });
  }
  const repeated = await request("feed", [
    ["limit", "1"],
    ["limit", "2"],
  ]);
  assert.equal(repeated.status, 400);
});

test("empty, partial, and exactly full final pages have no continuation", async () => {
  assert.deepEqual((await request("empty")).body, {
    items: [],
    next_cursor: null,
  });
  const partial = await traverse("feed", 2, [
    "evt_105",
    "evt_104",
    "evt_103",
    "evt_102",
    "evt_101",
  ]);
  assert.equal(partial.at(-1).items.length, 1);
  const exact = await traverse("exact", 2, [
    "evt_105",
    "evt_104",
    "evt_103",
    "evt_102",
  ]);
  assert.deepEqual(
    exact.map((page) => page.items.length),
    [2, 2]
  );
  assert.equal(exact[1].next_cursor, null);
});

test("authentication precedes malformed and wrong-scope cursor or limit validation", async () => {
  const privateCursor = (
    await request("private", { limit: "1" }, fixtures.tokenB)
  ).body.next_cursor;
  for (const token of [null, "invalid_session"]) {
    for (const parameters of [
      { cursor: "broken" },
      { cursor: privateCursor },
      { limit: "0", cursor: "broken" },
    ]) {
      const result = await request("feed", parameters, token);
      assert.equal(result.status, 401);
      assert.deepEqual(result.body, unauthenticated);
    }
  }
});

test("inaccessible and nonexistent projects return identical 404 before cursor validation", async () => {
  const ownCursor = (await request("feed", { limit: "1" })).body.next_cursor;
  for (const project of ["private", "missing"]) {
    for (const parameters of [
      {},
      { cursor: "broken" },
      { cursor: ownCursor },
      { limit: "0", cursor: "broken" },
    ]) {
      const result = await request(project, parameters);
      assert.equal(result.status, 404);
      assert.deepEqual(result.body, notFound);
    }
  }
});

test("a valid cursor from another project in the same tenant is invalid on an authorized feed", async () => {
  const cursor = (await request("other", { limit: "1" })).body.next_cursor;
  assert.ok(cursor);
  const result = await request("feed", { cursor });
  assert.equal(result.status, 400);
  assert.deepEqual(result.body, invalidCursor);
});

test("a valid cursor from another tenant is invalid on an authorized feed", async () => {
  const cursor = (await request("private", { limit: "1" }, fixtures.tokenB))
    .body.next_cursor;
  assert.ok(cursor);
  const result = await request("feed", { cursor });
  assert.equal(result.status, 400);
  assert.deepEqual(result.body, invalidCursor);
});

test("undecodable, empty, tampered, and repeated cursor tokens return the same closed error", async () => {
  const cursor = (await request("feed", { limit: "1" })).body.next_cursor;
  const [payload, signature] = cursor.split(".");
  const tampered = `${payload}.${signature[0] === "A" ? "B" : "A"}${signature.slice(1)}`;
  for (const token of [
    "broken",
    "",
    "%%%.___",
    "a.b.c",
    "x".repeat(2049),
    tampered,
  ]) {
    const result = await request("feed", { cursor: token });
    assert.equal(result.status, 400);
    assert.deepEqual(result.body, invalidCursor);
  }
  const result = await request("feed", [
    ["cursor", cursor],
    ["cursor", cursor],
  ]);
  assert.equal(result.status, 400);
  assert.deepEqual(result.body, invalidCursor);
});

test("signed structurally invalid payloads and unsupported versions are rejected", async (context) => {
  const valid = {
    version: 1,
    tenant_id: "tenant_a",
    project_id: "feed",
    created_at: "2026-01-15T12:00:02.123456Z",
    id: "evt_104",
  };
  const missing = { ...valid };
  delete missing.id;
  const cases = [
    ["missing ID", missing],
    ["number ID", { ...valid, id: 104 }],
    ["empty ID", { ...valid, id: "" }],
    ["number timestamp", { ...valid, created_at: 0 }],
    ["invalid date", { ...valid, created_at: "2026-02-30T12:00:00Z" }],
    ["unsupported version", { ...valid, version: 2 }],
    ["extra field", { ...valid, extra: true }],
    ["wrong tenant type", { ...valid, tenant_id: 1 }],
    ["wrong project type", { ...valid, project_id: null }],
    ["null payload", null],
    ["array payload", []],
    ["invalid JSON", "not-json"],
  ];
  for (const [name, payload] of cases) {
    await context.test(name, async () => {
      const result = await request("feed", { cursor: signFixture(payload) });
      assert.equal(result.status, 400);
      assert.deepEqual(result.body, invalidCursor);
    });
  }
});

test("every serialized event omits stored tenant, project, and raw payload fields", async () => {
  const result = await request("feed", { limit: "100" });
  assert.equal(result.status, 200);
  for (const item of result.body.items) {
    assert.deepEqual(Object.keys(item).sort(), [
      "created_at",
      "id",
      "summary",
      "type",
    ]);
  }
  assert.ok(
    fixtures.events.some((event) => event.internal_note && event.raw_payload)
  );
});

test("the schema oracle rejects extra, missing, incorrectly typed, and malformed public fields", () => {
  const schema = specification.components.schemas.EventPage;
  const page = {
    items: [
      {
        id: "evt_1",
        created_at: "2026-01-15T12:00:00.123456Z",
        type: "deployment",
        summary: "Synthetic",
      },
    ],
    next_cursor: null,
  };
  assert.ok(conforms(page, schema));
  assert.equal(conforms({ ...page, tenant_id: "tenant_a" }, schema), false);
  assert.equal(
    conforms(
      { ...page, items: [{ ...page.items[0], raw_payload: {} }] },
      schema
    ),
    false
  );
  assert.equal(conforms({ items: page.items }, schema), false);
  assert.equal(conforms({ ...page, next_cursor: "" }, schema), false);
  assert.equal(
    conforms({ ...page, items: [{ ...page.items[0], id: 1 }] }, schema),
    false
  );
  assert.equal(
    conforms(
      { ...page, items: [{ ...page.items[0], created_at: "yesterday" }] },
      schema
    ),
    false
  );
  const errorSchema = specification.components.schemas.InvalidCursor;
  assert.equal(
    conforms(
      { error: { ...invalidCursor.error, stack: "internal" } },
      errorSchema
    ),
    false
  );
  assert.equal(
    conforms(
      { error: { ...invalidCursor.error, message: "tenant_a" } },
      errorSchema
    ),
    false
  );
});

test("the existing project-detail route preserves access and ignores pagination parameters", async () => {
  const own = await request(
    "feed",
    { cursor: "broken", limit: "0" },
    fixtures.tokenA,
    true
  );
  assert.equal(own.status, 200);
  assert.deepEqual(own.body, { id: "feed", name: "Activity feed" });
  const inaccessible = await request("private", {}, fixtures.tokenA, true);
  assert.equal(inaccessible.status, 404);
  assert.deepEqual(inaccessible.body, notFound);
  const unauthenticatedResult = await request("feed", {}, null, true);
  assert.equal(unauthenticatedResult.status, 401);
  assert.deepEqual(unauthenticatedResult.body, unauthenticated);
});

test("OpenAPI declares operation, limit boundaries, signed cursor, and response statuses", () => {
  assert.equal(specification.openapi, "3.1.0");
  const operation = specification.paths["/v1/projects/{project_id}/events"].get;
  assert.equal(operation.operationId, "listProjectEvents");
  const limit = operation.parameters.find(
    (parameter) => parameter.name === "limit"
  ).schema;
  assert.deepEqual(limit, {
    type: "integer",
    minimum: 1,
    maximum: 100,
    default: 25,
  });
  assert.deepEqual(Object.keys(operation.responses).sort(), [
    "200",
    "400",
    "401",
    "404",
  ]);
  assert.equal(
    specification.components.securitySchemes.session.scheme,
    "bearer"
  );
});
```

</details>

<details>
  <summary>Evidence capture</summary>
```javascript
mkdirSync(output, { recursive: true });
const states = [];
for (const [name, arguments_] of [
  ["red", ["--seeded"]],
  ["green", []],
]) {
  const result = spawnSync(
    process.execPath,
    [resolve(directory, "test.mjs"), ...arguments_],
    {
      cwd: directory,
      encoding: "utf8",
      timeout: 30_000,
    }
  );
  writeFileSync(
    resolve(output, `${name}.log`),
    `${result.stdout ?? ""}${result.stderr ?? ""}`
  );
  states.push({
    name,
    command: `node test.mjs${arguments_.length ? " --seeded" : ""}`,
    exit_code: result.status,
    signal: result.signal,
    error: result.error?.message ?? null,
  });
}
const sources = Object.fromEntries(
  readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => [
      entry.name,
      createHash("sha256")
        .update(readFileSync(resolve(directory, entry.name)))
        .digest("hex"),
    ])
);
const observed = { red: await observe(true), green: await observe(false) };
writeJson("observed-http.json", observed);
writeJson("run-manifest.json", {
  execution: "Synthetic loopback HTTP fixture; no external service",
  recorded_at: new Date().toISOString(),
  node: process.version,
  minimum_node: "22.6.0",
  dependencies: "Node standard library only; no install step",
  baseline:
    "Deliberately seeded timestamp-only continuation; not a historical customer defect",
  correction:
    "Descending timestamp-and-ID tuple continuation using full fractional precision",
  source_sha256: sources,
  states,
});
if (
  states[0].exit_code === null ||
  states[0].exit_code === 0 ||
  states[1].exit_code !== 0
) {
  throw new Error(
    "Expected the unchanged tests to fail on the seeded baseline and pass on the corrected implementation. Inspect red.log and green.log."
  );
}
console.log(
  JSON.stringify(
    {
      execution: "synthetic-loopback-http",
      red_exit: states[0].exit_code,
      green_exit: states[1].exit_code,
      green_pages: observed.green.pages.map((page) =>
        page.body.items.map((item) => item.id)
      ),
      evidence_directory: output,
    },
    null,
    2
  )
);
```

</details>

## Prepare the input packet

An issue link is useful only if Codex can read it. Paste or attach the relevant content when the source is unavailable. Include the following information with the starter prompt.

| Input               | Sample issue                                                                                                                                                                                                                                |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Issue and outcome   | `API-142`: Add `GET /v1/projects/{project_id}/events` so customers can page through an activity feed.                                                                                                                                       |
| Repository and base | Put the sample folder in your chosen repository, then record the branch and exact commit selected for the task.                                                                                                                             |
| Relevant code       | The sample's `api.mjs`, `fixtures.mjs`, `test.mjs`, and `openapi.json`, plus your repository's `AGENTS.md`.                                                                                                                                 |
| Existing patterns   | Keep authentication and project authorization before pagination validation. Use signed cursors and the documented public error envelope. When adapting the issue, follow your repository's existing helpers.                                |
| Test setup          | Fixed in-memory test projects for two tenants, six tenant-A projects, a timestamp tie split across a page boundary, timestamps with fractional precision, empty and exactly full final pages, and 105 events for limit checks.              |
| Validation          | `node test.mjs --seeded` (expected failure), `node test.mjs` (corrected state), and `node reproduce.mjs ./evidence`. Run `node --check` for each `.mjs` file. For your own service, add its actual type, lint, regression, and CI commands. |
| Scope               | Endpoint, focused tests, and its OpenAPI documentation. No new dependencies, database migration, frontend, deployment, or auth redesign.                                                                                                    |
| Handoff             | A draft PR when the available repository integration supports it and you have authorized creation; otherwise a diff and draft PR description.                                                                                               |

For the sample, prepare Node 22.6 or later; the tests create their own test sessions and cursor-signing key and bind a temporary HTTP server to the loopback interface. For your own service, also prepare its dependencies, test configuration, and isolated services. Verify that its cursor helper can bind a cursor to the authenticated tenant and requested project before assigning this issue.

### Define the API contract

Confirm the sample contract below matches your repository before implementation. A successful response is HTTP 200 with exactly `{ items, next_cursor }`.

Each item has exactly four required public fields: `id` (nonempty string), `created_at` (UTC RFC 3339 timestamp string), `type` (nonempty string), and `summary` (string). `items` is an array of these objects; `next_cursor` is an opaque nonempty string or `null`.

Internal tenant/project keys, database metadata, raw event payloads, and credentials are not response fields. Describe response field types, required fields, whether fields allow `null`, and closed object shapes in OpenAPI. Verify the serialized HTTP bodies against that schema.

Events sort by `created_at DESC, id DESC`, preserving the timestamp's fractional precision and using descending lexical ID order. The cursor resumes strictly after the last returned tuple in that order.

The default page size is 25; valid limits are decimal integers from 1 through 100. Repeated limit or cursor parameters are invalid. Return a non-null cursor only when another matching event exists.

Both a partial final page and an exactly full final page return `next_cursor: null`; an empty authorized project returns `items: []` and `next_cursor: null`.

The sample signs each cursor and binds it to the authenticated tenant and requested project. Authenticate and authorize the requested project before validating its limit or cursor, so parameter errors cannot reveal whether another tenant's project exists.

A missing or invalid session returns 401; an inaccessible or nonexistent project returns the same generic 404. After confirming access, check the limit before the cursor.

A malformed, tampered, structurally invalid, or tenant/project-mismatched cursor returns HTTP 400 with code `invalid_cursor`. A valid cursor for another project in the same tenant, or for another tenant, is invalid when supplied to an authorized project.

A supplied cursor must not change the authorization result for an inaccessible project. The sample's version-1 cursor does not expire; unsupported versions are invalid.

In the sample, every error body has exactly `{ error: { code, message } }`, with both fields required strings and no extra fields.

Use these generic error responses:

- 400 `invalid_cursor` / `Invalid cursor.`
- 400 `invalid_limit` / `Limit must be an integer from 1 through 100.`
- 401 `unauthenticated` / `Authentication required.`
- 404 `not_found` / `Project not found.`

Keep decoded cursor contents, tenant/project identifiers, raw errors, and stack traces out of every error body. Use the real repository's approved envelope and codes if they differ; resolve that contract difference before changing shared helpers.

Traversal and replay assertions use fixed fixtures with no concurrent writes: following cursors returns every event once in the agreed order and terminates within `ceil(event_count / limit)` requests for a nonempty feed, or one request for an empty feed.

Replaying a valid cursor with the same request parameters returns the same items and continuation position while those fixtures stay unchanged; it need not produce byte-identical signed tokens.

This contract does not promise single-use cursors, snapshot pagination, or identical results after feed changes. Document the repository's existing feed consistency policy; stop for a product decision if no policy exists and the issue requires snapshot behavior.

## How to use

1. **Choose the issue and prepare the environment.** Confirm that the contract above matches the actual repository. Select the prepared cloud environment and the intended base commit. Supply the issue packet directly in the task; starting this recipe does not depend on an automatic issue-tracker trigger.
2. **Run the starter prompt.** Replace its bracketed inputs with your repository, issue packet, boundaries, and checks. Choose whether Codex should return a diff or create an authorized draft PR. The starter prompt on this page contains the full handoff instructions.
3. **Establish the baseline.** Codex should read repository instructions and run the approved baseline checks before editing.

   For the sample, run `node test.mjs` and the syntax checks in `README.md`; `--seeded` is a separate deliberate failure demonstration.

   For your own service, run its existing regression, type, and lint checks. A new endpoint's focused test file may not exist yet; record that as a test to create. Resolve failing existing checks or unavailable test services before attributing later results to the feature.

4. **Implement and verify the contract.** Ask Codex to use the existing access and cursor helpers, implement the endpoint, add the acceptance tests below, and update its API documentation. Where practical, the new tests should fail against the original code and pass after the change. Keep those results with the final verification record. In the downloadable sample, `--seeded` selects a deliberate defect for this comparison; this comparison is separate from a failing baseline in your repository.
5. **Review the change and its evidence.** Read the diff, acceptance checks, check outputs, and remaining risks together. If Codex creates an authorized draft PR, verify that its base and head are correct. If PR tooling is unavailable, use the returned diff and description to prepare the PR through your normal process. List any unresolved checks in the draft PR and keep it unready for merge.
6. **Resolve review feedback and merge through your normal process.** Give Codex the specific comments to address in the same task, then rerun the affected checks. A reviewer confirms required CI and approves the final commit before merging.

## Acceptance tests to require

These tests make the issue small enough to delegate and specific enough to review. Adapt the names to your test runner, while preserving the behavior each test proves.

### Stable traversal

Seed five fixed events: `evt_105` has the newest timestamp, `evt_104`, `evt_103`, and `evt_102` share the middle timestamp, and `evt_101` has the oldest.

With `limit=2`, require exactly these pages: `[evt_105, evt_104]`, `[evt_103, evt_102]`, `[evt_101]`. The tie group must cross the first boundary.

Assert exact order, no duplicate or missing IDs, non-null cursors on the first two pages, and a null cursor on the third; fail if traversal exceeds three requests.

Replay the first continuation cursor with the same limit against unchanged fixtures and assert the same second-page items and continuation position.

### Default and boundary sizes

Seed more than 100 events. Assert 25 items without a `limit` parameter, one with `limit=1`, and 100 with `limit=100`.

### Invalid limits

Assert HTTP 400 for `0`, `101`, `-1`, a fractional value, and a string such as `many`, using the existing validation error shape.

### Empty and final pages

Assert an empty authorized project returns `items: []` and `next_cursor: null`. With `limit=2`, assert that five events produce a one-item third page with a null cursor and that four events produce a two-item second page with a null cursor. The full final page must not require an extra empty request.

### Authentication

Assert missing and invalid sessions return the agreed 401 schema, including requests with a malformed cursor or a cursor from another scope. Cursor validation must not override authentication.

### Tenant isolation

Authenticate as tenant A and request tenant B's project or a nonexistent project. Assert the same agreed generic 404 body with no event data, including when the request carries a malformed or mismatched cursor. Authorization must precede cursor validation.

### Cursor scope

Request an authorized tenant-A project with (1) a valid signed cursor from another tenant-A project and (2) a valid signed cursor issued under tenant B.

Assert both return the same HTTP 400 `invalid_cursor` body with no event data or scope details. Test these separately from requests to an inaccessible project, which must return 404.

### Malformed and tampered cursors

On an authorized project, assert HTTP 400 `invalid_cursor` for tokens the helper cannot decode, tokens with modified signatures, and signed tokens that omit required cursor fields or give those fields the wrong type. Use isolated test signing fixtures.

Cover unsupported versions or expired tokens if the shared helper supports those features. Assert that responses match the agreed generic error schema and contain no decoded contents, identifiers, raw errors, or stack traces.

### Existing behavior

The sample checks the existing project-detail route with authorized, unauthorized, and inaccessible-project requests. Run syntax checks for its `.mjs` files. In your service, run its established regression suite, type check, and lint.

### Public response schema

Validate actual HTTP 200, 400, 401, and 404 response bodies against the agreed OpenAPI schemas. Assert required keys, item field types, timestamp format, whether the cursor allows `null`, and no extra properties at any object level.

Seed internal fields in stored events and verify they are absent from serialized items; verify every error response contains only its approved generic code and message.

### Documentation

Verify the OpenAPI operation and examples match the implemented parameters, exact success/error schemas, authorization precedence, ordering, final-page rules, and fixed-fixture replay/consistency limits. Run the repository's API specification validation if one exists.

## What good output looks like

### Shared evidence record

Use this evidence format for each acceptance criterion. Populate it from observed output. For a new test that does not exist at baseline, distinguish “not yet present” from a failed existing check.

```text
Criterion / test: [specific behavior and test location]
Environment: [published setup reference; runtime, database and dependency versions]
Before: [revision + test-only diff ID; command; exit code; observed assertion; log path]
After: [final revision or base + diff ID; command; exit code; observed assertion; log path]
Status: [pass / fail / blocked / not run]
Limits / reviewer action: [untested behavior, blocker, or decision required]
```

Keep red and green runs tied to their actual tested states, including test-only changes on the original revision. Keep the logs, response fixtures, and final diff with the handoff; file and test names alone do not prove execution. Update the evidence when the tested revision changes. Checks that are blocked or have not run cannot count as passing.

A useful PR description links each claim to its evidence. Use this handoff template and replace every bracketed field with observed results.

```text
Title: Add cursor pagination for project events
Issue: API-142
Base: [branch and commit]
Tested state: [head commit, or base commit plus attached diff identifier]

Changes
- Add the project-events endpoint using the existing project access helper.
- Reuse signed cursors scoped to tenant and project.
- Add contract tests and update the OpenAPI operation.

Acceptance evidence
- [One row per criterion above: test, observed result, and log reference.]

Validation
- Before edits: [command, result, and log reference for each baseline check].
- New tests against original code: [result, or not run with reason].
- After edits: [command, result, and log reference for each required check].
- CI: [check links and actual states, or not available].
- Remaining checks: [specific checks and blockers, or none with supporting evidence].

Reviewer focus
- [Highest-risk behavior and unresolved criteria.]

Remaining risk and rollback
- [Observed limitations; distinguish them from untested assumptions.]
- [How this change can be reverted and whether any callers depend on it.]
```

## Iterate from review comments

Use a focused follow-up for a specific review finding. For example:

```text
Address this review comment in the current change:
"Repeat the five-event traversal with limit=3; assert pages
[evt_105, evt_104, evt_103] and [evt_102, evt_101], then a null cursor."

Add the regression test and change the implementation only if it exposes a
failure. Rerun the focused endpoint tests and any other required checks affected
by the edit. Update the evidence table with the tested state and actual results.
Keep the same scope. Do not merge or deploy.
```

Provide the text of the comment if Codex cannot access the review directly. A reviewer should check that the response resolves the behavior in question, rather than only satisfying the wording of the comment.

## When to stop

- **The baseline is red or cannot run.** Return the failing check and setup details. Fix the environment or agree on a documented baseline before continuing.
- **The contract conflicts with existing behavior.** Identify the conflict, affected callers, and the smallest decision needed. Do not silently change the contract.
- **The change needs a migration, new dependency, or auth redesign.** Explain why and split or re-scope the issue before expanding it.
- **Tests fail after implementation.** Do not treat the change as ready to merge. Report the failing cases. Do not remove assertions or weaken authorization to make checks pass.
- **Repository write integration is unavailable.** Return the diff, draft PR description, and validation evidence. A teammate can complete the repository handoff.

## Reuse the workflow

After a reviewer accepts the first result, save the issue packet and acceptance checklist in your team's issue template. Record stable repository guidance, such as test commands and where API contracts live, in `AGENTS.md` or the existing contributor guide.