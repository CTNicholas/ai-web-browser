import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Tab } from "../types";

interface TabBarProps {
  tabs: Tab[];
  onTabClick: (tabId: string) => void;
  onTabClose: (tabId: string, e: React.MouseEvent) => void;
  onNewTab: () => void;
}

const TabBar: React.FC<TabBarProps> = ({ tabs, onTabClick, onTabClose, onNewTab }) => {
  const truncateTitle = (title: string, maxLength: number = 20) => {
    return title.length > maxLength ? `${title.substring(0, maxLength)}...` : title;
  };

  return (
    <div className="z-10 flex h-full grow items-center">
      {/* Spacer for macOS traffic lights (●●●) */}
      <motion.div
        className="flex h-full flex-1 gap-1"
        layout
        transition={{ type: "spring", stiffness: 800, damping: 40 }}
      >
        <AnimatePresence mode="popLayout">
          {tabs.map((tab) => (
            <motion.div
              key={tab.id}
              layout
              initial={{ width: 80, opacity: 0.4 }}
              animate={{ width: 180, opacity: 1 }}
              exit={{ width: 0, opacity: 0, scale: 0.8, filter: "blur(4px)" }}
              transition={{
                layout: { type: "spring", stiffness: 800, damping: 60 },
                width: { type: "spring", stiffness: 550, damping: 45 },
                opacity: { duration: 0.1 },
                scale: { duration: 0.1 },
                filter: { duration: 0.1 },
              }}
              style={{ originX: 0, WebkitAppRegion: "no-drag" } as any}
              className={`group relative flex h-full cursor-pointer items-center rounded-[5px] rounded-b-none ${
                tab.isActive
                  ? "bg-gradient-to-b from-white/80 to-white/70"
                  : "bg-white/0 hover:bg-white/40"
              } `}
              onClick={() => onTabClick(tab.id)}
              onMouseDown={(e) => {
                // Middle-click closes tab
                if (e.button === 1) {
                  onTabClose(tab.id, e);
                }
              }}
            >
              <div className="flex min-w-0 items-center px-2" style={{ width: 180 }}>
                {tab.isLoading ? (
                  <div className="mr-2 h-4 w-4 flex-shrink-0 animate-spin rounded-full border-[2px] border-neutral-500 border-t-transparent" />
                ) : (
                  <div className="mr-2 h-4 w-4 flex-shrink-0 rounded-sm bg-neutral-400" />
                )}
                <span className="flex-1 truncate text-xs">
                  {truncateTitle(tab.title || "New Tab")}
                </span>
              </div>

              <button
                onClick={(e) => onTabClose(tab.id, e)}
                className="absolute right-2 flex-shrink-0 rounded p-1 text-neutral-600 opacity-0 hover:bg-white/50 hover:text-neutral-800 group-hover:opacity-100"
                title="Close tab"
              >
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
              {tab.isActive ? (
                <>
                  <svg
                    className="absolute bottom-0 right-full h-[5px] w-[5px] fill-white/70"
                    viewBox="0 0 50 50"
                  >
                    <path d="M 0,50 A 50,50 0 0,0 50,0 L 50,50 Z" fill="" />
                  </svg>
                  <svg
                    className="absolute bottom-0 left-full h-[5px] w-[5px] scale-x-[-1] fill-white/70"
                    viewBox="0 0 50 50"
                  >
                    <path d="M 0,50 A 50,50 0 0,0 50,0 L 50,50 Z" fill="" />
                  </svg>
                </>
              ) : null}
            </motion.div>
          ))}
        </AnimatePresence>
        <button
          onClick={onNewTab}
          className="flex aspect-square h-full items-center justify-center rounded-t hover:bg-white/40 focus:outline-none"
          style={{ WebkitAppRegion: "no-drag" } as any}
          title="New tab"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </motion.div>
    </div>
  );
};

export default TabBar;
