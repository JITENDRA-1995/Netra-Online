import { useEffect, useRef, useState, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X, ArrowLeft, Volume2, VolumeX } from "lucide-react";

const CATEGORY_COLORS: Record<string, string> = {
  BRANDING: "#00d4ff",
  PRINT: "#10b981",
  DIGITAL: "#8b5cf6",
  VIDEO: "#ec4899",
  EVENT: "#f59e0b",
  COMMERCIAL: "#f97316",
};

// Autoplay Slideshow for showcase photos of a service card
function DynamicSlideshow({ 
  photos, 
  serviceTitle,
  serviceTag
}: { 
  photos: { 
    url: string; 
    title: string; 
    duration?: number;
    fit?: string;
    scale?: number;
    positionX?: number;
    positionY?: number;
    brightness?: number;
    contrast?: number;
    saturation?: number;
    grayscale?: number;
    hueRotate?: number;
  }[];
  serviceTitle?: string;
  serviceTag?: string;
}) {
  const [index, setIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [videoCurrentTime, setVideoCurrentTime] = useState<number>(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

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

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIndex((prev) => (prev + 1) % photos.length);
  };

  // Lightbox keyboard controls
  useEffect(() => {
    if (!isLightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsLightboxOpen(false);
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "ArrowRight") {
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLightboxOpen, photos.length]);

  useEffect(() => {
    if (isHovered || isLightboxOpen || !photos || photos.length <= 1 || !currentPhoto) return;

    // For videos with no custom duration, transition onEnded callback instead of timer
    if (isVideo && !hasCustomDuration) return;

    const timer = setTimeout(() => {
      setIndex((prev) => (prev + 1) % photos.length);
    }, delay);

    return () => clearTimeout(timer);
  }, [index, isHovered, isLightboxOpen, photos, isVideo, hasCustomDuration, delay]);

  if (!photos || photos.length === 0) {
    return (
      <div className="w-full h-[480px] md:h-[540px] rounded-3xl border border-white/5 bg-white/[0.01] flex flex-col items-center justify-center text-white/20 font-mono text-xs gap-2">
        <span className="text-3xl">📷</span>
        <span>NO PORTFOLIO IMAGES CALIBRATED FOR {serviceTitle?.toUpperCase()}</span>
      </div>
    );
  }

  return (
    <div 
      className="w-full h-[480px] md:h-[540px] rounded-3xl border border-white/5 relative overflow-hidden group/slide cursor-pointer shadow-[0_15px_35px_rgba(0,0,0,0.5)]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => setIsLightboxOpen(true)}
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
              muted={isMuted}
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
              initial={{ opacity: 0, scale: (currentPhoto.scale ?? 1) * 1.05 }}
              animate={{ opacity: 1, scale: currentPhoto.scale ?? 1 }}
              exit={{ opacity: 0, scale: (currentPhoto.scale ?? 1) * 0.95 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="w-full h-full"
              style={{
                objectFit: currentPhoto.fit as any || 'cover',
                objectPosition: `${(currentPhoto.positionX ?? 0) + 50}% ${(currentPhoto.positionY ?? 0) + 50}%`,
                filter: `brightness(${currentPhoto.brightness ?? 100}%) contrast(${currentPhoto.contrast ?? 100}%) saturate(${currentPhoto.saturation ?? 100}%) grayscale(${currentPhoto.grayscale ?? 0}%) hue-rotate(${currentPhoto.hueRotate ?? 0}deg)`
              }}
            />
          ) : (
            <motion.img
              key={index}
              src={currentPhoto.url}
              alt={currentPhoto.title || "Slideshow"}
              initial={{ opacity: 0, scale: (currentPhoto.scale ?? 1) * 1.05 }}
              animate={{ opacity: 1, scale: currentPhoto.scale ?? 1 }}
              exit={{ opacity: 0, scale: (currentPhoto.scale ?? 1) * 0.95 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="w-full h-full"
              style={{
                objectFit: currentPhoto.fit as any || 'cover',
                objectPosition: `${(currentPhoto.positionX ?? 0) + 50}% ${(currentPhoto.positionY ?? 0) + 50}%`,
                filter: `brightness(${currentPhoto.brightness ?? 100}%) contrast(${currentPhoto.contrast ?? 100}%) saturate(${currentPhoto.saturation ?? 100}%) grayscale(${currentPhoto.grayscale ?? 0}%) hue-rotate(${currentPhoto.hueRotate ?? 0}deg)`
              }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Mute/Unmute Toggle Button */}
      {isVideo && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsMuted(!isMuted);
          }}
          className="absolute right-4 top-4 z-30 w-10 h-10 rounded-full border border-white/10 bg-black/60 text-white flex items-center justify-center hover:bg-white hover:text-black transition-all hover:scale-105 duration-200 cursor-pointer"
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      )}

      {/* Interactive Controls (Arrows shown on hover) */}
      {photos.length > 1 && (
        <>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              handlePrev(e);
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full border border-white/10 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover/slide:opacity-100 transition-all duration-300 hover:bg-white hover:text-black z-10 hover:scale-105"
          >
            ←
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              handleNext(e);
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full border border-white/10 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover/slide:opacity-100 transition-all duration-300 hover:bg-white hover:text-black z-10 hover:scale-105"
          >
            →
          </button>
        </>
      )}

      {/* Service Name Header Overlay (Top center with transparent backdrop) */}
      {serviceTitle && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 text-center select-none w-full max-w-[85%] pointer-events-none">
          <div className="inline-block backdrop-blur-md bg-black/45 border border-white/5 rounded-2xl px-6 py-3 shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
            <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest block mb-0.5">
              {serviceTag || "PORTFOLIO"}
            </span>
            <h3 className="text-sm md:text-base font-extrabold text-white tracking-wider">
              {serviceTitle}
            </h3>
          </div>
        </div>
      )}

      {/* Centered Indicators at the bottom */}
      {photos.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex gap-2">
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

      {/* Lightbox Extended Preview Modal */}
      <AnimatePresence>
        {isLightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 backdrop-blur-md"
            onClick={(e) => {
              e.stopPropagation();
              setIsLightboxOpen(false);
            }}
          >
            {/* Close Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsLightboxOpen(false);
              }}
              className="absolute top-6 right-6 w-12 h-12 rounded-full border border-white/10 bg-black/40 hover:bg-white hover:text-black flex items-center justify-center text-white transition-all hover:scale-105 duration-200 cursor-pointer z-50 animate-fadeSlideUp"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Navigation Controls */}
            {photos.length > 1 && (
              <>
                <button
                  onClick={handlePrev}
                  className="absolute left-6 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full border border-white/10 bg-black/40 text-white hover:bg-white hover:text-black flex items-center justify-center transition-all hover:scale-105 duration-200 cursor-pointer z-50"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-6 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full border border-white/10 bg-black/40 text-white hover:bg-white hover:text-black flex items-center justify-center transition-all hover:scale-105 duration-200 cursor-pointer z-50"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            {/* Media Content Viewer */}
            <div 
              className="relative max-w-[90vw] max-h-[80vh] flex items-center justify-center select-none"
              onClick={(e) => e.stopPropagation()}
            >
              <AnimatePresence mode="wait">
                {isVideo ? (
                  <motion.video
                    key={index}
                    src={currentPhoto.url}
                    autoPlay
                    controls
                    initial={{ opacity: 0, scale: (currentPhoto.scale ?? 1) * 0.95 }}
                    animate={{ opacity: 1, scale: currentPhoto.scale ?? 1 }}
                    exit={{ opacity: 0, scale: (currentPhoto.scale ?? 1) * 0.95 }}
                    className="max-w-full max-h-[80vh] rounded-2xl border border-white/10 shadow-[0_0_50px_rgba(255,255,255,0.05)]"
                    style={{
                      objectFit: currentPhoto.fit as any || 'contain',
                      objectPosition: `${(currentPhoto.positionX ?? 0) + 50}% ${(currentPhoto.positionY ?? 0) + 50}%`,
                      filter: `brightness(${currentPhoto.brightness ?? 100}%) contrast(${currentPhoto.contrast ?? 100}%) saturate(${currentPhoto.saturation ?? 100}%) grayscale(${currentPhoto.grayscale ?? 0}%) hue-rotate(${currentPhoto.hueRotate ?? 0}deg)`
                    }}
                  />
                ) : (
                  <motion.img
                    key={index}
                    src={currentPhoto.url}
                    alt={currentPhoto.title || "Slideshow"}
                    initial={{ opacity: 0, scale: (currentPhoto.scale ?? 1) * 0.95 }}
                    animate={{ opacity: 1, scale: currentPhoto.scale ?? 1 }}
                    exit={{ opacity: 0, scale: (currentPhoto.scale ?? 1) * 0.95 }}
                    transition={{ duration: 0.3 }}
                    className="max-w-full max-h-[80vh] rounded-2xl border border-white/10 shadow-[0_0_50px_rgba(255,255,255,0.05)]"
                    style={{
                      objectFit: currentPhoto.fit as any || 'contain',
                      objectPosition: `${(currentPhoto.positionX ?? 0) + 50}% ${(currentPhoto.positionY ?? 0) + 50}%`,
                      filter: `brightness(${currentPhoto.brightness ?? 100}%) contrast(${currentPhoto.contrast ?? 100}%) saturate(${currentPhoto.saturation ?? 100}%) grayscale(${currentPhoto.grayscale ?? 0}%) hue-rotate(${currentPhoto.hueRotate ?? 0}deg)`
                    }}
                  />
                )}
              </AnimatePresence>
            </div>

            {/* Cyber Info Caption Overlay */}
            <div 
              className="absolute bottom-8 px-6 py-3 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-md flex flex-col items-center justify-center text-center select-none"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="text-[9px] font-mono text-cyan-400 uppercase tracking-widest mb-0.5">
                Extended Calibration Preview
              </span>
              <h4 className="text-sm font-bold text-white tracking-wide">
                {currentPhoto.title || "Showcase Asset"}
              </h4>
              <span className="text-[9px] font-mono text-muted-foreground/60 mt-1">
                SLIDE {index + 1} OF {photos.length}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function WorkScrollSection({ 
  sections,
  onPhotoSelect,
  selectedCategory,
  setSelectedCategory
}: { 
  sections: any[]; 
  onPhotoSelect: (photo: any) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
}) {
  if (!sections || sections.length === 0) {
    return (
      <div className="py-32 text-center text-white/30 font-mono text-xs uppercase tracking-widest bg-[#050508] border-y border-white/5">
        No portfolio segments calibrated in settings
      </div>
    );
  }

  // Flatten photos when ALL is active, or filter by category
  const displayedPhotos = (() => {
    if (selectedCategory === "ALL") {
      return sections.flatMap((section: any) => 
        (section?.photos || [])
          .filter((photo: any) => photo && typeof photo === 'object')
          .map((photo: any) => ({
            ...photo,
            section
          }))
      );
    } else {
      const section = sections.find((s: any) => s?.service?.id?.toString() === selectedCategory);
      if (!section || !section.photos) return [];
      return section.photos
        .filter((photo: any) => photo && typeof photo === 'object')
        .map((photo: any) => ({
          ...photo,
          section
        }));
    }
  })();

  return (
    <div className="py-24 px-6 md:px-12 bg-[#050508]">
      <div className="max-w-7xl mx-auto mb-16">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-px w-8 bg-gradient-to-r from-violet-500 to-fuchsia-500" />
          <span className="text-xs font-mono text-violet-400/70 tracking-widest uppercase">Selected Work</span>
        </div>
        <h2 className="text-4xl md:text-5xl font-bold text-white/90 leading-tight text-left">
          The Work That{" "}
          <span style={{ background: "linear-gradient(90deg, #a78bfa, #f472b6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            Defines Us
          </span>
        </h2>
      </div>

      {/* Category Tabs Menu */}
      <div className="max-w-7xl mx-auto mb-12 flex flex-wrap gap-3 justify-start select-none category-menu-bar">
        <button
          onClick={() => setSelectedCategory("ALL")}
          className={`px-6 py-2.5 rounded-full text-xs font-semibold tracking-wider transition-all duration-300 border cursor-pointer ${
            selectedCategory === "ALL"
              ? "bg-[#8b5cf6] border-[#8b5cf6] text-white shadow-[0_0_15px_rgba(139,92,246,0.3)]"
              : "bg-transparent border-white/10 text-white/60 hover:text-white hover:border-white/30"
          }`}
        >
          All
        </button>
        {sections.map((section: any) => (
          <button
            key={section.service.id}
            onClick={() => setSelectedCategory(section.service.id.toString())}
            className={`px-6 py-2.5 rounded-full text-xs font-semibold tracking-wider transition-all duration-300 border cursor-pointer ${
              selectedCategory === section.service.id.toString()
                ? "bg-[#8b5cf6] border-[#8b5cf6] text-white shadow-[0_0_15px_rgba(139,92,246,0.3)]"
                : "bg-transparent border-white/10 text-white/60 hover:text-white hover:border-white/30"
            }`}
          >
            {section.service.title}
          </button>
        ))}
      </div>

      {/* Card Grid */}
      {displayedPhotos.length > 0 ? (
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 portfolio-card-grid">
          {displayedPhotos.map((photo: any, idx: number) => {
            const isVideo = photo.url ? (photo.url.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i) || photo.url.includes("video") || photo.url.startsWith("data:video/")) : false;
            return (
              <div
                key={idx}
                onClick={() => onPhotoSelect(photo)}
                className="group/card relative h-[300px] md:h-[380px] rounded-3xl overflow-hidden border border-white/5 bg-white/[0.01] cursor-pointer hover:border-white/15 hover:shadow-[0_15px_30px_rgba(0,0,0,0.4)] transition-all duration-500 hover:-translate-y-1"
              >
                <div className="absolute inset-0 z-0">
                  {isVideo ? (
                    <video
                      src={photo.url}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-105"
                      muted
                      loop
                      autoPlay
                      playsInline
                      style={{
                        objectFit: photo.fit || 'cover',
                        objectPosition: `${(photo.positionX ?? 0) + 50}% ${(photo.positionY ?? 0) + 50}%`,
                        filter: `brightness(${photo.brightness ?? 100}%) contrast(${photo.contrast ?? 100}%) saturate(${photo.saturation ?? 100}%) grayscale(${photo.grayscale ?? 0}%) hue-rotate(${photo.hueRotate ?? 0}deg)`
                      }}
                    />
                  ) : (
                    <img
                      src={photo.url}
                      alt={photo.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-105"
                      style={{
                        objectFit: photo.fit || 'cover',
                        objectPosition: `${(photo.positionX ?? 0) + 50}% ${(photo.positionY ?? 0) + 50}%`,
                        filter: `brightness(${photo.brightness ?? 100}%) contrast(${photo.contrast ?? 100}%) saturate(${photo.saturation ?? 100}%) grayscale(${photo.grayscale ?? 0}%) hue-rotate(${photo.hueRotate ?? 0}deg)`
                      }}
                    />
                  )}
                </div>

                {/* Card Header Overlay */}
                <div className="absolute bottom-6 left-6 right-6 z-10 text-left drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                  <span className="text-[9px] font-mono text-cyan-400 uppercase tracking-widest block mb-1">
                    {photo.section?.service?.tag || "SHOWCASE"}
                  </span>
                  <h3 className="text-lg font-bold text-white tracking-wide">
                    {photo.title}
                  </h3>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="max-w-7xl mx-auto h-[250px] border border-white/5 border-dashed rounded-3xl flex flex-col items-center justify-center text-white/20 text-xs font-mono uppercase tracking-widest">
          <span>No portfolio works match the selected criteria</span>
        </div>
      )}
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

const getPhotoMetadata = (photo: any, service: any) => {
  const title = photo.title || "Showcase Asset";
  const serviceName = service?.title || "Creative Design";
  
  // Extract client name from photo title if client field is empty
  let client = photo.client || "";
  if (!client) {
    const words = title.split(' ');
    if (words.length > 1) {
      const firstWord = words[0];
      const secondWord = words[1];
      if (firstWord.toLowerCase() === 'terra' && secondWord.toLowerCase() === 'café') {
        client = "Terra Café";
      } else if (firstWord.toLowerCase() === 'nexus' && secondWord.toLowerCase() === 'tech') {
        client = "Nexus Tech";
      } else {
        const lowerWord = firstWord.toLowerCase();
        if (lowerWord === 'aurora') client = "Aurora Wellness";
        else if (lowerWord === 'prism') client = "Prism Media";
        else if (lowerWord === 'velvet') client = "Velvet Magazine";
        else if (lowerWord === 'helix') client = "Helix App";
        else if (lowerWord === 'nexus') client = "Nexus Tech";
        else client = firstWord + " Co.";
      }
    } else {
      client = title + " Client";
    }
  }

  // Extract year
  const year = photo.year || "2024";

  // Extract brief
  let brief = photo.brief || "";
  if (!brief) {
    if (client.startsWith("Aurora")) {
      brief = "A comprehensive visual identity for a luxury wellness brand focusing on serenity, balance, and modern elegance. The project involved creating a new logo mark, color palette, typography system, and packaging guidelines.";
    } else if (client.startsWith("Velvet")) {
      brief = "An editorial and print publication design for Velvet Magazine, showcasing visual excellence, editorial layout design, and refined typography hierarchies that resonate with modern art and style enthusiasts.";
    } else if (client.startsWith("Prism")) {
      brief = "A futuristic motion identity and brand trailer utilizing sleek 3D dynamics and glowing neon aesthetics to communicate high-tech intelligence and computational velocity.";
    } else if (client.startsWith("Terra")) {
      brief = "An organic, tactile packaging design and branding execution for Terra Café, reflecting earthly elements, sustainable materials, and a hand-crafted sensory brand experience.";
    } else if (client.startsWith("Helix")) {
      brief = "A high-fidelity interactive user interface and design system for the Helix mobile application, optimizing micro-interactions, layout ergonomics, and a premium neon-dark aesthetic.";
    } else {
      brief = `A comprehensive creative direction and execution for ${client}. The project focused on aligning visual touchpoints, enhancing modern brand value, and establishing a cohesive design system across all active marketing channels.`;
    }
  }

  return { client, service: serviceName, year, brief };
};

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
    if (!vSetting) return null;
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

  const activeSections = dynamicSections.filter((s: any) => s && s.photos && s.photos.length > 0);

  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedPhoto, setSelectedPhoto] = useState<any | null>(null);

  // Scroll to top when selected photo changes
  useEffect(() => {
    if (selectedPhoto) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [selectedPhoto]);

  // Handle browser back button for portfolio slides
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const state = event.state;
      if (state && state.page === 'vision' && state.photoUrl) {
        const found = activeSections
          .flatMap((s: any) => s.photos.map((p: any) => ({ ...p, section: s })))
          .find((p: any) => p.url === state.photoUrl);
        if (found) setSelectedPhoto(found);
        else setSelectedPhoto(null);
      } else {
        setSelectedPhoto(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeSections]);

  // Restore active slide on mount/refresh if deep linked
  useEffect(() => {
    const state = window.history.state;
    if (state && state.page === 'vision' && state.photoUrl) {
      const found = activeSections
        .flatMap((s: any) => s.photos.map((p: any) => ({ ...p, section: s })))
        .find((p: any) => p.url === state.photoUrl);
      if (found && (!selectedPhoto || selectedPhoto.url !== found.url)) {
        setSelectedPhoto(found);
      }
    }
  }, [activeSections]);

  const handlePhotoSelect = (photo: any) => {
    setSelectedPhoto(photo);
    window.history.pushState({ page: 'vision', photoUrl: photo.url }, '');
  };

  // Sibling photos
  const siblingPhotos = useMemo(() => {
    if (!selectedPhoto || !selectedPhoto.section || !selectedPhoto.section.photos) return [];
    return selectedPhoto.section.photos.filter((p: any) => p && p.url && p.url !== selectedPhoto.url);
  }, [selectedPhoto]);

  // Next section
  const nextSection = useMemo(() => {
    if (!selectedPhoto || !selectedPhoto.section || !selectedPhoto.section.service || activeSections.length <= 1) return null;
    const currentIdx = activeSections.findIndex((s: any) => s && s.service && s.service.id === selectedPhoto.section.service.id);
    if (currentIdx === -1) return null;
    const nextIdx = (currentIdx + 1) % activeSections.length;
    return activeSections[nextIdx];
  }, [selectedPhoto, activeSections]);

  const meta = useMemo(() => {
    if (!selectedPhoto) return null;
    return getPhotoMetadata(selectedPhoto, selectedPhoto.section?.service);
  }, [selectedPhoto]);

  const handleSiblingClick = (sibling: any) => {
    const photo = {
      ...sibling,
      section: selectedPhoto.section
    };
    setSelectedPhoto(photo);
    window.history.replaceState({ page: 'vision', photoUrl: photo.url }, '');
  };

  const handleUpNextClick = () => {
    if (!nextSection || !nextSection.photos || nextSection.photos.length === 0) return;
    const photo = {
      ...nextSection.photos[0],
      section: nextSection
    };
    setSelectedPhoto(photo);
    window.history.replaceState({ page: 'vision', photoUrl: photo.url }, '');
  };

  if (selectedPhoto) {
    const isVideo = selectedPhoto.url ? (selectedPhoto.url.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i) || selectedPhoto.url.includes("video") || selectedPhoto.url.startsWith("data:video/")) : false;
    return (
      <div className="min-h-screen text-white bg-[#050508]" style={{ cursor: "none", overflowX: "clip" }}>
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

        <div className="py-24 px-6 md:px-12 max-w-7xl mx-auto detail-page-container">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
            <div className="text-left">
              <button 
                onClick={() => {
                  const state = window.history.state;
                  if (state && state.page === 'vision' && state.photoUrl) {
                    window.history.back();
                  } else {
                    setSelectedPhoto(null);
                  }
                }}
                className="flex items-center gap-2 text-xs font-mono text-white/50 hover:text-white uppercase tracking-wider mb-6 group/back bg-transparent border-0 cursor-pointer p-0 outline-none"
              >
                <ArrowLeft className="w-4 h-4 transition-transform group-hover/back:-translate-x-1" />
                Back to Archive
              </button>
              
              <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight">
                {selectedPhoto.title || "Showcase Project"}
              </h1>
            </div>

            {/* Metadata Table */}
            <div className="flex gap-12 text-left md:text-right border-l md:border-l-0 md:border-r border-white/10 pl-6 md:pl-0 md:pr-6 py-2 shrink-0">
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest block">Client</span>
                  <span className="text-sm font-bold text-white mt-1 block">{meta?.client}</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest block">Services</span>
                  <span className="text-sm font-bold text-white mt-1 block">{meta?.service}</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest block">Year</span>
                  <span className="text-sm font-bold text-white mt-1 block">{meta?.year}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Large Media */}
          <div 
            className="w-full h-[450px] md:h-[600px] rounded-3xl border border-white/5 relative overflow-hidden bg-black/60 shadow-[0_20px_50px_rgba(0,0,0,0.6)] mb-16"
          >
            {isVideo ? (
              <video 
                src={selectedPhoto.url} 
                autoPlay
                controls
                loop
                muted
                playsInline
                className="w-full h-full"
                style={{
                  objectFit: selectedPhoto.fit || 'cover',
                  objectPosition: `${(selectedPhoto.positionX ?? 0) + 50}% ${(selectedPhoto.positionY ?? 0) + 50}%`,
                  transform: `scale(${selectedPhoto.scale ?? 1})`,
                  filter: `brightness(${selectedPhoto.brightness ?? 100}%) contrast(${selectedPhoto.contrast ?? 100}%) saturate(${selectedPhoto.saturation ?? 100}%) grayscale(${selectedPhoto.grayscale ?? 0}%) hue-rotate(${selectedPhoto.hueRotate ?? 0}deg)`
                }}
              />
            ) : (
              <img 
                src={selectedPhoto.url} 
                alt={selectedPhoto.title || "Showcase image"} 
                className="w-full h-full"
                style={{
                  objectFit: selectedPhoto.fit || 'cover',
                  objectPosition: `${(selectedPhoto.positionX ?? 0) + 50}% ${(selectedPhoto.positionY ?? 0) + 50}%`,
                  transform: `scale(${selectedPhoto.scale ?? 1})`,
                  filter: `brightness(${selectedPhoto.brightness ?? 100}%) contrast(${selectedPhoto.contrast ?? 100}%) saturate(${selectedPhoto.saturation ?? 100}%) grayscale(${selectedPhoto.grayscale ?? 0}%) hue-rotate(${selectedPhoto.hueRotate ?? 0}deg)`
                }}
              />
            )}
          </div>

          {/* The Brief & Project Description */}
          <div className="max-w-3xl text-left mb-24">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">The Brief</h2>
            <p className="text-white/70 text-base md:text-lg leading-relaxed font-light">
              {meta?.brief}
            </p>
          </div>

          {/* Sibling Photos Grid */}
          {siblingPhotos.length > 0 && (
            <div className="border-t border-white/5 pt-16 mb-24 text-left">
              <h3 className="text-xl font-bold text-white text-left mb-8 uppercase tracking-wider">
                More from {meta?.service}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {siblingPhotos.map((sibling: any, idx: number) => (
                  <div 
                    key={idx}
                    onClick={() => handleSiblingClick(sibling)}
                    className="group/sibling relative h-[250px] md:h-[300px] rounded-2xl overflow-hidden border border-white/5 bg-white/[0.01] cursor-pointer hover:border-white/15 transition-all duration-300 shadow-md hover:shadow-lg"
                  >
                    <div className="absolute inset-0 z-0">
                      {(() => {
                        const isSiblingVideo = sibling.url ? (sibling.url.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i) || sibling.url.includes("video") || sibling.url.startsWith("data:video/")) : false;
                        return isSiblingVideo ? (
                          <video 
                            src={sibling.url} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover/sibling:scale-105"
                            muted
                            loop
                            autoPlay
                            playsInline
                            style={{
                              objectFit: sibling.fit || 'cover',
                              objectPosition: `${(sibling.positionX ?? 0) + 50}% ${(sibling.positionY ?? 0) + 50}%`,
                              filter: `brightness(${sibling.brightness ?? 100}%) contrast(${sibling.contrast ?? 100}%) saturate(${sibling.saturation ?? 100}%) grayscale(${sibling.grayscale ?? 0}%) hue-rotate(${sibling.hueRotate ?? 0}deg)`
                            }}
                          />
                        ) : (
                          <img 
                            src={sibling.url} 
                            alt={sibling.title} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover/sibling:scale-105"
                            style={{
                              objectFit: sibling.fit || 'cover',
                              objectPosition: `${(sibling.positionX ?? 0) + 50}% ${(sibling.positionY ?? 0) + 50}%`,
                              filter: `brightness(${sibling.brightness ?? 100}%) contrast(${sibling.contrast ?? 100}%) saturate(${sibling.saturation ?? 100}%) grayscale(${sibling.grayscale ?? 0}%) hue-rotate(${sibling.hueRotate ?? 0}deg)`
                            }}
                          />
                        );
                      })()}
                    </div>
                    
                    <div className="absolute bottom-4 left-4 right-4 z-10 text-left drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                      <h4 className="text-sm font-bold text-white tracking-wide">{sibling.title}</h4>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Up Next Redirection */}
          {nextSection && (
            <div className="border-t border-white/5 pt-16 pb-8 text-center flex flex-col items-center">
              <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest block mb-4">Up Next</span>
              <button
                onClick={handleUpNextClick}
                className="group/upnext text-3xl md:text-5xl font-black text-white hover:text-cyan-400 transition-colors duration-300 bg-transparent border-0 cursor-pointer p-0 outline-none flex items-center gap-4"
              >
                {nextSection.service.title}
                <span className="transition-transform duration-300 group-hover/upnext:translate-x-3">→</span>
              </button>
            </div>
          )}
        </div>

        <footer className="py-10 px-10 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 bg-[#050508]">
          <span className="font-mono text-xs text-white/25 tracking-wider">© 2024 Netra Graphics. All rights reserved.</span>
          <span className="font-mono text-xs text-white/15 tracking-widest">NG — MMXXIV</span>
        </footer>
      </div>
    );
  }

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

      <WorkScrollSection 
        sections={activeSections} 
        onPhotoSelect={handlePhotoSelect}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
      />

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
