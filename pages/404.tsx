import type { NextPage } from "next";
import Image from "next/image";
import { motion } from "framer-motion";
import Squares from "../components/Squares";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const ErrorPage: NextPage = () => {
  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Background squares effect */}
      <div className="fixed inset-0 z-0">
        <Squares 
          speed={0.15}
          squareSize={40}
          direction="diagonal"
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
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mt-8 text-center"
        >
          <h1 className="text-3xl sm:text-4xl font-medium text-[var(--text-primary)] mb-3">
            Whoops! Lost in Space?
          </h1>
          <p className="text-base text-[var(--text-secondary)] mb-10">
            The page you&apos;re looking for isn&apos;t found. <br />
            We suggest you go back to home.
          </p>

          <Link href="/" passHref legacyBehavior>
            <motion.a
              whileHover={{ y: -1 }}
              className="inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-medium transition-all duration-200"
              style={{
                background: 'var(--text-primary)',
                color: 'var(--bg-primary)',
              }}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </motion.a>
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default ErrorPage;