"use client";

import Link from "next/link";
import { MoveRight } from "lucide-react";
import { motion } from "framer-motion";

export default function LandingHero() {
  return (
    <section className="relative overflow-hidden">
      <div className="container mx-auto">
        <div className="flex gap-8 py-20 lg:py-40 items-center justify-center flex-col">
          <div className="flex gap-4 flex-col">
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="text-4xl sm:text-5xl lg:text-6xl max-w-2xl tracking-tighter text-center font-bold"
            >
              <span className="text-foreground">Ask questions.</span>
              <br />
              <span className="text-primary">Get cited answers.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.6,
                delay: 0.1,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="text-lg leading-relaxed tracking-tight text-muted-foreground max-w-xl text-center mx-auto"
            >
              Upload any document. Get precise answers
              — each one linked to its source.
            </motion.p>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 0.5,
              delay: 0.2,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="flex flex-col items-center gap-3"
          >
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-primary/30"
            >
              Get started free
              <MoveRight className="w-4 h-4" />
            </Link>
            <p className="text-sm text-muted-foreground">
              Free for 50 documents. No credit card.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
