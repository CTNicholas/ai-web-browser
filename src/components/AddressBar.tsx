import React, { useState, useRef, useEffect } from 'react';
import { Tab } from '../types';

interface AddressBarProps {
  activeTab: Tab | null;
  onNavigate: (url: string) => void;
  onBack?: () => void;
  onForward?: () => void;
  onRefresh?: () => void;
  canGoBack?: boolean;
  canGoForward?: boolean;
}

const AddressBar: React.FC<AddressBarProps> = ({
  activeTab,
  onNavigate,
  onBack,
  onForward,
  onRefresh,
  canGoBack = false,
  canGoForward = false,
}) => {
  const [url, setUrl] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeTab) {
      setUrl(activeTab.url);
    }
  }, [activeTab]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      let finalUrl = url.trim();
      if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
        finalUrl = `https://${finalUrl}`;
      }
      onNavigate(finalUrl);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      inputRef.current?.blur();
      if (activeTab) {
        setUrl(activeTab.url);
      }
    }
  };

  return (
    <div className="flex items-center gap-2 border-b bg-white/40 px-4 py-2 backdrop-blur-md">
      <div className="flex items-center gap-1">
        <button
          onClick={onBack}
          disabled={!canGoBack}
          className="rounded p-2 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
          title="Go back"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <button
          onClick={onForward}
          disabled={!canGoForward}
          className="rounded p-2 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
          title="Go forward"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <button onClick={onRefresh} className="rounded p-2 hover:bg-gray-200" title="Refresh">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex-1">
        <input
          ref={inputRef}
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter URL or search..."
          className="w-full rounded-md border border-white/40 bg-white/60 px-3 py-1 backdrop-blur-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </form>
    </div>
  );
};

export default AddressBar;
