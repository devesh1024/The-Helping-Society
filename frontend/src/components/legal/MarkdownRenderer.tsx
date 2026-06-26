import React, { ReactNode } from "react";

interface Block {
  type: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'ul' | 'ol' | 'blockquote' | 'table' | 'code' | 'hr';
  content?: string;
  items?: string[];
  headers?: string[];
  rows?: string[][];
  language?: string;
}

export const slugify = (text: string) => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-');
};

// Inline tokenizer that securely parses links, bold, italics, and inline code to React elements
export function parseInline(text: string): ReactNode[] | string {
  if (!text) return "";
  
  const parts: ReactNode[] = [];
  let currentIndex = 0;
  
  // combined regex for:
  // 1. bold (**text**)
  // 2. links ([text](url))
  // 3. inline code (`code`)
  // 4. italics (*text*)
  const regex = /(\*\*(.*?)\*\*)|(\[(.*?)\]\((.*?)\))|(`(.*?)`)|(\*(.*?)\*)/g;
  
  let match;
  while ((match = regex.exec(text)) !== null) {
    const matchIndex = match.index;
    
    // Add plain text before match
    if (matchIndex > currentIndex) {
      parts.push(text.substring(currentIndex, matchIndex));
    }
    
    if (match[1]) {
      // Bold
      parts.push(<strong key={`b-${matchIndex}`} className="font-semibold text-foreground">{match[2]}</strong>);
    } else if (match[3]) {
      // Link
      const url = match[5];
      const linkText = match[4];
      const isEmail = url.startsWith('mailto:');
      parts.push(
        <a 
          key={`a-${matchIndex}`} 
          href={url} 
          target={isEmail ? undefined : "_blank"} 
          rel={isEmail ? undefined : "noopener noreferrer"}
          className="text-primary hover:underline font-medium decoration-primary/40 underline-offset-4"
        >
          {linkText}
        </a>
      );
    } else if (match[6]) {
      // Inline Code
      parts.push(
        <code key={`code-${matchIndex}`} className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs text-foreground border border-border">
          {match[7]}
        </code>
      );
    } else if (match[8]) {
      // Italics
      parts.push(<em key={`em-${matchIndex}`} className="italic text-muted-foreground">{match[9]}</em>);
    }
    
    currentIndex = regex.lastIndex;
  }
  
  if (currentIndex < text.length) {
    parts.push(text.substring(currentIndex));
  }
  
  return parts.length === 0 ? text : parts;
}

