function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/<[^>]*>/g, "") // Strip raw HTML tags if any
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

/**
 * A lightweight, zero-dependency Markdown to HTML parser.
 * Supports: Headings, Bold, Italic, Strikethrough, Code Blocks, Inline Code,
 * Blockquotes, Lists (unordered, ordered, checklists), Tables, Images, and Links.
 */
export function parseMarkdown(markdown: string): string {
  if (!markdown) return "";

  // 1. Extract safe HTML/SVG tags into placeholders
  const placeholders: string[] = [];
  let htmlPreserved = markdown;

  // Regexes to match safe HTML/SVG elements individually to avoid nested parsing issues
  const tagNames = [
    "p", "div", "span", "strong", "em", "code", "pre", "br", "img", "hr", "a",
    "h1", "h2", "h3", "h4", "h5", "h6",
    "svg", "path", "g", "defs", "linearGradient", "stop", "rect", "circle", "ellipse", "line", "polyline", "polygon", "text", "tspan"
  ].join("|");

  const safeTagsRegex = new RegExp(
    `</?(?:${tagNames})\\b(?:\\s+[a-zA-Z0-9:-]+(?:=(?:"[^"]*"|'[^']*'|[^\\s>]+))?)*\\s*/?>`,
    "gi"
  );

  htmlPreserved = htmlPreserved.replace(safeTagsRegex, (match) => {
    // Basic security filter to prevent event handler injection (onmouseover, onerror etc)
    if (/on[a-z]+\s*=/i.test(match) || /javascript:/i.test(match)) {
      return ""; // Strip dangerous attributes
    }
    placeholders.push(match);
    // DO NOT use underscores in placeholder names to avoid matching italic rules
    return `\uFFFCHTMLPLACEHOLDER${placeholders.length - 1}\uFFFC`;
  });

  // Escape any remaining `<` and `>` (which are unsafe or unparsed text)
  let html = htmlPreserved
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Track state
  let inCodeBlock = false;
  let codeLang = "";
  let codeContent: string[] = [];
  let inTable = false;
  
  const lines = html.split("\n");
  const processedLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Handle Code Blocks
    if (trimmed.startsWith("```")) {
      if (inCodeBlock) {
        // End of code block
        inCodeBlock = false;
        const codeJoined = codeContent.join("\n");
        processedLines.push(
          `<pre class="my-4 overflow-x-auto rounded-lg bg-[var(--bg-secondary)] p-4 border border-[var(--card-border)]"><code class="font-mono text-xs text-[var(--text-primary)] language-${codeLang}">${codeJoined}</code></pre>`
        );
        codeContent = [];
        codeLang = "";
      } else {
        // Start of code block
        inCodeBlock = true;
        codeLang = trimmed.substring(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeContent.push(line);
      continue;
    }

    // Handle Tables
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      const isSeparator = /^[|\s:-]+$/.test(trimmed);
      if (isSeparator) {
        inTable = true;
        continue;
      }

      // Inline replacement on the cells first
      const cells = trimmed.split("|").slice(1, -1).map(c => replaceInlineMarkdown(c.trim()));
      if (!inTable) {
        inTable = true;
        const ths = cells.map(c => `<th class="border border-[var(--card-border)] px-4 py-2 font-bold bg-[var(--bg-secondary)] text-left">${c}</th>`).join("");
        processedLines.push(`<table class="w-full border-collapse border border-[var(--card-border)] my-4 text-xs sm:text-sm"><thead><tr>${ths}</tr></thead><tbody>`);
      } else {
        const tds = cells.map(c => `<td class="border border-[var(--card-border)] px-4 py-2 text-[var(--text-secondary)]">${c}</td>`).join("");
        processedLines.push(`<tr>${tds}</tr>`);
      }
      continue;
    } else {
      if (inTable) {
        processedLines.push("</tbody></table>");
        inTable = false;
      }
    }

    // Handle Horizontal Rules
    if (trimmed === "---" || trimmed === "***") {
      processedLines.push('<hr class="my-6 border-[var(--card-border)]" />');
      continue;
    }

    // Process inline markdown on the active line content
    const parsedLine = replaceInlineMarkdown(line);

    // Handle Headings
    if (parsedLine.startsWith("# ")) {
      const text = parsedLine.substring(2);
      processedLines.push(`<h1 id="${slugify(text)}" class="font-display text-2xl font-bold mt-6 mb-3 text-[var(--text-primary)]">${text}</h1>`);
      continue;
    }
    if (parsedLine.startsWith("## ")) {
      const text = parsedLine.substring(3);
      processedLines.push(`<h2 id="${slugify(text)}" class="font-display text-xl font-bold mt-5 mb-2.5 text-[var(--text-primary)]">${text}</h2>`);
      continue;
    }
    if (parsedLine.startsWith("### ")) {
      const text = parsedLine.substring(4);
      processedLines.push(`<h3 id="${slugify(text)}" class="font-display text-lg font-bold mt-4 mb-2 text-[var(--text-primary)]">${text}</h3>`);
      continue;
    }
    if (parsedLine.startsWith("#### ")) {
      const text = parsedLine.substring(5);
      processedLines.push(`<h4 id="${slugify(text)}" class="font-display text-base font-bold mt-3.5 mb-1.5 text-[var(--text-primary)]">${text}</h4>`);
      continue;
    }

    // Handle Blockquotes
    if (parsedLine.startsWith("&gt; ") || parsedLine.startsWith("> ")) {
      const content = parsedLine.replace(/^(&gt;|>)\s+/, "");
      processedLines.push(`<blockquote class="border-l-4 border-[var(--accent)] pl-4 italic my-3 text-[var(--text-secondary)]">${content}</blockquote>`);
      continue;
    }

    // Handle Checklists
    const trimmedParsed = parsedLine.trim();
    if (trimmedParsed.startsWith("- [ ] ") || trimmedParsed.startsWith("* [ ] ")) {
      processedLines.push(`<li class="ml-4 list-none pl-1 text-[var(--text-secondary)] text-sm mb-1 flex items-center gap-2"><input type="checkbox" disabled class="accent-[var(--accent)] rounded animate-pulse" /> <span>${trimmedParsed.substring(6)}</span></li>`);
      continue;
    }
    if (trimmedParsed.startsWith("- [x] ") || trimmedParsed.startsWith("* [x] ")) {
      processedLines.push(`<li class="ml-4 list-none pl-1 text-[var(--text-secondary)] text-sm mb-1 flex items-center gap-2"><input type="checkbox" disabled checked class="accent-[var(--accent)] rounded" /> <span>${trimmedParsed.substring(6)}</span></li>`);
      continue;
    }

    // Handle Unordered List Items
    if (parsedLine.startsWith("- ") || parsedLine.startsWith("* ")) {
      processedLines.push(`<li class="ml-4 list-disc pl-1 text-[var(--text-secondary)] text-sm mb-1">${parsedLine.substring(2)}</li>`);
      continue;
    }

    // Handle Ordered List Items
    if (/^\d+\.\s+/.test(parsedLine)) {
      const content = parsedLine.replace(/^\d+\.\s+/, "");
      processedLines.push(`<li class="ml-4 list-decimal pl-1 text-[var(--text-secondary)] text-sm mb-1">${content}</li>`);
      continue;
    }

    // Default: Regular Line
    processedLines.push(parsedLine);
  }

  if (inTable) {
    processedLines.push("</tbody></table>");
  }

  let rawHtml = processedLines.join("\n");

  // Group contiguous lists
  rawHtml = rawHtml.replace(/(<li class="[^"]*(list-disc|list-none)[^"]*">.*?<\/li>\n?)+/g, (match) => {
    return `<ul class="my-3 space-y-1">${match}</ul>`;
  });
  rawHtml = rawHtml.replace(/(<li class="[^"]*list-decimal[^"]*">.*?<\/li>\n?)+/g, (match) => {
    return `<ol class="my-3 space-y-1">${match}</ol>`;
  });

  // Convert double newlines to paragraphs
  const blocks = rawHtml.split("\n\n");
  const parsedBlocks = blocks.map((block) => {
    const trimmed = block.trim();
    if (!trimmed) return "";
    
    if (/^(<h[1-4]|<pre|<ul|<ol|<table|<blockquote|<hr|<img)/i.test(trimmed)) {
      return trimmed;
    }
    return `<p class="mb-4 leading-relaxed text-[var(--text-secondary)] text-sm sm:text-base">${trimmed}</p>`;
  });

  let finalHtml = parsedBlocks.join("\n");

  // Restore safe HTML/SVG tags in reverse order to correctly handle nesting
  for (let j = placeholders.length - 1; j >= 0; j--) {
    finalHtml = finalHtml.replace(`\uFFFCHTMLPLACEHOLDER${j}\uFFFC`, placeholders[j]);
  }

  return finalHtml;
}

