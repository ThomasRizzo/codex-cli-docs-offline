---
name: Getting Started with Daybreak Blue
tagline: Give selected team members access and check that they can use Daybreak
  in Codex.
summary: Daybreak Blue reduces refusals on supported models for authorized
  defensive work. As a ChatGPT Business or Enterprise workspace owner, give
  approved team members access to review internal code in Codex.
bestFor:
  - ChatGPT Business and Enterprise workspace owners rolling out Daybreak Blue
    to an approved group.
  - Security team members checking their workspace access in Codex.
relatedLinks:
  - label: Models and Trusted Access
    url: /docs/cyber-safety
  - label: Run your first security scan
    url: /use-cases/find-vulnerabilities-in-your-code
---

> For the complete documentation index, see [llms.txt](/llms.txt). Markdown versions of documentation pages are available by appending `.md` to the page URL.

## Before you start

If your ChatGPT Business workspace is already approved, go to [ChatGPT Business](#chatgpt-business) to give team members access.

For ChatGPT Enterprise, sign in as a **workspace owner** and open [Workspace status and access](https://chatgpt.com/admin/status-and-access) for the Enterprise workspace your team will use. Look for **Daybreak Blue** under **Trusted Access**.

**What you'll accomplish**

1. [Request workspace access](#request-access-for-your-workspace) if you haven't applied. If Daybreak Blue shows **In review**, wait for OpenAI's welcome email.
2. [Give your team access](#enable-daybreak-for-your-team) when Daybreak Blue shows **Active**.
3. [Check access in Codex](#check-access-in-codex) with a team member you've granted access to. If you've already granted access, start here.

Using an API key for the Responses API or Codex? [Set up an API project](#set-up-an-api-project). If your team uses both ChatGPT sign-in and API keys, complete both setups.

## Request access for your workspace

Follow these steps for a ChatGPT Enterprise workspace.

Gather what you'll need for the application.

- **Business details.** Use the legal name, address, and contact details from your business records. Have a tax or registration number and supporting documents ready if requested.
- **Intended use.** Have the workspace name and ID handy. Describe what your security team does and which defensive workflows it plans to run.
- **Verification contact.** Use an email address the person completing verification can check. Persona may ask for proof they can act for the business. For identity verification, have an original, unexpired physical government-issued photo ID and a device with a camera ready if requested.

In **Trusted Access**, complete any outstanding business verification, then open the Daybreak Blue application. Complete the requested attestations, have an authorized signer accept the terms if prompted, and submit. See the [verification requirements](https://help.openai.com/en/articles/10910291-api-organization-verification) for accepted documents.

If your workspace doesn't show the application, follow the [enterprise onboarding guide](https://help.openai.com/en/articles/20001261-enterprise-daybreak-onboarding). On that path, submit the enterprise intake form first, then follow the verification email from Persona.



![Trusted Access showing Verified for the business and In review for the submitted Daybreak Blue application](<https://developers.openai.com/images/codex/daybreak/daybreak-application-under-review-focused-v3.webp>)



When OpenAI emails you that the workspace is ready, return to **Trusted Access**.



![ChatGPT workspace Trusted Access panel showing business verification as Verified and Daybreak Blue as Active](<https://developers.openai.com/images/codex/daybreak/daybreak-workspace-trusted-access.webp>)



## Enable Daybreak for your team

### ChatGPT Business

In your approved workspace, open [Admin Console → Models](https://chatgpt.com/admin/models). Under **Specialty Models**, find **Daybreak Blue**, choose **Set access**, and select the approved team members who should have access.

The workspace toggle lets you pause access for everyone. When you turn it back on, your individual selections still apply. Once access is on, [check access in Codex](#check-access-in-codex) with an approved member.

### ChatGPT Enterprise

Open [Admin Console → Models](https://chatgpt.com/admin/models) and check **Workspace default → Cybersecurity**. For a new rollout to selected members, leave **Daybreak Blue** off here. If it's already on, first give everyone who should keep access a role that grants it. Then you can turn the default off and select **Save changes**.




1. In the Admin Console, open **Groups & roles**. Choose a custom role used only by approved team members, or create and save a new role for the team.
2. Return to **Models → Roles**. Select **Add role override** and choose your role. If it already has an override, open its **⋯** menu and select **Edit override**.
3. Under **Cybersecurity**, set **Daybreak Blue** to **On**. Under **Models**, enable the model your team will use, such as **6 Sol** for GPT-6 Sol. Select **Save changes**.
4. Return to **Groups & roles** and assign the custom role to the approved group. For direct member assignments or the **Permissions & roles** layout in workspace settings, follow the [role assignment instructions](https://help.openai.com/en/articles/11750701-managing-feature-access-with-role-based-access-control-in-chatgpt).






![Models settings with the Roles tab selected and the Edit override menu open for an example role named Daybreak](<https://developers.openai.com/images/codex/daybreak/daybreak-models-roles.webp>)





![Role editor showing 6.1 Sol, 6 Sol, and 6 Luna set to On under Models and Daybreak Blue set to On under Cybersecurity](<https://developers.openai.com/images/codex/daybreak/daybreak-role-override.webp>)



Reopen the role in **Models → Roles** and confirm that you saved both Daybreak Blue and the model you chose. In **Groups & roles**, check who has the role, including through group membership. For someone outside the rollout, check whether any of their other roles grant Daybreak Blue. Allow about 10 minutes for changes to take effect before a team member checks access in Codex.

For other rollout options, see the [team setup guide](https://help.openai.com/en/articles/20001531-openai-daybreak-set-up-access-for-your-team).

## Check access in Codex

Have an approved team member open the [ChatGPT desktop app](https://developers.openai.com/docs/app), sign in with their ChatGPT account, and select the approved workspace. Have them open **Codex**, start a chat, and open the model menu below the message box.

In that menu, turn **Daybreak** on and select the model the owner enabled. **GPT-6 Sol** supports reduced refusals with Blue. For another model, check the [Daybreak model support table](https://help.openai.com/en/articles/20001258-openai-daybreak-trusted-access-for-cyber-overview).



![Codex model menu with Daybreak on and a checkmark beside GPT-6 Sol](<https://developers.openai.com/images/codex/daybreak/daybreak-model-picker-v2.webp>)



Have the member try a small task in that chat, such as “Suggest two tests for a patch that rejects expired session tokens.” Check that the chat returns a reply without a model access error.

If the toggle or model is missing, ask the member to refresh the app and check which workspace they're using. In ChatGPT Business, check the workspace toggle and the member’s selection under **Set access**. In ChatGPT Enterprise, confirm that the member has the intended role, directly or through their group. For that role, reopen the override in **Models → Roles** and check its Daybreak Blue and model settings. For access errors, see [Daybreak troubleshooting](https://help.openai.com/en/articles/20001259-troubleshooting-openai-daybreak).

## Run your first security scan

To review code with the team, follow [Run your first security scan](https://developers.openai.com/use-cases/find-vulnerabilities-in-your-code). Start with one repository the team owns or has permission to assess.

## Set up an API project

Workspace access settings apply to people who sign in with ChatGPT. For API keys, an **API organization owner** enables Daybreak Blue separately for each project that needs it.

1. **Confirm which organization is approved.** Open [Organization status and access](https://platform.openai.com/settings/organization/status-and-access) in the API Platform and check your Daybreak approval email for the intended API organization. If the email only names your ChatGPT workspace, ask your OpenAI account team to confirm API access before proceeding.
2. **Enable Blue for the project.** In the approved organization, choose or create a **non-default project** for your team's internal security work. Open **Project settings → General → Daybreak model access**, turn on **Daybreak Blue**, and select **Save**. Add the approved users to the project and allow up to 15 minutes for the change to take effect.
3. **Check that a request uses Blue.** Have a project member use an API key from that project to send a Responses API request with an approved model such as `gpt-6-sol` and `access_programs.cyber` set to `daybreak_blue`. When the response includes that field, its value should be `daybreak_blue`. The [Responses API guide](https://developers.openai.com/api/docs/guides/daybreak#send-a-request) has a request you can copy.

If your team uses a command-line client, follow the instructions for [Codex CLI](https://github.com/openai/codex-security/blob/main/sdk/typescript/docs/cli.md#daybreak-opt-in) or [Codex Security CLI](https://github.com/openai/codex-security/blob/main/sdk/typescript/docs/cli.md#select-a-cyber-access-program). For personal access, use the [individual application](https://chatgpt.com/cyber).