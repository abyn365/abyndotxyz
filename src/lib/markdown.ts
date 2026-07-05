/**
 * A lightweight, zero-dependency Markdown to HTML parser.
 * Supports: Headings, Bold, Italic, Strikethrough, Code Blocks, Inline Code,
 * Blockquotes, Lists (unordered, ordered, checklists), Tables, Images, and Links.
 */
export function parseMarkdown(markdown: string): string {
  if (!markdown) return "";

  // 1. Preserve safe HTML tags by replacing them with placeholders
  const placeholders: string[] = [];
  let htmlPreserved = markdown;

  // Regexes for safe HTML elements
  const safeTags = [
    /<br\s*\/?>/gi,
    /<\/?[p|div|span|strong|em|code|pre](\s+[a-zA-Z-]+="[^"]*")*\s*\/?>/gi,
    /<img\s+([^>]*?)\/?>/gi,
    /<\/?[h1|h2|h3|h4|h5|h6](\s+[a-zA-Z-]+="[^"]*")*\s*\/?>/gi,
    /<a\s+([^>]*?)>([\s\S]*?)<\/a>/gi
  ];

  // Temporarily extract all HTML tags matching safe patterns
  for (const regex of safeTags) {
    htmlPreserved = htmlPreserved.replace(regex, (match) => {
      // Basic security filter to prevent event handler injection (onmouseover, onerror etc)
      if (/on[a-z]+\s*=/i.test(match) || /javascript:/i.test(match)) {
        return ""; // Strip dangerous attributes
      }
      placeholders.push(match);
      return `\uFFFC_HTML_PLACEHOLDER_${placeholders.length - 1}_\uFFFC`;
    });
  }

  // 2. Escape any remaining `<` and `>` (which are unsafe or unparsed text)
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

    // 3. Handle Code Blocks
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

    // 4. Handle Tables
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

    // 5. Handle Horizontal Rules
    if (trimmed === "---" || trimmed === "***") {
      processedLines.push('<hr class="my-6 border-[var(--card-border)]" />');
      continue;
    }

    // Process inline markdown on the active line content
    const parsedLine = replaceInlineMarkdown(line);

    // 6. Handle Headings
    if (parsedLine.startsWith("# ")) {
      processedLines.push(`<h1 class="font-display text-2xl font-bold mt-6 mb-3 text-[var(--text-primary)]">${parsedLine.substring(2)}</h1>`);
      continue;
    }
    if (parsedLine.startsWith("## ")) {
      processedLines.push(`<h2 class="font-display text-xl font-bold mt-5 mb-2.5 text-[var(--text-primary)]">${parsedLine.substring(3)}</h2>`);
      continue;
    }
    if (parsedLine.startsWith("### ")) {
      processedLines.push(`<h3 class="font-display text-lg font-bold mt-4 mb-2 text-[var(--text-primary)]">${parsedLine.substring(4)}</h3>`);
      continue;
    }
    if (parsedLine.startsWith("#### ")) {
      processedLines.push(`<h4 class="font-display text-base font-bold mt-3.5 mb-1.5 text-[var(--text-primary)]">${parsedLine.substring(5)}</h4>`);
      continue;
    }

    // 7. Handle Blockquotes
    if (parsedLine.startsWith("&gt; ") || parsedLine.startsWith("> ")) {
      const content = parsedLine.replace(/^(&gt;|>)\s+/, "");
      processedLines.push(`<blockquote class="border-l-4 border-[var(--accent)] pl-4 italic my-3 text-[var(--text-secondary)]">${content}</blockquote>`);
      continue;
    }

    // 8. Handle Checklists
    const trimmedParsed = parsedLine.trim();
    if (trimmedParsed.startsWith("- [ ] ") || trimmedParsed.startsWith("* [ ] ")) {
      processedLines.push(`<li class="ml-4 list-none pl-1 text-[var(--text-secondary)] text-sm mb-1 flex items-center gap-2"><input type="checkbox" disabled class="accent-[var(--accent)] rounded animate-pulse" /> <span>${trimmedParsed.substring(6)}</span></li>`);
      continue;
    }
    if (trimmedParsed.startsWith("- [x] ") || trimmedParsed.startsWith("* [x] ")) {
      processedLines.push(`<li class="ml-4 list-none pl-1 text-[var(--text-secondary)] text-sm mb-1 flex items-center gap-2"><input type="checkbox" disabled checked class="accent-[var(--accent)] rounded" /> <span>${trimmedParsed.substring(6)}</span></li>`);
      continue;
    }

    // 9. Handle Unordered List Items
    if (parsedLine.startsWith("- ") || parsedLine.startsWith("* ")) {
      processedLines.push(`<li class="ml-4 list-disc pl-1 text-[var(--text-secondary)] text-sm mb-1">${parsedLine.substring(2)}</li>`);
      continue;
    }

    // 10. Handle Ordered List Items
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

  // 11. Restore safe HTML tags
  for (let j = 0; j < placeholders.length; j++) {
    finalHtml = finalHtml.replace(`\uFFFC_HTML_PLACEHOLDER_${j}_\uFFFC`, placeholders[j]);
  }

  return finalHtml;
}

// Helper to replace inline styles without touching HTML structures
function replaceInlineMarkdown(text: string): string {
  return text
    // Images: ![alt](url)
    .replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" class="rounded-xl max-h-[420px] w-auto my-5 object-cover mx-auto border border-[var(--card-border)] shadow-sm" />')
    // Links: [text](url)
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-[var(--accent)] underline hover:opacity-85 font-medium" target="_blank" rel="noopener noreferrer">$1</a>')
    // Strikethrough: ~~text~~
    .replace(/~~(.*?)~~/g, '<del class="line-through opacity-60">$1</del>')
    // Bold: **text** or __text__
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-[var(--text-primary)]">$1</strong>')
    .replace(/__(.*?)__/g, '<strong class="font-bold text-[var(--text-primary)]">$1</strong>')
    // Italics: *text* or _text_
    .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
    .replace(/_(.*?)_/g, '<em class="italic">$1</em>')
    // Inline code: `code`
    .replace(/`(.*?)`/g, '<code class="font-mono text-xs bg-[var(--bg-secondary)] px-1.5 py-0.5 rounded text-[var(--text-primary)]">$1</code>');
}
