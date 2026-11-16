# Submit product feeds

> For the complete documentation index, see [llms.txt](/llms.txt). Markdown versions of documentation pages are available by appending `.md` to the page URL.

## How it works

ChatGPT can use product feeds and other available retail and public web sources for product discovery. A feed supplies structured catalog data. Browser use is a separate capability that lets ChatGPT visit your site on a customer’s behalf, including to take actions. Configure manual upload, a hosted URL, or SFTP in the merchant portal to deliver full snapshots. The feed does not update a cart or confirm a purchase. Your live website or plugin still checks the current offer when a customer acts.

## Implementation steps

Use this sequence to set up your product feed:

- Businesses can start in [Business Hub](https://chatgpt.com/business-hub/).
  - If you have an Ads account or are working with an OpenAI account manager, your workspace admin should have received a personal claim link.

  - If you have not already claimed your business, follow the instructions outlined [here](https://openai.com/business/businesses-in-chatgpt/). You can find the claim for your business application at the bottom of the page.

- Navigate to the product section of the business hub and choose to verify your identity. This is a requirement to be able to upload your products.

- Once your identity has been verified, return to the product section of the business hub and click to upload products.

- Choose the countries and currencies where you sell your products.

- Prepare your feed. Follow the [product feed schema](https://developers.openai.com/commerce/specs/file-upload/products), include the required fields in every record, and keep `item_id` values stable.

- Choose one delivery method. Follow the file upload guide for manual upload, a hosted HTTPS URL, or SFTP. Review the upload and correct any errors.