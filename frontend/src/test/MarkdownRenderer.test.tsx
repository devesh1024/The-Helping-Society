import { describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MarkdownRenderer, slugify } from "../components/legal/MarkdownRenderer";

describe("slugify", () => {
  test("correctly formats text for headers", () => {
    expect(slugify("Hello World!")).toBe("hello-world");
    expect(slugify("Privacy Policy & Terms")).toBe("privacy-policy-terms");
    expect(slugify("Section 1.2: Scope")).toBe("section-12-scope");
  });
});

describe("MarkdownRenderer Component", () => {
  test("renders headings with slugified IDs", () => {
    const markdown = `# Main Title\n## Sub Section\n### Third Level`;
    render(<MarkdownRenderer content={markdown} />);
    
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1).toHaveTextContent("Main Title");
    expect(h1).toHaveAttribute("id", "main-title");
    
    const h2 = screen.getByRole("heading", { level: 2 });
    expect(h2).toHaveTextContent("Sub Section");
    expect(h2).toHaveAttribute("id", "sub-section");

    const h3 = screen.getByRole("heading", { level: 3 });
    expect(h3).toHaveTextContent("Third Level");
    expect(h3).toHaveAttribute("id", "third-level");
  });

  test("renders inline styling like bold, italics, and inline code", () => {
    const markdown = `This is **bold** text and *italicized* content with some \`inline code\`.`;
    render(<MarkdownRenderer content={markdown} />);
    
    const boldEl = screen.getByText("bold");
    expect(boldEl.tagName).toBe("STRONG");
    expect(boldEl).toHaveClass("font-semibold");
    
    const italicEl = screen.getByText("italicized");
    expect(italicEl.tagName).toBe("EM");
    expect(italicEl).toHaveClass("italic");
    
    const codeEl = screen.getByText("inline code");
    expect(codeEl.tagName).toBe("CODE");
    expect(codeEl).toHaveClass("font-mono");
  });

  test("renders secure external links", () => {
    const markdown = `Check the [Google Website](https://google.com).`;
    render(<MarkdownRenderer content={markdown} />);
    
    const link = screen.getByRole("link", { name: "Google Website" });
    expect(link).toHaveAttribute("href", "https://google.com");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  test("renders non-external links securely (like mailto)", () => {
    const markdown = `Email us at [support@uecu.ac.in](mailto:support@uecu.ac.in).`;
    render(<MarkdownRenderer content={markdown} />);
    
    const link = screen.getByRole("link", { name: "support@uecu.ac.in" });
    expect(link).toHaveAttribute("href", "mailto:support@uecu.ac.in");
    expect(link).not.toHaveAttribute("target");
    expect(link).not.toHaveAttribute("rel");
  });

  test("renders lists correctly", () => {
    const markdown = `- Item One\n- Item Two\n\n1. Number One\n2. Number Two`;
    render(<MarkdownRenderer content={markdown} />);
    
    const listItems = screen.getAllByRole("listitem");
    expect(listItems).toHaveLength(4);
    
    expect(listItems[0]).toHaveTextContent("Item One");
    expect(listItems[1]).toHaveTextContent("Item Two");
    expect(listItems[2]).toHaveTextContent("Number One");
    expect(listItems[3]).toHaveTextContent("Number Two");
  });

  test("renders tables correctly", () => {
    const markdown = `
| Header A | Header B |
|---|---|
| Row 1 Col 1 | Row 1 Col 2 |
| Row 2 Col 1 | Row 2 Col 2 |
`;
    render(<MarkdownRenderer content={markdown} />);
    
    const table = screen.getByRole("table");
    expect(table).toBeInTheDocument();
    
    const headers = screen.getAllByRole("columnheader");
    expect(headers).toHaveLength(2);
    expect(headers[0]).toHaveTextContent("Header A");
    
    const cells = screen.getAllByRole("cell");
    expect(cells).toHaveLength(4);
    expect(cells[0]).toHaveTextContent("Row 1 Col 1");
    expect(cells[3]).toHaveTextContent("Row 2 Col 2");
  });

  test("renders blockquotes, horizontal rules, and code blocks", () => {
    const markdown = `> Important message\n\n---\n\n\`\`\`javascript\nconst a = 1;\n\`\`\``;
    render(<MarkdownRenderer content={markdown} />);
    
    const blockquote = screen.getByRole("blockquote");
    expect(blockquote).toHaveTextContent("Important message");
    
    const hr = screen.getByRole("separator");
    expect(hr).toBeInTheDocument();
    
    const codeBlock = screen.getByText("const a = 1;");
    expect(codeBlock.parentElement).toBeInTheDocument();
    expect(codeBlock.parentElement?.tagName).toBe("PRE");
  });
});
