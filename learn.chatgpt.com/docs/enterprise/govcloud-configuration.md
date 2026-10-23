# Bedrock GovCloud configuration

> For the complete documentation index, see [llms.txt](../llms.txt). Markdown versions of documentation pages are available by appending `.md` to the page URL.

This guide explains how to configure Codex to perform inference against Amazon Bedrock in GovCloud. We cover AWS access, managed device settings, and network controls.

[Codex configuration reference](../config-file/config-reference.html)

This guide is not legal advice and does not grant an authorization to operate
  (ATO). Review the configuration, selected AWS services, endpoint controls, and
  data flows with your security and authorizing officials against your agency’s
  requirements and system security plan.

## Shared responsibility

Review the [AWS shared responsibility model](https://aws.amazon.com/compliance/shared-responsibility-model/) and your selected services’ documentation to understand which controls AWS provides. Your agency is responsible for authorizing their use.

In a supported deployment, Codex sends inference requests to the configured Bedrock endpoint using AWS authentication. Your organization secures the devices running Codex, including credentials, repositories, local records, and enabled third-party services. Using GovCloud for inference does not establish that the entire workflow meets your agency’s requirements.

{/* prettier-ignore */}
<Tabs
  id="govcloud-setup"
  ariaLabel="Codex client"
  param="govcloud-client"
  defaultTab="app"
  size="md"
  block
  tabs={[
    { id: "app", label: "App" },
    { id: "cli", label: "CLI" },
  ]}
>
  


[Verification checklist](#3-verify-the-deployment) · [Feature settings](#feature-settings)





## Before you begin

Use desktop app version **26.1002.51308 or later**, as shown in **About**.

| Prepare           | What you need                                                                             |
| ----------------- | ----------------------------------------------------------------------------------------- |
| AWS access        | An AWS GovCloud account with access to the Bedrock model you’ll use.                      |
| Configuration     | A reviewed `requirements.toml`, approved network destinations, and rollback instructions. |
| Device management | System configuration or MDM access, with app, device, and agent-command network policies. |








## 1. Deploy device requirements

Deploy `requirements.toml` through system configuration or MDM before app launch. Follow [Managed configuration](managed-configuration.html) for file locations and MDM delivery. Protect the managed policy and verify its settings on the machine running Codex in [step 3](#3-verify-the-deployment).

### Recommended `requirements.toml`

The default `requirements.toml` below is intentionally restrictive. Administrators can enable additional features if they accept the risk that they pose. Reference the [feature docs](#feature-settings) and [network control docs](managed-configuration.html#configure-network-access-requirements).

{/* prettier-ignore-start */}

requirements.toml

```toml
# Disable ChatGPT sign-in.
allowed_login_methods = ["api"]

# ../agent-approvals-security.html#common-sandbox-and-approval-combinations
allowed_sandbox_modes = ["read-only", "workspace-write"]

# Approval prompts are reviewed by the user.
allowed_approvals_reviewers = ["user"]
allowed_approval_policies = [
  { granular = { sandbox_approval = false, rules = true, mcp_elicitations = false, request_permissions = false, skill_approval = true } },
]

# Allow cached search only if your AWS GovCloud Region supports web search.
allowed_web_search_modes = ["disabled", "cached"]

# Block agent browser use and native-app control.
allow_browser_and_computer_use = false

# Appshots: ../appshots.html
allow_appshots = false

# Remote control: ../remote-connections.html#pick-up-work-from-another-device
allow_remote_control = false

# Managed hooks: managed-configuration.html#enforce-managed-hooks-from-requirements
allow_managed_hooks_only = true

check_for_update_on_startup = false

# MCP servers, apps, and plugins are disabled by default.
# Admins can enable supported integrations after accepting the risks
# for their use case and configuring access and network controls.
# managed-configuration.html
mcp_servers = {}

[features]
apps = false
enable_mcp_apps = false
plugins = false

# Enable the network proxy for sandboxed commands.
# ../agent-approvals-security.html#network-isolation
network_proxy = true

in_app_dictation = false
realtime_conversation = false

# Browser controls: managed-configuration.html#disable-codex-feature-surfaces
# Note that both browser use and computer use are up to your organization's risk appetite.
# An agent using your browser or computer may navigate to any websites or applications that the
# computer has access to. OpenAI does not currently provide additional protections restricting
# the network paths that browser use and computer use may exercise.
in_app_browser = false
browser_use = false
browser_use_external = false
browser_use_full_cdp_access = false

# Computer Use: ../computer-use.html
# Enable after accepting the risks and configuring app and network access.
computer_use = false

# Set to true to let users update through the app.
# App-store, package-manager, and MDM updates are controlled separately.
# manage-app-updates.html#turn-off-in-app-updates
in_app_updates = false

image_generation = false

# Memories: ../customization/memories.html
memories = false

# Computer History: ../customization/computer-history.html
chronicle = false

external_agent_memory_import = false

# We recommend that users review approval requests themselves.
# Admins can enable automatic review after accepting the risks for their use case.
# ../agent-approvals-security.html#automatic-approval-reviews
guardian_approval = false
guardianv2 = false

# Disable background skill-search experiments.
skill_search = false

# Hooks: ../hooks.html
hooks = false

# If you enable web search, use cached search through Bedrock Mantle
# where supported by your AWS GovCloud Region.
standalone_web_search = false

# Disable feedback submissions to OpenAI.
[feedback]
enabled = false

# Network controls for agent commands:
# managed-configuration.html#configure-network-access-requirements
[experimental_network]
enabled = true
managed_allowed_domains_only = true

# No domains allowed by default. Add destinations approved for your use case.
domains = {}

# Add approved Unix socket paths here.
unix_sockets = {}

# Set to true when using an organization-approved upstream proxy.
allow_upstream_proxy = false

# Keep the command proxy bound to localhost.
dangerously_allow_non_loopback_proxy = false
dangerously_allow_all_unix_sockets = false

# Local/private networking: ../agent-approvals-security.html#local-and-private-destinations
allow_local_binding = false

# App network controls: managed-configuration.html#control-desktop-app-network-destinations
[application.network]
enabled = true

# Example: Bedrock Mantle in us-gov-west-1.
# Replace this hostname with the Bedrock endpoint configured in config.toml.
[application.network.domains]
"bedrock-mantle.us-gov-west-1.api.aws" = "allow"

# OpenAI and ChatGPT endpoints.
# We recommend denying these endpoints to avoid any risk that user data is sent to commercial OpenAI infrastructure.
"api.openai.com" = "deny"
"chat.openai.com" = "deny"
"chatgpt.com" = "deny"
"ab.chatgpt.com" = "deny"
"platform.openai.com" = "deny"
"auth.openai.com" = "deny"
"gov.api.openai.com" = "deny"
"gov.chatgpt.com" = "deny"
"sdfedpreastus2.oaiusercontent.com" = "deny"
"o33249.ingest.us.sentry.io" = "deny"
"persistent.oaistatic.com" = "deny"
"oaisidekickupdates.blob.core.windows.net" = "deny"

# Windows only: ../config-file/config-reference.html#requirementstoml
[windows]
allowed_sandbox_implementations = ["elevated"]
```


{/* prettier-ignore-end */}








## 2. Configure provider routing and network controls

Set the provider, model, Region, and endpoint in `config.toml` or managed defaults. Users can change these defaults within the limits set by `requirements.toml`.

### Recommended `config.toml`

The example below uses Mantle in `us-gov-west-1`. Replace the model ID and AWS profile with your deployment’s values. For another supported Region or endpoint, update the URL, Region, and network policy together.

The example turns off optional diagnostics and data sharing. Keep AWS credentials outside the TOML file. Keep the AWS profile, credentials, and credential helper scripts outside folders Codex can modify.

{/* prettier-ignore-start */}

config.toml

```toml
# Replace with your approved Bedrock model ID.
model = "openai.gpt-5.6-terra"
model_provider = "amazon-bedrock"
approval_policy = { granular = { sandbox_approval = false, rules = true, mcp_elicitations = false, request_permissions = false, skill_approval = true } }
sandbox_mode = "workspace-write"

# Set to "cached" only when supported by your model and GovCloud Region
# and approved for your deployment.
# https://docs.aws.amazon.com/bedrock/latest/userguide/web-search.html
web_search = "disabled"

# Example: Bedrock Mantle in us-gov-west-1.
[model_providers.amazon-bedrock]
base_url = "https://bedrock-mantle.us-gov-west-1.api.aws/openai/v1"
wire_api = "responses"
requires_openai_auth = false

[model_providers.amazon-bedrock.aws]
region = "us-gov-west-1"

# Replace with your AWS profile name.
profile = "codex-govcloud"

[sandbox_workspace_write]
# Command destinations are controlled by requirements.toml.
network_access = true

# Disable sending Codex usage analytics to OpenAI.
[analytics]
enabled = false

# OpenTelemetry exports are off by default.
# Admins can configure an approved collector for logs, traces, and metrics.
# ../config-file/config-advanced.html#observability-and-telemetry
[otel]
exporter = "none"
trace_exporter = "none"
metrics_exporter = "none"
log_user_prompt = false
```


{/* prettier-ignore-end */}

This example uses AWS credentials with Bedrock Mantle. For Bedrock Runtime or a gateway, follow the [provider setup instructions](../amazon-bedrock.html).

### Apply network controls

Add approved app destinations, including Bedrock, to [`application.network.domains`](managed-configuration.html#control-desktop-app-network-destinations). Add approved command destinations to [`experimental_network.domains`](managed-configuration.html#configure-network-access-requirements).

Codex’s network settings do not replace your device firewall.








## 3. Verify the deployment

1. Confirm that your policy is active and Codex is using the intended AWS credentials and Bedrock settings.
1. Run an approved workflow with sample data.
1. Confirm that user settings cannot override the managed restrictions.
1. Test invalid or expired credentials and routing failures. Confirm that content is not sent to an unapproved destination.

## Troubleshoot common problems

| Problem                     | What to check                                                                                                  |
| --------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Unsupported endpoint        | Confirm with OpenAI that your installed desktop and app-server versions support the endpoint and model.        |
| Wrong AWS account or role   | Check the active credentials and selected AWS profile. A Bedrock API key may take precedence over the profile. |
| Restrictions aren’t applied | Confirm the intended `requirements.toml` is loaded on the machine running Codex.                               |
| Feature still unavailable   | Check the feature docs for required settings and Bedrock support, then check your network controls.            |








## Feature settings

Users cannot override feature settings enforced by `requirements.toml`.

The table summarizes the configuration above. **On** means permitted where supported; other permissions and network controls still apply.

For provider support, see [Bedrock feature availability](../amazon-bedrock.html#feature-availability).

| Feature                                                                                               | Default | Notes                                                                                                                        |
| ----------------------------------------------------------------------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Local coding, files, Git, and subagents                                                               | On      | —                                                                                                                            |
| [Local scheduled tasks](../automations.html)                                                           | On      | —                                                                                                                            |
| [Browser](../browser.html)                                                                             | Off     | Includes the built-in browser, connected browsers, agent browser control, and Developer mode.                                |
| [Computer Use](../computer-use.html) and [Appshots](../appshots.html)                                   | Off     | —                                                                                                                            |
| [Memory](../customization/memories.html) and [Computer History](../customization/computer-history.html) | Off     | —                                                                                                                            |
| [Image generation](../image-generation.html)                                                           | Off     | Does not block image inputs or reading existing image files.                                                                 |
| [Web search](../web-search.html)                                                                       | Off     | Cached search requires support in your model and GovCloud Region. Command-network rules do not restrict hosted search.       |
| [Apps and plugins](../plugins.html)                                                                    | Off     | —                                                                                                                            |
| [Configured MCP servers](managed-configuration.html)                                     | Off     | Admins can enable approved servers after accepting the risks for their use case and configuring access and network controls. |
| Interactive MCP apps                                                                                  | Off     | —                                                                                                                            |
| Dictation                                                                                             | Off     | —                                                                                                                            |
| [Automatic approval review](../agent-approvals-security.html#automatic-approval-reviews)               | Off     | —                                                                                                                            |
| [Remote control](../remote-connections.html#pick-up-work-from-another-device)                          | Off     | SSH connections are separate.                                                                                                |
| [App updates](manage-app-updates.html)                                                   | Off     | —                                                                                                                            |





Enabling agent browser use or Computer Use also requires `allow_browser_and_computer_use = true`.

  

  


[Verification checklist](#3-verify-the-cli-deployment) · [Feature settings](#cli-feature-settings)





Configure Codex CLI to perform inference against Amazon Bedrock in GovCloud. The [shared responsibility guidance](#shared-responsibility) also applies to CLI deployments.

<h2 id="cli-prerequisites">Before you begin</h2>

Install [Codex CLI](../codex/cli.html) and check the installed version:

```shell
codex --version
```

Use **Codex CLI 0.162.0 or newer**.

You need an AWS GovCloud account with access to the Bedrock model you’ll use, and administrator access to deploy `requirements.toml` on the machine running Codex. For WSL or SSH, apply the configuration inside the environment where the CLI runs.

<h2 id="1-deploy-cli-requirements">1. Deploy device requirements</h2>

Deploy `requirements.toml` through system configuration or MDM before CLI launch. Follow [Managed configuration](managed-configuration.html) for file locations and MDM delivery. Protect the managed policy and verify its settings on the machine running Codex in [step 3](#3-verify-the-cli-deployment).

<h3 id="cli-recommended-requirementstoml">
  Recommended `requirements.toml`
</h3>

The default `requirements.toml` below is intentionally restrictive. Administrators can enable additional features if they accept the risk that they pose. Reference the [feature docs](#cli-feature-settings) and [network control docs](managed-configuration.html#configure-network-access-requirements).

{/* prettier-ignore-start */}

requirements.toml

```toml
# Disable ChatGPT sign-in.
allowed_login_methods = ["api"]

# ../agent-approvals-security.html#common-sandbox-and-approval-combinations
allowed_sandbox_modes = ["read-only", "workspace-write"]

# Approval prompts are reviewed by the user.
allowed_approvals_reviewers = ["user"]
allowed_approval_policies = [
  { granular = { sandbox_approval = false, rules = true, mcp_elicitations = false, request_permissions = false, skill_approval = true } },
]

# Allow cached search only if your AWS GovCloud Region supports web search.
allowed_web_search_modes = ["disabled", "cached"]

# Remote control: https://learn.chatgpt.com/docs/cli/reference#codex-remote-control
allow_remote_control = false

# Managed hooks: managed-configuration.html#enforce-managed-hooks-from-requirements
allow_managed_hooks_only = true

check_for_update_on_startup = false

# MCP servers, apps, and plugins are disabled by default.
# Admins can enable supported integrations after accepting the risks
# for their use case and configuring access and network controls.
# managed-configuration.html
mcp_servers = {}

[features]
apps = false
plugins = false

# Enable the network proxy for sandboxed commands.
# ../agent-approvals-security.html#network-isolation
network_proxy = true

realtime_conversation = false
image_generation = false

# Memories: ../customization/memories.html
memories = false
external_agent_memory_import = false

# We recommend that users review approval requests themselves.
# Admins can enable automatic review after accepting the risks for their use case.
# ../agent-approvals-security.html#automatic-approval-reviews
guardian_approval = false
guardianv2 = false

# Disable background skill-search experiments.
skill_search = false

# Hooks: ../hooks.html
hooks = false

# If you enable web search, use cached search through Bedrock Mantle
# where supported by your AWS GovCloud Region.
standalone_web_search = false

# Disable feedback submissions to OpenAI.
[feedback]
enabled = false

# Network controls for agent commands:
# managed-configuration.html#configure-network-access-requirements
[experimental_network]
enabled = true
managed_allowed_domains_only = true

# No domains allowed by default. Add destinations approved for your use case.
domains = {}

# Add approved Unix socket paths here.
unix_sockets = {}

# Set to true when using an organization-approved upstream proxy.
allow_upstream_proxy = false

# Keep the command proxy bound to localhost.
dangerously_allow_non_loopback_proxy = false
dangerously_allow_all_unix_sockets = false

# Local/private networking: ../agent-approvals-security.html#local-and-private-destinations
allow_local_binding = false

# Application network controls: ../config-file/config-reference.html#requirementstoml
[application.network]
enabled = true

# Example: Bedrock Mantle in us-gov-west-1.
# Replace this hostname with the Bedrock endpoint configured in config.toml.
[application.network.domains]
"bedrock-mantle.us-gov-west-1.api.aws" = "allow"

# OpenAI and ChatGPT endpoints.
# We recommend denying these endpoints to avoid any risk that user data is sent to commercial OpenAI infrastructure.
"api.openai.com" = "deny"
"chat.openai.com" = "deny"
"chatgpt.com" = "deny"
"ab.chatgpt.com" = "deny"
"platform.openai.com" = "deny"
"auth.openai.com" = "deny"
"gov.api.openai.com" = "deny"
"gov.chatgpt.com" = "deny"
"sdfedpreastus2.oaiusercontent.com" = "deny"
"o33249.ingest.us.sentry.io" = "deny"
"persistent.oaistatic.com" = "deny"
"oaisidekickupdates.blob.core.windows.net" = "deny"

# Windows only: ../config-file/config-reference.html#requirementstoml
[windows]
allowed_sandbox_implementations = ["elevated"]
```


{/* prettier-ignore-end */}

<h2 id="2-configure-the-cli">
  2\. Configure provider routing and network controls
</h2>

Put `config.toml` in `~/.codex/config.toml` on Linux or macOS, or `%USERPROFILE%\.codex\config.toml` on Windows. If you set `CODEX_HOME`, use its `config.toml` instead. Users can change these defaults within the limits set by `requirements.toml`.

<h3 id="cli-recommended-configtoml">
  Recommended `config.toml`
</h3>

The example uses Mantle in `us-gov-west-1`. Replace the model ID and AWS profile with your deployment’s values. For another supported Region or endpoint, update the URL, Region, and network policy together.

Keep AWS credentials outside the TOML file. Keep the AWS profile, credentials, and credential helper scripts outside folders Codex can modify. The CLI uses AWS credentials for this provider; ChatGPT sign-in and an OpenAI API key are not required. See [Bedrock authentication options](../amazon-bedrock.html#authentication-options).

{/* prettier-ignore-start */}

config.toml

```toml
# Replace with your approved Bedrock model ID.
model = "openai.gpt-5.6-terra"
model_provider = "amazon-bedrock"
approval_policy = { granular = { sandbox_approval = false, rules = true, mcp_elicitations = false, request_permissions = false, skill_approval = true } }
sandbox_mode = "workspace-write"

# Set to "cached" only when supported by your model and GovCloud Region
# and approved for your deployment.
# https://docs.aws.amazon.com/bedrock/latest/userguide/web-search.html
web_search = "disabled"

# Example: Bedrock Mantle in us-gov-west-1.
[model_providers.amazon-bedrock]
base_url = "https://bedrock-mantle.us-gov-west-1.api.aws/openai/v1"
wire_api = "responses"
requires_openai_auth = false

[model_providers.amazon-bedrock.aws]
region = "us-gov-west-1"

# Replace with your AWS profile name.
profile = "codex-govcloud"

[sandbox_workspace_write]
# Command destinations are controlled by requirements.toml.
network_access = true

# Disable sending Codex usage analytics to OpenAI.
[analytics]
enabled = false

# OpenTelemetry exports are off by default.
# Admins can configure an approved collector for logs, traces, and metrics.
# ../config-file/config-advanced.html#observability-and-telemetry
[otel]
exporter = "none"
trace_exporter = "none"
metrics_exporter = "none"
log_user_prompt = false
```


{/* prettier-ignore-end */}

<h3 id="cli-apply-network-controls">Apply network controls</h3>

Add approved CLI destinations, including Bedrock, to `application.network.domains`. Add approved command destinations to `experimental_network.domains`. These are separate controls: allowing Bedrock for model requests does not allow agent commands to contact it.

In CLI 0.162.0, interactive sessions and `codex exec` apply `application.network` to Codex’s model and service requests. It does not cover standalone `codex login` or daemon update downloads. Codex’s network settings do not replace your device firewall. Use the firewall to restrict those destinations and credential-helper traffic.

<h2 id="3-verify-the-cli-deployment">3. Verify the deployment</h2>

Start a new CLI process after changing the configuration. From a repository, run:

```shell
codex
```

1. Open `/status` and confirm the model and provider. Check that the configured AWS profile uses the intended credentials.
1. Run an approved workflow with sample data.
1. Confirm that user settings and CLI flags cannot override the managed restrictions.
1. Test invalid or expired credentials and routing failures. Confirm that content is not sent to an unapproved destination.

Also check non-interactive use from a repository:

```shell
codex exec --sandbox read-only "Reply with exactly: bedrock-ok"
```

`codex exec` does not prompt for approval; actions that require approval fail.

Expect `bedrock-ok`. Confirm the provider and model in the CLI output; the reply alone does not identify the route. Follow with an approved workflow that reads a sample file, and repeat the policy checks for `codex exec`.

<h2 id="cli-troubleshooting">Troubleshoot common problems</h2>

| Problem                             | What to check                                                                                                                                                       |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unsupported endpoint                | Confirm with OpenAI that your installed CLI version supports the endpoint and model.                                                                                |
| Wrong AWS account or role           | Check the profile in `model_providers.amazon-bedrock.aws` and its active credentials.                                                                               |
| Restrictions aren’t applied         | Confirm `requirements.toml` is installed on the machine running the CLI, then start a new process.                                                                  |
| A command cannot access the network | Check the active sandbox, `sandbox_workspace_write.network_access`, and the managed command-domain allowlist. The sample allows no command destinations by default. |
| Feature still unavailable           | Check the feature docs for required settings and Bedrock support, then check your network controls.                                                                 |

<h2 id="cli-feature-settings">Feature settings</h2>

Users cannot override feature settings enforced by `requirements.toml`.

The table summarizes the configuration above. **On** means permitted where supported; other permissions and network controls still apply.

For provider support, see [Bedrock feature availability](../amazon-bedrock.html#feature-availability).

| Feature                                                                                 | Default | Notes                                                                                                                        |
| --------------------------------------------------------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Local coding, files, Git, and subagents                                                 | On      | —                                                                                                                            |
| CLI voice                                                                               | Off     | —                                                                                                                            |
| [Memory](../customization/memories.html)                                                 | Off     | —                                                                                                                            |
| [Image generation](../image-generation.html)                                             | Off     | Does not block image inputs or reading existing image files.                                                                 |
| [Web search](../web-search.html)                                                         | Off     | Cached search requires support in your model and GovCloud Region. Command-network rules do not restrict hosted search.       |
| [Apps and plugins](../plugins.html)                                                      | Off     | —                                                                                                                            |
| [Configured MCP servers](managed-configuration.html)                       | Off     | Admins can enable approved servers after accepting the risks for their use case and configuring access and network controls. |
| [Automatic approval review](../agent-approvals-security.html#automatic-approval-reviews) | Off     | —                                                                                                                            |
| [Remote control](../developer-commands.html#codex-remote-control)                             | Off     | —                                                                                                                            |

  

</Tabs>