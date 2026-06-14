"use client";

import { motion } from "framer-motion";

export default function SecuritySection() {
  return (
    <section id="security" className="bg-muted/30 py-16 sm:py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.5 }}
        className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8"
      >
        <h2 className="text-3xl font-bold tracking-tight">
          Private by default.
        </h2>
        <p className="mt-4 text-muted-foreground">
          AES-256 encryption. Workspace isolation. Audit logging.
        </p>
      </motion.div>
    </section>
  );
}
