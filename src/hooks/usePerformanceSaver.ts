import { useState, useEffect } from "react";

export interface PerformanceSaverState {
  isSlowConnection: boolean;
  isSlowDevice: boolean;
  isLowBattery: boolean;
  isDataSaver: boolean;
  isOverridden: boolean;
  isNoticeClosed: boolean;
  shouldDisableCanvas: boolean;
  shouldDisableBackdrops: boolean;
}

export function usePerformanceSaver(): PerformanceSaverState {
  const [state, setState] = useState<PerformanceSaverState>({
    isSlowConnection: false,
    isSlowDevice: false,
    isLowBattery: false,
    isDataSaver: false,
    isOverridden: false,
    isNoticeClosed: false,
    shouldDisableCanvas: false,
    shouldDisableBackdrops: false,
  });

  useEffect(() => {
    const check = () => {
      if (typeof window === "undefined") return;

      const isOverridden = localStorage.getItem("override-performance-saver") === "true";
      const isNoticeClosed = sessionStorage.getItem("performance-notice-closed") === "true";

      // Connection detection
      let isSlowConnection = false;
      let isDataSaver = false;
      const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      if (conn) {
        if (conn.saveData) {
          isDataSaver = true;
        }
        
        const type = conn.effectiveType || "";
        const rtt = conn.rtt;
        const downlink = conn.downlink;

        // "slow-2g", "2g", "3g", "slow-3g", "slow-4g"
        const isSlowType = ["2g", "3g", "slow-2g", "slow-3g", "slow-4g"].includes(type);
        
        // Downlink <= 1.5 Mbps or latency RTT >= 500ms constitutes a slow connection (slow 4g and below)
        const isLowBandwidth = (rtt !== undefined && rtt >= 500) || (downlink !== undefined && downlink <= 1.5);

        if (isSlowType || isLowBandwidth) {
          isSlowConnection = true;
        }
      }

      // Performance/FPS detection
      const isSlowDevice = sessionStorage.getItem("site-slow-device") === "true";

      // Battery detection
      const isLowBattery = sessionStorage.getItem("site-low-battery") === "true";

      // Canvas should be disabled if slow connection, slow device, data saver, or low battery (saving power)
      const shouldDisableCanvas = (isSlowConnection || isSlowDevice || isDataSaver || isLowBattery) && !isOverridden;

      // Backdrops should be disabled if slow device or low battery (saving CPU/GPU/battery)
      const shouldDisableBackdrops = (isSlowDevice || isLowBattery) && !isOverridden;

      setState({
        isSlowConnection,
        isSlowDevice,
        isLowBattery,
        isDataSaver,
        isOverridden,
        isNoticeClosed,
        shouldDisableCanvas,
        shouldDisableBackdrops,
      });
    };

    check();

    // Listen to changes in the performance state
    window.addEventListener("performance-state-change", check);
    return () => {
      window.removeEventListener("performance-state-change", check);
    };
  }, []);

  return state;
}

// Global utility helper to trigger a change event
export function triggerPerformanceStateChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("performance-state-change"));
  }
}
