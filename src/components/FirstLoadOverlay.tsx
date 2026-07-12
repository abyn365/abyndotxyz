import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Headphones, ArrowRight } from "lucide-react";

export default function FirstLoadOverlay() {
  const [show, setShow] = useState(false);
  const [loadingText, setLoadingText] = useState("setting the stage...");

  useEffect(() => {
    const hasEntered = sessionStorage.getItem("has_entered");
    if (!hasEntered) {
      setShow(true);
    }
  }, []);

  useEffect(() => {
    if (show) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [show]);

  useEffect(() => {
    if (!show) return;

    // Human/casual loading states instead of SaaS jargon
    const timers = [
      setTimeout(() => setLoadingText("cueing the music..."), 800),
      setTimeout(() => setLoadingText("polishing the details..."), 1600),
      setTimeout(() => setLoadingText("all set."), 2400),
    ];

    return () => timers.forEach(clearTimeout);
  }, [show]);

  const handleEnter = () => {
    sessionStorage.setItem("has_entered", "true");
    window.dispatchEvent(new CustomEvent("site-entered"));

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        const ctx = new AudioContextClass();
        if (ctx.state === "suspended") {
          ctx.resume();
        }
      }
    } catch (e) {
      // Audio blocked or unsupported
    }

    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#080808] text-white overflow-hidden"
        >
          {/* Ambient background glows */}
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[20%] left-[10%] w-[300px] h-[300px] rounded-full bg-indigo-500/5 blur-[100px]" />
            <div className="absolute bottom-[20%] right-[10%] w-[350px] h-[350px] rounded-full bg-neutral-500/5 blur-[120px]" />
          </div>

          {/* Centered Content */}
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-20 flex flex-col items-center max-w-sm w-[85%] mx-auto text-center select-none"
          >
            {/* Minimal Icon Indicator */}
            <div className="mb-6 text-neutral-500">
              <Headphones className="h-5 w-5 stroke-[1.5]" />
            </div>

            {/* Title */}
            <h1 className="font-mono text-xl tracking-tight text-neutral-200">
              abyn.xyz
            </h1>

            {/* Your Personal Copy */}
            <p className="mt-4 text-sm text-neutral-400 leading-relaxed font-sans max-w-[280px]">
              A little corner of the internet where I build things, listen to music, and occasionally obsess over tiny details.
            </p>

            <span className="mt-3 text-xs text-neutral-500 font-sans italic">
              Audio starts after your first click.
            </span>

            {/* Action Button */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="mt-8 w-full"
            >
              <button
                onClick={handleEnter}
                className="group flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-neutral-300 transition-all duration-300 hover:bg-white hover:text-black active:scale-[0.98]"
              >
                take a look
                <ArrowRight className="h-3.5 w-3.5 opacity-60 transition-transform duration-300 group-hover:translate-x-0.5" />
              </button>
            </motion.div>

            {/* Micro Status Text */}
            <div className="mt-12 font-mono text-[10px] tracking-widest text-neutral-600 lowercase">
              {loadingText}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
