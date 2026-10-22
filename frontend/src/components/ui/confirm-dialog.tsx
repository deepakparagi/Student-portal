"use client";

import React, { useEffect, useRef } from "react";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "./button";

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = true,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen && !loading) {
        onCancel();
      }
    }
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, loading, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#080D1C]/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-100"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-desc"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onCancel();
      }}
    >
      <div className="w-full max-w-md rounded-xl border border-[#243556] bg-[#111E3B] p-5 shadow-2xl animate-in zoom-in-95 duration-100" ref={dialogRef}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`grid w-8 h-8 place-items-center rounded-lg shrink-0 ${
                danger
                  ? "bg-[#FB7185]/15 border border-[#FB7185]/30 text-[#FB7185]"
                  : "bg-[#F6C56B]/15 border border-[#F6C56B]/30 text-[#F6C56B]"
              }`}
            >
              <AlertTriangle size={16} />
            </div>
            <h2 id="confirm-dialog-title" className="text-base font-heading font-semibold text-[#F4F7FF]">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            aria-label="Close dialog"
            className="p-1 rounded-md text-[#8998B7] hover:text-[#F4F7FF] hover:bg-[#1A2A4B] transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <p id="confirm-dialog-desc" className="text-sm text-[#C4CEE4] leading-relaxed mb-6">
          {description}
        </p>

        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={onCancel} disabled={loading} size="sm">
            {cancelLabel}
          </Button>
          <Button
            variant={danger ? "danger" : "primary"}
            onClick={onConfirm}
            loading={loading}
            size="sm"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
