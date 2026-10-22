"use client";

import React from "react";
import { LucideIcon } from "lucide-react";

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`rounded-xl border border-dashed border-[#243556] bg-[#111E3B]/40 p-10 text-center flex flex-col items-center justify-center ${className}`}
    >
      {Icon && (
        <div className="grid w-10 h-10 place-items-center rounded-lg bg-[#1A2A4B] border border-[#243556] text-[#7185FF] mb-3.5">
          <Icon size={20} />
        </div>
      )}

      <h3 className="text-base font-heading font-semibold text-[#F4F7FF] mb-1">
        {title}
      </h3>

      <p className="text-sm text-[#C4CEE4] max-w-sm mb-5 leading-relaxed">
        {description}
      </p>

      {action && <div>{action}</div>}
    </div>
  );
}
