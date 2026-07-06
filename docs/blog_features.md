# Blog Features & Markdown Syntax Guide

This guide documents the rendering features, interactive options, and supported Markdown syntax of the blog.

---

## 1. Core Blog Features
- **Readability Text Slider**: A professional typography scalar control located in the article action panel. Readers can slide across four custom font-size increments (Small, Medium, Large, Extra Large) to automatically scale paragraphs, blockquotes, lists, and spacing elements uniformly for optimal screen comfort.
- **Cover Images**: Automatically displays cover image banners at the top of the post if a `coverImage` URL is provided.
- **Copy Page**: A "Copy page" button next to the post meta header copies the raw Markdown content of the post to the client's clipboard instantly.
- **On This Page (Table of Contents)**: Automatically generates a right-hand sticky sidebar listing all `##` (h2), `###` (h3), and `####` (h4) headers. Clicking any list item scrolls the page smoothly to the corresponding section.
- **Likes**: Registered and unregistered visitors can like posts. Likes are persistent.
- **Comments Section**: Allows registered visitors to post linear comments below the article. Admins can delete any comment, and authors can delete their own.

---

## 2. Supported Markdown Syntax

The blog uses a zero-dependency, high-performance custom Markdown parser that renders standard GFM (Github Flavored Markdown) components:

### Headings
Headings from level 1 to 4 are supported. The parser automatically generates slugified HTML `id` attributes for header anchors, allowing direct link scrolling.
```markdown
# Heading 1 (Title)
## Heading 2
### Heading 3
#### Heading 4
```

### Text Styling
- **Bold**: `**text**` or `__text__` renders as `<strong class="font-bold text-[var(--text-primary)]">text</strong>`.
- **Italic**: `*text*` or `_text_` renders as `<em class="italic">text</em>`.
- **Strikethrough**: `~~text~~` renders as `<del class="line-through opacity-60">text</del>`.
- **Inline Code**: `` `code` `` renders as `<code class="font-mono text-xs bg-[var(--bg-secondary)] px-1.5 py-0.5 rounded text-[var(--text-primary)]">code</code>`.

### Lists
- **Unordered Lists**: Use `-` or `*` to render standard bullets.
- **Ordered Lists**: Use `1.`, `2.`, etc., to render numbered items.
- **Task Lists**: Supports checkboxes (active/inactive states):
  - `- [ ] Uncompleted task` (displays animated unchecked input)
  - `- [x] Completed task` (displays disabled checked input)

### Tables
GFM tables with align syntax are supported. Cells are styled to fit seamlessly into the site theme:
```markdown
| Feature | Status | Type |
| :--- | :---: | ---: |
| Webhook | Stable | Rich Embed |
| SVGs | Enabled | Inline/Img |
```

### Blockquotes
Use `>` to display quoted paragraphs:
```markdown
> This is a blockquote. It renders with an accent-colored left border and italicized text.
```

### Code Blocks
Fenced code blocks are styled with a dark rounded card block:
```javascript
// Example Code Block
const greet = () => console.log("Hello World!");
```

---

## 3. Advanced HTML & SVG Embedding

The parser preserves safe HTML tags instead of escaping them. This allows you to embed layout containers and vectors directly inside post files:

### Native SVG Rendering
You can paste raw SVG code directly in your markdown, and it will render as a native, interactive vector element:
```html
<svg width="100" height="100" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="40" stroke="green" stroke-width="4" fill="yellow" />
</svg>
```

### Badge Alignments (Flowing Inline)
By default, the stylesheet overrides standard typography behaviors to match GitHub's markdown image flow. Multiple consecutive badge images or icons (like Shields.io tags) flow side-by-side horizontally rather than stacking vertically:
```markdown
![Next.js](https://img.shields.io/badge/Next.js-000000?logo=nextdotjs&logoColor=white) ![Vercel](https://img.shields.io/badge/Vercel-000000?logo=vercel&logoColor=white)
```
