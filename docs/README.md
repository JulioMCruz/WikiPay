# zkWiki Example Articles

This directory contains example articles for testing the zkWiki anonymous publishing system.

## Available Examples

### 1. X402 Article (Detailed)
**File:** `x402-article.md`
- **Topic:** Cross-chain interoperability protocol
- **Length:** ~8 minute read, ~1,200 words
- **Price:** $0.05
- **Use Case:** Testing full-featured article publishing with comprehensive content

### 2. Quick Test Article
**File:** `quick-test-article.md`
- **Topic:** zkWiki system overview
- **Length:** ~2 minute read, ~200 words
- **Price:** $0.01
- **Use Case:** Quick testing of publish/unlock flow

## How to Use

### Option 1: Load from UI
1. Navigate to http://localhost:3000/publish
2. Click one of the example buttons:
   - "📝 X402 Article (Detailed)"
   - "⚡ Quick Test (Short)"
3. The form will auto-populate with the example content
4. Click "Publish to Blockchain"

### Option 2: Manual Copy/Paste
1. Open one of the markdown files
2. Copy the content sections:
   - **Title:** First heading (# Title)
   - **Preview:** Content under "Preview" section
   - **Full Article:** Content under "Full Article" section
   - **Price:** Listed at the top
3. Paste into the publish form at http://localhost:3000/publish

## Article Structure

Each article follows this format:

```markdown
# Article Title

**Price:** $X.XX
**Category:** Category Name
**Reading Time:** X minutes

---

## Preview
[Preview text visible to all readers - 2-3 sentences]

---

## Full Article
[Full content only visible after payment]
```

## Creating Your Own Examples

To add new example articles:

1. Create a new `.md` file in this directory
2. Follow the structure above
3. Add metadata at the top (price, category, reading time)
4. Write a compelling preview (readers see this before paying)
5. Write the full article content
6. (Optional) Add the example to the UI buttons in `frontend/src/app/publish/page.tsx`

## Testing Workflow

1. **Publish:** Use example articles to test the publishing flow
2. **Browse:** View published articles on the home page
3. **Unlock:** Test anonymous payment and content unlocking
4. **Earn:** Verify creator receives payment

## Tips

- Keep preview text engaging (2-3 sentences)
- Preview should entice readers without giving away everything
- Full article should deliver value worth the price
- Use markdown formatting for better readability
- Include disclaimers where appropriate

---

**Happy Testing!** 🚀
