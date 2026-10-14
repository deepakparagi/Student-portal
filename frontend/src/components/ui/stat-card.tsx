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
  iconColor = "var(--mint)",
  accentColor = "var(--paper)",
  progressPercent,
  className = "",
  onClick,
}: StatCardProps) {
  return (
    <article
      className={`glass-panel ${className}`}
      onClick={onClick}
      style={{
        padding: "20px 22px",
        borderRadius: "var(--radius-lg)",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        minHeight: "128px",
        cursor: onClick ? "pointer" : "default",
        transition: "transform 0.2s ease, border-color 0.2s ease",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", marginBottom: "8px" }}>
        <span
          style={{
            fontSize: "12px",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "var(--mist)",
            fontWeight: 700,
            lineHeight: 1.3,
          }}
        >
          {label}
        </span>
        {Icon && (
          <div
            style={{
              display: "grid",
              width: "32px",
              height: "32px",
              placeItems: "center",
              borderRadius: "8px",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid var(--line)",
              flexShrink: 0,
            }}
          >
            <Icon size={16} color={iconColor} />
          </div>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "baseline", gap: "6px", margin: "4px 0" }}>
        <span
          style={{
            fontSize: "2.1rem",
            fontWeight: 700,
            fontFamily: "var(--font-serif-family)",
            color: accentColor,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
          }}
        >
          {value}
        </span>
        {unit && (
          <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--mist)" }}>
            {unit}
          </span>
        )}
      </div>

      {progressPercent !== undefined && (
        <div
          style={{
            marginTop: "8px",
            marginBottom: "4px",
            height: "5px",
            borderRadius: "3px",
            background: "rgba(255, 255, 255, 0.08)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${Math.min(Math.max(progressPercent, 0), 100)}%`,
              height: "100%",
              background: "var(--accent-lime)",
              borderRadius: "3px",
              transition: "width 0.5s ease-out",
            }}
          />
        </div>
      )}

      {subtext && (
        <div style={{ fontSize: "12px", color: "var(--mist)", marginTop: "4px", lineHeight: 1.4 }}>
          {subtext}
        </div>
      )}
    </article>
  );
}