export function parseMarkdownToBlocks(markdown: string): Block[] {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const blocks: Block[] = [];
  
  let currentBlock: Block | null = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // 1. Code block processing
    if (currentBlock && currentBlock.type === 'code') {
      if (trimmed.startsWith('```')) {
        blocks.push(currentBlock);
        currentBlock = null;
      } else {
        currentBlock.content = (currentBlock.content ? currentBlock.content + '\n' : '') + line;
      }
      continue;
    }
    
    if (trimmed.startsWith('```')) {
      if (currentBlock) {
        blocks.push(currentBlock);
      }
      const lang = trimmed.slice(3).trim();
      currentBlock = { type: 'code', content: '', language: lang };
      continue;
    }
    
    // 2. Horizontal Rule
    if (trimmed === '---' || trimmed === '***') {
      if (currentBlock) {
        blocks.push(currentBlock);
        currentBlock = null;
      }
      blocks.push({ type: 'hr' });
      continue;
    }
    
    // 3. Headings
    if (trimmed.startsWith('#')) {
      if (currentBlock) {
        blocks.push(currentBlock);
        currentBlock = null;
      }
      const match = trimmed.match(/^(#{1,6})\s+(.*)$/);
      if (match) {
        const level = match[1].length;
        const headingText = match[2];
        const headingType = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
        blocks.push({ type: headingType, content: headingText });
        continue;
      }
    }
    
    // 4. Blockquotes
    if (trimmed.startsWith('>')) {
      const quoteText = line.substring(line.indexOf('>') + 1).trim();
      if (currentBlock && currentBlock.type === 'blockquote') {
        currentBlock.content = (currentBlock.content ? currentBlock.content + '\n' : '') + quoteText;
      } else {
        if (currentBlock) {
          blocks.push(currentBlock);
        }
        currentBlock = { type: 'blockquote', content: quoteText };
      }
      continue;
    }
    
    // 5. Unordered Lists
    if (trimmed.startsWith('* ') || trimmed.startsWith('- ') || trimmed.startsWith('+ ')) {
      const itemText = trimmed.slice(2).trim();
      if (currentBlock && currentBlock.type === 'ul') {
        currentBlock.items?.push(itemText);
      } else {
        if (currentBlock) {
          blocks.push(currentBlock);
        }
        currentBlock = { type: 'ul', items: [itemText] };
      }
      continue;
    }
    
    // 6. Ordered Lists
    if (/^\d+\.\s+/.test(trimmed)) {
      const itemText = trimmed.replace(/^\d+\.\s+/, '').trim();
      if (currentBlock && currentBlock.type === 'ol') {
        currentBlock.items?.push(itemText);
      } else {
        if (currentBlock) {
          blocks.push(currentBlock);
        }
        currentBlock = { type: 'ol', items: [itemText] };
      }
      continue;
    }
    
    // 7. Tables
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      if (trimmed.includes('---') || trimmed.includes('-')) {
        if (currentBlock && currentBlock.type === 'table') {
          continue; // skip the markdown table separation line
        }
      }
      
      const cells = trimmed
        .split('|')
        .map(c => c.trim())
        .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
      
      if (currentBlock && currentBlock.type === 'table') {
        currentBlock.rows?.push(cells);
      } else {
        if (currentBlock) {
          blocks.push(currentBlock);
        }
        currentBlock = { type: 'table', headers: cells, rows: [] };
      }
      continue;
    }
    
    // 8. Empty line (closes paragraphs, lists, tables)
    if (trimmed === '') {
      if (currentBlock) {
        blocks.push(currentBlock);
        currentBlock = null;
      }
      continue;
    }
    
    // 9. Standard Paragraphs (merges multi-line paragraphs)
    if (currentBlock && currentBlock.type === 'p') {
      currentBlock.content = (currentBlock.content ? currentBlock.content + ' ' : '') + trimmed;
    } else {
      if (currentBlock) {
        blocks.push(currentBlock);
      }
      currentBlock = { type: 'p', content: trimmed };
    }
  }
  
  if (currentBlock) {
    blocks.push(currentBlock);
  }
  
  return blocks;
}

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const blocks = parseMarkdownToBlocks(content);
  
  return (
    <article className="prose prose-teal max-w-none dark:prose-invert">
      {blocks.map((block, idx) => {
        const key = `${block.type}-${idx}`;
        
        switch (block.type) {
          case "h1":
            return (
              <h1 key={key} id={slugify(block.content || "")} className="font-display font-bold text-3xl sm:text-4xl text-foreground mt-8 mb-4 border-b border-border/50 pb-2">
                {parseInline(block.content || "")}
              </h1>
            );
          case "h2":
            return (
              <h2 key={key} id={slugify(block.content || "")} className="font-display font-semibold text-2xl text-foreground mt-8 mb-4 border-b border-border/30 pb-1.5 scroll-mt-20">
                {parseInline(block.content || "")}
              </h2>
            );
          case "h3":
            return (
              <h3 key={key} id={slugify(block.content || "")} className="font-display font-semibold text-xl text-foreground mt-6 mb-3 scroll-mt-20">
                {parseInline(block.content || "")}
              </h3>
            );
          case "h4":
            return (
              <h4 key={key} id={slugify(block.content || "")} className="font-display font-semibold text-lg text-foreground mt-5 mb-2 scroll-mt-20">
                {parseInline(block.content || "")}
              </h4>
            );
          case "h5":
            return (
              <h5 key={key} className="font-display font-semibold text-base text-foreground mt-4 mb-2">
                {parseInline(block.content || "")}
              </h5>
            );
          case "h6":
            return (
              <h6 key={key} className="font-display font-semibold text-sm text-foreground mt-4 mb-2">
                {parseInline(block.content || "")}
              </h6>
            );
          case "p":
            return (
              <p key={key} className="text-muted-foreground leading-relaxed text-base mb-4 font-normal">
                {parseInline(block.content || "")}
              </p>
            );
          case "blockquote":
            return (
              <blockquote key={key} className="border-l-4 border-primary pl-4 py-1.5 pr-2 my-5 italic text-muted-foreground bg-muted/40 rounded-r border-y-0 border-r-0">
                {parseInline(block.content || "")}
              </blockquote>
            );
          case "ul":
            return (
              <ul key={key} className="list-disc pl-6 mb-5 space-y-2 text-muted-foreground">
                {block.items?.map((item, i) => (
                  <li key={i}>{parseInline(item)}</li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={key} className="list-decimal pl-6 mb-5 space-y-2 text-muted-foreground">
                {block.items?.map((item, i) => (
                  <li key={i}>{parseInline(item)}</li>
                ))}
              </ol>
            );
          case "hr":
            return <hr key={key} className="my-8 border-border" />;
          case "code":
            return (
              <pre key={key} className="bg-muted p-4 rounded-xl my-5 overflow-x-auto font-mono text-sm border border-border text-foreground">
                <code>{block.content}</code>
              </pre>
            );
          case "table":
            return (
              <div key={key} className="overflow-x-auto my-6 border border-border rounded-xl">
                <table className="w-full text-sm text-left text-muted-foreground">
                  <thead className="text-xs uppercase bg-muted/60 text-foreground border-b border-border">
                    <tr>
                      {block.headers?.map((header, hIdx) => (
                        <th key={hIdx} className="px-5 py-3.5 font-semibold">
                          {parseInline(header)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {block.rows?.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-muted/10 transition-colors">
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="px-5 py-3.5 align-middle">
                            {parseInline(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          default:
            return null;
        }
      })}
    </article>
  );
};
