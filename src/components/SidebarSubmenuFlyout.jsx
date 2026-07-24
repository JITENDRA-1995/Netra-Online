import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ArrowRight } from 'lucide-react';

const MODULE_THEMES = {
  PROJECTS: {
    color: '#00E5FF',
    accentBorder: 'hover:border-[#00E5FF]/60 border-[#00E5FF]/30',
    glow: 'shadow-[0_10px_40px_rgba(0,0,0,0.95)]',
    tagBg: 'bg-[#00E5FF]/20 text-[#00E5FF] border-[#00E5FF]/40',
    iconBg: 'bg-[#00E5FF]/20 text-[#00E5FF]',
    btnHover: 'hover:bg-[#1a253b] hover:border-[#00E5FF]/50'
  },
  INQUIRIES: {
    color: '#f59e0b',
    accentBorder: 'hover:border-amber-500/60 border-amber-500/30',
    glow: 'shadow-[0_10px_40px_rgba(0,0,0,0.95)]',
    tagBg: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
    iconBg: 'bg-amber-500/20 text-amber-400',
    btnHover: 'hover:bg-[#2b2214] hover:border-amber-500/50'
  },
  CLIENTS: {
    color: '#a855f7',
    accentBorder: 'hover:border-purple-500/60 border-purple-500/30',
    glow: 'shadow-[0_10px_40px_rgba(0,0,0,0.95)]',
    tagBg: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
    iconBg: 'bg-purple-500/20 text-purple-400',
    btnHover: 'hover:bg-[#251936] hover:border-purple-500/50'
  },
  INVOICES: {
    color: '#10b981',
    accentBorder: 'hover:border-emerald-500/60 border-emerald-500/30',
    glow: 'shadow-[0_10px_40px_rgba(0,0,0,0.95)]',
    tagBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    iconBg: 'bg-emerald-500/20 text-emerald-400',
    btnHover: 'hover:bg-[#142822] hover:border-emerald-500/50'
  },
  FINANCIALS: {
    color: '#eab308',
    accentBorder: 'hover:border-yellow-500/60 border-yellow-500/30',
    glow: 'shadow-[0_10px_40px_rgba(0,0,0,0.95)]',
    tagBg: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
    iconBg: 'bg-yellow-500/20 text-yellow-400',
    btnHover: 'hover:bg-[#282414] hover:border-yellow-500/50'
  },
  SETTINGS: {
    color: '#3b82f6',
    accentBorder: 'hover:border-blue-500/60 border-blue-500/30',
    glow: 'shadow-[0_10px_40px_rgba(0,0,0,0.95)]',
    tagBg: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
    iconBg: 'bg-blue-500/20 text-blue-400',
    btnHover: 'hover:bg-[#152238] hover:border-blue-500/50'
  },
  SYSTEM_ALERTS: {
    color: '#ef4444',
    accentBorder: 'hover:border-red-500/60 border-red-500/30',
    glow: 'shadow-[0_10px_40px_rgba(0,0,0,0.95)]',
    tagBg: 'bg-red-500/20 text-red-400 border-red-500/40',
    iconBg: 'bg-red-500/20 text-red-400',
    btnHover: 'hover:bg-[#2c1518] hover:border-red-500/50'
  }
};

