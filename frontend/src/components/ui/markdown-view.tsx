"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export interface MarkdownViewProps {
  content: string;
  clampLines?: number;
  allowToggle?: boolean;
  className?: string;
}

export function MarkdownView({
  content,
  clampLines,
  allowToggle = true,
  className = "",
}: MarkdownViewProps) {
  const [expanded, setExpanded] = useState(false);

  const shouldClamp = clampLines && !expanded;

  return (
    <div className={`markdown-view-wrapper ${className}`}>
      <div
        style={{
          fontSize: "13px",
          lineHeight: 1.6,
          color: "var(--paper-soft)",
          overflow: shouldClamp ? "hidden" : "visible",
          display: shouldClamp ? "-webkit-box" : "block",
          WebkitLineClamp: shouldClamp ? clampLines : undefined,
          WebkitBoxOrient: shouldClamp ? "vertical" : undefined,
        }}
        className="prose-dark"
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }) => <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "16px", fontWeight: 700, margin: "12px 0 6px", color: "var(--text-primary)" }}>{children}</h3>,
            h2: ({ children }) => <h4 style={{ fontFamily: "var(--font-heading)", fontSize: "14px", fontWeight: 700, margin: "10px 0 4px", color: "var(--ai-accent)" }}>{children}</h4>,
            h3: ({ children }) => <h5 style={{ fontFamily: "var(--font-heading)", fontSize: "13px", fontWeight: 700, margin: "8px 0 4px", color: "var(--text-primary)" }}>{children}</h5>,
            p: ({ children }) => <p style={{ margin: "4px 0 8px" }}>{children}</p>,
            ul: ({ children }) => <ul style={{ paddingLeft: "18px", margin: "4px 0 8px", listStyleType: "disc" }}>{children}</ul>,
            ol: ({ children }) => <ol style={{ paddingLeft: "18px", margin: "4px 0 8px", listStyleType: "decimal" }}>{children}</ol>,
            li: ({ children }) => <li style={{ margin: "2px 0" }}>{children}</li>,
            strong: ({ children }) => <strong style={{ color: "var(--text-primary)", fontWeight: 700 }}>{children}</strong>,
            em: ({ children }) => <em style={{ color: "var(--ai-accent)", fontStyle: "italic" }}>{children}</em>,
            blockquote: ({ children }) => (
              <blockquote
                style={{
                  borderLeft: "2px solid var(--primary-action)",
                  paddingLeft: "10px",
                  margin: "8px 0",
                  color: "var(--text-secondary)",
                  background: "rgba(17, 30, 59, 0.4)",
                }}
              >
                {children}
              </blockquote>
            ),
            code: ({ children }) => (
              <code
                style={{
                  padding: "2px 6px",
                  borderRadius: "4px",
                  background: "var(--app-bg)",
                  border: "1px solid var(--border-subtle)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                  color: "var(--ai-accent)",
                }}
              >
                {children}
              </code>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>

      {allowToggle && clampLines && content.length > 180 && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          style={{
            marginTop: "6px",
            background: "none",
            border: "none",
            color: "var(--primary-action)",
            fontSize: "12px",
            fontWeight: 700,
            cursor: "pointer",
            padding: 0,
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
          }}
          className="hover:underline hover:text-[#899AFF]"
        >
          {expanded ? "Show less ↑" : "Read full summary →"}
        </button>
      )}
    </div>
  );
}
