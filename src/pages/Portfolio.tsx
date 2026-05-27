import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const CATEGORY_COLORS: Record<string, string> = {
  BRANDING: "#00d4ff",
  PRINT: "#10b981",
  DIGITAL: "#8b5cf6",
  VIDEO: "#ec4899",
  EVENT: "#f59e0b",
  COMMERCIAL: "#f97316",
};

// Autoplay Slideshow for showcase photos of a service card
function DynamicSlideshow({ photos }: { photos: { url: string; title: string; duration?: number }[] }) {
  const [index, setIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [videoCurrentTime, setVideoCurrentTime] = useState<number>(0);

  // Reset video progress state whenever the slide changes
  useEffect(() => {
    setVideoCurrentTime(0);
    setVideoDuration(null);
  }, [index]);

  const currentPhoto = photos && photos[index];
  const isVideo = currentPhoto && (
    currentPhoto.url.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i) || 
    currentPhoto.url.includes("video") || 
    currentPhoto.url.startsWith("data:video/")
  );
  const hasCustomDuration = currentPhoto && currentPhoto.duration !== undefined && currentPhoto.duration > 0;

  // Determine transition delay (fallback to 5000ms for photos)
  const delay = hasCustomDuration 
    ? currentPhoto.duration! * 1000 
    : 5000;

  useEffect(() => {
    if (isHovered || !photos || photos.length <= 1 || !currentPhoto) return;

    // For videos with no custom duration, transition onEnded callback instead of timer
    if (isVideo && !hasCustomDuration) return;

    const timer = setTimeout(() => {
      setIndex((prev) => (prev + 1) % photos.length);
    }, delay);

    return () => clearTimeout(timer);
  }, [index, isHovered, photos, isVideo, hasCustomDuration, delay]);

  if (!photos || photos.length === 0) {
    return (
      <div className="w-full lg:w-2/3 h-[360px] rounded-3xl border border-white/5 bg-white/[0.01] flex flex-col items-center justify-center text-white/20 font-mono text-xs gap-2">
        <span className="text-3xl">📷</span>
        <span>NO PORTFOLIO IMAGES CALIBRATED</span>
      </div>
    );
  }

  return (
    <div 
      className="w-full lg:w-2/3 h-[360px] rounded-3xl border border-white/5 relative overflow-hidden group/slide cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: "rgba(8, 8, 16, 0.4)",
        borderColor: "rgba(255, 255, 255, 0.04)"
      }}
    >
      {/* Autoplay progress bar */}
      {photos.length > 1 && !isHovered && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/10 z-20">
          {isVideo && !hasCustomDuration ? (
            <div 
              className="h-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all duration-100 ease-out"
              style={{ width: `${(videoCurrentTime / (videoDuration || 1)) * 100}%` }}
            />
          ) : (
            <motion.div 
              key={index}
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: delay / 1000, ease: "linear" }}
              className="h-full bg-gradient-to-r from-violet-500 to-cyan-400"
            />
          )}
        </div>
      )}

      {/* Image / Video rendering with Framer Motion AnimatePresence */}
      <div className="absolute inset-0 z-0">
        <AnimatePresence mode="wait">
          {isVideo ? (
            <motion.video
              key={index}
              src={currentPhoto.url}
              autoPlay
              loop={photos.length === 1 || hasCustomDuration}
              muted
              playsInline
              onTimeUpdate={(e) => {
                const video = e.currentTarget;
                if (video.duration) {
                  setVideoCurrentTime(video.currentTime);
                  setVideoDuration(video.duration);
                }
              }}
              onEnded={() => {
                if (!hasCustomDuration) {
                  setIndex((prev) => (prev + 1) % photos.length);
                }
              }}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="w-full h-full object-cover"
            />
          ) : (
            <motion.img
              key={index}
              src={currentPhoto.url}
              alt={currentPhoto.title || "Slideshow"}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="w-full h-full object-cover"
            />
          )}
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent z-1"></div>
      </div>

      {/* Interactive Controls (Arrows shown on hover) */}
      {photos.length > 1 && (
        <>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setIndex((prev) => (prev - 1 + photos.length) % photos.length);
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full border border-white/10 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover/slide:opacity-100 transition-all duration-300 hover:bg-white hover:text-black z-10 hover:scale-105"
          >
            ←
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setIndex((prev) => (prev + 1) % photos.length);
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full border border-white/10 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover/slide:opacity-100 transition-all duration-300 hover:bg-white hover:text-black z-10 hover:scale-105"
          >
            →
          </button>
        </>
      )}

      {/* Text / Caption Container */}
      <div className="absolute bottom-6 left-6 right-6 z-10 flex justify-between items-end">
        <div className="backdrop-blur-md bg-black/50 border border-white/10 rounded-2xl px-5 py-3 max-w-[70%]">
          <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block mb-1">PORTFOLIO FLAME</span>
          <h4 className="text-xs md:text-sm font-bold text-white tracking-wide">{currentPhoto.title || "Showcase Asset"}</h4>
        </div>

        {/* Indicators */}
        {photos.length > 1 && (
          <div className="flex gap-2 pb-2">
            {photos.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  setIndex(idx);
                }}
                className={`h-1.5 rounded-full transition-all duration-300 ${idx === index ? 'w-6 bg-cyan-400 shadow-[0_0_8px_#00e5ff]' : 'w-2 bg-white/30 hover:bg-white/50'}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function WorkScrollSection({ sections }: { sections: any[] }) {
  if (!sections || sections.length === 0) {
    return (
      <div className="py-32 text-center text-white/30 font-mono text-xs uppercase tracking-widest bg-[#050508] border-y border-white/5">
        No portfolio segments calibrated in settings
      </div>
    );
  }

  return (
    <div className="py-24 px-6 md:px-12 bg-[#050508]">
      <div className="max-w-7xl mx-auto mb-16">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-px w-8 bg-gradient-to-r from-violet-500 to-fuchsia-500" />
          <span className="text-xs font-mono text-violet-400/70 tracking-widest uppercase">Selected Work</span>
        </div>
        <h2 className="text-4xl md:text-5xl font-bold text-white/90 leading-tight">
          The Work That{" "}
          <span style={{ background: "linear-gradient(90deg, #a78bfa, #f472b6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            Defines Us
          </span>
        </h2>
      </div>

      <div className="flex flex-col gap-20 max-w-7xl mx-auto">
        {sections.map((section, sIdx) => (
          <div key={sIdx} className="flex flex-col lg:flex-row gap-8 items-stretch">
            {/* Left Side: Service Card */}
            <div 
              className="w-full lg:w-1/3 flex flex-col justify-between p-8 rounded-3xl border relative overflow-hidden group transition-all duration-500"
              style={{
                background: "rgba(5, 5, 8, 0.6)",
                borderColor: "rgba(255, 255, 255, 0.05)",
                boxShadow: "inset 0 0 30px rgba(255, 255, 255, 0.01)"
              }}
            >
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                style={{
                  background: `radial-gradient(circle at 10% 20%, ${section.service.color}15 0%, transparent 60%)`
                }}
              />
              <div>
                <span 
                  className="inline-flex items-center gap-1.5 text-[10px] font-mono tracking-widest uppercase px-3 py-1 rounded-full border mb-6"
                  style={{
                    color: section.service.accent,
                    borderColor: `${section.service.accent}30`,
                    background: `${section.service.color}10`
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: section.service.accent }} />
                  {section.service.tag}
                </span>
                <div className="text-3xl mb-4">{section.service.icon}</div>
                <h3 className="text-2xl font-bold text-white/90 mb-3">{section.service.title}</h3>
                <p className="text-white/45 font-light text-xs leading-relaxed mb-8">{section.service.desc}</p>
              </div>
              <div className="pt-6 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-white/20">
                <span>DELIVERY IN {section.service.delivery.toUpperCase()}</span>
                <span style={{ color: section.service.accent }}>{section.service.price}</span>
              </div>
            </div>

            {/* Right Side: Dynamic Slideshow */}
            <DynamicSlideshow photos={section.photos} />
          </div>
        ))}
      </div>
    </div>
  );
}

function useMouse() {
  const [pos, setPos] = useState({ x: -200, y: -200 });
  useEffect(() => {
    const h = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", h);
    return () => window.removeEventListener("mousemove", h);
  }, []);
  return pos;
}

function useScrollProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const h = () => {
      const el = document.documentElement;
      setProgress(el.scrollTop / (el.scrollHeight - el.clientHeight));
    };
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);
  return progress;
}

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView] as const;
}

function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let raf: number;
    const particles: { x: number; y: number; vx: number; vy: number; r: number; a: number; da: number }[] = [];
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener("resize", resize);
    for (let i = 0; i < 120; i++) {
      particles.push({
        x: Math.random() * canvas.width, y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 1.5 + 0.3, a: Math.random(), da: (Math.random() - 0.5) * 0.005,
      });
    }
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx; p.y += p.vy; p.a += p.da;
        if (p.x < 0) p.x = canvas.width; if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0;
        if (p.a < 0.1 || p.a > 0.9) p.da *= -1;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(167,139,250,${p.a * 0.6})`; ctx.fill();
      });
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x, dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y); ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(167,139,250,${(1 - dist / 100) * 0.12})`; ctx.lineWidth = 0.5; ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
}

function GlitchText({ text, className = "" }: { text: string; className?: string }) {
  const [glitch, setGlitch] = useState(false);
  useEffect(() => {
    const interval = setInterval(() => {
      setGlitch(true);
      setTimeout(() => setGlitch(false), 180);
    }, 3200 + Math.random() * 1500);
    return () => clearInterval(interval);
  }, []);
  return (
    <span className={`relative inline-block ${className}`}>
      {text}
      {glitch && (
        <>
          <span className="absolute inset-0 text-cyan-400" style={{ clipPath: "inset(20% 0 60% 0)", transform: "translateX(-3px)", opacity: 0.7 }}>{text}</span>
          <span className="absolute inset-0 text-fuchsia-500" style={{ clipPath: "inset(50% 0 20% 0)", transform: "translateX(3px)", opacity: 0.7 }}>{text}</span>
        </>
      )}
    </span>
  );
}

function ScanLine() {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden" style={{ mixBlendMode: "overlay" }}>
      <div className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-violet-400/30 to-transparent" style={{ animation: "scanline 6s linear infinite" }} />
    </div>
  );
}

function StatCounter({ value, label, delay }: { value: string; label: string; delay: number }) {
  const [ref, inView] = useInView(0.3);
  return (
    <div ref={ref} className="text-center" style={{ opacity: inView ? 1 : 0, transform: inView ? "translateY(24px)" : "translateY(0)", transition: `all 0.6s ease ${delay}s` }}>
      <div className="text-4xl font-bold text-white mb-1">{value}</div>
      <div className="text-xs font-mono text-white/40 tracking-widest uppercase">{label}</div>
    </div>
  );
}

function PhilosophySection() {
  const [ref, inView] = useInView(0.15);
  const cards = [
    { icon: "◈", title: "Precision", body: "Every decision is intentional. No decorative noise — only form that serves function." },
    { icon: "◉", title: "Narrative", body: "Design is a language. We craft stories that create genuine emotional resonance." },
    { icon: "◌", title: "Craft", body: "Obsessive attention to detail at every scale — from kerning to full campaign strategy." },
  ];
  return (
    <section ref={ref} className="py-32 px-6 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 100%, rgba(124,58,237,0.06) 0%, transparent 60%)" }} />
      <div className="max-w-5xl mx-auto">
        {/* "NOT SURE WHAT YOU NEED?" Banner */}
        <div 
          className="mb-20 p-8 rounded-3xl border border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden group"
          style={{ 
            background: "rgba(255, 255, 255, 0.01)", 
            backdropFilter: "blur(10px)",
            boxShadow: "inset 0 0 30px rgba(255, 255, 255, 0.01)" 
          }}
        >
          <div 
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
            style={{
              background: "radial-gradient(circle at 10% 20%, rgba(167, 139, 250, 0.08) 0%, transparent 60%)"
            }}
          />
          <div className="relative z-10">
            <span className="text-[10px] font-mono tracking-widest text-violet-400/60 uppercase block mb-1.5">Not sure what you need?</span>
            <h3 className="text-xl md:text-2xl font-bold text-white/90 leading-tight">Let's talk — we'll figure it out together.</h3>
          </div>
          <a 
            href="https://wa.me/917359093035?text=I am interested in starting a visual revolution with Netra Graphics."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full text-xs font-mono tracking-wider transition-all duration-300 border border-violet-500/30 text-violet-300 hover:bg-violet-600 hover:text-white hover:border-violet-500 hover:shadow-[0_0_20px_rgba(124,58,237,0.4)] relative z-10 shrink-0"
          >
            Start a Conversation
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1.5 10.5L10.5 1.5M10.5 1.5H5M10.5 1.5V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
        </div>

        <div className="mb-16 max-w-2xl" style={{ opacity: inView ? 1 : 0, transform: inView ? "none" : "translateY(32px)", transition: "all 0.7s ease" }}>
          <span className="text-xs font-mono text-fuchsia-400/60 tracking-widest uppercase">Our Philosophy</span>
          <h2 className="text-4xl font-bold text-white/90 mt-3 leading-tight">Design that earns<br />its place.</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map((c, i) => (
            <div
              key={c.title}
              className="p-8 rounded-2xl border border-white/6 hover:border-fuchsia-500/30 transition-all duration-500 group"
              style={{ background: "rgba(255,255,255,0.02)", opacity: inView ? 1 : 0, transform: inView ? "none" : "translateY(32px)", transition: `all 0.7s ease ${0.15 + i * 0.15}s` }}
            >
              <span className="text-3xl text-fuchsia-400/60 group-hover:text-fuchsia-400 transition-colors duration-300">{c.icon}</span>
              <h3 className="text-lg font-semibold text-white/80 mt-4 mb-2">{c.title}</h3>
              <p className="text-sm text-white/40 leading-relaxed">{c.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProcessSection() {
  const [ref, inView] = useInView(0.1);
  const [activeStep, setActiveStep] = useState(0);
  const [progressVal, setProgressVal] = useState(0);

  const steps = [
    { n: "01", label: "Discover", desc: "Deep dive into your brand, audience, and competitive landscape.", accent: "#a78bfa", glow: "rgba(167, 139, 250, 0.15)", color: "#7c3aed" },
    { n: "02", label: "Define", desc: "Strategic positioning, creative territories, and a clear design direction.", accent: "#22d3ee", glow: "rgba(34, 211, 238, 0.15)", color: "#0891b2" },
    { n: "03", label: "Design", desc: "Iterative visual exploration with continuous collaborative refinement.", accent: "#f472b6", glow: "rgba(244, 114, 182, 0.15)", color: "#be185d" },
    { n: "04", label: "Deliver", desc: "Production-ready assets, guidelines, and handoff with ongoing support.", accent: "#34d399", glow: "rgba(52, 211, 153, 0.15)", color: "#065f46" },
  ];

  useEffect(() => {
    if (!inView) return;
    let timer: number;
    let startTime = Date.now();
    const duration = 3000;

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min((elapsed / duration) * 100, 100);
      setProgressVal(pct);

      if (elapsed >= duration) {
        setActiveStep((prev) => (prev + 1) % 4);
        startTime = Date.now();
        setProgressVal(0);
      }
      timer = requestAnimationFrame(tick);
    };

    timer = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(timer);
  }, [inView, activeStep]);

  return (
    <section ref={ref} className="py-32 px-6 border-t border-white/5 bg-[#050508]">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-20" style={{ opacity: inView ? 1 : 0, transform: inView ? "none" : "translateY(24px)", transition: "all 0.6s ease" }}>
          <span className="text-xs font-mono text-cyan-400/60 tracking-widest uppercase">How We Work</span>
          <h2 className="text-4xl font-bold text-white/90 mt-3">A process built for clarity</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 relative">
          {/* Background Timeline bar */}
          <div className="hidden md:block absolute top-[48px] left-[12%] right-[12%] h-[1.5px]" style={{ background: "rgba(255,255,255,0.03)" }}>
            <div 
              className="h-full transition-all duration-300 ease-out relative" 
              style={{ 
                width: `${(activeStep / 3) * 100}%`,
                background: `linear-gradient(to right, #a78bfa, #22d3ee 50%, #34d399 100%)`
              }}
            >
              <div 
                className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full filter blur-[2px] transition-all duration-300"
                style={{ 
                  background: steps[activeStep].accent,
                  boxShadow: `0 0 12px ${steps[activeStep].accent}`
                }}
              />
            </div>
          </div>

          {steps.map((s, i) => {
            const isActive = activeStep === i;
            return (
              <div 
                key={s.n} 
                className="relative p-6 text-center rounded-2xl border transition-all duration-500 cursor-pointer"
                style={{ 
                  opacity: inView ? 1 : 0, 
                  transform: inView 
                    ? (isActive ? "scale(1.05) translateY(-4px)" : "scale(0.97)")
                    : "translateY(32px)", 
                  transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
                  background: isActive ? "rgba(255,255,255,0.015)" : "transparent",
                  borderColor: isActive ? s.accent : "rgba(255,255,255,0.04)",
                  boxShadow: isActive ? `0 10px 30px ${s.glow}` : "none"
                }}
              >
                <div 
                  className="w-16 h-16 rounded-full border flex items-center justify-center mx-auto mb-6 transition-all duration-500 relative" 
                  style={{ 
                    background: isActive ? `${s.color}20` : "rgba(255,255,255,0.02)",
                    borderColor: isActive ? "transparent" : "rgba(255,255,255,0.1)",
                    color: isActive ? s.accent : "rgba(255,255,255,0.3)"
                  }}
                >
                  <span className="text-sm font-mono font-bold">{s.n}</span>
                  {isActive && (
                    <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 64 64">
                      <circle 
                        cx="32" 
                        cy="32" 
                        r="30" 
                        stroke={s.accent} 
                        strokeWidth="2" 
                        fill="none" 
                        strokeDasharray="188.5" 
                        strokeDashoffset={188.5 - (progressVal * 188.5) / 100}
                        style={{ transition: "none" }}
                      />
                    </svg>
                  )}
                </div>
                <h3 
                  className="text-base font-semibold mb-2 transition-colors duration-300"
                  style={{ color: isActive ? s.accent : "rgba(255,255,255,0.7)" }}
                >
                  {s.label}
                </h3>
                <p 
                  className="text-xs leading-relaxed transition-colors duration-300"
                  style={{ color: isActive ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.3)" }}
                >
                  {s.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function CTASection({ onContactClick }: { onContactClick?: () => void }) {
  const [ref, inView] = useInView(0.2);
  const [hovered, setHovered] = useState(false);
  return (
    <section ref={ref} className="py-40 px-6 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(124,58,237,0.12) 0%, transparent 70%)" }} />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-violet-500/10" style={{ width: `${(i + 1) * 200}px`, height: `${(i + 1) * 200}px`, animation: `pulseRing ${3 + i}s ease-out ${i * 0.8}s infinite` }} />
        ))}
      </div>
      <div className="relative z-10 max-w-2xl mx-auto text-center" style={{ opacity: inView ? 1 : 0, transform: inView ? "none" : "translateY(40px)", transition: "all 0.8s ease" }}
        onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
        <span className="text-xs font-mono text-violet-400/60 tracking-widest uppercase mb-6 block">Start a Project</span>
        <h2 className="text-5xl md:text-6xl font-bold text-white/90 mb-6 leading-tight">
          Let's build something<br />
          <span style={{ background: "linear-gradient(135deg, #7c3aed, #22d3ee)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>worth remembering</span>
        </h2>
        <p className="text-sm text-white/40 mb-10 leading-relaxed">We take on a limited number of projects each quarter to ensure every client gets the focus they deserve.</p>
        <a href="#" onClick={(e) => { e.preventDefault(); onContactClick?.(); }} className="inline-flex items-center gap-3 px-10 py-4 rounded-full text-sm font-mono tracking-wider transition-all duration-500"
          style={{ background: hovered ? "linear-gradient(135deg, #7c3aed, #22d3ee)" : "transparent", border: `1px solid ${hovered ? "transparent" : "rgba(124,58,237,0.5)"}`, color: hovered ? "#fff" : "rgba(167,139,250,0.8)", boxShadow: hovered ? "0 0 40px rgba(124,58,237,0.5)" : "none" }}>
          Get in Touch
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 12L12 2M12 2H5M12 2V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </div>
    </section>
  );
}

export function Portfolio({ 
  onContactClick,
  visionSettings,
  servicesList
}: { 
  onContactClick?: () => void;
  visionSettings?: any[];
  servicesList?: any[];
}) {
  const mouse = useMouse();
  const scrollProgress = useScrollProgress();
  const cursorRef = useRef<HTMLDivElement>(null);
  const cursorDotRef = useRef<HTMLDivElement>(null);
  const ring1Ref = useRef<HTMLDivElement>(null);
  const ring2Ref = useRef<HTMLDivElement>(null);
  const ring3Ref = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const cursorX = useRef(-200);
  const cursorY = useRef(-200);
  const lerpX = useRef(-200);
  const lerpY = useRef(-200);
  const parallaxX = useRef(0);
  const parallaxY = useRef(0);

  useEffect(() => { cursorX.current = mouse.x; cursorY.current = mouse.y; }, [mouse]);

  useEffect(() => {
    let raf: number;
    const animate = () => {
      lerpX.current += (cursorX.current - lerpX.current) * 0.45;
      lerpY.current += (cursorY.current - lerpY.current) * 0.45;
      if (cursorRef.current) cursorRef.current.style.transform = `translate(${lerpX.current - 16}px, ${lerpY.current - 16}px)`;
      if (cursorDotRef.current) cursorDotRef.current.style.transform = `translate(${cursorX.current - 3}px, ${cursorY.current - 3}px)`;

      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const rawX = (lerpX.current - cx) / cx;
      const rawY = (lerpY.current - cy) / cy;
      parallaxX.current += (rawX - parallaxX.current) * 0.06;
      parallaxY.current += (rawY - parallaxY.current) * 0.06;
      const px = parallaxX.current;
      const py = parallaxY.current;

      if (ring1Ref.current) ring1Ref.current.style.transform = `translate(${px * 28}px, ${py * 28}px)`;
      if (ring2Ref.current) ring2Ref.current.style.transform = `translate(${px * 18}px, ${py * 18}px)`;
      if (ring3Ref.current) ring3Ref.current.style.transform = `translate(${px * 10}px, ${py * 10}px)`;
      if (glowRef.current) glowRef.current.style.transform = `translate(${px * 36}px, ${py * 36}px)`;

      raf = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(raf);
  }, []);

  // Compute dynamic portfolio segments based on admin selections
  const activeServicesList = servicesList || [];
  const activeVisionSettings = visionSettings || [];

  const dynamicSections = activeVisionSettings.map((vSetting: any) => {
    const svc = activeServicesList.find((s: any) => s.id === vSetting.serviceId);
    if (!svc) return null;

    const tag = (svc.tag || "BRANDING").toUpperCase();
    const color = CATEGORY_COLORS[tag] || "#7c3aed";
    const accent = color === "#00d4ff" ? "#a78bfa" : color;

    return {
      service: {
        id: svc.id,
        tag: svc.tag,
        icon: svc.icon || "⚡",
        title: svc.title,
        desc: svc.desc,
        delivery: svc.delivery,
        price: svc.price,
        color: color,
        accent: accent
      },
      photos: vSetting.photos || []
    };
  }).filter(Boolean);

  return (
    <div className="min-h-screen text-white" style={{ background: "#050508", cursor: "none", overflowX: "clip" }}>
      <style>{`
        @keyframes scanline { 0% { top: -2px; } 100% { top: 100%; } }
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-12px); } }
        @keyframes pulseRing { 0% { transform: scale(1); opacity: 0.6; } 100% { transform: scale(1.8); opacity: 0; } }
        @keyframes rotateSlow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes rotateReverse { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
        @keyframes fadeSlideUp { 0% { opacity: 0; transform: translateY(30px); } 100% { opacity: 1; transform: translateY(0); } }
        @keyframes hologram { 0%, 100% { opacity: 1; } 50% { opacity: 0.85; } }
        @keyframes tickerScroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .cursor-ring { position: fixed; top: 0; left: 0; width: 32px; height: 32px; border: 1px solid rgba(167,139,250,0.6); border-radius: 50%; pointer-events: none; z-index: 9999; mix-blend-mode: difference; }
        .cursor-dot { position: fixed; top: 0; left: 0; width: 6px; height: 6px; background: #a78bfa; border-radius: 50%; pointer-events: none; z-index: 9999; }
        .noise-overlay { position: fixed; inset: 0; z-index: 1; opacity: 0.025; pointer-events: none; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E"); }
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
      `}</style>

      <div ref={cursorRef} className="cursor-ring" />
      <div ref={cursorDotRef} className="cursor-dot" />
      <ScanLine />
      <div className="noise-overlay" />

      <div className="fixed top-0 left-0 z-50 h-0.5 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-400 transition-all duration-100" style={{ width: `${scrollProgress * 100}%` }} />

      {/* Hero */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-6">
        <ParticleField />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div ref={ring1Ref} className="w-[600px] h-[600px] rounded-full border border-violet-900/30 absolute" style={{ animation: "rotateSlow 30s linear infinite" }} />
          <div ref={ring2Ref} className="w-[400px] h-[400px] rounded-full border border-fuchsia-900/20 absolute" style={{ animation: "rotateReverse 20s linear infinite" }} />
          <div ref={ring3Ref} className="w-[800px] h-[800px] rounded-full border border-cyan-900/10 absolute" />
          <div ref={glowRef} className="w-96 h-96 rounded-full absolute" style={{ background: "radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)" }} />
        </div>

        <div className="relative z-10 text-center max-w-5xl mx-auto">
          <h1 className="text-6xl md:text-8xl font-bold leading-none mb-6 tracking-tight" style={{ animation: "fadeSlideUp 0.8s ease 0.2s both" }}>
            <GlitchText text="Crafting" className="block text-white" />
            <span className="block" style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899, #22d3ee)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              Narratives
            </span>
            <span className="block text-white/20 text-5xl md:text-7xl font-light">through Design</span>
          </h1>
          <p className="text-base text-white/45 max-w-xl mx-auto leading-relaxed font-light" style={{ animation: "fadeSlideUp 0.8s ease 0.4s both" }}>
            A design studio at the intersection of aesthetics and impact — building brand systems, motion, and digital experiences that move people.
          </p>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2" style={{ animation: "float 3s ease-in-out infinite" }}>
          <span className="text-xs font-mono text-white/20 tracking-widest uppercase">Scroll</span>
          <div className="w-px h-10 bg-gradient-to-b from-white/20 to-transparent" />
        </div>
      </section>

      {/* Stats */}
      <section className="relative py-24 px-6 border-y border-white/5" style={{ background: "rgba(255,255,255,0.015)" }}>
        <div className="max-w-3xl mx-auto grid grid-cols-3 gap-6 md:gap-12">
          <StatCounter value="6+" label="Years Active" delay={0} />
          <StatCounter value="120+" label="Projects Shipped" delay={0.1} />
          <StatCounter value="38" label="Global Clients" delay={0.2} />
        </div>
      </section>

      <WorkScrollSection sections={dynamicSections} />

      <PhilosophySection />
      <ProcessSection />
      <CTASection onContactClick={onContactClick} />

      <footer className="py-10 px-10 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
        <span className="font-mono text-xs text-white/25 tracking-wider">© 2024 Netra Graphics. All rights reserved.</span>
        <span className="font-mono text-xs text-white/15 tracking-widest">NG — MMXXIV</span>
      </footer>
    </div>
  );
}
