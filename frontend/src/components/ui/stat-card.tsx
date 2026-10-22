"use client";

import React from "react";
import { LucideIcon } from "lucide-react";

export interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  subtext?: React.ReactNode;
  icon?: LucideIcon;
  iconColor?: string;
  accentColor?: string;
  progressPercent?: number;
  className?: string;
  onClick?: () => void;
}

export function StatCard({
  label,
  value,
  unit,
  subtext,
  icon: Icon,
  progressPercent,
  className = "",
  onClick,
}: StatCardProps) {
  return (
    <article
      className={`rounded-xl border border-[#243556] bg-[#111E3B] p-4 flex flex-col justify-between transition-all duration-150 hover:border-[#32476E] ${
        onClick ? "cursor-pointer hover:bg-[#1A2A4B]" : ""
      } ${className}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-medium text-[#8998B7]">
          {label}
        </span>
        {Icon && (
          <div className="grid w-7 h-7 place-items-center rounded-lg bg-[#080D1C] border border-[#243556] text-[#7185FF] shrink-0">
            <Icon size={14} />
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-1.5 my-1">
        <span className="text-2xl font-heading font-bold tracking-tight text-[#F4F7FF]">
          {value}
        </span>
        {unit && (
          <span className="text-xs text-[#8998B7] font-medium">
            {unit}
          </span>
        )}
      </div>

      {subtext && (
        <div className="text-xs text-[#C4CEE4] mt-1 flex items-center gap-1">
          {subtext}
        </div>
      )}

      {typeof progressPercent === "number" && (
        <div className="mt-3 w-full bg-[#1A2A4B] rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full bg-[#7185FF] rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
          />
        </div>
      )}
    </article>
  );
}