// Helper to replace inline styles without touching HTML structures
function replaceInlineMarkdown(text: string): string {
  let textState = text;
  const inlinePlaceholders: string[] = [];

  // 1. Inline code: `code` (replace first to preserve literal text containing underscores, etc.)
  textState = textState.replace(/`(.*?)`/g, (match, code) => {
    const tag = `<code class="font-mono text-xs bg-[var(--bg-secondary)] px-1.5 py-0.5 rounded text-[var(--text-primary)]">${code}</code>`;
    const index = inlinePlaceholders.push(tag) - 1;
    // DO NOT use underscores in placeholder names to avoid matching italic rules
    return `\uFFFCINLINEPLACEHOLDER${index}\uFFFC`;
  });

  // 2. Images: ![alt](url)
  textState = textState.replace(/!\[(.*?)\]\((.*?)\)/g, (match, alt, url) => {
    const tag = `<img src="${url}" alt="${alt}" class="inline-block max-h-[420px] w-auto my-1.5 object-cover border border-[var(--card-border)] shadow-sm rounded-lg mx-0.5 align-middle" />`;
    const index = inlinePlaceholders.push(tag) - 1;
    return `\uFFFCINLINEPLACEHOLDER${index}\uFFFC`;
  });

  // 3. Links: [text](url) (replace open/close tags with placeholders, keeping inner text open to markdown parsing)
  textState = textState.replace(/\[(.*?)\]\((.*?)\)/g, (match, linkText, url) => {
    const openTag = `<a href="${url}" class="text-[var(--accent)] underline hover:opacity-85 font-medium" target="_blank" rel="noopener noreferrer">`;
    const closeTag = `</a>`;
    const openIndex = inlinePlaceholders.push(openTag) - 1;
    const closeIndex = inlinePlaceholders.push(closeTag) - 1;
    const openPlc = `\uFFFCINLINEPLACEHOLDER${openIndex}\uFFFC`;
    const closePlc = `\uFFFCINLINEPLACEHOLDER${closeIndex}\uFFFC`;
    return `${openPlc}${linkText}${closePlc}`;
  });

  // 4. Strikethrough: ~~text~~
  textState = textState.replace(/~~(.*?)~~/g, '<del class="line-through opacity-60">$1</del>');

  // 5. Bold: **text** or __text__
  textState = textState.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-[var(--text-primary)]">$1</strong>');
  textState = textState.replace(/__(.*?)__/g, '<strong class="font-bold text-[var(--text-primary)]">$1</strong>');

  // 6. Italics: *text* or _text_
  textState = textState.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
  textState = textState.replace(/_(.*?)_/g, '<em class="italic">$1</em>');

  // 7. Restore inline placeholders
  for (let j = 0; j < inlinePlaceholders.length; j++) {
    textState = textState.replace(`\uFFFCINLINEPLACEHOLDER${j}\uFFFC`, inlinePlaceholders[j]);
  }

  return textState;
}
