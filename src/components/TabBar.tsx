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
    <div className="flex items-center border-b bg-gray-100">
      {/* Spacer for macOS traffic lights (●●●) */}
      <div className="h-10 w-24 flex-shrink-0" style={{ WebkitAppRegion: 'drag' } as any}></div>

      <div className="flex flex-1 overflow-x-auto">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`group flex min-w-0 max-w-xs cursor-pointer items-center border-r px-3 py-2 ${
              tab.isActive ? 'border-b-2 border-blue-500 bg-white' : 'bg-gray-50 hover:bg-gray-200'
            } `}
            onClick={() => onTabClick(tab.id)}
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
      </div>

      <button
        onClick={onNewTab}
        className="flex h-10 w-10 items-center justify-center transition-colors hover:bg-gray-200"
        title="New tab"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {process.env.NODE_ENV === 'development' && (
        <button
          onClick={() => window.location.reload()}
          className="flex h-10 w-10 items-center justify-center transition-colors hover:bg-gray-200"
          title="Refresh app"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      )}
    </div>
  );
};

export default TabBar;
