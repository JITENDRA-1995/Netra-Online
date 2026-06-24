import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, X, CheckCircle2 } from 'lucide-react';

export function WhatsNewBulb({ isClientPortal = false }) {
  const [showBulb, setShowBulb] = useState(() => {
    return localStorage.getItem(`netra_whatsnew_v257_${isClientPortal ? 'client' : 'admin'}`) !== 'true';
  });
  const [isOpen, setIsOpen] = useState(false);

  if (!showBulb) return null;

  const handleGotIt = () => {
    localStorage.setItem(`netra_whatsnew_v257_${isClientPortal ? 'client' : 'admin'}`, 'true');
    setShowBulb(false);
    setIsOpen(false);
  };

  return (
    <>
      <button 
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsOpen(true); }}
        className={`flex items-center justify-center gap-2 p-2 rounded-lg transition-colors border ${isClientPortal ? 'bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20' : 'bg-transparent border-transparent text-amber-400 hover:bg-white/5 mx-2'}`}
        title="What's New in v2.5.7"
      >
        <Lightbulb className={`w-5 h-5 ${isClientPortal ? '' : 'animate-pulse'} ${isOpen ? 'fill-amber-400' : ''}`} />
        {isClientPortal && <span className="text-sm font-semibold tracking-wider pr-1">What's New</span>}
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }} 
              className="bg-[#0a0f1e] border border-amber-500/20 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden relative"
            >
              {/* Header */}
              <div className="p-6 border-b border-white/5 bg-amber-500/5 flex items-center gap-3">
                <div className="p-3 bg-amber-500/20 rounded-full">
                  <Lightbulb className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white tracking-widest uppercase">Idea Spark</h3>
                  <p className="text-xs text-amber-400/80 uppercase tracking-widest mt-1">Netra OS v2.5.7 Update</p>
                </div>
                <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-white p-2">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <p className="text-sm text-white/80 leading-relaxed mb-4">
                  We've rolled out Netra OS v2.5.7 with custom category management, Progressive Web App (PWA) support, and redesigned alerts interface!
                </p>
                
                <ul className="space-y-3">
                  <li className="flex gap-3 items-start">
                    <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-white">Custom Category Management</h4>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Admins can now edit, rename, and delete custom ledger categories directly from the income/expense creation and calibration panels. Reassignment safeguards ensure no transaction details are lost.</p>
                    </div>
                  </li>
                  <li className="flex gap-3 items-start">
                    <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-white">Inquiry Ignition Safeguard</h4>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Fixed a bug where inquiries were marked as "Ignited" immediately upon clicking accept, even if the project creation was subsequently canceled. Inquiries now remain active until the project is successfully calibrated and saved.</p>
                    </div>
                  </li>
                  <li className="flex gap-3 items-start">
                    <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-white">Responsive Portfolio Slideshow</h4>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Optimized the fullscreen portfolio slideshow viewer for mobile viewports. Showcase photos and videos now fit completely without cropping on narrow screens.</p>
                    </div>
                  </li>
                  <li className="flex gap-3 items-start">
                    <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-white">System Alerts Redesign</h4>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">A premium split-screen overlay layout featuring vertical action button stacks on the left and dynamic horizontal tab selectors on the right to resolve pending deadlines and new inquiries quickly.</p>
                    </div>
                  </li>
                  <li className="flex gap-3 items-start">
                    <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-white">App Installation (PWA)</h4>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Install Netra Graphics directly onto your phone's home screen or desktop dock for a clean, borderless standalone app experience.</p>
                    </div>
                  </li>
                  <li className="flex gap-3 items-start">
                    <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-white">Offline Shell Caching</h4>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Critical frontend assets (styling, scripts, media loops) cache locally so the interface can boot offline instantly.</p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-white/5 bg-black/20 flex gap-3 justify-end">
                <button 
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider text-white hover:bg-white/10 transition-colors"
                >
                  Keep for later
                </button>
                <button 
                  onClick={handleGotIt}
                  className="px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wider bg-amber-500 text-black hover:bg-amber-400 transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                >
                  Got it! <Lightbulb className="w-4 h-4 fill-black" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
