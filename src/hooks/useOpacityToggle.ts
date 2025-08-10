import { useState, useCallback } from "react";
import { BrowserAPI } from "../types";

export const useOpacityToggle = (
  initialOpacity: number = 1,
  browserAPI?: BrowserAPI | null,
  activeTabId?: string | null,
) => {
  const [opacity, setOpacity] = useState<number>(initialOpacity);
  const [isToggled, setIsToggled] = useState<boolean>(false);

  const toggleOpacity = useCallback(async () => {
    const newOpacity = opacity === 1 ? 0 : 1;
    setIsToggled((prev) => !prev);
    setOpacity(newOpacity);

    // Apply opacity to the actual WebContentsView via Electron IPC
    if (browserAPI && activeTabId) {
      try {
        await browserAPI.setTabOpacity(activeTabId, newOpacity);
      } catch (error) {
        console.error("Failed to set tab opacity:", error);
      }
    }
  }, [opacity, browserAPI, activeTabId]);

  const setCustomOpacity = useCallback(
    async (value: number) => {
      const clampedValue = Math.max(0.1, Math.min(1, value));
      setOpacity(clampedValue);
      setIsToggled(clampedValue !== 1);

      // Apply opacity to the actual WebContentsView via Electron IPC
      if (browserAPI && activeTabId) {
        try {
          await browserAPI.setTabOpacity(activeTabId, clampedValue);
        } catch (error) {
          console.error("Failed to set tab opacity:", error);
        }
      }
    },
    [browserAPI, activeTabId],
  );

  return {
    opacity,
    isToggled,
    toggleOpacity,
    setCustomOpacity,
  };
};
