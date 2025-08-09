import React from 'react';
import { Tab } from '../types';

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
      <div className="flex h-full flex-1 gap-1 overflow-x-auto">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`group flex h-full w-[180px] max-w-xs cursor-pointer items-center rounded-[5px] rounded-b-none px-2 ${
              tab.isActive ? 'bg-white/70' : 'bg-white/0 hover:bg-white/40'
            } `}
            style={{ WebkitAppRegion: 'no-drag' } as any}
            onClick={() => onTabClick(tab.id)}
            onMouseDown={(e) => {
              // Middle-click closes tab
              if (e.button === 1) {
                onTabClose(tab.id, e);
              }
            }}
          >
            <div className="flex min-w-0 flex-1 items-center">
              {tab.isLoading ? (
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-[2px] border-neutral-500 border-t-transparent" />
              ) : (
                <div className="mr-2 h-4 w-4 flex-shrink-0 rounded-sm bg-neutral-400" />
              )}
              <span className="truncate text-xs">{truncateTitle(tab.title || 'New Tab')}</span>
            </div>

            <button
              onClick={(e) => onTabClose(tab.id, e)}
              className="ml-2 rounded p-1 text-neutral-600 opacity-0 transition-opacity hover:bg-white/50 hover:text-neutral-800 group-hover:opacity-100"
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
          </div>
        ))}
        <button
          onClick={onNewTab}
          className="flex aspect-square h-full items-center justify-center rounded-t transition-colors hover:bg-white/40"
          style={{ WebkitAppRegion: 'no-drag' } as any}
          title="New tab"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default TabBar;
