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
      className={`glass-card ${className}`}
      style={{
        padding: "48px 24px",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "var(--radius-lg)",
        border: "1px dashed var(--line-bright)",
        background: "rgba(255, 255, 255, 0.02)",
      }}
    >
      {Icon && (
        <div
          style={{
            display: "grid",
            width: "48px",
            height: "48px",
            placeItems: "center",
            borderRadius: "14px",
            background: "var(--accent-lime-dim)",
            border: "1px solid var(--accent-lime-border)",
            color: "var(--accent-lime)",
            marginBottom: "16px",
          }}
        >
          <Icon size={24} />
        </div>
      )}

      <h3
        style={{
          fontFamily: "var(--font-serif-family)",
          fontSize: "20px",
          fontWeight: 600,
          color: "var(--paper)",
          margin: "0 0 8px 0",
        }}
      >
        {title}
      </h3>

      <p
        style={{
          fontSize: "14px",
          color: "var(--mist)",
          maxWidth: "460px",
          margin: "0 auto",
          lineHeight: 1.6,
        }}
      >
        {description}
      </p>

      {action && <div style={{ marginTop: "20px" }}>{action}</div>}
    </div>
  );
}
