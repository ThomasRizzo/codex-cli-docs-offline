# Help ensure cloud browser access to your site

> For the complete documentation index, see [llms.txt](/llms.txt). Markdown versions of documentation pages are available by appending `.md` to the page URL.

<section id="overview" aria-labelledby="overview-heading">

<h2 id="overview-heading" className="heading-lg not-prose">Reach customers where they decide</h2>

People can ask ChatGPT to visit websites and help them get things done, such as finding a product, comparing options, or filling out a form. Making your site accessible to ChatGPT helps users get information directly from your business and take action using your site.

For some tasks, ChatGPT uses a [browser running on a computer in the cloud](https://help.openai.com/en/articles/20001280-using-cloud-browser-in-chatgpt). This browser lets ChatGPT read pages, click buttons, and interact with your site on a user’s behalf.

</section>

<section className="site-access-section" id="reach-customers" aria-labelledby="reach-heading">

<h2 id="reach-heading" className="heading-lg not-prose">If your site blocks cloud browser visits</h2>

ChatGPT’s cloud browser can already use your site. You don’t need to add it to an allowlist.

However, your security settings may unintentionally block these visits. To address this, configure your CDN or firewall to allow verified ChatGPT browser visits while keeping your other security controls in place.

See the [Web Bot Auth and cloud browser allowlisting guide](https://help.openai.com/en/articles/11845367-chatgpt-works-cloud-browser-allowlisting) for details.




<h3 id="enable-heading">Configure an exception if needed</h3>

If your site blocks verified cloud browser traffic, see the instructions for your CDN or firewall below.

Akamai, Cloudflare, HUMAN, and Vercel verify ChatGPT request signatures automatically.

If you use another provider, follow the manual verification instructions under “Other CDNs and firewalls.”

<button type="button" id="toggle-all" aria-controls="providers">Expand all</button>









<a id="akamai"></a>



## Akamai



Akamai identifies Cloud browser traffic under the existing bot name **ChatGPT Agent** in its **AI Fetchers and Agents** bots category.

To allow this traffic:

1. In your Akamai Security Configuration, open **Shared Resources**.
2. Select **Custom Bot Categories** in the navigation bar.
3. Select the **+** icon to create a new custom bot category.
4. Add a new bot category and save it.
5. Within that new bot category, create a bot with:
   - Type: **Verified Bots**
   - Bot name: **ChatGPT Agent**
6. Close **Shared Resources** and open the relevant **Security Policy**.
7. Select **Bot & Agent Control**, then **Custom Bots**, and set the new category’s action to **Allow**.

Akamai verifies request signatures automatically. No custom signature verification is required.







<a id="cloudflare"></a>



## Cloudflare



##### Option 1: Via AI Crawler and Agent access policies

Cloudflare verifies Cloud browser traffic and shows it as **dots, OpenAI** under **Personal Agents**.

To allow this traffic:

1. In the Cloudflare dashboard, select your domain, then go to **Security** > **Settings**.
2. Filter by **Bot traffic**, then select **AI Crawler and Agent access policies**.
3. Under **Personal Agents**, set **dots, OpenAI** to **Allow (do not block)**.
4. Select **Save**.

##### Option 2: Via WAF custom rules

Cloudflare recognizes Cloud browser traffic as a signed agent in its Bots and Agents directory.

The existing identifiers are:

- Bot tag: `chatgpt-agent`
- Detection ID: `129220581`

To allow this traffic:

1. In the Cloudflare dashboard, open Security → WAF and create a custom rule.
2. Set the rule expression to **Bot Detection ID equals**.
3. Search for **ChatGPT Operator** and select detection ID `129220581`.
4. Configure the rule to allow or skip requests matching this detection ID.
5. Save and deploy the rule.

Cloudflare verifies request signatures automatically. No additional signature verification is required.







<a id="human"></a>



## HUMAN



##### HUMAN Sightline

HUMAN recognizes Cloud browser traffic under the existing bot name **ChatGPT Agent** in Known Bots & Crawlers.

To allow it:

1. In your Sightline or BD console, go to Policies → Traffic Policy Settings → Known bots & Crawlers.
2. Search for **ChatGPT Agent**.
3. Set the rule to **ON** and select **Allow**.

##### HUMAN AgenticTrust

HUMAN AgenticTrust verifies Cloud browser traffic and allows you to manage permissions associated with the existing **ChatGPT Agent** entry.

To update those permissions:

1. In your Sightline console, open Policies → AI Agents Permissions.
2. Search for **ChatGPT Agent**.
3. Review and update the available permissions as needed.

HUMAN verifies request signatures automatically. Its permission settings do not change Cloud browser’s supported capabilities.







<a id="vercel"></a>



## Vercel



If your site is hosted on Vercel and your security rules don’t block cloud browser traffic, no additional configuration is required.

Vercel recognizes this traffic through the existing **ChatGPT Agent** entry, identified as `chatgpt-operator`, and automatically verifies signatures on those requests.

For more information, see [Vercel’s support for Web Bot Auth](https://vercel.com/changelog/vercels-bot-verification-now-supports-web-bot-auth).







<a id="other-cdns"></a>



## Other CDNs and firewalls






<h5 id="message-signatures">How message signatures work</h5>

ChatGPT uses Web Bot Auth to identify certain automated browser requests. This guidance applies to signed cloud browser requests, not web crawlers. Web Bot Auth uses the HTTP Message Signatures standard, [RFC 9421](https://www.rfc-editor.org/rfc/rfc9421.html).

A signed request includes:

- A `Signature` header.
- A `Signature-Input` header.
- A `Signature-Agent` header set to `"https://chatgpt.com"`.

Public keys for verifying these signatures are available at [https://chatgpt.com/.well-known/http-message-signatures-directory](https://chatgpt.com/.well-known/http-message-signatures-directory).

Your CDN, firewall, or edge service can retrieve the public key, validate the signature, and confirm that a request originated from ChatGPT.




If your CDN or firewall does not automatically recognize Cloud browser traffic, you can verify requests directly:

1. Confirm the `Signature-Agent` header exactly matches `"https://chatgpt.com"`, including the quotation marks.
2. Retrieve the corresponding public key from [https://chatgpt.com/.well-known/http-message-signatures-directory](https://chatgpt.com/.well-known/http-message-signatures-directory).
3. Verify the `Signature` and `Signature-Input` headers according to [RFC 9421](https://www.rfc-editor.org/rfc/rfc9421.html).
4. To apply an allowlist exception for signed browser requests, first verify their signatures.











</section>

<section id="faqs" aria-labelledby="faq-heading">

<h2 id="faq-heading" className="heading-xl not-prose">FAQs</h2>




<h3 className="heading-lg not-prose">Safety and security</h3>




#### Can I require that a human confirm certain actions, including checkout?

We don’t yet have features to allow specific site owners to control what actions users can take, but across all our users, we require human review before any consequential action.







#### Can I prevent agents from accessing certain pages or products?

An exception can apply site-wide. Keep your existing page-level access controls in place.







#### Does this affect other bots?

No. An allowlist rule for verified cloud browser visits doesn’t change how your site handles other traffic. These browser visits happen on a user’s behalf and are separate from OpenAI’s web crawlers, including OAI-SearchBot for search. See [OpenAI web crawlers](https://developers.openai.com/api/docs/bots) for crawler-specific controls.










<h3 className="heading-lg not-prose">Technical</h3>




#### How does this relate to product feeds?

Cloud Browser lets ChatGPT securely access websites on a user&#39;s behalf to complete end-to-end tasks for users within the ChatGPT conversation. This functionality is independent of but complementary to commerce feeds. Direct shopping feeds help our models better understand retailers&#39; product inventory for product discovery while computer use via Cloud Browser/Dots helps users take downstream actions directly on partner sites. Websites/merchants do not need to have direct feeds set up with us for verified ChatGPT users to use our Cloud Browser to navigate their sites.







#### How does this relate to plugins?

Cloud Browser lets ChatGPT securely access websites on a user&#39;s behalf to complete end-to-end tasks for users within the ChatGPT conversation. This functionality is independent of but complementary to plugins, which let a user connect directly to your service via MCP. Websites/merchants do not need to have a plugin for verified ChatGPT users to use our Cloud Browser to navigate their sites. That said, a plugin may make it easier and faster for users to engage with your service, and we encourage developers to build and publish plugins.










<h3 className="heading-lg not-prose">Commercial</h3>




#### Who handles payment or order errors?

Customers are ultimately responsible for the actions they take, so any customer service or support should be handled in the same way you would if a customer took the action themselves.







#### How will this impact my relationship with my customers?

Users are increasingly turning to ChatGPT for answers, help making decisions, and help completing tasks. Meeting users and customers where they are is the best way to maintain engagement. Sites that block access may lose users or customers who turn to other sources to make decisions.







</section>