export function SidebarSubmenuFlyout({
  item,
  isActive,
  activeFlyoutId,
  setActiveFlyoutId,
  onPrimaryClick,
  onSubmenuClick
}) {
  const timeoutRef = useRef(null);

  // If item is currently active selection, NEVER show flyout on hover!
  const isHovered = !isActive && activeFlyoutId === item.id;

  const theme = MODULE_THEMES[item.id] || MODULE_THEMES.PROJECTS;

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (isActive) {
      // Immediately close any other open flyout when hovering over active selection menu
      if (setActiveFlyoutId) setActiveFlyoutId(null);
      return;
    }
    if (setActiveFlyoutId) {
      setActiveFlyoutId(item.id);
    }
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      if (setActiveFlyoutId) {
        setActiveFlyoutId((prev) => (prev === item.id ? null : prev));
      }
    }, 140);
  };

  const Icon = item.icon;
  const hasSubmenus = Array.isArray(item.submenus) && item.submenus.length > 0;

  return (
    <div
      className="relative group/sidebar-item"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <a
        href="#"
        className={`sidebar-menu-link ${isActive ? 'active' : ''} flex items-center justify-between transition-all duration-200`}
        onClick={(e) => {
          e.preventDefault();
          if (setActiveFlyoutId) setActiveFlyoutId(null);
          onPrimaryClick(item);
        }}
        data-testid={`link-sidebar-${item.label.toLowerCase()}`}
      >
        <div className="flex items-center gap-3">
          <Icon className={`sidebar-link-icon ${isActive ? 'text-[#00E5FF]' : ''}`} />
          <span className="sidebar-link-label">{item.label}</span>
          {item.badge && <span className="sidebar-notification-dot"></span>}
        </div>
        {hasSubmenus && !isActive && (
          <ChevronRight className={`w-3.5 h-3.5 text-white/40 group-hover/sidebar-item:text-[#00E5FF] transition-transform duration-200 ${isHovered ? 'rotate-90 text-[#00E5FF]' : ''}`} />
        )}
      </a>

      {/* Solid Opaque Flyout Submenu Popover Panel (No Transparency) */}
      <AnimatePresence>
        {hasSubmenus && isHovered && (
          <motion.div
            initial={{ opacity: 0, x: 14, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 10, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 450, damping: 28 }}
            onMouseEnter={() => {
              if (timeoutRef.current) clearTimeout(timeoutRef.current);
              if (setActiveFlyoutId) setActiveFlyoutId(item.id);
            }}
            onMouseLeave={handleMouseLeave}
            className={`absolute left-full top-0 ml-3 z-[99999] w-[310px] bg-[#0b0e1b] border-2 ${theme.accentBorder} ${theme.glow} rounded-2xl p-3 text-white overflow-hidden pointer-events-auto shadow-[0_20px_50px_rgba(0,0,0,1)] opacity-100`}
          >
            {/* Solid Header Bar */}
            <div className="px-2 py-2 mb-2 flex items-center justify-between bg-[#121629] rounded-xl border border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full border text-[9px] font-black tracking-widest uppercase flex items-center gap-1.5 ${theme.tagBg}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
                  {item.label}
                </span>
              </div>
              <span className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-wider">{item.submenus.length} Options</span>
            </div>

            {/* Solid Submenu Cards */}
            <div className="space-y-1.5">
              {item.submenus.map((sub, idx) => {
                const SubIcon = sub.icon;
                return (
                  <motion.button
                    key={sub.id || idx}
                    initial={{ opacity: 0, x: 6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.02 + 0.02 }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (setActiveFlyoutId) setActiveFlyoutId(null);
                      onSubmenuClick(item, sub);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#14192d] ${theme.btnHover} border border-white/10 text-white transition-all duration-150 text-left group/sub-btn cursor-pointer active:scale-[0.98] relative overflow-hidden`}
                  >
                    {SubIcon && (
                      <div className={`p-2 rounded-lg ${theme.iconBg} shrink-0 shadow-md`}>
                        <SubIcon className="w-4 h-4" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0 pr-1">
                      <div className="text-xs font-black text-white group-hover/sub-btn:text-white truncate flex items-center gap-1 tracking-wide">
                        {sub.label}
                      </div>
                      {sub.description && (
                        <div className="text-[10px] text-zinc-300 font-semibold truncate mt-0.5">
                          {sub.description}
                        </div>
                      )}
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover/sub-btn:text-white group-hover/sub-btn:translate-x-1 transition-all shrink-0" />
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
