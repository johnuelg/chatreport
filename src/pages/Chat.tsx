import { useState, useRef, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Send, 
  User, 
  Loader2,
  RefreshCw,
  RotateCcw,
  Pencil,
  Check,
  X,
  Download,
  FileText,
  File,
  Bookmark,
  BookmarkCheck,
  PanelLeft,
  Bot
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MarkdownMessage } from "@/components/chat/MarkdownMessage";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChatHistory } from "@/components/chat/ChatHistory";
import { DomainChatHeader } from "@/components/chat/DomainChatHeader";
import { DomainWelcome } from "@/components/chat/DomainWelcome";
import { exportChatAsPDF } from "@/lib/pdf-export";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DocumentSource {
  name: string;
  folder: string | null;
  relevanceScore: number;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
  sources?: DocumentSource[];
  conversation_id?: string;
}

interface Domain {
  id: string;
  name: string;
  slug: string;
  color: string;
  abbreviation?: string | null;
}

// Using Perplexity as the only AI provider

export default function Chat() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  // Perplexity is the only AI provider
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);
  const [exampleQuestions, setExampleQuestions] = useState<string[]>([]);
  const [bookmarkDialogOpen, setBookmarkDialogOpen] = useState(false);
  const [pendingBookmarkId, setPendingBookmarkId] = useState<string | null>(null);
  const [bookmarkNote, setBookmarkNote] = useState("");
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(true);
  const [historyKey, setHistoryKey] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [selectedDomainId, setSelectedDomainId] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetchBookmarks();
    fetchDomains();
    // Mark initial load complete after a short delay
    const timer = setTimeout(() => setIsInitialLoad(false), 100);
    return () => clearTimeout(timer);
  }, [user]);

  // Refetch quick questions when domain selection changes
  useEffect(() => {
    fetchQuickQuestions();
  }, [selectedDomainId]);

  useEffect(() => {
    // Skip fetch during active submission - handleSubmit manages its own state
    // Also skip during initial load to prevent flicker
    if (isSubmitting || isInitialLoad) return;
    fetchMessages();
  }, [user, currentConversationId, isInitialLoad]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  };

  const fetchMessages = async (showLoading = false) => {
    if (!user) return;
    
    // If no conversation selected, show empty state
    if (!currentConversationId) {
      setMessages([]);
      return;
    }
    
    if (showLoading) {
      setIsLoadingConversation(true);
    }
    
    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("user_id", user.id)
      .eq("conversation_id", currentConversationId)
      .order("created_at", { ascending: true })
      .limit(100);

    if (error) {
      console.error("Error fetching messages:", error);
    } else if (data) {
      setMessages(data as Message[]);
    }
    
    if (showLoading) {
      setIsLoadingConversation(false);
    }
  };

  const fetchDomains = async () => {
    const { data, error } = await supabase
      .from("domains")
      .select("id, name, slug, color, abbreviation")
      .order("display_order", { ascending: true });

    if (error) {
      console.error("Error fetching domains:", error);
    } else if (data) {
      setDomains(data as Domain[]);
    }
  };

  const fetchBookmarks = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("chat_bookmarks")
      .select("message_id")
      .eq("user_id", user.id);

    if (error) {
      console.error("Error fetching bookmarks:", error);
    } else if (data) {
      setBookmarkedIds(new Set(data.map(b => b.message_id)));
    }
  };

  const handleBookmarkClick = (messageId: string) => {
    if (!user || messageId.startsWith("temp-")) return;
    
    const isBookmarked = bookmarkedIds.has(messageId);
    
    if (isBookmarked) {
      // Remove bookmark directly
      removeBookmark(messageId);
    } else {
      // Open dialog to add note
      setPendingBookmarkId(messageId);
      setBookmarkNote("");
      setBookmarkDialogOpen(true);
    }
  };

  const removeBookmark = async (messageId: string) => {
    if (!user) return;
    
    const { error } = await supabase
      .from("chat_bookmarks")
      .delete()
      .eq("user_id", user.id)
      .eq("message_id", messageId);
    
    if (error) {
      toast.error("Failed to remove bookmark");
      return;
    }
    
    setBookmarkedIds(prev => {
      const next = new Set(prev);
      next.delete(messageId);
      return next;
    });
    toast.success("Bookmark removed");
  };

  const saveBookmark = async () => {
    if (!user || !pendingBookmarkId) return;
    
    const { error } = await supabase
      .from("chat_bookmarks")
      .insert({
        user_id: user.id,
        message_id: pendingBookmarkId,
        note: bookmarkNote.trim() || null,
      });
    
    if (error) {
      toast.error("Failed to add bookmark");
      return;
    }
    
    setBookmarkedIds(prev => new Set([...prev, pendingBookmarkId]));
    toast.success("Message bookmarked");
    setBookmarkDialogOpen(false);
    setPendingBookmarkId(null);
    setBookmarkNote("");
  };

  const createConversation = async (firstMessage: string): Promise<string | null> => {
    if (!user) return null;

    // Generate title from first message (first 50 chars)
    const title = firstMessage.length > 50 
      ? firstMessage.substring(0, 50) + "..." 
      : firstMessage;

    const { data, error } = await supabase
      .from("chat_conversations")
      .insert({
        user_id: user.id,
        title,
        domain_id: selectedDomainId, // Associate conversation with current domain
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating conversation:", error);
      return null;
    }

    return data?.id || null;
  };

  const saveMessage = async (role: "user" | "assistant", content: string, conversationId: string) => {
    if (!user) return;

    const { data, error } = await supabase
      .from("chat_messages")
      .insert({
        user_id: user.id,
        role,
        content,
        conversation_id: conversationId,
      })
      .select()
      .single();

    if (error) {
      console.error("Error saving message:", error);
    }
    
    return data;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setIsLoading(true);
    setIsSubmitting(true);

    // Create conversation if needed
    let conversationId = currentConversationId;
    if (!conversationId) {
      conversationId = await createConversation(userMessage);
      if (!conversationId) {
        toast.error("Failed to create conversation");
        setIsLoading(false);
        return;
      }
      setCurrentConversationId(conversationId);
      setHistoryKey(prev => prev + 1); // Refresh history list
    }

    // Add user message optimistically
    const tempUserMessage: Message = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: userMessage,
      created_at: new Date().toISOString(),
      conversation_id: conversationId,
    };
    setMessages(prev => [...prev, tempUserMessage]);

    // Save user message to database
    await saveMessage("user", userMessage, conversationId);

    // Create a placeholder for assistant response
    const tempAssistantMessage: Message = {
      id: `temp-assistant-${Date.now()}`,
      role: "assistant",
      content: "",
      created_at: new Date().toISOString(),
      conversation_id: conversationId,
    };
    setMessages(prev => [...prev, tempAssistantMessage]);
    setIsStreaming(true);

    // Store conversationId for use in the response handler
    const activeConversationId = conversationId;

    try {
      // Get user's session token for authentication
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error("Please log in to use the chat assistant");
      }

      // Use Perplexity endpoint
      const endpoint = "chat-perplexity";

      // Call the selected edge function with user's JWT token
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${endpoint}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            messages: messages.map(m => ({
              role: m.role,
              content: m.content,
            })).concat([{ role: "user", content: userMessage }]),
            language,
            domainId: selectedDomainId,
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("Rate limit exceeded. Please wait a moment and try again.");
        }
        if (response.status === 402) {
          throw new Error("Payment required. Please add credits to your AgentRouter account.");
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to get response from AI assistant");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";
      let buffer = "";
      let documentSources: DocumentSource[] = [];

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Process complete lines
          let newlineIndex: number;
          while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
            let line = buffer.slice(0, newlineIndex);
            buffer = buffer.slice(newlineIndex + 1);

            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (line.startsWith(":") || line.trim() === "") continue;
            if (!line.startsWith("data: ")) continue;

            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") break;

            try {
              const parsed = JSON.parse(jsonStr);
              
              // Check for sources event (sent first by agentrouter)
              if (parsed.sources && Array.isArray(parsed.sources)) {
                documentSources = parsed.sources;
                // Update the assistant message with sources
                setMessages(prev => {
                  const updated = [...prev];
                  const lastMsg = updated[updated.length - 1];
                  if (lastMsg?.role === "assistant") {
                    updated[updated.length - 1] = {
                      ...lastMsg,
                      sources: documentSources,
                    };
                  }
                  return updated;
                });
                continue;
              }
              
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                assistantContent += content;
                setMessages(prev => {
                  const updated = [...prev];
                  const lastMsg = updated[updated.length - 1];
                  if (lastMsg?.role === "assistant") {
                    updated[updated.length - 1] = {
                      ...lastMsg,
                      content: assistantContent,
                      sources: documentSources,
                    };
                  }
                  return updated;
                });
              }
            } catch {
              // Incomplete JSON, put back and wait for more
              buffer = line + "\n" + buffer;
              break;
            }
          }
        }
      }

      // Save final assistant message and update temp message with real ID
      if (assistantContent) {
        const savedMessage = await saveMessage("assistant", assistantContent, activeConversationId);
        
        // Replace temp assistant message with saved one (to get real ID for bookmarking)
        if (savedMessage) {
          setMessages(prev => prev.map(m => 
            m.id.startsWith("temp-assistant") 
              ? { ...m, id: savedMessage.id, created_at: savedMessage.created_at }
              : m.id.startsWith("temp-") && m.role === "user"
                ? { ...m, id: savedMessage.id.replace(savedMessage.id, m.id) } // keep user temp for now
                : m
          ));
        }
      }
      
      // Refresh user message ID from database (for bookmarking)
      const { data: latestMessages } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("user_id", user?.id)
        .eq("conversation_id", activeConversationId)
        .order("created_at", { ascending: true })
        .limit(100);
      
      if (latestMessages) {
        setMessages(latestMessages as Message[]);
      }
      
      setHistoryKey(prev => prev + 1); // Refresh history to update timestamps

    } catch (error) {
      console.error("Error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to get response");
      
      // Remove the temporary assistant message
      setMessages(prev => prev.filter(m => !m.id.startsWith("temp-assistant")));
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const startNewChat = () => {
    // Clear conversation and messages, ready for new conversation
    setCurrentConversationId(null);
    setMessages([]);
  };

  // Handle domain change from dropdown - if viewing a saved chat with different domain, start new chat
  const handleDomainChange = (newDomainId: string | null) => {
    // Get the current conversation's domain
    const currentConvDomainId = currentConversationId ? 
      // We need to track the conversation's domain - for now check if domain actually changed
      selectedDomainId : null;
    
    // If we're viewing a saved conversation and switching to a different domain
    if (currentConversationId && newDomainId !== selectedDomainId) {
      // Start new chat for the new domain
      setSelectedDomainId(newDomainId);
      setCurrentConversationId(null);
      setMessages([]);
    } else {
      // Just update the domain selection
      setSelectedDomainId(newDomainId);
    }
  };

  // Get domain-specific placeholder text
  const getDomainPlaceholder = () => {
    const selectedDomain = domains.find(d => d.id === selectedDomainId);
    const slug = selectedDomain?.slug || '';
    
    const placeholders: Record<string, string> = {
      'emergency-department': 'Ask about ED performance, statistics, reports, summary and insights',
      'radiology': 'Ask about machine reports, scan volumes, release, duration etc...',
      'blood-bank': 'Ask about blood bank inventory, discarded, received, processed, crossmatch and expired statistics.',
      'laboratory': 'Ask about lab samples reports, corrected, critical results, rejected, processed turnaround time etc...',
      'picu': 'Ask about ICU re-admission, unplanned extubation and re-intubation',
      'nicu': 'Ask about in-born and out-born, ventilator days, extubation and re-intubation',
      'health-quality-index': 'Ask about patient centered, time & equitable, safe, effective, efficient and top 5 procedures',
      'nursing': 'Ask about patient fall, admission, ulcer cases etc...',
      'cpr': 'Ask about CPR cases: VT, VF, PEA, Asystole, Bradycardia etc..',
      'clinical-audit': 'Ask about patient centered, time & equitable, safe, effective, efficient and top 5 procedures',
    };
    
    return placeholders[slug] || 'Ask about reports, statistics, and insights...';
  };

  // Get domain abbreviation for footer
  const getDomainAbbreviation = () => {
    const selectedDomain = domains.find(d => d.id === selectedDomainId);
    return selectedDomain?.abbreviation || 'data';
  };

  const handleSelectConversation = async (id: string | null, domainId?: string | null) => {
    if (id === currentConversationId) return;
    
    if (id === null) {
      // Starting new chat - clear immediately
      setCurrentConversationId(null);
      setMessages([]);
      return;
    }
    
    // Load new conversation with loading state
    setIsLoadingConversation(true);
    setCurrentConversationId(id);
    
    // Switch to the conversation's domain context if provided
    if (domainId !== undefined) {
      setSelectedDomainId(domainId);
    }
    
    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("user_id", user?.id)
      .eq("conversation_id", id)
      .order("created_at", { ascending: true })
      .limit(100);

    if (error) {
      console.error("Error fetching messages:", error);
    } else if (data) {
      setMessages(data as Message[]);
    }
    
    setIsLoadingConversation(false);
  };

  const regenerateLastResponse = async () => {
    if (isLoading || messages.length < 2) return;
    
    // Find the last user message
    const lastUserMsgIndex = [...messages].reverse().findIndex(m => m.role === "user");
    if (lastUserMsgIndex === -1) return;
    
    const actualIndex = messages.length - 1 - lastUserMsgIndex;
    const lastUserMessage = messages[actualIndex];
    
    // Remove messages after and including the last assistant response
    const messagesBeforeRegenerate = messages.slice(0, actualIndex + 1);
    setMessages(messagesBeforeRegenerate);
    
    // Delete the last assistant message from database if it exists
    const lastAssistantMsg = messages.find((m, i) => i > actualIndex && m.role === "assistant");
    if (lastAssistantMsg && !lastAssistantMsg.id.startsWith("temp-")) {
      await supabase.from("chat_messages").delete().eq("id", lastAssistantMsg.id);
    }
    
    // Regenerate by setting input and triggering submit
    setInput(lastUserMessage.content);
    
    // Use setTimeout to ensure state updates before submitting
    setTimeout(() => {
      const form = document.querySelector('form');
      if (form) {
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      }
    }, 100);
  };

  const startEditMessage = (message: Message) => {
    setEditingMessageId(message.id);
    setEditContent(message.content);
  };

  const cancelEdit = () => {
    setEditingMessageId(null);
    setEditContent("");
  };

  const saveEditAndRegenerate = async (messageId: string, messageIndex: number) => {
    if (!editContent.trim() || isLoading) return;

    // Update the message in database
    if (!messageId.startsWith("temp-")) {
      await supabase
        .from("chat_messages")
        .update({ content: editContent.trim() })
        .eq("id", messageId);
    }

    // Remove all messages after this one (including assistant responses)
    const messagesToKeep = messages.slice(0, messageIndex);
    const updatedUserMsg = { ...messages[messageIndex], content: editContent.trim() };
    
    // Delete subsequent messages from database
    const messagesToDelete = messages.slice(messageIndex + 1);
    for (const msg of messagesToDelete) {
      if (!msg.id.startsWith("temp-")) {
        await supabase.from("chat_messages").delete().eq("id", msg.id);
      }
    }

    setMessages([...messagesToKeep, updatedUserMsg]);
    setEditingMessageId(null);
    setEditContent("");

    // Regenerate response
    setInput(editContent.trim());
    setTimeout(() => {
      const form = document.querySelector('form');
      if (form) {
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      }
    }, 100);
  };

  const exportAsText = () => {
    if (messages.length === 0) {
      toast.error("No messages to export");
      return;
    }

    const textContent = messages.map(msg => {
      const role = msg.role === "user" ? "You" : "Assistant";
      const date = new Date(msg.created_at).toLocaleString();
      return `[${date}] ${role}:\n${msg.content}\n`;
    }).join("\n---\n\n");

    const header = `ER Intelligence Assistant - Chat Export\nExported on: ${new Date().toLocaleString()}\n\n${"=".repeat(50)}\n\n`;
    const blob = new Blob([header + textContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chat-export-${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Chat exported as text file");
  };

  const exportAsPDF = () => {
    if (messages.length === 0) {
      toast.error("No messages to export");
      return;
    }

    // Get conversation title from first message or current conversation
    const conversationTitle = messages.length > 0 
      ? messages[0].content.substring(0, 50) 
      : undefined;

    exportChatAsPDF(messages, {
      conversationId: currentConversationId,
      conversationTitle,
      userName: user?.email?.split('@')[0] || 'User',
    });
    
    toast.success("Chat exported as PDF");
  };

  const fetchQuickQuestions = async () => {
    // Fetch questions for the selected domain plus global questions (domain_id is null)
    let query = supabase
      .from("quick_questions")
      .select("question, domain_id")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching quick questions:", error);
      // Fallback to defaults
      setExampleQuestions([
        "How many patients visited the ER this month?",
        "Show me the latest ED performance summary",
        "Which CTAS levels generate the most significant volumes?",
        "ED Seasonal Trends",
      ]);
    } else if (data) {
      // Filter to show only questions that match the selected domain OR are global (domain_id is null)
      const filteredQuestions = data.filter(q => 
        q.domain_id === null || q.domain_id === selectedDomainId
      );
      setExampleQuestions(filteredQuestions.map((q) => q.question));
    }
  };

  return (
    <DashboardLayout fullHeight>
      <div className="h-full flex overflow-hidden gap-0 md:gap-4 relative py-2 md:py-4">
        {/* Mobile overlay backdrop */}
        {showHistory && (
          <div 
            className="md:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowHistory(false)}
          />
        )}
        
        {/* Floating toggle button - visible when sidebar is collapsed */}
        <div className={cn(
          "absolute left-0 top-1/2 -translate-y-1/2 z-30",
          "transition-all duration-300 ease-out",
          showHistory 
            ? "opacity-0 -translate-x-full pointer-events-none" 
            : "opacity-100 translate-x-0"
        )}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="secondary"
                size="icon"
                onClick={() => setShowHistory(true)}
                className="h-9 w-9 rounded-l-none rounded-r-lg shadow-lg border border-l-0 border-border"
              >
                <PanelLeft className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              Show sidebar
            </TooltipContent>
          </Tooltip>
        </div>
        
        {/* Chat History Sidebar - responsive with mobile drawer */}
        <div className={cn(
          "flex flex-col bg-card border border-border rounded-lg z-50",
          // Smooth 0.3s ease-out transition for all properties
          "transition-[transform,width,opacity] duration-300 ease-out",
          // Mobile: fixed position drawer with safe-area support
          "fixed md:relative inset-y-0 left-0 md:inset-auto",
          // Safe area inset for mobile notches
          "pb-[env(safe-area-inset-bottom)]",
          showHistory 
            ? "w-[280px] md:w-[280px] lg:w-[320px] translate-x-0 opacity-100" 
            : "-translate-x-full md:translate-x-0 md:w-0 md:min-w-0 md:border-0 opacity-0 md:opacity-100 md:invisible"
        )}>
          <div className={cn(
            "flex flex-col h-full w-[280px] lg:w-[320px] transition-opacity duration-300",
            showHistory ? "opacity-100" : "md:opacity-0"
          )}>
            <ChatHistory
              key={historyKey}
              currentConversationId={currentConversationId}
              domains={domains}
              onSelectConversation={(id, domainId) => {
                handleSelectConversation(id, domainId);
                // Close sidebar on mobile after selection
                if (window.innerWidth < 768) {
                  setShowHistory(false);
                }
              }}
              onNewConversation={() => {
                startNewChat();
                // Close sidebar on mobile after new chat
                if (window.innerWidth < 768) {
                  setShowHistory(false);
                }
              }}
              onToggleSidebar={() => setShowHistory(false)}
            />
          </div>
        </div>

        {/* Main Chat Area - auto-expands when sidebar hidden */}
        <div className={cn(
          "flex-1 flex flex-col min-w-0 overflow-hidden",
          // Smooth transition matching sidebar
          "transition-all duration-300 ease-out",
          // Center content with max-width when sidebar is hidden on desktop
          !showHistory && "md:max-w-4xl lg:max-w-5xl md:mx-auto md:w-full md:px-4"
        )}>
          {/* Header - compact on mobile */}
          <div className={cn(
            "flex flex-col gap-2 md:gap-3 mb-3 md:mb-4 animate-fade-in shrink-0 px-1 md:px-2",
            "transition-all duration-300 ease-out"
          )}>
            <DomainChatHeader
              domains={domains}
              selectedDomainId={selectedDomainId}
              onDomainChange={handleDomainChange}
            />
            
            {/* Action buttons row - scrollable on mobile */}
            {messages.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
                {/* Bookmarks filter toggle */}
                <Button
                  variant={showBookmarksOnly ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowBookmarksOnly(!showBookmarksOnly)}
                  className={cn(
                    "shrink-0 h-8",
                    showBookmarksOnly ? "" : "text-muted-foreground"
                  )}
                >
                  <BookmarkCheck className="h-4 w-4 mr-1.5 md:mr-2" />
                  <span className="hidden sm:inline">Bookmarks</span> {bookmarkedIds.size > 0 && `(${bookmarkedIds.size})`}
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-muted-foreground shrink-0 h-8"
                    >
                      <Download className="h-4 w-4 md:mr-2" />
                      <span className="hidden md:inline">Export</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={exportAsText}>
                      <FileText className="h-4 w-4 mr-2" />
                      Export as Text (.txt)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={exportAsPDF}>
                      <File className="h-4 w-4 mr-2" />
                      Export as PDF
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={startNewChat}
                  className="text-muted-foreground shrink-0 h-8"
                >
                  <RefreshCw className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">New Chat</span>
                </Button>
              </div>
            )}
          </div>

          {/* Chat Area - flex-1 to fill remaining space */}
          <Card className={cn(
            "flex-1 border-0 shadow-elegant overflow-hidden flex flex-col min-h-0",
            "transition-all duration-300 ease-out"
          )}>
          <ScrollArea ref={scrollAreaRef} className="flex-1 px-3 py-5 md:px-6 md:py-6 transition-all duration-300">
            {isLoadingConversation ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Loading conversation...</p>
              </div>
            ) : messages.length === 0 ? (
              <DomainWelcome
                selectedDomain={domains.find(d => d.id === selectedDomainId) || null}
                exampleQuestions={exampleQuestions}
                onQuestionClick={(question) => {
                  setInput(question);
                  textareaRef.current?.focus();
                }}
                modelName={t("chat.model1")}
              />
            ) : (
              <div className="space-y-6">
                {showBookmarksOnly && bookmarkedIds.size === 0 ? (
                  <div className="text-center py-12">
                    <Bookmark className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No bookmarked messages yet</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Click the bookmark icon on any message to save it
                    </p>
                  </div>
                ) : (
                  messages
                    .filter(msg => !showBookmarksOnly || bookmarkedIds.has(msg.id))
                    .map((message, index) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-4 animate-slide-up",
                      message.role === "user" ? "flex-row-reverse" : ""
                    )}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className={cn(
                      "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                      message.role === "user" 
                        ? "gradient-primary" 
                        : "bg-accent"
                    )}>
                      {message.role === "user" ? (
                        <User className="h-4 w-4 text-primary-foreground" />
                      ) : (
                        <Bot className="h-4 w-4 text-accent-foreground" />
                      )}
                    </div>
                    
                    <div className={cn(
                      "flex-1 min-w-0 max-w-[85%] sm:max-w-[80%]",
                      message.role === "user" ? "text-right" : ""
                    )}>
                      {/* Edit mode for user messages */}
                      {editingMessageId === message.id ? (
                        <div className="space-y-2">
                          <Textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="min-h-[60px] max-h-32 resize-none text-sm"
                            autoFocus
                          />
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={cancelEdit}
                              className="h-7 px-2 text-xs"
                            >
                              <X className="h-3 w-3 mr-1" />
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => saveEditAndRegenerate(message.id, index)}
                              disabled={!editContent.trim() || isLoading}
                              className="h-7 px-2 text-xs"
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Save & Regenerate
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className={cn(
                            "inline-block p-3 sm:p-4 rounded-2xl max-w-full overflow-hidden group relative",
                            message.role === "user"
                              ? "gradient-primary text-primary-foreground rounded-tr-sm"
                              : "bg-secondary text-foreground rounded-tl-sm"
                          )}>
                            {message.content ? (
                              <MarkdownMessage 
                                content={message.content} 
                                isUser={message.role === "user"}
                                showCopyButton={message.role === "assistant"}
                              />
                            ) : (
                              <span className="flex items-center gap-2 text-sm">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Thinking...
                              </span>
                            )}
                            
                            {/* Edit button for user messages */}
                            {message.role === "user" && message.content && !isLoading && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => startEditMessage(message)}
                                className="absolute -top-1 -left-1 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-background shadow-sm"
                              >
                                <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                              </Button>
                            )}
                            
                          </div>
                          
                          {/* Document sources display for assistant messages */}
                          {message.role === "assistant" && message.sources && message.sources.length > 0 && (
                            <div className="mt-2 p-2 rounded-lg bg-muted/50 border border-border/50">
                              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1.5">
                                <FileText className="h-3 w-3" />
                                Sources used:
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {message.sources.map((source, sourceIndex) => (
                                  <div
                                    key={sourceIndex}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-background border border-border text-xs"
                                    title={`Relevance score: ${source.relevanceScore}`}
                                  >
                                    <File className="h-3 w-3 text-primary" />
                                    <span className="font-medium truncate max-w-[150px]">{source.name}</span>
                                    {source.folder && (
                                      <span className="text-muted-foreground">({source.folder})</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Action buttons for assistant messages */}
                          {message.role === "assistant" && message.content && !isLoading && (
                            <div className="mt-2 flex items-center gap-1">
                              {/* Bookmark button */}
                              {!message.id.startsWith("temp-") && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleBookmarkClick(message.id)}
                                  className={cn(
                                    "text-xs h-7 px-2",
                                    bookmarkedIds.has(message.id) 
                                      ? "text-primary hover:text-primary" 
                                      : "text-muted-foreground hover:text-foreground"
                                  )}
                                >
                                  {bookmarkedIds.has(message.id) ? (
                                    <>
                                      <BookmarkCheck className="h-3 w-3 mr-1.5" />
                                      Bookmarked
                                    </>
                                  ) : (
                                    <>
                                      <Bookmark className="h-3 w-3 mr-1.5" />
                                      Bookmark
                                    </>
                                  )}
                                </Button>
                              )}
                              
                              {/* Regenerate button for last assistant message */}
                              {index === messages.length - 1 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={regenerateLastResponse}
                                  className="text-xs text-muted-foreground hover:text-foreground h-7 px-2"
                                >
                                  <RotateCcw className="h-3 w-3 mr-1.5" />
                                  Regenerate
                                </Button>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))
                )}
              </div>
            )}
          </ScrollArea>

          {/* Input Area - fixed at bottom with safe-area support */}
          <div className="border-t border-border px-3 py-3 md:px-4 md:py-4 bg-card shrink-0 pb-[max(12px,env(safe-area-inset-bottom))] transition-all duration-300 ease-out">
            <form onSubmit={handleSubmit} className="flex gap-2 md:gap-3 items-end max-w-full transition-all duration-300">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={getDomainPlaceholder()}
                className="min-h-[48px] md:min-h-[52px] max-h-32 resize-none transition-all duration-300 ease-out text-sm md:text-base flex-1"
                style={{
                  borderColor: domains.find(d => d.id === selectedDomainId)?.color || 'hsl(var(--border))',
                  boxShadow: `0 0 0 1px ${domains.find(d => d.id === selectedDomainId)?.color || 'transparent'}20`
                }}
                disabled={isLoading}
                key={selectedDomainId}
              />
              <Button
                type="submit"
                size="icon"
                className="h-[48px] w-[48px] md:h-[52px] md:w-[52px] hover:opacity-90 transition-all duration-300 shrink-0"
                style={{
                  backgroundColor: input.trim() 
                    ? (domains.find(d => d.id === selectedDomainId)?.color || 'hsl(var(--primary))') 
                    : 'hsl(var(--muted))',
                  color: input.trim() ? 'white' : 'hsl(var(--muted-foreground))'
                }}
                disabled={!input.trim() || isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </form>
            
            <p className="text-[10px] md:text-xs text-muted-foreground text-center mt-2 md:mt-3 transition-opacity duration-200">
              <span key={selectedDomainId} className="inline-block animate-fade-in">
                Powered by Model 1 - Ask questions about uploaded reports and {getDomainAbbreviation()} data
              </span>
            </p>
          </div>
        </Card>
        </div>

        {/* Bookmark Note Dialog */}
        <Dialog open={bookmarkDialogOpen} onOpenChange={setBookmarkDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Bookmark className="h-5 w-5 text-primary" />
                Add Bookmark
              </DialogTitle>
              <DialogDescription>
                Add an optional note to help you remember why you saved this message.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Textarea
                value={bookmarkNote}
                onChange={(e) => setBookmarkNote(e.target.value)}
                placeholder="Add a note (optional)..."
                className="min-h-[100px] resize-none"
              />
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setBookmarkDialogOpen(false);
                  setPendingBookmarkId(null);
                  setBookmarkNote("");
                }}
              >
                Cancel
              </Button>
              <Button onClick={saveBookmark}>
                <BookmarkCheck className="h-4 w-4 mr-2" />
                Save Bookmark
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
