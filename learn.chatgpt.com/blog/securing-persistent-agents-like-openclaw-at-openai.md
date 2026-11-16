# Securing persistent agents like OpenClaw at OpenAI

> For the complete documentation index, see [llms.txt](/llms.txt). Markdown versions of documentation pages are available by appending `.md` to the page URL.

When OpenClaw launched almost a year ago, it showed the world the capabilities of a persistent agent. Unlike regular codex sessions which involve a fixed goal and human steering, persistent agents run 24/7 with a broad scope and the ability to proactively take actions without user input.

While persistent agents are extremely capable, their real world deployment has been limited to date. These deployments present many novel challenges compared to traditional software. With traditional software, we have relied on configuration and code to be deterministic and for threats to come (mostly) from external attackers. Persistent agents can change their configuration and write arbitrary code to accomplish a goal. Attacks come from the inside when agents take misaligned actions.

At OpenAI, we currently have persistent agents deployed across the entire company, including hundreds of OpenClaw agents. This post covers some of the controls we've adopted to enable OpenClaw deployments at OpenAI.

## Separate trusted and untrusted execution

In order to secure persistent agents, we needed to isolate trusted deterministic logic from un-trusted LLM execution. Trusted logic includes critical components like networking, identity, and sandboxing. This is traditional static code that, outside of software bugs, should behave as configured. Agents, the environment they execute in, and the code they write are considered untrusted. This is an environment where agents can dynamically generate code to accomplish a goal with no hard guarantees on behavior.

