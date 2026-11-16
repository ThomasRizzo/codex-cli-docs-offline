# Partner Playbook Overview

> For the complete documentation index, see [llms.txt](/llms.txt). Markdown versions of documentation pages are available by appending `.md` to the page URL.

## How commerce works in ChatGPT

1. **The customer describes what they need.** For example, “Find a carry-on that fits under the seat.”
2. **ChatGPT looks for relevant options.** Sources depend on the request and available integrations. ChatGPT can use information from the public web, private API integrations, and, for retail, merchant product feeds.
3. **The customer compares offerings.** They can choose an offer, a time, or another available option and decide whether to buy or book.
4. **The journey moves to browser use or a plugin.** Browser use follows your existing website flow and does not require a significant engineering lift. A plugin takes more integration work but lets you expose structured actions and control how your backend validates and executes them. [Intelligent UI](https://openai.com/index/gpt-6-for-everyone/) can present information and actions in the conversation. Sign in with ChatGPT and ChatGPT Wallet can support account and payment steps where available.



> Illustration: A customer describes what they need, then finds and compares options. Where supported, browser use or a plugin can help complete a purchase or booking. Account and payment steps depend on the transaction. The business confirms the result.



## Support the commerce journey

<ol className="not-prose my-6 grid list-none gap-3 p-0">
  <li>
    [Submit product feeds (applicable if you sell physical goods)](https://developers.openai.com/commerce/guides/submit-product-feeds)

Enhance the search index with a current feed of products, images, prices, and availability.


  </li>
  <li>
    [Help ensure cloud browser access](https://developers.openai.com/commerce/guides/enable-browser-access)

Check whether your CDN or firewall blocks verified ChatGPT browser visits.


  </li>
  <li>
    [Accept payments](https://developers.openai.com/commerce/guides/accept-payments)

Accept ChatGPT Wallet payments on your existing website.


  </li>
  <li>
    [Build a plugin](https://developers.openai.com/commerce/guides/build-a-plugin)

Expose supported actions, such as checking availability or preparing a purchase or booking, as structured tools.


  </li>
  <li>
    [Integrate Sign in with ChatGPT](https://developers.openai.com/commerce/guides/integrate-sign-in-with-chatgpt)

Let customers sign in with ChatGPT when your website or checkout requires an account.


  </li>
  <li>
    [Claim your business](https://developers.openai.com/commerce/guides/create-business-profile)

Claim your business and manage its Business Profile through Business Hub.


  </li>
</ol>