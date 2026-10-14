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
            h1: ({ children }) => <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "12px 0 6px", color: "var(--paper)" }}>{children}</h3>,
            h2: ({ children }) => <h4 style={{ fontSize: "14px", fontWeight: 700, margin: "10px 0 4px", color: "var(--mint)" }}>{children}</h4>,
            h3: ({ children }) => <h5 style={{ fontSize: "13px", fontWeight: 700, margin: "8px 0 4px", color: "var(--paper)" }}>{children}</h5>,
            p: ({ children }) => <p style={{ margin: "4px 0 8px" }}>{children}</p>,
            ul: ({ children }) => <ul style={{ paddingLeft: "18px", margin: "4px 0 8px", listStyleType: "disc" }}>{children}</ul>,
            ol: ({ children }) => <ol style={{ paddingLeft: "18px", margin: "4px 0 8px", listStyleType: "decimal" }}>{children}</ol>,
            li: ({ children }) => <li style={{ margin: "2px 0" }}>{children}</li>,
            strong: ({ children }) => <strong style={{ color: "var(--paper)", fontWeight: 700 }}>{children}</strong>,
            em: ({ children }) => <em style={{ color: "var(--mint)", fontStyle: "italic" }}>{children}</em>,
            blockquote: ({ children }) => (
              <blockquote
                style={{
                  borderLeft: "2px solid var(--accent-lime)",
                  paddingLeft: "10px",
                  margin: "8px 0",
                  color: "var(--mist)",
                  background: "rgba(255, 255, 255, 0.02)",
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
                  background: "rgba(0, 0, 0, 0.4)",
                  border: "1px solid var(--line)",
                  fontFamily: "monospace",
                  fontSize: "12px",
                  color: "var(--mint)",
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
            color: "var(--accent-lime)",
            fontSize: "12px",
            fontWeight: 700,
            cursor: "pointer",
            padding: 0,
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
          }}
          className="hover:underline"
        >
          {expanded ? "Show less ↑" : "Read full summary →"}
        </button>
      )}
    </div>
  );
}