To support this in OpenClaw, we ended up implementing [remote harness execution](https://docs-enterprise.openclaw.org/guides/topics/remote-harness/#gateway-and-harness) in the open source project. This enabled the [OpenClaw Gateway](https://github.com/openclaw/openclaw) to run in a separate container (and in our case, a separate cluster), from the agent harness.

By implementing the split, we could treat the gateway, the component that configured the agent, as trusted deterministic code and focus on sandboxing the agent workload as untrusted code.

## Enforce hard security boundaries

Security boundaries for agent workloads are enforced through sandboxing, which limits the actions agents can take.

For our OpenClaw deployment, we used the following sandbox controls:

- network: control what endpoints an agent can access - we used an organization-managed allowlist with explicit denials for restricted endpoints
- workspace: control what files an agent can access - we only allowed writes to agent working directories
- process: control what processes an agent can access - we relied on process isolation via codex linux sandbox
- secrets: control what secrets an agent can access - we manage secrets through a credential broker so secrets are not visible to the agent

For our OpenClaw deployment, we used the built-in sandbox from the codex harness. The following are some of the settings we employed, divided between [`requirements.toml`](/codex/enterprise/managed-configuration#admin-enforced-requirements-requirementstoml) (restrict what options are available in codex configuration) and [`config.toml`](/codex/config-basic#codex-configuration-file) (actual codex configuration). Note that we also enabled some additional security controls - removing the ability to use [`danger-full-access`](/codex/agent-approvals-security#common-sandbox-and-approval-combinations) mode and relying on [cached web search](/codex/config-basic#web-search-mode) which routes web searches through OpenAI’s own index for search queries.

**`requirements.toml`**

```toml snippet=configuration reason="requirements.toml reference settings"
# Exclude unrestricted "danger-full-access" sandbox mode.
allowed_sandbox_modes = ["read-only", "workspace-write"]

# Permit cached hosted search, but not live hosted search.
allowed_web_search_modes = ["cached"]

# Require the managed network proxy.
experimental_network.enabled = true

# Prevent user-level configuration from expanding the domain allowlist.
experimental_network.managed_allowed_domains_only = true

# Allow only these destinations; replace with the workload's required hosts.
experimental_network.allowed_domains = [
  "github.com",
  "api.github.com",
  "codeload.github.com",
]

# Explicitly block these destinations, including cloud metadata endpoints.
experimental_network.denied_domains = [
  "pastebin.com",
  "*.pastebin.com",
  "webhook.site",
  "metadata.google.internal",
  "169.254.169.254",
]
```

**`config.toml`**

```toml snippet=configuration reason="config.toml reference settings"
# Select the permission profile defined below.
default_permissions = "openclaw"

# Use cached hosted search.
web_search = "cached"

[permissions.openclaw.filesystem]
# Allow reads needed by the minimal runtime environment.
":minimal" = "read"

# Allow reading and modifying the agent's workspace.
"/home/dev-user/openclaw-workspaces" = "write"

# Allow reading managed assets without modifying them.
"/home/dev-user/read-only" = "read"

# Prevent access to SSH credentials.
"/home/dev-user/.ssh" = "deny"

[permissions.openclaw.network]
# Permit network access through the administrator-required proxy.
enabled = true

# Do not inherit an upstream proxy.
allow_upstream_proxy = false

# Keep the proxy's local/private-address guard enabled.
allow_local_binding = false

# Disable the SOCKS5 listener.
enable_socks5 = false

# Disable SOCKS5 UDP support.
enable_socks5_udp = false

# Do not permit proxy listeners on non-loopback addresses.
dangerously_allow_non_loopback_proxy = false

# Do not permit unrestricted Unix-socket access.
dangerously_allow_all_unix_sockets = false

[shell_environment_policy]
# Preserve default filtering of sensitive environment variables.
ignore_default_excludes = false

# Remove GitHub credentials from agent command environments.
# This does not hide credentials stored in accessible files.
exclude = [
  "GH_TOKEN",
  "GITHUB_TOKEN",
  "OPENCLAW_GITHUB_BASIC_AUTH",
  "OPENCLAW_GITHUB_READONLY_BASIC_AUTH",
]

[apps._default]
# Disable apps unless individually enabled.
enabled = false

# Disable destructive app operations by default.
destructive_enabled = false

# Disable open-world app operations by default.
open_world_enabled = false
```

## Add model-based safeguards

All the controls we talked about so far are static in the sense that they rely on traditional deterministic code to prevent an agent from taking misaligned actions. As models get smarter, it's critical that we also have defenses that scale with compute - aka other models.

With [Auto-review](https://alignment.openai.com/auto-review/), a second agent can monitor and approve the actions of a primary agent. Constantly requiring human review creates review fatigue where humans are trained to blindly accept all permission prompts. By using an LLM based reviewer as a filter, we reserve human attention for high value approvals. This is a feature that is natively supported in both OpenClaw and Codex.

For our OpenClaw deployment, we enforce auto review on all agent actions.

## Split agent identity from user identity

When an agent takes an action, we need to be able to audit said action, give the agent access to resources, and distinguish whether that action was initiated by the agent or by the user. Agent identity gives us the means to do so. There are emerging specifications like [WAG](https://datatracker.ietf.org/doc/draft-carleton-workload-authz-grant/) that give agents their own access to resources, and others like [XAA](https://datatracker.ietf.org/doc/draft-ietf-oauth-identity-assertion-authz-grant/) that let agents act on behalf of the user through OAuth delegation. Note that agent identity is different from service accounts which provide separate API access for bots. The two should be used together - for example, your agent should act with its own agent identity and access third party services through service accounts which are linked to said identity.

For our OpenClaw deployment, each agent has a unique identity that is associated with a [ChatGPT Service Account](../docs/enterprise/service-accounts.html). This gives each agent its own inference credential separate from the user’s and allows teams to connect custom plugins to the agent. This also lets us audit agent actions and if needed, turn off inference.

## Observe everything

Comprehensive observability lets operators understand the full lifecycle of agents - from how they were configured to what actions they took. With persistent agents, it's critical that we have this coverage in order to trace and detect misaligned actions.

For our OpenClaw deployment, we log everything - every configuration change on the control plane and all turns from the agent. Because agent turns can contain sensitive information, these logs are locked down and only available to a select few individuals in the security team.

## Closing thoughts

We are still at the beginning of the adoption curve when it comes to deploying persistent agents. The lack of established best practices makes it difficult to adopt agents in many enterprises today.

When we rolled out our internal pilot of OpenClaw at OpenAI, we witnessed a huge jump in both productivity and adoption, from both technical and non-technical teams across the company. We now have over 500 agents that run proactively in the background doing meaningful work - everything from automatically opening PRs in response to product feedback to continuously running data experiments on new features.

During OpenAI dev day, we [announced OpenClaw Enterprise (OCE)](https://openclaw.ai/blog/openclaw-enterprise), an open source vendor neutral agent control plane. If you use OCE, you can launch an agent with many of the safeguards we talked about built-in when using the [standard codex preset](https://github.com/openclaw/openclaw-enterprise/blob/main/docs/guides/topics/standard-codex-preset.md). Note the project is currently still in the pilot phase and that we plan to get to a 1.0 release by the end of the year.

We believe many of AI’s biggest gains in industry will come from persistent agents. By sharing what we’ve learned and building OCE in the open, we hope to make them safer for everyone to deploy.