import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Activity, ArrowRight, Zap } from 'lucide-react';
import whatsNewData from './whatsnew.json';

export function WhatsNewBulb({ isClientPortal = false }) {
  const [showBulb, setShowBulb] = useState(() => {
    return localStorage.getItem(`netra_whatsnew_${whatsNewData.version}_${isClientPortal ? 'client' : 'admin'}`) !== 'true';
  });
  const [isOpen, setIsOpen] = useState(false);

  if (!showBulb) return null;

  const handleGotIt = () => {
    localStorage.setItem(`netra_whatsnew_${whatsNewData.version}_${isClientPortal ? 'client' : 'admin'}`, 'true');
    setShowBulb(false);
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsOpen(true); }}
        className={`flex items-center justify-center p-2.5 rounded-xl transition-all duration-300 border cursor-pointer active:scale-95 ${isClientPortal ? 'bg-indigo-500/10 border-indigo-500/20 hover:border-indigo-500/40 text-indigo-400 hover:bg-indigo-500/20 shadow-sm' : 'bg-transparent border-transparent text-indigo-400 hover:bg-white/5 mx-2'}`}
        title={`What's New in ${whatsNewData.title || 'this update'}`}
      >
        <Sparkles className={`w-5 h-5 ${isClientPortal ? '' : 'animate-bounce'} ${isOpen ? 'fill-indigo-400' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 sm:p-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, rotateX: 10 }}
              animate={{ opacity: 1, scale: 1, rotateX: 0 }}
              exit={{ opacity: 0, scale: 0.9, rotateX: -10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-[#0f111a] border border-indigo-500/30 rounded-3xl w-full max-w-2xl max-h-[90vh] shadow-[0_0_50px_-12px_rgba(99,102,241,0.5)] flex flex-col overflow-hidden relative"
            >
              {/* Decorative Background Elements */}
              <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-indigo-500/20 to-transparent pointer-events-none" />
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px] pointer-events-none" />

              {/* Header */}
              <div className="p-8 pb-4 flex items-start justify-between relative z-10 shrink-0">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold tracking-widest uppercase mb-4">
                    <Activity className="w-3.5 h-3.5" /> Latest Release
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    {whatsNewData.title || 'Netra OS Update'}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2 max-w-md leading-relaxed">
                    {whatsNewData.summary || 'Summary of recent updates.'}
                  </p>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-white/40 hover:text-white p-2 cursor-pointer bg-white/5 hover:bg-white/10 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content Grid */}
              <div className="p-8 pt-4 space-y-4 overflow-y-auto flex-1 relative z-10">
                <div className="grid grid-cols-1 gap-4">
                  {(whatsNewData.features || []).map((feature, index) => (
                    <motion.div 
                      key={index} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 + 0.2 }}
                      className="group bg-white/[0.03] hover:bg-indigo-500/[0.05] border border-white/[0.05] hover:border-indigo-500/30 rounded-2xl p-5 transition-all duration-300"
                    >
                      <div className="flex items-start gap-4">
                        <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl group-hover:scale-110 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300 shrink-0">
                          <Zap className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-base font-bold text-white mb-2">{feature.title}</h4>
                          <div className="text-sm text-white/60 leading-relaxed whitespace-pre-line space-y-2">
                            {feature.description.split('\n').map((line, i) => (
                              <p key={i} className="flex items-start gap-2">
                                {line.trim().startsWith('•') ? (
                                  <>
                                    <span className="text-indigo-400/50 mt-1 shrink-0">•</span>
                                    <span>{line.replace('•', '').trim()}</span>
                                  </>
                                ) : (
                                  line
                                )}
                              </p>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 sm:px-8 border-t border-white/5 bg-black/40 flex flex-col sm:flex-row gap-3 justify-end items-center shrink-0 relative z-10 backdrop-blur-xl">
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-semibold text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Dismiss for now
                </button>
                <button
                  onClick={handleGotIt}
                  className="w-full sm:w-auto px-8 py-3 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(79,70,229,0.4)] hover:shadow-[0_0_30px_rgba(79,70,229,0.6)] cursor-pointer group"
                >
                  Explore Updates <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
