import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { 
  Shield, FileText, Cookie, Users, FileCheck, 
  Copyright, ShieldCheck, AlertTriangle, Search, Menu, X 
} from "lucide-react";

export interface DocItem {
  id: string;
  title: string;
  icon: React.ComponentType<any>;
}

export const LEGAL_DOCS: DocItem[] = [
  { id: "privacy", title: "Privacy Policy", icon: Shield },
  { id: "terms", title: "Terms & Conditions", icon: FileText },
  { id: "cookies", title: "Cookie Policy", icon: Cookie },
  { id: "community-guidelines", title: "Community Guidelines", icon: Users },
  { id: "content-policy", title: "Content Policy", icon: FileCheck },
  { id: "copyright", title: "Copyright Policy", icon: Copyright },
  { id: "safety", title: "Safety Guidelines", icon: ShieldCheck },
  { id: "disclaimer", title: "Disclaimer", icon: AlertTriangle },
];

interface LegalSidebarProps {
  activeId: string;
  onSelectDoc?: (id: string) => void;
}

export const LegalSidebar: React.FC<LegalSidebarProps> = ({ activeId, onSelectDoc }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Extensibility Architecture:
  // In the future, this filtering logic can be hooked into a full-text search index
  // (e.g. MiniSearch, Lunr, or a backend API endpoint) to rank documents by match relevance.
  const filteredDocs = LEGAL_DOCS.filter(doc => 
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLinkClick = (id: string) => {
    setMobileMenuOpen(false);
    if (onSelectDoc) onSelectDoc(id);
  };

  const SidebarContent = () => (
    <div className="flex flex-col gap-6 h-full">
      {/* Search Input - Structured for future search indexing extensions */}
      <div className="relative group">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
        <input
          type="text"
          placeholder="Search legal documents..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 text-sm bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            Clear
          </button>
        )}
      </div>

      {/* Navigation List */}
      <nav className="flex flex-col gap-1.5" aria-label="Legal Center Navigation">
        {filteredDocs.map((doc) => {
          const Icon = doc.icon;
          const isActive = doc.id === activeId;
          
          return (
            <NavLink
              key={doc.id}
              to={`/legal/${doc.id}`}
              onClick={() => handleLinkClick(doc.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-smooth ${
                isActive
                  ? "bg-primary/10 text-primary border-l-2 border-primary pl-[14px]"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              <Icon className={`h-4.5 w-4.5 transition-colors ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`} />
              <span className="truncate">{doc.title}</span>
            </NavLink>
          );
        })}
        {filteredDocs.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">No documents found matching "{searchQuery}"</p>
        )}
      </nav>
    </div>
  );

  return (
    <>
      {/* Mobile Drawer Trigger (Sticky Bar just below main Navbar) */}
      <div className="md:hidden sticky top-16 z-30 w-full flex items-center justify-between px-4 py-3 bg-card/90 backdrop-blur border-b border-border">
        <span className="text-sm font-medium text-foreground">
          {LEGAL_DOCS.find(d => d.id === activeId)?.title || "Legal Documents"}
        </span>
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground border border-border rounded-lg transition-colors"
          aria-expanded={mobileMenuOpen}
          aria-label="Open legal navigation"
        >
          <Menu className="h-3.5 w-3.5" /> Menu
        </button>
      </div>

      {/* Mobile Sidebar Overlay/Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Overlay backdrop */}
          <div 
            className="fixed inset-0 bg-background/80 backdrop-blur-sm" 
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Drawer container */}
          <aside className="relative flex flex-col w-[280px] max-w-sm h-full bg-card border-r border-border p-5 z-50 animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between mb-6">
              <span className="font-display font-bold text-lg text-foreground">Legal Center</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg bg-muted text-muted-foreground hover:text-foreground"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto pr-1">
              <SidebarContent />
            </div>
          </aside>
        </div>
      )}

      {/* Desktop Sidebar (Permanent) */}
      <aside className="hidden md:block w-72 shrink-0 self-start sticky top-24 pr-4 border-r border-border/40 h-[calc(100vh-120px)] overflow-y-auto">
        <div className="mb-4">
          <span className="font-display font-bold text-xs uppercase tracking-wider text-muted-foreground/80 pl-4 block mb-2">Legal Center</span>
        </div>
        <SidebarContent />
      </aside>
    </>
  );
};
