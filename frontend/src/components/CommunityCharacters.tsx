import { useEffect, useRef } from "react";

export function CommunityCharacters() {
  const containerRef = useRef<HTMLDivElement>(null);
  const pupilsRef = useRef<HTMLDivElement[]>([]);

  // Function to register pupil refs dynamically
  const registerPupil = (el: HTMLDivElement | null) => {
    if (el && !pupilsRef.current.includes(el)) {
      pupilsRef.current.push(el);
    }
  };

  useEffect(() => {
    let animationFrameId: number;
    let lastMouseX = window.innerWidth / 2;
    let lastMouseY = window.innerHeight / 2;
    let currentMouseX = lastMouseX;
    let currentMouseY = lastMouseY;

    // Check accessibility preference
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const handleMouseMove = (e: MouseEvent) => {
      currentMouseX = e.clientX;
      currentMouseY = e.clientY;
    };

    const updateEyePositions = () => {
      // Lerp mouse positions for smoother motion
      lastMouseX += (currentMouseX - lastMouseX) * 0.15;
      lastMouseY += (currentMouseY - lastMouseY) * 0.15;

      pupilsRef.current.forEach((pupil) => {
        if (!pupil) return;

        // Get eye boundary
        const eye = pupil.parentElement;
        if (!eye) return;

        const rect = eye.getBoundingClientRect();
        const eyeCenterX = rect.left + rect.width / 2;
        const eyeCenterY = rect.top + rect.height / 2;

        const dx = lastMouseX - eyeCenterX;
        const dy = lastMouseY - eyeCenterY;
        const angle = Math.atan2(dy, dx);

        // Maximum distance the pupil can move from center
        const maxDist = 5; 
        const distance = Math.min(maxDist, Math.sqrt(dx * dx + dy * dy) / 30);

        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;

        pupil.style.transform = `translate(${x}px, ${y}px)`;
      });

      if (!prefersReducedMotion) {
        animationFrameId = requestAnimationFrame(updateEyePositions);
      }
    };

    if (!prefersReducedMotion) {
      window.addEventListener("mousemove", handleMouseMove);
      animationFrameId = requestAnimationFrame(updateEyePositions);
    }

    return () => {
      if (!prefersReducedMotion) {
        window.removeEventListener("mousemove", handleMouseMove);
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-lg aspect-square flex items-center justify-center select-none"
    >
      {/* Background Animated Blobs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-cyan-500/10 dark:bg-cyan-500/20 blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-teal-500/10 dark:bg-teal-500/25 blur-3xl animate-pulse [animation-delay:2s]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-blue-500/5 dark:bg-blue-500/15 blur-3xl animate-pulse [animation-delay:4s]" />

      {/* Grid of Characters */}
      <div className="grid grid-cols-2 gap-8 md:gap-12 relative z-10 p-6 w-full">
        
        {/* CHARACTER 1: Student (Round/Mortarboard) */}
        <div 
          className="flex flex-col items-center animate-float-slow justify-self-end"
          style={{ animation: "float-slow 6s ease-in-out infinite" }}
        >
          <div className="relative w-28 h-28 bg-gradient-to-br from-teal-400 to-cyan-500 dark:from-teal-500 dark:to-cyan-600 rounded-full shadow-lg flex items-center justify-center group hover:scale-105 transition-transform duration-300">
            {/* Mortarboard Cap */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-16 h-8 bg-slate-800 dark:bg-slate-900 rounded-sm rotate-[-12deg] shadow-md flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full absolute right-2 bottom-1" />
              <div className="w-6 h-0.5 bg-yellow-400 absolute right-2 bottom-2 origin-right rotate-[30deg]" />
            </div>
            
            {/* Eyes */}
            <div className="flex gap-4 mt-2">
              {/* Left Eye */}
              <div className="relative w-6 h-8 bg-white rounded-full flex items-center justify-center overflow-hidden animate-blink">
                <div 
                  ref={registerPupil}
                  className="w-3.5 h-3.5 bg-slate-900 rounded-full" 
                />
              </div>
              {/* Right Eye */}
              <div className="relative w-6 h-8 bg-white rounded-full flex items-center justify-center overflow-hidden animate-blink">
                <div 
                  ref={registerPupil}
                  className="w-3.5 h-3.5 bg-slate-900 rounded-full" 
                />
              </div>
            </div>

            {/* Rosy Cheeks */}
            <div className="absolute bottom-6 left-4 w-3 h-1.5 bg-pink-400/55 dark:bg-pink-400/40 rounded-full blur-[1px]" />
            <div className="absolute bottom-6 right-4 w-3 h-1.5 bg-pink-400/55 dark:bg-pink-400/40 rounded-full blur-[1px]" />
            
            {/* Mouth */}
            <div className="absolute bottom-5 w-4 h-2 border-b-2 border-slate-900 dark:border-white rounded-b-full" />
          </div>
          <span className="mt-3 text-sm font-semibold tracking-wider text-teal-600 dark:text-teal-400 uppercase">Student</span>
        </div>

        {/* CHARACTER 2: Alumni (Pill/Sash) */}
        <div 
          className="flex flex-col items-center animate-float-medium justify-self-start"
          style={{ animation: "float-medium 7s ease-in-out infinite [animation-delay:1.5s]" }}
        >
          <div className="relative w-28 h-28 bg-gradient-to-br from-blue-400 to-indigo-500 dark:from-blue-500 dark:to-indigo-600 rounded-[2rem] shadow-lg flex items-center justify-center group hover:scale-105 transition-transform duration-300">
            {/* Graduation Sash */}
            <div className="absolute bottom-2 left-3 right-3 h-5 bg-yellow-400/80 dark:bg-yellow-500/80 rounded-sm skew-x-12 flex items-center justify-center text-[8px] font-bold text-slate-900">
              ALUMNI
            </div>

            {/* Glasses Frame */}
            <div className="absolute top-8 left-1/2 -translate-x-1/2 w-16 h-7 border-2 border-slate-800 dark:border-yellow-400/60 rounded-full pointer-events-none z-10 flex justify-between px-1.5 items-center">
              <div className="w-5 h-5 border-2 border-slate-800 dark:border-yellow-400/60 rounded-full" />
              <div className="w-5 h-5 border-2 border-slate-800 dark:border-yellow-400/60 rounded-full" />
            </div>
            
            {/* Eyes */}
            <div className="flex gap-4 mt-[-6px]">
              {/* Left Eye */}
              <div className="relative w-5 h-7 bg-white rounded-full flex items-center justify-center overflow-hidden animate-blink">
                <div 
                  ref={registerPupil}
                  className="w-3 h-3 bg-slate-900 rounded-full" 
                />
              </div>
              {/* Right Eye */}
              <div className="relative w-5 h-7 bg-white rounded-full flex items-center justify-center overflow-hidden animate-blink">
                <div 
                  ref={registerPupil}
                  className="w-3 h-3 bg-slate-900 rounded-full" 
                />
              </div>
            </div>
            
            {/* Mouth */}
            <div className="absolute bottom-8 w-3 h-1.5 border-b-2 border-slate-900 dark:border-white rounded-b-full" />
          </div>
          <span className="mt-3 text-sm font-semibold tracking-wider text-blue-600 dark:text-blue-400 uppercase">Alumni</span>
        </div>

        {/* CHARACTER 3: Faculty (Hexagon/Bowtie) */}
        <div 
          className="flex flex-col items-center animate-float-medium justify-self-end"
          style={{ animation: "float-medium 6.5s ease-in-out infinite [animation-delay:0.8s]" }}
        >
          <div className="relative w-28 h-28 bg-gradient-to-br from-violet-400 to-fuchsia-500 dark:from-violet-500 dark:to-fuchsia-600 rounded-2xl rotate-45 shadow-lg flex items-center justify-center group hover:scale-105 transition-transform duration-300">
            <div className="rotate-[-45deg] flex flex-col items-center justify-center w-full h-full relative">
              {/* Bowtie */}
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 flex items-center z-10">
                <div className="w-3 h-3 bg-slate-900 dark:bg-yellow-400 rotate-45" />
                <div className="w-2 h-2 bg-slate-800 dark:bg-yellow-500 rounded-full absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>

              {/* Eyes */}
              <div className="flex gap-4 mt-2">
                {/* Left Eye */}
                <div className="relative w-6 h-8 bg-white rounded-full flex items-center justify-center overflow-hidden animate-blink">
                  <div 
                    ref={registerPupil}
                    className="w-3.5 h-3.5 bg-slate-900 rounded-full" 
                  />
                </div>
                {/* Right Eye */}
                <div className="relative w-6 h-8 bg-white rounded-full flex items-center justify-center overflow-hidden animate-blink">
                  <div 
                    ref={registerPupil}
                    className="w-3.5 h-3.5 bg-slate-900 rounded-full" 
                  />
                </div>
              </div>
              
              {/* Mouth */}
              <div className="absolute bottom-5 w-4 h-2 border-b-2 border-slate-900 dark:border-white rounded-b-full" />
            </div>
          </div>
          <span className="mt-3 text-sm font-semibold tracking-wider text-violet-600 dark:text-violet-400 uppercase">Faculty</span>
        </div>

        {/* CHARACTER 4: Volunteer (Star/Heart badge) */}
        <div 
          className="flex flex-col items-center animate-float-slow justify-self-start"
          style={{ animation: "float-slow 7.5s ease-in-out infinite [animation-delay:2.2s]" }}
        >
          <div className="relative w-28 h-28 bg-gradient-to-br from-pink-400 to-rose-500 dark:from-pink-500 dark:to-rose-600 rounded-[2.5rem] shadow-lg flex items-center justify-center group hover:scale-105 transition-transform duration-300">
            {/* Volunteer Badge */}
            <div className="absolute -top-2 -right-1 w-7 h-7 bg-yellow-400 dark:bg-yellow-500 rounded-full shadow flex items-center justify-center rotate-12">
              <svg className="w-4 h-4 text-slate-900" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 4.435c-1.989-5.399-12-4.597-12 3.568 0 4.068 3.06 9.481 12 14.997 8.94-5.516 12-10.929 12-14.997 0-8.118-10-8.947-12-3.568z" />
              </svg>
            </div>

            {/* Eyes */}
            <div className="flex gap-4 mt-2">
              {/* Left Eye */}
              <div className="relative w-6 h-8 bg-white rounded-full flex items-center justify-center overflow-hidden animate-blink">
                <div 
                  ref={registerPupil}
                  className="w-3.5 h-3.5 bg-slate-900 rounded-full" 
                />
              </div>
              {/* Right Eye */}
              <div className="relative w-6 h-8 bg-white rounded-full flex items-center justify-center overflow-hidden animate-blink">
                <div 
                  ref={registerPupil}
                  className="w-3.5 h-3.5 bg-slate-900 rounded-full" 
                />
              </div>
            </div>

            {/* Rosy Cheeks */}
            <div className="absolute bottom-6 left-4 w-3 h-1.5 bg-pink-300/60 dark:bg-pink-300/40 rounded-full blur-[1px]" />
            <div className="absolute bottom-6 right-4 w-3 h-1.5 bg-pink-300/60 dark:bg-pink-300/40 rounded-full blur-[1px]" />
            
            {/* Mouth */}
            <div className="absolute bottom-5 w-5 h-2.5 border-b-2 border-slate-900 dark:border-white rounded-b-full" />
          </div>
          <span className="mt-3 text-sm font-semibold tracking-wider text-pink-600 dark:text-pink-400 uppercase">Volunteer</span>
        </div>

      </div>

      {/* Global CSS for Animations */}
      <style>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(2deg); }
        }
        @keyframes float-medium {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-9px) rotate(-2deg); }
        }
        @keyframes blink {
          0%, 92%, 100% { transform: scaleY(1); }
          96% { transform: scaleY(0.1); }
        }
        .animate-blink {
          animation: blink 4s ease-in-out infinite;
          transform-origin: center;
        }
      `}</style>
    </div>
  );
}
