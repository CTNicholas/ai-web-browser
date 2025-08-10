import { useState, useEffect, useCallback } from "react";
import { useBrowserAPI } from "./useBrowserAPI";
import { turndownService } from "../utils/turndownService";

interface WebpageContent {
  markdown: string;
  html: string;
  url: string;
  title: string;
  isLoading: boolean;
  error: string | null;
}

export const useWebpageContent = (activeTabId: string | null): WebpageContent => {
  const [content, setContent] = useState<WebpageContent>({
    markdown: "",
    html: "",
    url: "",
    title: "",
    isLoading: false,
    error: null,
  });

  const browserAPI = useBrowserAPI();

  const fetchContent = useCallback(async () => {
    if (!browserAPI || !activeTabId) {
      setContent((prev) => ({
        ...prev,
        markdown: "",
        html: "",
        url: "",
        title: "",
        isLoading: false,
        error: null,
      }));
      return;
    }

    setContent((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const contentData = await browserAPI.getTabContent(activeTabId);

      if (contentData && contentData.html) {
        const markdown = turndownService.turndown(contentData.html);

        setContent({
          markdown: markdown || "No content available",
          html: contentData.html,
          url: contentData.url,
          title: contentData.title,
          isLoading: false,
          error: null,
        });
      } else {
        setContent((prev) => ({
          ...prev,
          markdown: "",
          html: "",
          isLoading: false,
          error: contentData ? "No content found on page" : "Failed to fetch content",
        }));
      }
    } catch (error) {
      console.warn("Error fetching webpage content:", error);
      setContent((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }));
    }
  }, [browserAPI, activeTabId]);

  // Fetch content when activeTabId changes
  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  // Listen for content change events from Electron main process
  useEffect(() => {
    if (typeof window === "undefined" || !window.require || !activeTabId) return;

    try {
      const { ipcRenderer } = window.require("electron");

      const handleContentChanged = (_event: any, tabId: string) => {
        if (tabId === activeTabId) {
          // Small delay to ensure content is fully loaded
          setTimeout(() => {
            fetchContent();
          }, 500);
        }
      };

      ipcRenderer.on("tab-content-changed", handleContentChanged);

      return () => {
        ipcRenderer.removeListener("tab-content-changed", handleContentChanged);
      };
    } catch (error) {
      console.warn("Could not set up IPC listener:", error);

      // Fallback to polling if IPC is not available
      const interval = setInterval(() => {
        fetchContent();
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [activeTabId, fetchContent]);

  // Also provide a manual refresh function
  const refresh = useCallback(() => {
    fetchContent();
  }, [fetchContent]);

  return {
    ...content,
    refresh,
  } as WebpageContent & { refresh: () => void };
};
