import { X } from "lucide-react";
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
    noticeMessage = "Slow Device (Backdrops & Canvas Paused)";
  } else if (isLowBattery) {
    noticeMessage = "Low Battery (Backdrops Paused)";
  } else if (isSlowConnection || isDataSaver) {
    noticeMessage = "Slow Connection (Canvas Paused)";
  }

  const showNotice = noticeMessage && !isOverridden && !isNoticeClosed;

  if (!showNotice) return null;

  return (
    <div className="fixed bottom-4 left-4 z-[100] flex items-center gap-2.5 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 backdrop-blur-md text-[10px] font-mono font-bold text-amber-500 animate-fade-in print:hidden select-none">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
      <span>{noticeMessage}</span>
      <div className="flex items-center gap-1.5 ml-2 border-l border-amber-500/20 pl-2">
        <button
          onClick={handleEnable}
          className="px-1.5 py-0.5 rounded bg-amber-500 text-neutral-950 font-bold hover:bg-amber-400 active:scale-95 transition-all uppercase tracking-wider text-[8px]"
        >
          Enable
        </button>
        <button
          onClick={handleDismiss}
          title="Dismiss warning (keep paused)"
          className="p-0.5 rounded hover:bg-amber-500/20 active:scale-95 text-amber-500/80 hover:text-amber-500 transition-all flex items-center justify-center"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
