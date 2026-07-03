import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Headphones } from "lucide-react";

export default function FirstLoadOverlay() {
  const [show, setShow] = useState(false);
  const [loadingText, setLoadingText] = useState("preloading assets...");

  useEffect(() => {
    // Check session storage to prevent showing on refresh
    const hasEntered = sessionStorage.getItem("has_entered");
    if (!hasEntered) {
      setShow(true);
    }
  }, []);

  // Prevent page scroll when overlay is active
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

    // Simulate preloading text changes
    const timers = [
      setTimeout(() => setLoadingText("warming up audio engine..."), 800),
      setTimeout(() => setLoadingText("initializing local cache..."), 1500),
      setTimeout(() => setLoadingText("ready."), 2200),
    ];

    return () => timers.forEach(clearTimeout);
  }, [show]);

  const handleEnter = () => {
    // Set session storage
    sessionStorage.setItem("has_entered", "true");

    // Initialize AudioContext dummy to unlock browser audio restrictions
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        const ctx = new AudioContextClass();
        if (ctx.state === "suspended") {
          ctx.resume();
        }
      }
    } catch (e) {
      // AudioContext not supported or blocked, ignore
    }

    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="first-load-overlay fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#050505] text-white overflow-hidden"
        >
          {/* Subtle noise/grid background overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.01),transparent)] pointer-events-none z-10" />

          {/* Ambient blurred slow-floating circles */}
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[15%] left-[5%] w-[350px] h-[350px] rounded-full bg-indigo-500/10 blur-[90px] animate-float-slow" />
            <div className="absolute bottom-[15%] right-[5%] w-[400px] h-[400px] rounded-full bg-purple-500/10 blur-[110px] animate-float-slower" />
          </div>

          {/* Glassmorphic Centered Container */}
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-20 flex flex-col items-center max-w-sm w-[90%] mx-auto px-8 py-10 rounded-3xl border border-white/10 bg-black/40 backdrop-blur-2xl shadow-[0_30px_100px_rgba(0,0,0,0.8)] text-center select-none"
          >
            {/* Logo icon */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="mb-6 rounded-2xl bg-white/5 border border-white/10 p-4 shadow-[0_0_30px_rgba(255,255,255,0.02)]"
            >
              <Headphones className="h-8 w-8 text-neutral-300" />
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="font-display text-3xl font-bold tracking-tight text-neutral-100"
            >
              abyn.xyz
            </motion.h1>

            {/* Description */}
            <motion.p
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="mt-3 text-sm text-neutral-400 leading-relaxed font-sans"
            >
              Interactive portfolio and music player dashboard. For the best experience, audio activation is recommended.
            </motion.p>

            {/* Enter Button */}
            <motion.div
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.45, duration: 0.5 }}
              className="mt-8 w-full"
            >
              <button
                onClick={handleEnter}
                className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3.5 text-sm font-semibold text-black transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] active:scale-[0.98]"
              >
                <Sparkles className="h-4 w-4 text-neutral-800 transition-transform duration-300 group-hover:rotate-12" />
                Enter Experience
              </button>
            </motion.div>

            {/* Loading text status indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="mt-8 font-mono text-[10px] uppercase tracking-widest text-neutral-500"
            >
              {loadingText}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
