import { X, ShieldAlert } from "lucide-react";
import { usePerformanceSaver, triggerPerformanceStateChange } from "../hooks/usePerformanceSaver";

export default function PerformanceNotice() {
  const {
    isSlowConnection,
    isSlowDevice,
    isLowBattery,
    isDataSaver,
    isOverridden,
    isNoticeClosed,
  } = usePerformanceSaver();

  const handleEnable = () => {
    localStorage.setItem("override-performance-saver", "true");
    triggerPerformanceStateChange();
  };

  const handleDismiss = () => {
    sessionStorage.setItem("performance-notice-closed", "true");
    triggerPerformanceStateChange();
  };

  let noticeMessage = "";
  if (isSlowDevice) {
    noticeMessage = "Performance Mode: backdrops & effects have been paused for smoothness.";
  } else if (isLowBattery) {
    noticeMessage = "Battery Saver: backdrops & effects have been paused to save power.";
  } else if (isSlowConnection || isDataSaver) {
    noticeMessage = "Data Saver: background canvas has been paused to conserve network data.";
  }

  const showNotice = noticeMessage && !isOverridden && !isNoticeClosed;

  if (!showNotice) return null;

  return (
    <div className="fixed bottom-4 left-4 z-[100] flex max-w-sm flex-col gap-2 rounded-xl border border-amber-500/20 bg-neutral-950/90 p-3 shadow-2xl backdrop-blur-md text-[10px] font-mono text-amber-400/90 animate-fadeIn print:hidden select-none">
      <div className="flex items-start gap-2">
        <ShieldAlert className="h-4 w-4 shrink-0 text-amber-500" />
        <div className="flex-1 leading-normal pr-2">
          {noticeMessage}
        </div>
        <button
          onClick={handleDismiss}
          title="Dismiss warning (keep paused)"
          className="p-1 rounded hover:bg-white/5 active:scale-95 text-neutral-400 hover:text-white transition-all flex items-center justify-center shrink-0"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      
      <div className="flex items-center justify-end gap-1.5 border-t border-amber-500/10 pt-2 mt-1">
        <span className="mr-auto text-[9px] text-amber-500/50 uppercase tracking-widest font-semibold">ECO MODE ACTIVE</span>
        <button
          onClick={handleEnable}
          className="px-2 py-1 rounded bg-amber-500 text-neutral-950 font-bold hover:bg-amber-400 active:scale-95 transition-all uppercase tracking-wider text-[8px] shadow-md shadow-amber-500/10"
        >
          Enable FX Anyway
        </button>
      </div>
    </div>
  );
}
