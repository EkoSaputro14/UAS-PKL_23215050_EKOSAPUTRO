"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ConfirmOptions {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
}

let resolvePromise: ((value: boolean) => void) | null = null;

export function useConfirm() {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({
    title: "",
    description: "",
  });

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setOptions(opts);
      setOpen(true);
      resolvePromise = resolve;
    });
  }, []);

  const handleConfirm = () => {
    setOpen(false);
    resolvePromise?.(true);
    resolvePromise = null;
  };

  const handleCancel = () => {
    setOpen(false);
    resolvePromise?.(false);
    resolvePromise = null;
  };

  const ConfirmDialog = (
    <Dialog open={open} onOpenChange={(v) => !v && handleCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{options.title}</DialogTitle>
          <DialogDescription>{options.description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            {options.cancelLabel || "Batal"}
          </Button>
          <Button
            variant={options.variant === "destructive" ? "destructive" : "default"}
            onClick={handleConfirm}
          >
            {options.confirmLabel || "Ya"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return { confirm, ConfirmDialog };
}
