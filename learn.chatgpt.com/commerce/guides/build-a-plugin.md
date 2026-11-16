# Build a plugin

> For the complete documentation index, see [llms.txt](/llms.txt). Markdown versions of documentation pages are available by appending `.md` to the page URL.

If you have the engineering resources, the next step is to build a plugin (MCP server plus skills). A plugin lets ChatGPT call your services directly instead of navigating pages and forms in a browser.

Direct tools offer the following advantages over browser access:

- **Reliability:** structured inputs and results avoid dependence on page layout, button placement, and browser state.
- **Persistent authentication:** an authorized connection can carry customer access between interactions, subject to token expiry, revocation, and your account policies.
- **Latency:** one tool call can replace several page loads and browser interactions. Measure your actual end-to-end flow; a plugin is not automatically faster.

Start with the [general plugin documentation](https://developers.openai.com/plugins) for setup, hosting, authentication, and submission. This chapter explains how to design commerce tools.

## How it works

Build a headless plugin (iframe-based MCP UI is not supported in Dots and is not the recommended path for commerce integrations). Expose structured tools without requiring a merchant-built iframe for each action. ChatGPT can present the results in conversation or [Intelligent UI](https://openai.com/index/gpt-6-for-everyone/). Your MCP server owns availability, pricing, transaction state, and confirmation. For example, a restaurant can expose available reservation times, a ticket seller can expose seat availability, and a retailer can expose product variants and cart updates. Implement the actions your integration supports.

For retail, the table shows how product lookup, cart tools, checkout, and order history can work together. Booking flows may instead look up a date, time, location, or party size and hand off to your site when needed. These examples are not mandatory tool names or a universal schema:

| Tool group                                       | What it should do                                                                                                              | What it should return                                                                                  |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| **Product lookup**                               | Look up an exact merchant product, offer, and variant; check location-dependent availability where needed.                     | Stable item IDs, current price, availability, images, and fulfillment choices.                         |
| **Cart manipulation**                            | Create and read a cart; add or remove items and change quantities.                                                             | A persistent cart ID, current line items, totals where available, and clear error messages.            |
| **Checkout, when supported**                     | Set delivery and customer details, prepare checkout, and complete an approved purchase or return a checkout handoff.           | The current total and required steps, followed by a continuation URL or a confirmed order result.      |
| **Order history and reordering, when supported** | Let signed-in customers find products they previously bought from your business and add available items to their current cart. | Matching past items and the result of adding each selected item at its current price and availability. |

Design supported plugin checkouts so customers can complete a purchase or booking without leaving the conversation. If the plugin can’t complete a required step, return a browser handoff URL (`continue_url`) so the customer can continue checkout on your website.

## Support retail discovery and carts without customer sign-in

Make product lookup and cart creation, retrieval, and updates available in **guest mode**, without requiring the customer to sign in to your merchant account. Customers should be able to discover products and build a cart before being asked to sign in. Preserve that cart when they sign in at checkout.

Guest access means customers can use these tools without signing in. If you still require server-to-server authentication, OpenAI supports [mutual TLS (mTLS) for MCP servers](https://developers.openai.com/plugins/build/auth#mutual-tls-mtls). ChatGPT presents an OpenAI-managed client certificate that your MCP server can verify.

## Retail sample tool schemas

The model can work with different tool names and schemas. The examples below use a physical retail product to illustrate tool inputs and outputs; they don't define a required contract. Fields, supported actions, authentication, and checkout behavior depend on your integration. All values are illustrative.

### Look up a product

Your MCP server should have a lookup tool that answers a concrete question: **Can this customer buy this exact product, in this variant, at this price, in their ZIP code?** Accept the ZIP code in the request and return availability for that ZIP code instead of generic nationwide availability.

Return the following information together so the model can compare options and build the right cart:

| Information                          | What to include                                                                                                                                                                                            |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Product and offer identity**       | Stable product, selected variant/SKU, and seller-offer identifiers; title, description, and product URL. Keep a variant ID separate from an offer ID when different sellers can sell the same item.        |
| **Location and price**               | The ZIP code used for the lookup, current price and currency for the selected offer, and each variant's price. Include a previous price or promotion only when applicable.                                 |
| **Availability**                     | Availability for the requested location, not just catalog presence. Distinguish in stock, out of stock, unavailable in this location, and unknown.                                                         |
| **Variants**                         | Each option's stable item/SKU identifier, option values such as color and size, price, availability, and image URLs. Identify the selected variant. State when the variant list is incomplete.             |
| **Product images**                   | Usable image URLs for the product **and each variant**, with alt text when available. Do not make the model infer the selected color from a generic product image.                                         |
| **Checkout eligibility**             | Whether the selected offer can be bought through this integration. If not, return a reason and a supported alternative where available. Being in stock does not necessarily mean an offer is checkoutable. |
| **Seller, fulfillment, and returns** | When available, identify the seller and return policy, and list shipping, delivery, or pickup availability for the requested location. Include costs or estimates only when known, and label estimates.    |

The core example below covers price and availability for the requested ZIP code, variants, and per-variant images. Include seller, fulfillment, returns, and freshness information when your service supports it.

```json snippet=reference reason="Illustrative merchant-defined tool request and response data, not an executable program."
{
  "tool": "get_product_details",
  "input": {
    "item_id": "backpack-green",
    "offer_id": "offer-green-123",
    "zip_code": "10004"
  },
  "output": {
    "product_id": "everyday-backpack",
    "item_id": "backpack-green",
    "sku": "BAG-GREEN-STD",
    "offer_id": "offer-green-123",
    "title": "Everyday backpack",
    "description": "A lightweight backpack with a padded laptop compartment.",
    "url": "https://shop.example.com/products/backpack-green",
    "location": { "zip_code": "10004", "country": "US" },
    "selected_options": { "color": "green", "size": "standard" },
    "price": { "amount": "68.00", "currency": "USD" },
    "availability": {
      "status": "in_stock",
      "basis": "requested_zip_code",
      "message": "Shipping is available to 10004."
    },
    "images": [
      {
        "url": "https://shop.example.com/images/backpack-green-front.jpg",
        "alt": "Green backpack, front view"
      },
      {
        "url": "https://shop.example.com/images/backpack-green-inside.jpg",
        "alt": "Inside the green backpack"
      }
    ],
    "variants": [
      {
        "item_id": "backpack-green",
        "sku": "BAG-GREEN-STD",
        "offer_id": "offer-green-123",
        "options": { "color": "green", "size": "standard" },
        "price": { "amount": "68.00", "currency": "USD" },
        "availability": { "status": "in_stock", "zip_code": "10004" },
        "images": [
          {
            "url": "https://shop.example.com/images/backpack-green-front.jpg",
            "alt": "Green backpack"
          }
        ],
        "checkoutable": true
      },
      {
        "item_id": "backpack-blue",
        "sku": "BAG-BLUE-STD",
        "offer_id": "offer-blue-456",
        "options": { "color": "blue", "size": "standard" },
        "price": { "amount": "72.00", "currency": "USD" },
        "availability": { "status": "out_of_stock", "zip_code": "10004" },
        "images": [
          {
            "url": "https://shop.example.com/images/backpack-blue-front.jpg",
            "alt": "Blue backpack"
          }
        ],
        "checkoutable": false,
        "checkoutability_reason": "No stock available for the requested location."
      }
    ],
    "variants_complete": true,
    "seller": { "id": "merchant-123", "name": "Example Store" },
    "fulfillment_options": [
      {
        "type": "shipping",
        "available": true,
        "estimated_cost": { "amount": "5.00", "currency": "USD" },
        "estimate_requires_full_address": true
      },
      {
        "type": "pickup",
        "available": false,
        "reason": "No pickup location available for this ZIP code."
      }
    ],
    "returns": {
      "returnable": true,
      "policy_summary": "Unused items may be returned within 30 days; exclusions apply.",
      "policy_url": "https://shop.example.com/returns"
    },
    "checkoutable": true,
    "checked_at": "2026-11-04T18:00:00Z",
    "messages": []
  }
}
```

### Create, read, and update a cart

Your MCP server should also expose tools to create, retrieve, and update carts. Return a stable cart ID and the resulting line items. In this example, an update replaces the cart's line-item list with the desired list; it does not add items incrementally. An empty list clears the cart in this illustrative contract.

```json snippet=reference reason="Illustrative merchant-defined tool request and response data, not an executable program."
{
  "tool": "update_cart",
  "input": {
    "cart_id": "cart_example",
    "line_items": [{ "item_id": "backpack-green", "quantity": 1 }]
  },
  "output": {
    "cart_id": "cart_example",
    "line_items": [{ "item_id": "backpack-green", "quantity": 1 }],
    "errors": []
  }
}
```

If your API uses separate add, remove, and quantity-change tools instead, keep those semantics explicit. Return rejected changes and current cart state rather than an ambiguous success message.

### Prepare checkout or return a handoff

The third group of tools your MCP server should expose handles checkout. The reference shape below follows the cart-and-checkout proposal: a checkout has line items, currency, totals, a status, fulfillment, and messages that explain the next step. Use `get_checkout` to read its state and `update_checkout` to change contact, delivery, or payment choices.

```json snippet=reference reason="Illustrative merchant-defined tool request and response data, not an executable program."
{
  "tool": "create_checkout",
  "input": {
    "checkout": { "cart_id": "cart_example", "line_items": [] }
  },
  "output": {
    "id": "checkout_example",
    "line_items": [
      {
        "id": "line_1",
        "item": {
          "id": "backpack-green",
          "title": "Everyday backpack",
          "price": 6800
        },
        "quantity": 1,
        "totals": [{ "type": "subtotal", "amount": 6800 }]
      }
    ],
    "currency": "USD",
    "status": "requires_escalation",
    "totals": [
      { "type": "subtotal", "amount": 6800 },
      { "type": "fulfillment", "amount": 500 },
      { "type": "total", "amount": 7300 }
    ],
    "messages": [
      {
        "type": "error",
        "code": "shipping_address_required",
        "severity": "requires_buyer_input",
        "path": "fulfillment.methods[0].destinations",
        "content": "Choose a shipping address to confirm delivery and the final total."
      }
    ],
    "links": [],
    "continue_url": "https://shop.example.com/checkout/example"
  }
}
```

Return `continue_url` from your start-checkout tool (such as `create_checkout`) so checkout can continue in a browser if plugin checkout fails or cannot complete a required cart or checkout step. Ideally, this is a short-lived, one-time authenticated magic link that opens the same cart and checkout session without requiring the customer to start again. A regular checkout URL does not automatically provide that authentication or continuity. The model can adapt to different names; make the next action clear.

### Complete checkout when supported

If you support direct plugin checkout, assume customers will need to sign in or, for guest checkout, enter all their information from scratch. We’re still working on the interaction patterns between third-party plugins and ChatGPT Wallet.

### Look up past items and add them to a cart

If you support reordering, let a signed-in customer find an item they previously bought from your business and add it to their current cart. Use the authenticated account from server-side context. Don't accept a customer ID from the tool caller to select an account.

| Operation               | Direction   | Field and type                                                                   | Required     | Meaning                                                                                                                                                         |
| ----------------------- | ----------- | -------------------------------------------------------------------------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `find_past_items`       | Input       | `query` (string)                                                                 | Yes          | A product description, for example, “green backpack.”                                                                                                           |
| `find_past_items`       | Output      | `items` (array of objects)                                                       | Yes          | Matching items from the customer's orders with your business. Return an empty array if none match.                                                              |
| `find_past_items`       | Output item | `order_ref`, `past_item_ref`, `name` (strings)                                   | Yes          | Opaque references to the order and past line item, and the item name.                                                                                           |
| `find_past_items`       | Output item | `variant` (string), `current_offer` (object)                                     | No           | Return the variant when available. If you look up a current offer, include `amount` (integer in minor units), `currency` (string), and `availability` (string). |
| `add_past_item_to_cart` | Input       | `cart_id`, `order_ref`, `past_item_ref` (strings), `quantity` (positive integer) | Yes          | Identify the cart, the past order line, and how many items to add.                                                                                              |
| `add_past_item_to_cart` | Output      | `status` (string)                                                                | Yes          | Return `added` only after updating the cart. Otherwise, return `not_added`.                                                                                     |
| `add_past_item_to_cart` | Output      | `item_id` (string), `current_offer`, `cart` (objects)                            | If added     | Return the resolved current item ID, the price and availability checked for the cart, and the updated cart.                                                     |
| `add_past_item_to_cart` | Output      | `message` (string)                                                               | If not added | Explain why the cart didn't change, without exposing another account's information.                                                                             |

For example, a customer asks to add the green backpack they bought last spring to their cart. Return the matching item with an `order_ref` such as `ord_a7f2` and a `past_item_ref` such as `line_c19e`. Before updating the cart, verify that the authenticated customer owns the order and may update the cart, and that the past item belongs to the order from your business. Resolve the past item to its current variant, then recheck price and availability. If it isn't available, leave the cart unchanged and explain why.

Reuse your cart tools once you've resolved the current `item_id`. If your cart tool replaces line items, preserve existing items when adding the selected item.

## Resources

- [Plan your tools](https://developers.openai.com/plugins/plan/tools)
- [Build an MCP server](https://developers.openai.com/plugins/build/mcp-server)
- [Configure plugin authentication](https://developers.openai.com/plugins/build/auth)
- [Submit your plugin](https://developers.openai.com/plugins/deploy/submission)

## Next step

Continue to [Integrate Sign in with ChatGPT](https://developers.openai.com/commerce/guides/integrate-sign-in-with-chatgpt).