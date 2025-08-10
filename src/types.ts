export interface Tab {
  id: string;
  title: string;
  url: string;
  isActive: boolean;
  isLoading?: boolean;
  favicon?: string;
}

export interface BrowserAPI {
  createTab: (url?: string) => Promise<{ id: string; url: string; title: string }>;
  switchTab: (viewId: string) => Promise<boolean>;
  closeTab: (viewId: string) => Promise<boolean>;
  navigateTab: (viewId: string, url: string) => Promise<boolean>;
  getTabInfo: (viewId: string) => Promise<{
    url: string;
    title: string;
    canGoBack: boolean;
    canGoForward: boolean;
    favicon: string | null;
  } | null>;
  getTabContent: (viewId: string) => Promise<{
    html: string;
    url: string;
    title: string;
  } | null>;
  goBack: (viewId: string) => Promise<boolean>;
  goForward: (viewId: string) => Promise<boolean>;
  setTabOpacity: (viewId: string, opacity: number) => Promise<boolean>;
}

declare global {
  interface Window {
    require: (module: string) => any;
  }
}
