---
name: Migrate a validation module
tagline: Upgrade one module and prove that its public behavior still holds.
summary: Give Codex a bounded migration brief, contract fixtures, and a prepared
  cloud environment. Upgrade one validation module and return the focused
  change, parity evidence, remaining differences, and rollback instructions.
bestFor:
  - Engineering teams moving a legacy validation component.
  - Migrations with explicit contracts and repeatable tests.
  - Teams needing a small reviewed change while other modules keep working.
starterPrompt:
  title: Migrate a validation module
  body: >-
    Migrate [module] in [repository] from [current pinned version] to [approved
    target version] in this cloud environment.


    Read AGENTS.md, [migration brief], [official migration guide], the
    dependency lockfile, the module's callers, and [contract test locations].
    Record the starting commit, environment/setup reference, installed Python
    version, framework/Pydantic/bundled-v1 versions, and lockfile hash. Confirm
    baseline/target compatibility; treat shared dependency/import preparation as
    a separate reviewed change.


    First run [baseline commands], inventory the migration surface, and write a
    short plan in [plan file]. Preserve [public contracts]. Keep [out-of-scope
    modules] unchanged. Remove obsolete code only inside the approved slice;
    name any compatibility adapter that must remain.


    If the slice can be isolated and the baseline is usable, run the same frozen
    HTTP contract tests before and after the change through the real router,
    error handler, and response serialization. Compare status codes, contractual
    headers, accepted/rejected inputs, public JSON keys/types, defaults/nulls,
    and the complete error envelope. Run affected integration, lint and type
    checks too. If this requires broader upgrades or public behavior changes,
    return that decision before expanding scope. Do not approve new snapshots,
    normalize away public differences or weaken assertions. Record each check's
    revisions/environment/versions, before/after commands, exit codes, evidence
    paths, and pass/fail/blocked/not run with limitations.


    Return the diff, before-and-after evidence, unresolved differences,
    dependency and lockfile changes, rollback instructions, and a draft PR
    description. Create a draft PR only if the connected repository tools and my
    permissions support it; otherwise provide the patch and description. Do not
    merge, deploy, change production data, or begin another slice.
relatedLinks:
  - label: Cloud environments
    url: ../docs/environments/cloud-environments.html
  - label: Pydantic migration guide
    url: https://docs.pydantic.dev/latest/migration/
---

> For the complete documentation index, see [llms.txt](/llms.txt). Markdown versions of documentation pages are available by appending `.md` to the page URL.

## When to use it

Use this workflow when a migration has a clear boundary and tests that compare old and new behavior. Give Codex a migration brief, the module and its callers, frozen contract fixtures, and a prepared cloud environment. Ask for one focused change with evidence and a rollback path.

The sample migrates one validation model in an orders service from `Pydantic` v1 to v2. It includes the original implementation, a compatibility preparation stage, and the final module. Its tests exercise the real FastAPI router, error handler, response serialization, adjacent legacy route, and public OpenAPI document. No database migration or deployment is included.

## Prepare the cloud environment

1. Choose **Work in** > **Cloud** and select a published environment.

2. To create one, select **Create environment**, choose the GitHub repositories, and ask Codex to prepare the runtime, dependencies, and isolated test services.

3. Review the setup report, resolve failed checks, and **Publish** before starting a new task.

- Follow the [Cloud environment guide](../docs/environments/cloud-environments.html).
- Keep repository guidance in [AGENTS.md](../docs/agent-configuration/agents-md.html).

If dependencies change or service setup changes, edit the reusable environment, test it, and **Republish**.

Validate the updated environment in a new task. Repository refresh preserves dependency caches without rerunning installation or startup commands, and existing tasks retain their own state.

Configure required network destinations and credentials separately.

Record the environment/setup reference, source commit, Python patch version, framework and dependency versions, package-manager version, and lockfile hash at each stage. Verify those versions inside the new task before using its results.

## Run the sample

