"use client";

import { useRef, useState, useEffect, useCallback, type FormEvent, type KeyboardEvent, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Paperclip,
  Send,
  Trash2,
  Copy,
  Check,
  Search,
  FileText,
  Loader2,
  ChevronDown,
  ChevronUp,
  Eye,
  MessageSquare,
  Shield,
  Plus,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from "lucide-react";
import { Navbar } from "../navbar";
import { Button } from "@/components/ui/button";
import { MarkdownView } from "@/components/ui/markdown-view";
import {
  useTutorConversations,
  useCreateTutorConversation,
  useAskTutor,
  useAskTutorGrounded,
  useDeleteTutorConversation,
  useClearAllTutorConversations,
  useRenameTutorConversation,
  useTutorHealth,
  type TutorAskResponse,
  type TutorSource,
} from "@/hooks/useTutor";
import { useMaterials, useUploadMaterial } from "@/hooks/useMaterials";
import { api } from "@/lib/api";

type ChatMessage = {
  id: string | number;
  role: "USER" | "TUTOR";
  content: string;
  timestamp: string;
  sources?: TutorSource[];
  grounded?: boolean;
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

type DocumentItem = {
  id: number;
  title: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  status: string;
  summary: string | null;
  createdAt: string;
};

const STARTER_PROMPTS = [
  "Summarize key concepts from my notes",
  "Generate 5 active recall questions",
  "Explain the core arguments in this document",
  "What are the main definitions and formulas?",
];

const FILE_TYPE_LABELS: Record<string, string> = {
  "application/pdf": "PDF",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "XLSX",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "PPTX",
  "text/plain": "TXT",
  "text/csv": "CSV",
  "text/markdown": "MD",
};

export default function TutorPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auth verification
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1"}/auth/me`, { credentials: "include" })
      .then((res) => {
        if (res.status === 401 || res.status === 403) {
          router.push("/login?redirect=/ai-tutor");
        }
      })
      .catch(() => {});
  }, [router]);

  // Data fetching
  const { data: conversationsData = [], refetch: refetchConversations } = useTutorConversations();
  const { data: materialsData = { content: [] }, refetch: refetchMaterials } = useMaterials();
  const { data: healthData } = useTutorHealth();

  // Mutations
  const createConversation = useCreateTutorConversation();
  const askTutor = useAskTutor();
  const askTutorGrounded = useAskTutorGrounded();
  const deleteConversation = useDeleteTutorConversation();
  const clearAllConversations = useClearAllTutorConversations();
  const renameConversation = useRenameTutorConversation();
  const uploadMaterial = useUploadMaterial();

  // State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string>("");
  const [inputText, setInputText] = useState("");
  const [attachedFile, setAttachedFile] = useState<{ name: string; size: string; file: File } | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | number | null>(null);
  const [searchConv, setSearchConv] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedMaterialIds, setSelectedMaterialIds] = useState<number[]>([]);
  const [expandedSources, setExpandedSources] = useState<Set<string>>(new Set());
  const [showSourceModal, setShowSourceModal] = useState<{ source: TutorSource; messageId: string | number } | null>(null);
  const [loadingConvId, setLoadingConvId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>("smartstudy-tutor");

  useEffect(() => {
    const saved = localStorage.getItem("ai_tutor_model");
    if (saved) setSelectedModel(saved);
  }, []);

  const handleModelChange = (m: string) => {
    setSelectedModel(m);
    localStorage.setItem("ai_tutor_model", m);
  };

  // Sync conversations list from server without wiping already-loaded messages or active local chats
  useEffect(() => {
    if (!conversationsData || conversationsData.length === 0) {
      setConversations((prev) => prev.filter((c) => c.id.startsWith("conv-")));
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setConversations((prev) => {
        const prevMap = new Map(prev.map((c) => [c.id, c]));
        const localConvs = prev.filter((c) => c.id.startsWith("conv-"));
        const serverConvs = conversationsData.map((c: any) => {
          const idStr = String(c.id);
          const existing = prevMap.get(idStr);
          return {
            id: idStr,
            title: c.title,
            lastActive: c.createdAt,
            messages: existing && existing.messages && existing.messages.length > 0 ? existing.messages : [],
          };
        });
        return [...localConvs, ...serverConvs];
      });
      setActiveConvId((curr) => {
        if (!curr && conversationsData.length > 0) {
          return String(conversationsData[0].id);
        }
        return curr;
      });
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [conversationsData]);

  // Load conversation messages whenever activeConvId changes
  useEffect(() => {
    if (!activeConvId || activeConvId.startsWith("conv-")) return;
    const numId = parseInt(activeConvId, 10);
    if (isNaN(numId)) return;

    let isSubscribed = true;
    const timeoutId = window.setTimeout(() => {
      setLoadingConvId(activeConvId);
      void api.get<{ conversation: any; messages: any[] }>(`/tutor/conversations/${numId}`)
      .then((res) => {
        if (!isSubscribed || !res) return;
        const fetchedMessages: ChatMessage[] = (res.messages || []).map((m: any) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: m.createdAt
            ? new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : "Just now",
          sources: m.sources,
          grounded: Array.isArray(m.sources) && m.sources.length > 0,
        }));

        setConversations((prev) => {
          const exists = prev.some((c) => c.id === activeConvId);
          if (exists) {
            return prev.map((c) =>
              c.id === activeConvId
                ? {
                    ...c,
                    title: res.conversation?.title || c.title,
                    messages: fetchedMessages,
                  }
                : c
            );
          } else if (res.conversation) {
            return [
              {
                id: String(res.conversation.id),
                title: res.conversation.title,
                lastActive: res.conversation.createdAt,
                messages: fetchedMessages,
              },
              ...prev,
            ];
          }
          return prev;
        });
      })
      .catch((err) => {
        console.error("Failed to load conversation details:", err);
      })
      .finally(() => {
        if (isSubscribed) setLoadingConvId(null);
      });
    }, 0);

    return () => {
      isSubscribed = false;
      window.clearTimeout(timeoutId);
    };
  }, [activeConvId]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversations, activeConvId, isTyping]);

  const activeConv = conversations.find((c) => c.id === activeConvId);
  const messages = activeConv?.messages || [];
  const documents: DocumentItem[] = (materialsData.content || []) as unknown as DocumentItem[];
  const availableDocuments = documents.filter((d) => d.status === "COMPLETED");
  const isOllamaHealthy = Boolean((healthData as any)?.ollama?.server === "healthy");

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      setAttachedFile({
        name: file.name,
        size: `${sizeMb === "0.0" ? "< 1" : sizeMb} MB`,
        file,
      });
    }
  };

  const handleSendMessage = useCallback(async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query && !attachedFile) return;

    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const userMsg: ChatMessage = {
      id: Date.now(),
      role: "USER",
      content: query || `Uploaded document: ${attachedFile?.name}`,
      timestamp: now,
      attachment: attachedFile ? { name: attachedFile.name, size: attachedFile.size } : undefined,
    };

    const currentAttached = attachedFile;
    const currentQuery = query;
    const currentSelectedMaterials = [...selectedMaterialIds];
    let currentConvId = activeConvId;

    setInputText("");
    setAttachedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";

    // If no active conversation exists, generate a new conversation entry immediately
    if (!currentConvId || !conversations.some((c) => c.id === currentConvId)) {
      currentConvId = `conv-${Date.now()}`;
      setActiveConvId(currentConvId);
      const newConv: Conversation = {
        id: currentConvId,
        title: query ? (query.length > 28 ? query.slice(0, 28) + "..." : query) : "Study Chat",
        lastActive: "Just now",
        messages: [userMsg],
      };
      setConversations((prev) => [newConv, ...prev.filter((c) => c.id !== currentConvId)]);
    } else {
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === currentConvId) {
            return {
              ...c,
              lastActive: "Just now",
              messages: [...c.messages, userMsg],
            };
          }
          return c;
        })
      );
    }

    setIsTyping(true);

    try {
      let newlyUploadedId: number | undefined;
      // If a document was attached with the paperclip, upload it to /materials first so it is processed & indexed
      if (currentAttached) {
        try {
          const uploadedMat = await uploadMaterial.mutateAsync(currentAttached.file);
          if (uploadedMat?.id) {
            newlyUploadedId = uploadedMat.id;
            // Poll for processing to reach COMPLETED so text & chunks are ready
            for (let pollCount = 0; pollCount < 25; pollCount++) {
              try {
                const checkRes = await api.get<{ status: string }>(`/materials/${newlyUploadedId}`);
                if (checkRes?.status === "COMPLETED") break;
              } catch {}
              await new Promise((r) => setTimeout(r, 500));
            }
            setSelectedMaterialIds([newlyUploadedId]);
            refetchMaterials();
          }
        } catch (uploadErr) {
          console.warn("Material upload warning, proceeding with query:", uploadErr);
        }
      }

      // If user uploaded a new document, target ONLY that document!
      // Otherwise use selected materials; if none selected, ground against all completed notes
      let targetMaterialIds = newlyUploadedId ? [newlyUploadedId] : [...currentSelectedMaterials];
      if (targetMaterialIds.length === 0 && availableDocuments.length > 0) {
        targetMaterialIds = availableDocuments.map((d) => d.id);
      }

      const dbConvId = currentConvId && !currentConvId.startsWith("conv-") && !isNaN(Number(currentConvId))
        ? parseInt(currentConvId, 10)
        : undefined;

      let result: TutorAskResponse;
      if (targetMaterialIds.length > 0) {
        result = await askTutorGrounded.mutateAsync({
          question: currentQuery || `Analyze and answer key questions from: ${currentAttached?.name}`,
          materialIds: targetMaterialIds,
          conversationId: dbConvId,
          model: selectedModel,
        });
      } else {
        result = await askTutor.mutateAsync({
          question: currentQuery || `Analyze: ${currentAttached?.name}`,
          conversationId: dbConvId,
          grounded: true,
          model: selectedModel,
        });
      }

      const tutorReply: ChatMessage = {
        id: Date.now() + 1,
        role: "TUTOR",
        content: result.messages[result.messages.length - 1]?.content || "No response generated.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        sources: result.messages[result.messages.length - 1]?.sources,
        grounded: result.grounded,
      };

      const finalConvId = result.conversationId ? String(result.conversationId) : currentConvId;
      if (currentConvId !== finalConvId) {
        setActiveConvId(finalConvId);
      }

      setConversations((prev) => {
        const found = prev.some((c) => c.id === currentConvId || c.id === finalConvId);
        if (!found) {
          return [
            {
              id: finalConvId,
              title: currentQuery ? (currentQuery.length > 28 ? currentQuery.slice(0, 28) + "..." : currentQuery) : "Study Chat",
              lastActive: "Just now",
              messages: [userMsg, tutorReply],
            },
            ...prev,
          ];
        }
        return prev.map((c) => {
          if (c.id === currentConvId || c.id === finalConvId) {
            return {
              ...c,
              id: finalConvId,
              messages: [...c.messages, tutorReply],
            };
          }
          return c;
        });
      });

      refetchConversations();
    } catch (error: any) {
      const status = error?.status;
      const code = error?.code;
      const rawMsg = error?.message || "An unexpected error occurred.";

      let contentMsg = `⚠️ **Error**: ${rawMsg}`;
      if (status === 401 || status === 403 || code === "UNAUTHORIZED" || code === "FORBIDDEN" || rawMsg.includes("403") || rawMsg.includes("401")) {
        contentMsg = `⚠️ **Session Expired / Authentication Required**\n\nYour login session has expired or you are not currently signed in.\n\nPlease **[Click here to Log In](/login?redirect=/ai-tutor)** to continue your conversation.`;
      } else if (status === 422 || code === "VALIDATION_ERROR") {
        contentMsg = `⚠️ **Input Validation**: ${rawMsg.replace(/HTTP 422:?\s*/i, "")}`;
      } else if (status === 400 || status === 404 || code === "MODEL_ERROR") {
        contentMsg = `⚠️ **Model Configuration**: ${rawMsg.replace(/HTTP (400|404):?\s*/i, "")}`;
      } else if (status === 504 || code === "TIMEOUT_ERROR") {
        contentMsg = `⚠️ **Request Timeout**: The local AI engine took too long to complete generation. Try asking a more specific question or using a shorter context.`;
      } else if (status === 503 || code === "SERVICE_UNAVAILABLE" || rawMsg.includes("Connection refused") || rawMsg.includes("Failed to fetch")) {
        contentMsg = `⚠️ **Local AI Unavailable**: Could not connect to local Ollama on http://127.0.0.1:11434. Please check that Ollama is running.`;
      } else if (status === 409) {
        contentMsg = `⚠️ **Document Processing**: ${rawMsg}`;
      }

      const tutorReply: ChatMessage = {
        id: Date.now() + 1,
        role: "TUTOR",
        content: contentMsg,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        grounded: false,
      };

      setConversations((prev) => {
        const found = prev.some((c) => c.id === currentConvId);
        if (!found) {
          return [
            {
              id: currentConvId,
              title: currentQuery ? (currentQuery.length > 28 ? currentQuery.slice(0, 28) + "..." : currentQuery) : "Study Chat",
              lastActive: "Just now",
              messages: [userMsg, tutorReply],
            },
            ...prev,
          ];
        }
        return prev.map((c) => {
          if (c.id === currentConvId) {
            return {
              ...c,
              messages: [...c.messages, tutorReply],
            };
          }
          return c;
        });
      });
    } finally {
      setIsTyping(false);
    }
  }, [inputText, attachedFile, activeConvId, selectedMaterialIds, availableDocuments, selectedModel, askTutor, askTutorGrounded, uploadMaterial, refetchMaterials, refetchConversations, conversations]);

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
  };

  const deleteConversationHandler = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const remaining = conversations.filter((c) => c.id !== id);
    setConversations(remaining);
    if (activeConvId === id) {
      setActiveConvId(remaining.length > 0 ? remaining[0].id : "");
    }
    const cleanId = id.replace("conv-", "");
    const numId = parseInt(cleanId, 10);
    if (!isNaN(numId)) {
      try {
        await deleteConversation.mutateAsync(numId);
        refetchConversations();
      } catch (err) {
        console.error("Failed to delete conversation:", err);
      }
    }
  };

  const handleClearAllConversations = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setConversations([]);
    setActiveConvId("");
    try {
      await clearAllConversations.mutateAsync();
      refetchConversations();
    } catch (err) {
      console.error("Failed to clear all conversations:", err);
    }
  };

  const toggleSourceExpanded = (sourceId: string) => {
    setExpandedSources((prev) => {
      const next = new Set(prev);
      if (next.has(sourceId)) next.delete(sourceId);
      else next.add(sourceId);
      return next;
    });
  };

  const copyToClipboard = (id: string | number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchConv.toLowerCase())
  );

  return (
    <div className="flex flex-col h-screen bg-brand-primary text-brand-light overflow-hidden">
      <Navbar />

      <div className="flex flex-1 overflow-hidden relative">
        {/* SIDEBAR: Conversations & Documents */}
        <aside
          className={`${
            sidebarOpen ? "w-72" : "w-0 -ml-72"
          } transition-all duration-200 border-r border-brand-neutral/20 bg-brand-secondary flex flex-col shrink-0 z-20 overflow-hidden`}
        >
          {/* Sidebar Top: New Chat & Search */}
          <div className="p-3 border-b border-brand-neutral/20 space-y-2">
            <button
              onClick={startNewChat}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-md bg-brand-accent hover:bg-brand-accent text-brand-light text-xs font-medium shadow-sm transition-colors cursor-pointer"
            >
              <Plus size={14} /> New Conversation
            </button>

            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-2.5 text-brand-muted" />
              <input
                type="text"
                placeholder="Search chats..."
                value={searchConv}
                onChange={(e) => setSearchConv(e.target.value)}
                className="w-full h-8 pl-8 pr-3 bg-brand-primary border border-brand-neutral/20 rounded-md text-xs text-brand-neutral placeholder-zinc-500 focus:outline-none focus:border-brand-neutral/30"
              />
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            <div className="flex items-center justify-between px-2 py-1 text-[11px] font-medium text-brand-muted uppercase tracking-wider">
              <span>Conversations ({filteredConversations.length})</span>
              {filteredConversations.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAllConversations}
                  className="text-[10px] text-brand-muted hover:text-red-400 cursor-pointer transition-colors"
                  title="Clear all conversations"
                >
                  Clear All
                </button>
              )}
            </div>

            {filteredConversations.map((c) => {
              const isActive = c.id === activeConvId;
              return (
                <div
                  key={c.id}
                  onClick={() => setActiveConvId(c.id)}
                  className={`group flex items-center justify-between px-2.5 py-2 rounded-md text-xs transition-colors cursor-pointer ${
                    isActive
                      ? "bg-brand-secondary text-brand-light font-medium"
                      : "text-brand-neutral hover:text-brand-neutral hover:bg-brand-secondary/50"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                    <MessageSquare size={13} className={isActive ? "text-brand-neutral" : "text-brand-muted"} />
                    <span className="truncate">{c.title}</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => deleteConversationHandler(c.id, e)}
                    aria-label="Delete chat"
                    className="opacity-40 group-hover:opacity-100 p-1 text-brand-muted hover:text-red-400 rounded transition-all shrink-0 ml-1.5 cursor-pointer"
                    title="Delete chat"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}

            {filteredConversations.length === 0 && (
              <div className="px-3 py-6 text-center text-xs text-brand-muted">
                No conversations found
              </div>
            )}
          </div>

          {/* Document Grounding Selector */}
          <div className="p-3 border-t border-brand-neutral/20 bg-brand-primary/60">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-medium text-brand-neutral uppercase tracking-wider">
                Grounded Notes ({availableDocuments.length})
              </span>
              {selectedMaterialIds.length > 0 && (
                <button
                  onClick={() => setSelectedMaterialIds([])}
                  className="text-[10px] text-brand-neutral hover:underline cursor-pointer"
                >
                  Clear ({selectedMaterialIds.length})
                </button>
              )}
            </div>

            <div className="max-h-36 overflow-y-auto space-y-1">
              {availableDocuments.length === 0 ? (
                <div className="p-3 rounded border border-dashed border-brand-neutral/20 text-center text-[11px] text-brand-muted">
                  No completed notes yet
                </div>
              ) : (
                availableDocuments.map((doc) => {
                  const isSelected = selectedMaterialIds.includes(doc.id);
                  const label = FILE_TYPE_LABELS[doc.mimeType] || "DOC";
                  return (
                    <label
                      key={doc.id}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-md border text-xs cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-brand-accent/20 border-brand-neutral/30 text-brand-light"
                          : "bg-brand-primary/60 border-brand-neutral/20 text-brand-neutral hover:border-brand-neutral/30"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedMaterialIds((p) => [...p, doc.id]);
                          else setSelectedMaterialIds((p) => p.filter((id) => id !== doc.id));
                        }}
                        className="rounded border-brand-neutral/30 text-brand-neutral focus:ring-0 cursor-pointer"
                      />
                      <span className="text-[10px] px-1 py-0.5 rounded bg-brand-secondary text-brand-neutral font-mono">
                        {label}
                      </span>
                      <span className="truncate flex-1 text-[11px]">{doc.title}</span>
                    </label>
                  );
                })
              )}
            </div>
          </div>
        </aside>

        {/* MAIN CHAT AREA */}
        <main className="flex-1 flex flex-col h-full bg-brand-primary overflow-hidden">
          {/* Chat Header Bar */}
          <div className="h-11 px-4 border-b border-brand-neutral/20 flex items-center justify-between bg-brand-secondary/50 shrink-0">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSidebarOpen((o) => !o)}
                className="p-1 rounded text-brand-neutral hover:text-brand-neutral hover:bg-brand-secondary transition-colors cursor-pointer"
                title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
              >
                {sidebarOpen ? <PanelLeftClose size={15} /> : <PanelLeftOpen size={15} />}
              </button>
              <h2 className="text-xs font-medium text-brand-neutral truncate max-w-xs">
                {activeConv?.title || "AI Tutor"}
              </h2>
            </div>

            <div className="flex items-center gap-3">
              {/* Grounded Status Pill */}
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] border border-brand-neutral/20 bg-brand-primary">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    selectedMaterialIds.length > 0 || availableDocuments.length > 0 ? "bg-emerald-400" : "bg-brand-elevated"
                  }`}
                />
                <span className="text-brand-neutral">
                  {selectedMaterialIds.length > 0
                    ? `Grounded on ${selectedMaterialIds.length} doc${selectedMaterialIds.length > 1 ? "s" : ""}`
                    : availableDocuments.length > 0
                    ? `Grounded on ${availableDocuments.length} note${availableDocuments.length > 1 ? "s" : ""}`
                    : "General Assistant"}
                </span>
              </div>

              {/* Model Pill */}
              <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-brand-muted">
                <span className={`w-1.5 h-1.5 rounded-full ${isOllamaHealthy ? "bg-emerald-400" : "bg-red-400"}`} />
                <span>smartstudy-tutor (Local AI)</span>
              </div>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            {loadingConvId === activeConvId ? (
              <div className="max-w-lg mx-auto py-16 text-center space-y-3">
                <Loader2 size={24} className="animate-spin text-brand-neutral mx-auto" />
                <p className="text-xs text-brand-neutral">Loading conversation history...</p>
              </div>
            ) : (messages.length === 0 && !isTyping) ? (
              <div className="max-w-lg mx-auto py-12 text-center">
                <div className="grid w-10 h-10 place-items-center rounded-xl bg-brand-accent/20 border border-brand-neutral/20 text-brand-neutral mx-auto mb-3">
                  <Sparkles size={20} />
                </div>
                <h3 className="text-base font-semibold text-brand-light mb-1">
                  How can I help with your studies today?
                </h3>
                <p className="text-xs text-brand-neutral leading-relaxed mb-6">
                  Select documents from the sidebar to ground answers in verified course materials.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                  {STARTER_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => handleSendMessage(prompt)}
                      className="p-3 rounded-lg border border-brand-neutral/20 bg-brand-secondary hover:border-brand-neutral/30 text-xs text-brand-neutral hover:text-brand-light transition-colors cursor-pointer"
                    >
                      &ldquo;{prompt}&rdquo;
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg) => {
                const isUser = msg.role === "USER";
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isUser ? "items-end" : "items-start"} w-full`}
                  >
                    <div className="flex items-center gap-2 mb-1 text-[11px] text-brand-muted px-1">
                      <span className="font-medium text-brand-neutral">
                        {isUser ? "You" : msg.grounded ? "Smart Study AI (Grounded)" : "Smart Study AI"}
                      </span>
                      <span>·</span>
                      <span>{msg.timestamp}</span>
                    </div>

                    <div
                      className={`rounded-xl px-4 py-3 text-sm leading-relaxed max-w-[94%] sm:max-w-[88%] ${
                        isUser
                          ? "bg-brand-accent text-brand-light"
                          : "bg-brand-secondary border border-brand-neutral/20 text-brand-light shadow-sm"
                      }`}
                    >
                      {msg.attachment && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-brand-primary/20 border border-white/10 text-xs mb-2">
                          <Paperclip size={12} />
                          <span>{msg.attachment.name}</span>
                          <span className="opacity-70 text-[10px]">({msg.attachment.size})</span>
                        </div>
                      )}

                      <MarkdownView content={msg.content} />

                      {/* Source Citations */}
                      {msg.sources && msg.sources.length > 0 && !isUser && (
                        <div className="mt-3 pt-3 border-t border-brand-neutral/20">
                          <div className="flex items-center gap-1.5 text-xs font-medium text-brand-neutral mb-2">
                            <Shield size={13} />
                            <span>Verified Sources ({msg.sources.length})</span>
                          </div>

                          <div className="space-y-1.5">
                            {msg.sources.map((source, idx) => {
                              const sId = `${msg.id}-${idx}`;
                              const isExp = expandedSources.has(sId);
                              const meta = source.metadata;
                              const citation =
                                source.citation ||
                                (meta
                                  ? `[${meta.filename}${meta.page ? `, page ${meta.page}` : ""}]`
                                  : `Source ${idx + 1}`);

                              return (
                                <div
                                  key={sId}
                                  className="rounded-lg border border-brand-neutral/20 bg-brand-primary/60 overflow-hidden text-xs"
                                >
                                  <button
                                    onClick={() => toggleSourceExpanded(sId)}
                                    className="w-full flex items-center justify-between p-2 text-left hover:bg-brand-secondary/40 transition-colors cursor-pointer"
                                  >
                                    <span className="font-mono text-brand-neutral text-[11px] truncate">
                                      {citation}
                                    </span>
                                    {isExp ? <ChevronUp size={12} className="text-brand-muted shrink-0" /> : <ChevronDown size={12} className="text-brand-muted shrink-0" />}
                                  </button>
                                  {isExp && (
                                    <div className="p-2.5 border-t border-brand-neutral/20 bg-brand-primary/30 text-brand-neutral text-xs leading-relaxed">
                                      <p className="italic">{source.text}</p>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {!isUser && (
                        <div className="flex justify-end mt-2 pt-2 border-t border-brand-neutral/20">
                          <button
                            onClick={() => copyToClipboard(msg.id, msg.content)}
                            className="flex items-center gap-1 text-[11px] text-brand-muted hover:text-brand-neutral transition-colors cursor-pointer"
                          >
                            {copiedId === msg.id ? (
                              <>
                                <Check size={11} className="text-emerald-400" /> Copied
                              </>
                            ) : (
                              <>
                                <Copy size={11} /> Copy
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {isTyping && (
              <div className="flex items-center gap-2 w-full text-xs text-brand-muted p-2">
                <Loader2 size={13} className="animate-spin text-brand-neutral" />
                <span>Generating response with smartstudy-tutor...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Chat Input */}
          <div className="p-3 sm:p-4 border-t border-brand-neutral/20 bg-brand-secondary/80 backdrop-blur-sm shrink-0">
            <div className="w-full">
              {attachedFile && (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-brand-secondary border border-brand-neutral/30 text-xs text-brand-neutral mb-2">
                  <Paperclip size={13} className="text-brand-neutral" />
                  <span className="truncate max-w-xs">{attachedFile.name}</span>
                  <span className="text-brand-muted text-[10px]">({attachedFile.size})</span>
                  <button
                    onClick={() => setAttachedFile(null)}
                    className="p-0.5 hover:text-red-400 cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}

              <div className="relative flex items-end gap-2 rounded-xl border border-brand-neutral/20 bg-brand-primary/90 p-2 focus-within:border-brand-neutral/30 focus-within:ring-1 focus-within:ring-brand-neutral">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 rounded-lg text-brand-neutral hover:text-brand-neutral hover:bg-brand-secondary transition-colors cursor-pointer shrink-0"
                  title="Attach study document"
                >
                  <Paperclip size={16} />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                  accept=".pdf,.docx,.xlsx,.xlsm,.pptx,.txt,.csv,.md"
                />

                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    selectedMaterialIds.length > 0
                      ? "Ask a question about the selected documents..."
                      : availableDocuments.length > 0
                      ? "Ask about your notes (e.g., scholarship details, deadlines, eligibility)..."
                      : "Ask anything, or attach a document for grounded Q&A..."
                  }
                  className="flex-1 max-h-32 bg-transparent text-sm text-brand-light placeholder-zinc-500 resize-none border-0 focus:outline-none focus:ring-0 py-1.5"
                />

                <button
                  type="button"
                  onClick={() => handleSendMessage()}
                  disabled={isTyping || (!inputText.trim() && !attachedFile)}
                  className="p-2 rounded-lg bg-brand-accent hover:bg-brand-accent disabled:opacity-40 disabled:hover:bg-brand-accent text-brand-light transition-colors cursor-pointer shrink-0"
                  aria-label="Send message"
                >
                  <Send size={15} />
                </button>
              </div>

              <div className="flex items-center justify-between text-[11px] text-brand-muted mt-1.5 px-1">
                <span>Enter to send · Shift+Enter for newline</span>
                <span>Ollama local RAG active</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
