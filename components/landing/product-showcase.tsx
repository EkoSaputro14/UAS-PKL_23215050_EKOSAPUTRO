"use client";

import { FileText } from "lucide-react";
import { motion } from "framer-motion";

export default function ProductShowcase() {
  return (
    <section id="product" className="pb-16 pt-8 sm:pb-24 sm:pt-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-primary/10"
        >
          {/* Window chrome */}
          <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
            <div className="size-2.5 rounded-full bg-muted" />
            <div className="size-2.5 rounded-full bg-muted" />
            <div className="size-2.5 rounded-full bg-muted" />
            <span className="ml-2 text-xs text-muted-foreground">MimoNotes</span>
          </div>

          {/* App layout */}
          <div className="flex min-h-[350px] sm:min-h-[420px]">
            {/* Sidebar */}
            <div className="hidden w-52 shrink-0 border-r border-border bg-card p-4 sm:block">
              <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Documents
              </div>
              {[
                "Employee Handbook.pdf",
                "Q4 Financial Report.docx",
                "API Documentation.md",
                "Onboarding Guide.pdf",
              ].map((doc) => (
                <div
                  key={doc}
                  className="mb-1 flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground"
                >
                  <FileText className="size-3.5 shrink-0" />
                  <span className="truncate">{doc}</span>
                </div>
              ))}
            </div>

            {/* Chat area */}
            <div className="flex flex-1 flex-col bg-background p-4 sm:p-6">
              {/* User message */}
              <div className="mb-4 ml-auto max-w-md rounded-xl bg-muted/50 px-4 py-2.5 text-sm">
                What is our vacation policy?
              </div>

              {/* AI response */}
              <div className="mb-3 max-w-lg rounded-xl bg-primary/10 px-4 py-3 text-sm leading-relaxed">
                <p className="mb-2">
                  Full-time employees are entitled to 20 days of paid vacation
                  per year. Vacation must be requested at least 2 weeks in
                  advance through the HR portal.
                </p>
                <p className="text-xs text-muted-foreground">
                  Part-time employees accrue vacation proportionally based on
                  their hours.
                </p>
              </div>

              {/* Citation — THE DIFFERENTIATOR */}
              <div className="flex max-w-md items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
                <FileText className="size-3.5 shrink-0 text-primary" />
                <span className="text-xs text-muted-foreground">
                  Source: Employee Handbook.pdf, Section 2
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-6 text-center text-sm italic text-muted-foreground"
        >
          Every answer includes the exact source.
        </motion.p>
      </div>
    </section>
  );
}
