# Accept payments

> For the complete documentation index, see [llms.txt](/llms.txt). Markdown versions of documentation pages are available by appending `.md` to the page URL.

Customers can use ChatGPT Wallet to pay on your website or use an existing saved payment method. The customer reviews and approves the purchase in ChatGPT, and your checkout processes the payment. Your business handles the order, fulfillment, customer support, and fraud decisions.

## Accept payments on your website

ChatGPT Wallet works out of the box with existing checkout pages and payment forms. No Wallet-specific integration is required. The guidance below and [Help ensure cloud browser access](https://developers.openai.com/commerce/guides/enable-browser-access) checks are optional steps that can help ensure Wallet works smoothly on your site.

## Handling risk

Risk systems are often tuned to detect bots and rely on observed signals like IP addresses or details about the connected browser. ChatGPT’s cloud browser can set off these systems by accident and cause purchases to fail.

That’s why OpenAI is rolling out support for relaying user signals through the Forwarded HTTP header. If you use a third party risk provider, contact them to ensure your configuration properly ingests these new signals. If you have your own risk systems, start observing the Forwarded header. The signals you receive may vary as we roll out support for every site.

Below are the parameters that may be included in the header:

| Parameter Name | Description                                                                                 | Example Values                               |
| -------------- | ------------------------------------------------------------------------------------------- | -------------------------------------------- |
| `asn`          | Origin autonomous system (AS) number for the route to the IP address observed for the user. | 64496<br />64497                             |
| `for`          | IP address observed for the ChatGPT user.                                                   | 198.51.100.23<br />"[2001:db8::23]"          |
| `ip-country`   | Two-letter country code estimated from the IP address observed for the user.                | CA<br />US                                   |
| `ip-prefix`    | Masked network prefix of the IP address observed for the user, in CIDR notation.            | "192.0.2.0/24"<br />"2001:db8:1234::/48"     |
| `locale`       | The user’s configured locale, expressed as a language tag.                                  | en-GB<br />en-US                             |
| `tz`           | The user’s configured time zone, expressed as an IANA time zone identifier.                 | "Europe/London"<br />"America/Los_Angeles"   |
| `user-agent`   | Name of the user’s browser or app, with optional version and operating system details.      | "ExampleBrowser/130"<br />"ExampleApp (iOS)" |

### Example Forwarded headers

#### Geographic eligibility

```text
Forwarded: ip-country=CA
```

#### Local formatting and scheduling

```text
Forwarded: locale=en-GB;tz="Europe/London"
```

#### Fraud risk assessment

```text
Forwarded: asn=64496;ip-prefix="192.0.2.0/24";user-agent="Example/130"
```

## Common questions

_Can I use this for a subscription?_

Yes, if your existing checkout supports recurring billing. Get the customer’s consent for recurring charges and follow your payment processor’s best practices for merchant-initiated transactions.

_Can I use this for another purchase?_

No. The customer consents only to the specific transaction. Don’t reuse or save that payment credential for a separate purchase.

_Do I receive the full card number?_

No. You receive a network token instead. Use the Payment Account Reference (PAR) to associate the token with the underlying payment account.

_Can I keep using a card already saved with my business?_

Yes. ChatGPT Wallet is a separate payment option. You can keep using your existing authorized card-on-file flow.

## Next step

Continue to [Build a plugin](https://developers.openai.com/commerce/guides/build-a-plugin).