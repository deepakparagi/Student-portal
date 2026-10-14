"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export interface PageHeaderProps {
  eyebrow?: React.ReactNode;
  eyebrowIcon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  badge?: React.ReactNode;
  backHref?: string;
  backLabel?: string;
  className?: string;
}

export function PageHeader({
  eyebrow,
  eyebrowIcon,
  title,
  description,
  actions,
  badge,
  backHref,
  backLabel = "Back",
  className = "",
}: PageHeaderProps) {
  return (
    <div
      className={`page-header-wrapper ${className}`}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        marginBottom: "28px",
        paddingTop: "4px",
      }}
    >
      {backHref && (
        <div style={{ marginBottom: "4px" }}>
          <Link
            href={backHref}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "13px",
              fontWeight: 600,
              color: "var(--mist)",
              transition: "color 0.18s ease",
            }}
            className="hover:text-lime-300"
          >
            <ArrowLeft size={14} />
            <span>{backLabel}</span>
          </Link>
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          gap: "20px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ maxWidth: "760px", flex: "1 1 320px" }}>
          {eyebrow && (
            <p className="eyebrow" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              {eyebrowIcon}
              <span>{eyebrow}</span>
            </p>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <h1 className="page-title">{title}</h1>
            {badge && <div>{badge}</div>}
          </div>

          {description && <p className="page-lead">{description}</p>}
        </div>

        {actions && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
              flexShrink: 0,
            }}
          >
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
