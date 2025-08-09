import { useEffect, useState } from 'react';
import { BrowserAPI } from '../types';

export const useBrowserAPI = (): BrowserAPI | null => {
  const [api, setApi] = useState<BrowserAPI | null>(null);

  useEffect(() => {
    try {
      // Check if we're in Electron
      if (typeof window !== 'undefined' && window.require) {
        const { ipcRenderer } = window.require('electron');

        const browserAPI: BrowserAPI = {
          createTab: (url?: string) => ipcRenderer.invoke('create-tab', url),
          switchTab: (viewId: string) => ipcRenderer.invoke('switch-tab', viewId),
          closeTab: (viewId: string) => ipcRenderer.invoke('close-tab', viewId),
          navigateTab: (viewId: string, url: string) =>
            ipcRenderer.invoke('navigate-tab', viewId, url),
          getTabInfo: (viewId: string) => ipcRenderer.invoke('get-tab-info', viewId),
        };

        setApi(browserAPI);
      } else {
        // Mock API for web browser (development)
        console.log('Running in web browser - using mock browser API');
        const mockAPI: BrowserAPI = {
          createTab: async (url?: string) => ({
            id: `mock-${Date.now()}`,
            url: url || 'https://google.com',
            title: 'Mock Tab',
          }),
          switchTab: async (viewId: string) => {
            console.log('Mock switch to:', viewId);
            return true;
          },
          closeTab: async (viewId: string) => {
            console.log('Mock close:', viewId);
            return true;
          },
          navigateTab: async (viewId: string, url: string) => {
            console.log('Mock navigate:', viewId, url);
            return true;
          },
          getTabInfo: async (viewId: string) => ({
            url: 'https://example.com',
            title: 'Mock Tab',
            canGoBack: false,
            canGoForward: false,
          }),
        };

        setApi(mockAPI);
      }
    } catch (error) {
      console.error('Failed to initialize browser API:', error);
      // Set a mock API even if there's an error
      const fallbackAPI: BrowserAPI = {
        createTab: async () => ({ id: 'fallback', url: 'about:blank', title: 'Fallback Tab' }),
        switchTab: async () => true,
        closeTab: async () => true,
        navigateTab: async () => true,
        getTabInfo: async () => ({
          url: 'about:blank',
          title: 'Fallback',
          canGoBack: false,
          canGoForward: false,
        }),
      };
      setApi(fallbackAPI);
    }
  }, []);

  return api;
};
