import type { Metadata } from "next";
import { QueryProvider } from "@/lib/query-provider";
import "@fontsource/plus-jakarta-sans/400.css";
import "@fontsource/plus-jakarta-sans/500.css";
import "@fontsource/plus-jakarta-sans/600.css";
import "@fontsource/plus-jakarta-sans/700.css";
import "@fontsource/plus-jakarta-sans/800.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import "@fontsource/jetbrains-mono/600.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Smart Study Portal | Adaptive AI Learning Workspace",
  description: "A clean, source-grounded learning portal with intelligent note ingestion, adaptive study plans, active recall quizzes, and parent oversight.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans min-h-screen bg-[#080D1C] text-[#F4F7FF] antialiased selection:bg-[#7185FF]/30 selection:text-[#F4F7FF]">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#7185FF] focus:text-[#080D1C] focus:font-semibold focus:rounded-md focus:shadow-lg focus:outline-none"
        >
          Skip to main content
        </a>
        <QueryProvider>
          <div id="app-root" className="min-h-screen flex flex-col bg-[#080D1C]">{children}</div>
        </QueryProvider>
      </body>
    </html>
  );
}