Download the [complete migration sample](https://developers.openai.com/codex/use-cases/migrate-a-validation-module/sample.zip). It includes three standalone `uv` projects, their resolved `uv.lock` files, application implementations, a shared error and schema adapter, frozen HTTP fixtures, and the contract runner.

Use Python 3.11, 3.12, or 3.13 and install [`uv`](https://docs.astral.sh/uv/getting-started/installation/), then run:

```bash
unzip sample.zip
cd migrate-a-validation-module
uv run --project support/target --python python3 --frozen python run.py --compare-stages --output evidence
```

The comparison creates a separate `.venv` for each stage and installs dependencies with `uv sync --frozen`. All stages use the invoking Python interpreter and the same HTTP and schema fixtures; dependency versions remain locked.

Python 3.14 and later are excluded because the legacy `Pydantic` v1 bridge does not support them. A successful run ends with:

```text
PASS: legacy, prepared, target HTTP/schema/serialization contracts match
Native model schemas differ; the existing public schema adapter is preserved.
```

Read `evidence/legacy.json`, `prepared.json`, `target.json`, and `summary.json`. They contain observed responses, runtime versions, source, fixture, and lockfile hashes, commands, exit codes, and raw-log paths.

The runner exercises the sample application's HTTP endpoints through `FastAPI`'s in-process `TestClient`. Run it inside your chosen Cloud task and retain that task's evidence.

Run `python3 run.py` without `--compare-stages` only to check the target model in an environment with `Pydantic` v2 installed. That self-contained mode checks seven validation and serialization cases. It does not run HTTP or cross-stage parity checks. Use the full comparison command above to verify a migration.

The full comparison checks 23 HTTP cases in each stage, public OpenAPI, and response serialization. It passed locally on Python 3.11, 3.12, and 3.13. The download's `README.md` records the tested versions and execution history. Run the current comparison in your Cloud environment to record its results there.

### Keep the dependency stages separate

| Stage             | Python / FastAPI / `Pydantic`   | Migration boundary                                                             |
| ----------------- | ------------------------------- | ------------------------------------------------------------------------------ |
| Legacy            | `3.11–3.13 / 0.119.0 / 1.10.22` | Existing models import from `pydantic`.                                        |
| Prepared baseline | `3.11–3.13 / 0.119.0 / 2.12.3`  | Both models use `pydantic.v1`. Record the actual bundled-v1 version.           |
| Target            | `3.11–3.13 / 0.119.0 / 2.12.3`  | Only `OrderInput` moves to v2. The adjacent route keeps its separate v1 model. |

The prepared and target dependency locks are identical. The module slice changes the model and its direct serialization method, not the dependency environment.

The preparation step is a separate reviewed change. It also makes the remaining v1 route adapters emit alias-keyed dictionaries with `dict(by_alias=True)` before response validation; returning the v1 model directly under the v2 host can lose public aliases.

The target order adapter uses `model_dump(by_alias=True)`, and the adjacent v1 route keeps its preparation adapter.

The [FastAPI migration guide](https://fastapi.tiangolo.com/how-to/migrate-from-pydantic-v1-to-pydantic-v2/) limits temporary mixed v1/v2 route support to `0.119.0` through `0.127.x`; `0.128.0` removed it.

This example deliberately pins `0.119.0` to demonstrate that transition. Use a fully v2 boundary for a newer FastAPI application, and keep an owner and removal condition for the temporary bridge. Do not nest v1 and v2 models. This bridge is not a Python 3.14 migration path.

### Review the contract tests

The frozen HTTP cases cover successful requests, an omitted note or a note explicitly set to null, missing and invalid IDs, multiple unknown fields, mixed field errors, invalid notes, malformed JSON, wrong content type, missing body, aliases, array and string bodies, and the adjacent legacy route. They compare status codes, the `Content-Type` header, and complete parsed JSON responses without stripping error fields or changing expected types.

The service has an application-owned error envelope and public OpenAPI document from the legacy stage. The error and schema adapters remain in place. The target preserves the legacy error order: declared-field errors first, then unknown keys alphabetically.

The tests compare the complete ordered `error.fields` array; they do not sort observed responses. The runner records each model's native schema separately and verifies that native schemas differ; public schema parity does not mean the dependency's generated schemas are identical.

The service preserves a legacy input behavior: it accepts an array of pairs such as `[["order_id", "ord_123"]]` as an object, and both `[]` and an empty JSON string become empty objects with a missing-ID error. A nonempty string remains an invalid body. The target model keeps successful `dict(value)` conversions. Changing it to object-only input requires an owner's contract decision, not a rewritten test expectation.

For your repository, freeze its actual existing responses before editing. Preserve optional fields with explicit defaults, keep strictness and unknown-field behavior, and test the real error handler and response serialization.

Raw validation errors differ across versions. The [`Pydantic` migration guide](https://docs.pydantic.dev/latest/migration/) also describes changes to aliases, coercion, optional fields, and custom validation functions; v2 does not convert `TypeError` raised inside those functions into `ValidationError`.

### Inspect the contract runner

This excerpt comes from `run.py` in the download. Run the complete files after extracting the ZIP; the locked stages and HTTP fixtures are included there.

<details>
  <summary>Compare the three stages</summary>
```python
class OrderInput(BaseModel):
    internal_order_id: StrictStr = Field(alias="order_id")
    customer_note: StrictStr | None = None
    model_config = ConfigDict(extra="forbid", populate_by_name=False)

    @model_validator(mode="before")
    @classmethod
    def preserve_legacy_mapping(cls, value):
        # v1 tries dict(value), so pairs, [] and "" can become objects.
        # Preserve successful conversions without changing failed-input errors.
        if not isinstance(value, dict):
            try:
                return dict(value)
            except (TypeError, ValueError):
                return value
        return value


def serialize_order(payload):
    return OrderInput(**payload).model_dump(by_alias=True)


def preserve_legacy_error_order(fields):
    # v1 reports declared-field errors first and unknown keys alphabetically.
    # v2 keeps unknown keys in input order; preserve the existing HTTP contract.
    known = [field for field in fields if field["code"] != "extra_forbidden"]
    extra = sorted(
        (field for field in fields if field["code"] == "extra_forbidden"),
        key=lambda field: field["path"],
    )
    return known + extra


def check_target_model():
    for payload, expected in (
        ({"order_id": "ord_123"}, {"order_id": "ord_123", "customer_note": None}),
        (
            {"order_id": "ord_123", "customer_note": "Leave at desk"},
            {"order_id": "ord_123", "customer_note": "Leave at desk"},
        ),
        (
            {"order_id": "ord_123", "customer_note": None},
            {"order_id": "ord_123", "customer_note": None},
        ),
    ):
        assert serialize_order(payload) == expected
    for payload, expected in (
        ({}, [("order_id", "missing")]),
        ({"order_id": 123}, [("order_id", "string_type")]),
        (
            {"order_id": "ord_123", "customer_note": 17},
            [("customer_note", "string_type")],
        ),
        (
            {"order_id": "ord_123", "unexpected": True},
            [("unexpected", "extra_forbidden")],
        ),
    ):
        try:
            OrderInput(**payload)
        except ValidationError as error:
            assert [
                (item["loc"][0], item["type"]) for item in error.errors()
            ] == expected
        else:
            raise AssertionError(f"Accepted invalid order: {payload}")
    print("PASS: target model validation and serialization (7 cases)")
    print("Model-only checks; use --compare-stages for HTTP migration parity.")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=ROOT / "evidence")
    parser.add_argument("--compare-stages", action="store_true")
    args = parser.parse_args()
    if not args.compare_stages:
        check_target_model()
        return
    args.output.mkdir(parents=True, exist_ok=True)
    reports = []
    commands = []
    for stage in ("legacy", "prepared", "target"):
        project = Path("support") / stage
        stage_commands = [
            [
                "uv",
                "sync",
                "--project",
                str(project),
                "--python",
                sys.executable,
                "--frozen",
            ],
            [
                "uv",
                "run",
                "--project",
                str(project),
                "--python",
                sys.executable,
                "--frozen",
                "python",
                "test/run_stage.py",
                stage,
                str(args.output / f"{stage}.json"),
            ],
        ]
        for command in stage_commands:
            completed = subprocess.run(
                command, cwd=ROOT, capture_output=True, text=True
            )
            label = f"{stage}-{len(commands)}"
            (args.output / f"{label}.log").write_text(
                completed.stdout + completed.stderr
            )
            commands.append(
                {
                    "command": command,
                    "exit_code": completed.returncode,
                    "log": f"{label}.log",
                }
            )
            (args.output / "commands.json").write_text(
                json.dumps(commands, indent=2, sort_keys=True) + "\n"
            )
            if completed.returncode:
                print(completed.stdout + completed.stderr, file=sys.stderr)
                raise SystemExit(completed.returncode)
            print(completed.stdout, end="")
        reports.append(json.loads((args.output / f"{stage}.json").read_text()))
    assert all(report["python"] == platform.python_version() for report in reports)
    for report in reports[1:]:
        for key in (
            "observations",
            "public_openapi",
            "direct_call",
            "fixture_sha256",
            "schema_fixture_sha256",
        ):
            assert report[key] == reports[0][key], f"Parity failed: {key}"
    assert reports[1]["lock_sha256"] == reports[2]["lock_sha256"]
    native_schema_differs = (
        reports[0]["native_model_schema"] != reports[2]["native_model_schema"]
    )
    assert native_schema_differs, "The example should expose native schema drift"
    manifest = {
        str(path.relative_to(ROOT)): digest(path)
        for path in sorted(ROOT.rglob("*"))
        if path.is_file()
        and not path.resolve().is_relative_to(args.output.resolve())
        and not any(
            part in {".venv", "__pycache__", "evidence", ".ruff_cache"}
            for part in path.relative_to(ROOT).parts
        )
    }
    summary = {
        "status": "pass",
        "scope": "synthetic in-process FastAPI TestClient execution",
        "stages": [report["stage"] for report in reports],
        "http_cases_per_stage": reports[0]["http_cases"],
        "native_model_schema_differs": native_schema_differs,
        "public_http_and_schema_parity": True,
        "commands": commands,
        "source_sha256": manifest,
    }
    (args.output / "summary.json").write_text(
        json.dumps(summary, indent=2, sort_keys=True) + "\n"
    )
    print("PASS: legacy, prepared, target HTTP/schema/serialization contracts match")
    print(
        "Native model schemas differ; the existing public schema adapter is preserved."
    )
```

</details>

## Run the workflow in your repository

1. **Write the brief.** Name the module, direct callers, owner, approved versions, contract tests, out-of-scope code, and rollback instructions. Stop if the slice requires a wider dependency upgrade or changes public behavior.
2. **Establish the baseline.** Have Codex read `AGENTS.md`, the brief, official migration guidance, locks, callers, and tests. Record the starting commit and installed versions. Explain or repair failing baseline checks before claiming parity.
3. **Prepare compatibility separately.** If shared dependencies couple the module to other code, review that preparation first. Prove that the same fixtures pass against both the original and prepared baselines.
4. **Migrate one slice.** Use the starter prompt on this page. Change the module and its direct adapter; preserve unrelated modules and name any compatibility code that remains.
5. **Run the same tests.** Compare baseline and final HTTP/schema fixtures without changing expectations. Run affected integration, lint, and type checks, and save output tied to the final source and dependency state.
6. **Review the handoff.** Inspect the diff, observed evidence, unresolved differences, remaining bridge, and rollback. Create a draft PR only when repository tools and permissions support it. Leave merging, deployment, and another migration slice to the reviewer.

## Record what was verified

Use an evidence record for each criterion:

```text
Criterion: [behavior and test]
Environment: [setup reference; actual runtime and dependency versions]
Before: [commit/diff ID; command; exit code; observed result; evidence path]
After: [final commit/diff ID; command; exit code; observed result; evidence path]
Status: [pass / fail / blocked / not run]
Limits: [untested behavior, missing prerequisite, or required owner decision]
```

A successful import, lint check, or regenerated snapshot does not prove API parity. Record intentional differences separately, and rerun checks when the final source changes. When adapting the sample, include your application's callers and services in the contract tests.