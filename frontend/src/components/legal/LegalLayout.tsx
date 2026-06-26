import React, { ReactNode } from "react";
import { Navbar } from "../Navbar";
import { Footer } from "../Footer";

interface LegalLayoutProps {
  children: ReactNode;
  sidebar: ReactNode;
  progressPercent: number;
}

export const LegalLayout: React.FC<LegalLayoutProps> = ({ children, sidebar, progressPercent }) => {
  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      {/* Primary Global Header */}
      <Navbar />

      {/* Reading Scroll Progress Indicator (Sticky just below Navbar) */}
      <div 
        className="sticky top-[64px] z-30 h-1 w-full bg-border/20" 
        role="progressbar" 
        aria-valuenow={Math.round(progressPercent)} 
        aria-valuemin={0} 
        aria-valuemax={100}
        aria-label="Reading progress"
      >
        <div 
          className="h-full bg-gradient-primary transition-all duration-75"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Main documentation container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8 flex flex-col md:flex-row gap-6 md:gap-8">
        {/* Left Navigation Panel */}
        {sidebar}

        {/* Right Content Panel */}
        <section className="flex-1 min-w-0" aria-label="Legal document viewer">
          <div className="bg-card border border-border/50 rounded-2xl p-6 md:p-10 shadow-soft transition-smooth">
            {children}
          </div>
        </section>
      </main>

      {/* Primary Global Footer */}
      <Footer />
    </div>
  );
};
