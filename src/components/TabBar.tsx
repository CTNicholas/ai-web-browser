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
    <div
      className="flex items-center border-b bg-white/50 backdrop-blur-md"
      style={{ WebkitAppRegion: 'drag' } as any}
    >
      {/* Spacer for macOS traffic lights (●●●) */}
      <div className="h-8 w-24 flex-shrink-0" style={{ WebkitAppRegion: 'drag' } as any}></div>

      <div className="flex flex-1 overflow-x-auto">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`group flex w-[180px] max-w-xs cursor-pointer items-center border-r px-3 py-2 ${
              tab.isActive ? 'border-b-2 border-blue-500 bg-white' : 'bg-gray-50 hover:bg-gray-200'
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
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
              ) : (
                <div className="mr-2 h-4 w-4 flex-shrink-0 rounded-sm bg-gray-400" />
              )}
              <span className="truncate text-sm">{truncateTitle(tab.title || 'New Tab')}</span>
            </div>

            <button
              onClick={(e) => onTabClose(tab.id, e)}
              className="ml-2 rounded p-1 opacity-0 transition-opacity hover:bg-gray-300 group-hover:opacity-100"
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
          className="flex h-10 w-10 items-center justify-center transition-colors hover:bg-white/40"
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
