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
    <div className="flex items-center bg-gray-100 border-b">
      <div className="flex flex-1 overflow-x-auto">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`
              flex items-center min-w-0 max-w-xs px-3 py-2 border-r cursor-pointer group
              ${tab.isActive 
                ? 'bg-white border-b-2 border-blue-500' 
                : 'bg-gray-50 hover:bg-gray-200'
              }
            `}
            onClick={() => onTabClick(tab.id)}
          >
            <div className="flex items-center min-w-0 flex-1">
              {tab.isLoading ? (
                <div className="w-4 h-4 mr-2 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <div className="w-4 h-4 mr-2 bg-gray-400 rounded-sm flex-shrink-0" />
              )}
              <span className="truncate text-sm">
                {truncateTitle(tab.title || 'New Tab')}
              </span>
            </div>
            
            <button
              onClick={(e) => onTabClose(tab.id, e)}
              className="ml-2 p-1 rounded hover:bg-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Close tab"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
      
      <button
        onClick={onNewTab}
        className="flex items-center justify-center w-10 h-10 hover:bg-gray-200 transition-colors"
        title="New tab"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
      
      {process.env.NODE_ENV === 'development' && (
        <button
          onClick={() => window.location.reload()}
          className="flex items-center justify-center w-10 h-10 hover:bg-gray-200 transition-colors"
          title="Refresh app"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default TabBar;