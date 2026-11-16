---
name: Fill out an expense report
tagline: Let ChatGPT fill in your expense report from your receipts.
summary: Use Computer Use to enter expenses and upload receipts in a browser or
  desktop app. Review the completed report before submitting it.
bestFor:
  - A work trip with a few receipts to enter in a reimbursement form.
  - Expense reports you normally fill in by hand in a website or desktop app.
starterPrompt:
  title: Fill in my expense form
  body: >-
    Use Computer Use to fill in the expense report I have open in [app or
    website]. Find my receipts [attached to this chat, in a connected drive, or
    in a folder on my computer]. Enter the date, merchant, total, and currency
    for each expense. Match existing expenses where possible and upload each
    receipt if required.


    Pick a category from the form when the receipt makes it clear. Ask me about
    anything missing, including any required business purpose. Leave the
    filled-in form open for me to review. Do not submit it.
relatedLinks:
  - label: Using your computer and browser
    url: /training/walkthroughs/using-your-computer-and-browser
  - label: Computer Use
    url: /docs/computer-use
---

> For the complete documentation index, see [llms.txt](/llms.txt). Markdown versions of documentation pages are available by appending `.md` to the page URL.

After a work trip, you might have a few expenses you need to manually reconcile. ChatGPT can use your computer to fill in your expense report based on your receipts.

## Open the form and add your receipts

1. Open your expense report in a browser or desktop app and sign in if needed. Enable [Computer Use](https://developers.openai.com/docs/computer-use) in the ChatGPT desktop app if you haven't already.
2. Attach receipts to your ChatGPT thread, use a [drive plugin such as Google Drive](https://developers.openai.com/docs/plugins) to find them, or point ChatGPT to a folder on your computer. Grant access if prompted.
3. Update the starter prompt with the app or website you use and where to find your receipts. Include the business purpose if your form requires one. Ask ChatGPT to use Computer Use to fill in the report and upload the receipts, and approve access when prompted.

If your expense report requires supporting files, ChatGPT can automatically upload your receipts and attach them to the matching expenses.

## Review the filled-in report

Review the amounts, expense categories, and attached receipts before submitting the report. If anything is missing or incorrect, continue in the same thread and ask ChatGPT to fix it. You can provide any remaining details, such as a business purpose, and have ChatGPT update the report for you.