import React, { useEffect, useState, useRef } from "react";
import { useParams, Navigate, useNavigate } from "react-router-dom";
import { ArrowUp, Clock, Calendar, Hash } from "lucide-react";
import { LegalLayout } from "@/components/legal/LegalLayout";
import { LegalSidebar, LEGAL_DOCS } from "@/components/legal/LegalSidebar";
import { MarkdownRenderer, slugify } from "@/components/legal/MarkdownRenderer";

interface TocHeading {
  text: string;
  level: number;
  id: string;
}

const docFileMap: Record<string, string> = {
  privacy: "privacy_policy.md",
  terms: "terms_and_conditions.md",
  cookies: "cookie_policy.md",
  "community-guidelines": "community_guidelines.md",
  "content-policy": "content_policy.md",
  copyright: "copyright_policy.md",
  safety: "SAFETY-GUIDELINES.md",
  disclaimer: "disclaimer.md",
};

export default function Legal() {
  const { docId } = useParams<{ docId: string }>();
  const navigate = useNavigate();
  
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const [headings, setHeadings] = useState<TocHeading[]>([]);
  const [activeHeadingId, setActiveHeadingId] = useState<string>("");
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [showBackToTop, setShowBackToTop] = useState<boolean>(false);
  
  const contentRef = useRef<HTMLDivElement>(null);

  // 1. Handle redirection for invalid or missing document IDs
  useEffect(() => {
    if (!docId || !docFileMap[docId]) {
      navigate("/legal/privacy", { replace: true });
    }
  }, [docId, navigate]);

  // 2. Fetch document content dynamically
  useEffect(() => {
    const fetchDoc = async () => {
      if (!docId || !docFileMap[docId]) return;
      setLoading(true);
      setError(null);
      try {
        const fileName = docFileMap[docId];
        const response = await fetch(`/legal/${fileName}`);
        
        if (!response.ok) {
          throw new Error(`Failed to load document: ${response.statusText}`);
        }
        
        const text = await response.text();
        setContent(text);
        
        // Parse headings for Table of Contents
        const lines = text.replace(/\r\n/g, '\n').split('\n');
        const parsedHeadings: TocHeading[] = [];
        
        lines.forEach(line => {
          const trimmed = line.trim();
          // We only track H2 and H3 for Table of Contents to avoid overcrowding
          const match = trimmed.match(/^(#{2,3})\s+(.*)$/);
          if (match) {
            const level = match[1].length;
            const textContent = match[2];
            parsedHeadings.push({
              text: textContent,
              level,
              id: slugify(textContent)
            });
          }
        });
        
        setHeadings(parsedHeadings);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "An error occurred while loading the legal document.");
      } finally {
        setLoading(false);
      }
    };

    fetchDoc();
    // Scroll window to top on doc change
    window.scrollTo({ top: 0 });
  }, [docId]);

  // 2. Track reading progress and back-to-top button visibility
  useEffect(() => {
    const handleScroll = () => {
      // Calculate scroll progress percentage
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const currentPercent = (window.scrollY / totalHeight) * 100;
        setProgressPercent(Math.min(100, Math.max(0, currentPercent)));
      } else {
        setProgressPercent(0);
      }

      // Show back to top button after 400px of scrolling
      setShowBackToTop(window.scrollY > 400);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 3. Highlight the active heading in the Table of Contents on scroll
  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Find headings currently intersecting
        const visibleHeadings = entries
          .filter((entry) => entry.isIntersecting)
          .map((entry) => entry.target.id);

        if (visibleHeadings.length > 0) {
          // Set active to the first visible heading
          setActiveHeadingId(visibleHeadings[0]);
        }
      },
      {
        rootMargin: "-80px 0px -60% 0px", // triggers when headings are near top-to-middle of viewport
        threshold: 0.1,
      }
    );

    // Observe all heading elements matching the IDs in TOC
    headings.forEach((heading) => {
      const el = document.getElementById(heading.id);
      if (el) observer.observe(el);
    });

    return () => {
      headings.forEach((heading) => {
        const el = document.getElementById(heading.id);
        if (el) observer.unobserve(el);
      });
    };
  }, [headings, content]);

  // 4. Calculate stats (Reading Time, Last Updated)
  const calculateReadingTime = (text: string): number => {
    const cleanText = text.replace(/[#*`[\]()|]/g, '');
    const wordCount = cleanText.split(/\s+/).filter(Boolean).length;
    // average reading speed: 200 words per minute
    return Math.max(1, Math.ceil(wordCount / 200));
  };

  const extractLastUpdated = (text: string): string => {
    // Looks for lines starting with "Last Updated:" or "Effective Date:"
    const match = text.match(/(Last Updated|Effective Date):\s*(.*)/i);
    return match ? match[2].trim() : "June 2026";
  };

  const readingTime = calculateReadingTime(content);
  const lastUpdated = extractLastUpdated(content);

  const handleBackToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleTocClick = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      const offset = 88; // offsets sticky navbars
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = el.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
      setActiveHeadingId(id);
    }
  };

  return (
    <LegalLayout 
      sidebar={<LegalSidebar activeId={docId} />} 
      progressPercent={progressPercent}
    >
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4" aria-busy="true">
          <div className="h-10 w-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm font-medium">Loading document...</p>
        </div>
      ) : error ? (
        <div className="py-12 text-center" role="alert">
          <h2 className="text-xl font-bold text-destructive mb-2">Error Loading Document</h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">{error}</p>
          <button 
            onClick={() => navigate("/legal/privacy")}
            className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/95 rounded-lg transition-colors"
          >
            Return to Privacy Policy
          </button>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-8 xl:gap-12">
          {/* Document Content Area */}
          <div className="flex-1 min-w-0" ref={contentRef}>
            {/* Meta Header */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-muted-foreground border-b border-border/50 pb-5 mb-6">
              <span className="flex items-center gap-1.5 bg-muted/60 px-2.5 py-1 rounded-md">
                <Calendar className="h-3.5 w-3.5" />
                Updated: {lastUpdated}
              </span>
              <span className="flex items-center gap-1.5 bg-muted/60 px-2.5 py-1 rounded-md">
                <Clock className="h-3.5 w-3.5" />
                Reading Time: {readingTime} min
              </span>
            </div>

            {/* Secure Markdown Rendering Component */}
            <MarkdownRenderer content={content} />
          </div>

          {/* Floating Table of Contents (Desktop Right Sidebar) */}
          {headings.length > 0 && (
            <aside className="hidden lg:block w-64 shrink-0 self-start sticky top-24 pl-6 border-l border-border/60">
              <nav aria-label="Table of contents">
                <span className="font-display font-bold text-xs uppercase tracking-wider text-muted-foreground/80 mb-3 block">
                  On this page
                </span>
                <ul className="flex flex-col gap-2 max-h-[calc(100vh-200px)] overflow-y-auto pr-2 py-1 scrollbar-thin">
                  {headings.map((heading) => (
                    <li 
                      key={heading.id}
                      style={{ paddingLeft: `${(heading.level - 2) * 12}px` }}
                    >
                      <a
                        href={`#${heading.id}`}
                        onClick={(e) => handleTocClick(heading.id, e)}
                        className={`group flex items-start gap-1.5 text-[13px] font-medium leading-relaxed transition-smooth ${
                          activeHeadingId === heading.id
                            ? "text-primary font-semibold"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Hash className={`h-3 w-3 mt-1 shrink-0 transition-opacity ${
                          activeHeadingId === heading.id 
                            ? "opacity-100 text-primary" 
                            : "opacity-0 group-hover:opacity-100 text-muted-foreground/60"
                        }`} />
                        <span>{heading.text}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </aside>
          )}
        </div>
      )}

      {/* Floating Back to Top Button */}
      {showBackToTop && (
        <button
          onClick={handleBackToTop}
          className="fixed bottom-6 right-6 z-40 p-3 rounded-full bg-primary text-primary-foreground shadow-elegant hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all outline-none focus:ring-2 focus:ring-primary/20"
          aria-label="Scroll back to top"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </LegalLayout>
  );
}
