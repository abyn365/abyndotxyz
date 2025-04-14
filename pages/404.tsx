import type { NextPage } from "next";
import Image from "next/image";
import { motion } from "framer-motion";
import Squares from "../components/Squares";
import Link from "next/link"; // Add this import

const ErrorPage: NextPage = () => {

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-zinc-900">
      {/* Background squares effect */}
      <div className="fixed inset-0 z-0 sm:block">
        <Squares 
          speed={0.2}
          squareSize={40}
          direction='diagonal'
          borderColor='rgba(255,255,255,0.1)'
          hoverFillColor='rgba(255, 99, 71, 0.1)'
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-lg"
        >
          <Image
            src="/assests/404.svg"
            width={800}
            height={400}
            alt="404 illustration"
            className="w-full h-auto drop-shadow-2xl"
            priority
          />
        </motion.div>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mt-8 text-center"
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 font-jost">
            Whoops! Lost in Space?
          </h1>
          <p className="text-lg text-zinc-400 font-sen mb-8">
            The page you&apos;re looking for isn&apos;t found :( <br />
            We suggest you go back to home
          </p>

          <Link href="/" passHref>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="elegant-card glow-effect px-6 py-3 text-white font-medium transition-colors"
            >
              <span className="flex items-center gap-2">
                <svg 
                  className="w-5 h-5" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Back to Home
              </span>
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default ErrorPage;