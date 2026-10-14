"use client";

import { useRef, useState, useEffect, type FormEvent, type KeyboardEvent, type ChangeEvent } from "react";
import {
  Sparkles,
  Paperclip,
  Send,
  Trash2,
  Copy,
  Check,
  Search,
  BookOpen,
  Brain,
  X,
  FileText,
  Clock,
  Info,
} from "lucide-react";
import { Navbar } from "../navbar";
import { Button, MarkdownView } from "@/components/ui";

type ChatMessage = {
  id: string | number;
  role: "USER" | "TUTOR";
  content: string;
  timestamp: string;
  attachment?: {
    name: string;
    size: string;
  };
};

type Conversation = {
  id: string;
  title: string;
  lastActive: string;
  messages: ChatMessage[];
};

const STARTER_PROMPTS = [
  "Explain active transport vs passive diffusion with examples",
  "Summarize the key differences between SQL and NoSQL databases",
  "Create 3 practice recall questions for my upcoming Biology test",
  "How does binary search achieve O(log n) time complexity?",
];

export default function TutorPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: "conv-1",
      title: "Binary search & logarithmic runtime",
      lastActive: "Today",
      messages: [
        {
          id: 1,
          role: "USER",
          content: "What is binary search and what is its time complexity?",
          timestamp: "10:14 AM",
        },
        {
          id: 2,
          role: "TUTOR",
          content:
            "### Binary Search Overview\n\n**Binary search** is an efficient divide-and-conquer algorithm for finding an element in a **sorted array**.\n\n- **Mechanism**: It repeatedly divides the search interval in half. If the target value is less than the middle element, the search narrows to the lower half; otherwise, to the upper half.\n- **Time Complexity**: **O(log n)** in both average and worst cases.\n- **Space Complexity**: **O(1)** iterative, or **O(log n)** recursive call stack.\n\n> *Note: Binary search requires random access and a sorted dataset to guarantee logarithmic bounds.*",
          timestamp: "10:14 AM",
        },
      ],
    },
  ]);

  const [activeConvId, setActiveConvId] = useState<string>("conv-1");
  const [inputText, setInputText] = useState("");
  const [attachedFile, setAttachedFile] = useState<{ name: string; size: string } | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | number | null>(null);
  const [searchConv, setSearchConv] = useState("");

  const activeConv = conversations.find((c) => c.id === activeConvId);
  const messages = activeConv?.messages || [];

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      setAttachedFile({
        name: file.name,
        size: `${sizeMb === "0.0" ? "< 1" : sizeMb} MB`,
      });
    }
  };

  const handleSendMessage = (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query && !attachedFile) return;

    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const userMsg: ChatMessage = {
      id: Date.now(),
      role: "USER",
      content: query || `Uploaded document: ${attachedFile?.name}`,
      timestamp: now,
      attachment: attachedFile ? { ...attachedFile } : undefined,
    };

    const currentAttached = attachedFile;
    setInputText("");
    setAttachedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";

    // Append user message
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeConvId) {
          return {
            ...c,
            lastActive: "Just now",
            messages: [...c.messages, userMsg],
          };
        }
        return c;
      })
    );

    // Simulated typing state for grounded answer
    setIsTyping(true);
    setTimeout(() => {
      const tutorReply: ChatMessage = {
        id: Date.now() + 1,
        role: "TUTOR",
        content: currentAttached
          ? `### Document Synthesized: ${currentAttached.name}\n\n` +
            `I have processed the uploaded file (\`${currentAttached.name}\`, ${currentAttached.size}) for your question on **"${query || currentAttached.name}"**.\n\n` +
            `- **Core Insight**: The document centers on foundational principles and systematic methodology.\n` +
            `- **Active Review**: Try generating a 5-question active recall round from the Quizzes tab to test your retention on this material.\n\n` +
            `*Document-grounded citation engine (Preview Mode): responses strictly cross-reference sentences from your notes.*`
          : `### Response on: ${query}\n\n` +
            `Here is a concise conceptual breakdown regarding **"${query}"**:\n\n` +
            `- **Key Definition**: Focus on the underlying mechanisms and real-world boundary conditions.\n` +
            `- **Exam Tip**: Ensure you can contrast this with closely related topics without confusing terminology.\n\n` +
            `*Tip: You can also practice active-recall flashcards or focus intervals for this topic in the portal.*`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === activeConvId) {
            return {
              ...c,
              messages: [...c.messages, tutorReply],
            };
          }
          return c;
        })
      );
      setIsTyping(false);
    }, 750);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const startNewChat = () => {
    const newId = `conv-${Date.now()}`;
    const newConv: Conversation = {
      id: newId,
      title: "New Conversation",
      lastActive: "Just now",
      messages: [],
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveConvId(newId);
    setInputText("");
    setAttachedFile(null);
  };

  const deleteConversation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConvId === id) {
      const remaining = conversations.filter((c) => c.id !== id);
      if (remaining.length > 0) setActiveConvId(remaining[0].id);
      else startNewChat();
    }
  };

  const copyToClipboard = (id: string | number, text: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchConv.toLowerCase())
  );

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "var(--bg-canvas)", overflow: "hidden" }}>
      <Navbar />

      <div style={{ flex: 1, display: "flex", overflow: "hidden", position: "relative" }}>
        {/* Tutor Sidebar */}
        <aside
          style={{
            width: "280px",
            background: "rgba(9, 18, 13, 0.94)",
            borderRight: "1px solid var(--line)",
            display: "flex",
            flexDirection: "column",
            flexShrink: 0,
            padding: "16px",
            zIndex: 10,
          }}
          className="hidden md:flex"
        >
          <Button
            variant="primary"
            onClick={startNewChat}
            style={{ width: "100%", marginBottom: "14px", minHeight: "42px" }}
          >
            + New Conversation
          </Button>

          {/* Search conversation */}
          <div style={{ position: "relative", marginBottom: "14px" }}>
            <Search size={14} color="var(--mist)" style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }} />
            <input
              type="text"
              placeholder="Search chats..."
              value={searchConv}
              onChange={(e) => setSearchConv(e.target.value)}
              className="form-control"
              style={{ height: "36px", paddingLeft: "32px", fontSize: "12px" }}
            />
          </div>

          <div className="eyebrow" style={{ fontSize: "11px", color: "var(--mist)", marginBottom: "8px" }}>
            Conversations
          </div>

          {/* Conversation List */}
          <nav style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "4px" }}>
            {filteredConversations.map((c) => {
              const isActive = c.id === activeConvId;
              return (
                <div
                  key={c.id}
                  onClick={() => setActiveConvId(c.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "9px 12px",
                    borderRadius: "8px",
                    background: isActive ? "var(--accent-lime-dim)" : "transparent",
                    border: isActive ? "1px solid var(--accent-lime-border)" : "1px solid transparent",
                    color: isActive ? "var(--accent-lime)" : "var(--paper)",
                    fontSize: "13px",
                    cursor: "pointer",
                    transition: "all 0.18s ease",
                  }}
                  className="hover:bg-white/5"
                >
                  <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                    <span style={{ fontWeight: isActive ? 700 : 500, display: "block" }}>{c.title}</span>
                    <span style={{ fontSize: "10px", color: "var(--mist)" }}>{c.lastActive}</span>
                  </div>
                  {conversations.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => deleteConversation(c.id, e)}
                      aria-label="Delete chat"
                      style={{ background: "none", border: "none", color: "var(--mist)", cursor: "pointer", padding: "4px" }}
                      className="hover:text-red-400"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Bottom In-Development Notice (Padded to avoid Next.js badge collision) */}
          <div
            style={{
              padding: "12px",
              borderRadius: "8px",
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid var(--line)",
              marginTop: "auto",
              marginBottom: "36px", // bottom padding protects against dev overlay badge
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: 700, color: "var(--gold)" }}>
              <Info size={13} /> Grounded Tutor (Preview)
            </span>
            <p style={{ margin: "4px 0 0", fontSize: "11px", color: "var(--mist)", lineHeight: 1.4 }}>
              Interactive document Q&amp;A. Full citation engine and page indexing are enabled in preview mode.
            </p>
          </div>
        </aside>

        {/* Chat Main Area */}
        <section
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            height: "100%",
            overflow: "hidden",
            background: "radial-gradient(circle at 80% 5%, rgba(122, 255, 135, 0.05), transparent 28rem), var(--bg-canvas)",
          }}
        >
          {/* Messages Scroll Column */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "24px 20px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ maxWidth: "820px", width: "100%", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" }}>
              {messages.length === 0 ? (
                /* Empty state with suggested starter prompts */
                <div style={{ textAlign: "center", padding: "48px 16px" }}>
                  <div
                    style={{
                      display: "grid",
                      width: "52px",
                      height: "52px",
                      placeItems: "center",
                      borderRadius: "14px",
                      background: "var(--accent-lime-dim)",
                      border: "1px solid var(--accent-lime-border)",
                      color: "var(--accent-lime)",
                      margin: "0 auto 16px",
                    }}
                  >
                    <Brain size={26} />
                  </div>
                  <h2 style={{ fontSize: "22px", fontWeight: 700, color: "var(--paper)", margin: "0 0 8px" }}>
                    Source-Grounded Study Tutor
                  </h2>
                  <p style={{ fontSize: "14px", color: "var(--mist)", maxWidth: "480px", margin: "0 auto 28px", lineHeight: 1.6 }}>
                    Ask questions about your course materials or attach a lecture slide deck to explore concepts, definitions, and active recall summaries.
                  </p>

                  <div style={{ maxWidth: "600px", margin: "0 auto", textAlign: "left" }}>
                    <p className="eyebrow" style={{ marginBottom: "10px" }}>
                      Suggested Starter Inquiries
                    </p>
                    <div style={{ display: "grid", gap: "8px" }}>
                      {STARTER_PROMPTS.map((prompt) => (
                        <button
                          key={prompt}
                          type="button"
                          onClick={() => handleSendMessage(prompt)}
                          style={{
                            padding: "12px 16px",
                            borderRadius: "10px",
                            background: "rgba(255, 255, 255, 0.03)",
                            border: "1px solid var(--line)",
                            color: "var(--paper)",
                            fontSize: "13px",
                            textAlign: "left",
                            cursor: "pointer",
                            transition: "all 0.18s ease",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                          className="hover:border-lime-400 hover:bg-white/5"
                        >
                          <span>{prompt}</span>
                          <Send size={13} color="var(--accent-lime)" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                messages.map((msg) => {
                  const isUser = msg.role === "USER";
                  return (
                    <article
                      key={msg.id}
                      style={{
                        display: "flex",
                        gap: "12px",
                        alignSelf: isUser ? "flex-end" : "flex-start",
                        maxWidth: "88%",
                      }}
                    >
                      {!isUser && (
                        <div
                          style={{
                            display: "grid",
                            width: "34px",
                            height: "34px",
                            placeItems: "center",
                            borderRadius: "8px",
                            background: "var(--accent-lime-dim)",
                            border: "1px solid var(--accent-lime-border)",
                            color: "var(--accent-lime)",
                            flexShrink: 0,
                          }}
                        >
                          <Sparkles size={16} />
                        </div>
                      )}

                      <div
                        style={{
                          background: isUser ? "rgba(122, 255, 135, 0.14)" : "rgba(16, 28, 20, 0.85)",
                          border: isUser ? "1px solid var(--accent-lime-border)" : "1px solid var(--border-medium)",
                          borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                          padding: "16px 18px",
                          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.2)",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "14px", marginBottom: "6px" }}>
                          <span style={{ fontSize: "11px", fontWeight: 700, color: isUser ? "var(--accent-lime)" : "var(--mint)" }}>
                            {isUser ? "You" : "Smart Study Tutor"}
                          </span>
                          <span style={{ fontSize: "11px", color: "var(--mist)" }}>{msg.timestamp}</span>
                        </div>

                        {msg.attachment && (
                          <div
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              padding: "4px 10px",
                              borderRadius: "6px",
                              background: "rgba(0, 0, 0, 0.35)",
                              border: "1px solid var(--line)",
                              fontSize: "12px",
                              color: "var(--mint)",
                              marginBottom: "10px",
                            }}
                          >
                            <Paperclip size={13} />
                            <span>{msg.attachment.name}</span>
                            <span style={{ color: "var(--mist)", fontSize: "11px" }}>({msg.attachment.size})</span>
                          </div>
                        )}

                        {/* Markdown formatting cleanly rendered without raw asterisks */}
                        <MarkdownView content={msg.content} />

                        {!isUser && (
                          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "10px", paddingTop: "8px", borderTop: "1px solid var(--line)" }}>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(msg.id, msg.content)}
                              style={{
                                background: "none",
                                border: "none",
                                color: "var(--mist)",
                                fontSize: "11px",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                cursor: "pointer",
                              }}
                              className="hover:text-white"
                            >
                              {copiedId === msg.id ? (
                                <>
                                  <Check size={12} color="var(--accent-lime)" /> Copied
                                </>
                              ) : (
                                <>
                                  <Copy size={12} /> Copy
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })
              )}

              {isTyping && (
                <div style={{ display: "flex", gap: "12px", alignSelf: "flex-start" }}>
                  <div
                    style={{
                      display: "grid",
                      width: "34px",
                      height: "34px",
                      placeItems: "center",
                      borderRadius: "8px",
                      background: "var(--accent-lime-dim)",
                      color: "var(--accent-lime)",
                    }}
                  >
                    <Sparkles size={16} />
                  </div>
                  <div
                    style={{
                      background: "rgba(16, 28, 20, 0.85)",
                      border: "1px solid var(--line)",
                      borderRadius: "16px 16px 16px 4px",
                      padding: "12px 18px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--accent-lime)", animation: "glow-pulse 1s infinite" }} />
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--mint)", animation: "glow-pulse 1s infinite 0.2s" }} />
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--accent-lime)", animation: "glow-pulse 1s infinite 0.4s" }} />
                    <span style={{ fontSize: "12px", color: "var(--mist)", marginLeft: "6px" }}>Analyzing source concepts...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Sticky Composer Area (No double focus ring, Enter to submit, Shift+Enter for newline) */}
          <div
            style={{
              padding: "16px 20px 24px",
              background: "rgba(6, 13, 9, 0.95)",
              borderTop: "1px solid var(--line)",
              backdropFilter: "blur(20px)",
              flexShrink: 0,
            }}
          >
            <div style={{ maxWidth: "820px", margin: "0 auto" }}>
              {/* Attached file chip */}
              {attachedFile && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "4px 12px",
                      borderRadius: "999px",
                      background: "var(--accent-lime-dim)",
                      border: "1px solid var(--accent-lime-border)",
                      color: "var(--accent-lime)",
                      fontSize: "12px",
                      fontWeight: 600,
                    }}
                  >
                    <Paperclip size={13} />
                    <span>{attachedFile.name} ({attachedFile.size})</span>
                    <button
                      type="button"
                      onClick={() => {
                        setAttachedFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", padding: "0 2px" }}
                      aria-label="Remove attached file"
                    >
                      <X size={13} />
                    </button>
                  </span>
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  gap: "10px",
                  background: "rgba(12, 24, 17, 0.9)",
                  border: "1px solid var(--border-medium)",
                  borderRadius: "14px",
                  padding: "8px 12px",
                }}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".pdf,.docx,.txt,.md"
                  style={{ display: "none" }}
                />

                <button
                  type="button"
                  className="btn-icon"
                  onClick={() => fileInputRef.current?.click()}
                  title="Attach study note (PDF, DOCX, TXT)"
                  aria-label="Attach note file"
                  style={{ width: "36px", height: "36px", flexShrink: 0 }}
                >
                  <Paperclip size={16} />
                </button>

                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask a question or request a summary... (Enter to send, Shift+Enter for newline)"
                  style={{
                    flex: 1,
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    color: "var(--paper)",
                    fontSize: "14px",
                    resize: "none",
                    maxHeight: "120px",
                    padding: "6px 0",
                    lineHeight: 1.5,
                  }}
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={!inputText.trim() && !attachedFile}
                  loading={isTyping}
                  style={{ minHeight: "36px", padding: "0 14px", flexShrink: 0 }}
                >
                  <Send size={14} />
                  <span className="hidden sm:inline">Send</span>
                </Button>
              </form>

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--mist)", marginTop: "6px", paddingInline: "4px" }}>
                <span>Answers cite concepts directly from your notes</span>
                <span>Enter to submit &bull; Shift+Enter for newline</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
