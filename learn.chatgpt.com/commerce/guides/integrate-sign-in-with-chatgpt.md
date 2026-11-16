# Integrate Sign in with ChatGPT

> For the complete documentation index, see [llms.txt](/llms.txt). Markdown versions of documentation pages are available by appending `.md` to the page URL.

If your website or checkout requires customers to log in, let them [sign in with ChatGPT](https://developers.openai.com/siwc/quickstart). We strongly recommend Sign in with ChatGPT for commerce integrations, especially when customers need to stay signed in across visits or identify themselves for checkout, order tracking, refunds, or discounts.

## How it works

When the customer is prompted to log in to the plugin, they can choose Continue with ChatGPT and complete the supported sign-in flow. Your application verifies the identity token, creates or links the appropriate merchant account, and starts its own session. Account creation is still subject to your business rules and the customer's consent; a ChatGPT identity is not purchase approval. You are responsible for providing relevant notices and obtaining relevant consents for the identity data you receive.

## Before you begin

Sign in with ChatGPT is available to select commercial partners. To request allowlisting, email [siwc-partners-inbox@openai.com](mailto:siwc-partners-inbox@openai.com) and say that you’re a commerce partner. For an identity-only integration, you can complete setup yourself after OpenAI allowlists you. Submit your client for manual review before it can go live.

## Implementation steps

1. Follow the [website integration guide](https://developers.openai.com/siwc/website) for website sign-in and the [plugin integration guide](https://developers.openai.com/siwc/chatgpt-plugin) for plugin sign-in. Complete both so authentication carries across plugins and the cloud browser.
2. Let returning customers link an existing merchant account without creating a duplicate. Reuse an authenticated session where supported so customers don't have to sign in or verify their identity again unnecessarily. Follow the [account-linking policy](https://developers.openai.com/siwc/website#7-find-create-or-link-the-local-account): an email match alone does not prove account ownership.
3. Keep merchant-account permissions and checkout approval separate from identity verification.

Use the [quickstart](https://developers.openai.com/siwc/quickstart) and [client registration guide](https://developers.openai.com/siwc/request-client-id) for the current setup requirements and protocol details.

## Test before launch

Test sign-in for new and returning customers, account linking, denied consent, expired sessions, and revoked access. Confirm that the right merchant account and cart survive the sign-in flow.

## Resources

- [Sign in with ChatGPT quickstart](https://developers.openai.com/siwc/quickstart)
- [Website integration](https://developers.openai.com/siwc/website)
- [Plugin integration](https://developers.openai.com/siwc/chatgpt-plugin)
- [UI and branding guidelines](https://developers.openai.com/siwc/ui-ux-guidelines)

## Next step

Continue to [Claim your business](https://developers.openai.com/commerce/guides/create-business-profile).