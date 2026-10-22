"use client";

import React from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "quiet" | "ai";
export type ButtonSize = "default" | "sm" | "lg" | "icon";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  href?: string;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "secondary",
      size = "default",
      loading = false,
      disabled,
      href,
      icon,
      iconRight,
      className = "",
      style,
      ...props
    },
    ref
  ) => {
    const baseClasses = ["button"];

    if (variant === "primary") baseClasses.push("primary");
    else if (variant === "secondary") baseClasses.push("secondary");
    else if (variant === "ghost") baseClasses.push("ghost");
    else if (variant === "danger") baseClasses.push("danger");
    else if (variant === "quiet") baseClasses.push("quiet");
    else if (variant === "ai") baseClasses.push("ai");

    if (size === "sm") baseClasses.push("btn-compact");
    if (size === "icon") baseClasses.push("btn-icon");

    if (className) baseClasses.push(className);

    const content = (
      <>
        {loading && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
        {!loading && icon && <span className="button-icon-left">{icon}</span>}
        {children && <span>{children}</span>}
        {!loading && iconRight && <span className="button-icon-right">{iconRight}</span>}
      </>
    );

    if (href) {
      return (
        <Link
          href={href}
          className={baseClasses.join(" ")}
          style={style}
          aria-busy={loading}
          aria-disabled={disabled || loading}
        >
          {content}
        </Link>
      );
    }

    return (
      <button
        ref={ref}
        type={props.type || "button"}
        disabled={disabled || loading}
        aria-busy={loading}
        className={baseClasses.join(" ")}
        style={style}
        {...props}
      >
        {content}
      </button>
    );
  }
);

Button.displayName = "Button";
