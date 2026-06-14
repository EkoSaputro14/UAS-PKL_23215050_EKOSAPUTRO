"use client";

import Link from "next/link";
import { Bot } from "lucide-react";

export default function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Bot className="size-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight">MimoNotes</span>
        </div>

        <nav className="hidden items-center gap-8 md:flex">
          <a href="#product" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Product
          </a>
          <a href="#pricing" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Pricing
          </a>
          <a href="#security" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Security
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:block"
          >
            Log In
          </Link>
          <Link
            href="/chat"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
          >
            Start Free
          </Link>
        </div>
      </div>
    </header>
  );
}
