"use client";

import React from "react";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
}

export function Skeleton({
  width = "100%",
  height = "20px",
  borderRadius = "var(--radius-sm)",
  className = "",
  style,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={`skeleton-pulse ${className}`}
      style={{
        width,
        height,
        borderRadius,
        background: "linear-gradient(90deg, #111E3B 25%, #1A2A4B 50%, #111E3B 75%)",
        backgroundSize: "200% 100%",
        animation: "skeleton-loading 1.5s infinite ease-in-out",
        ...style,
      }}
      aria-hidden="true"
      {...props}
    />
  );
}
