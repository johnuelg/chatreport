import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import AdminLayout from "@/components/admin/AdminLayout";
import { useDomains } from "@/hooks/useDomains";
import { useUserDomains } from "@/hooks/useUserDomains";
import { useIsAdmin } from "@/hooks/useSiteSettings";
import { useAuth } from "@/contexts/AuthContext";
import { useQuickQuestions } from "@/components/admin/settings/SettingsQuickQuestions";
import { useUserQuickQuestions } from "@/hooks/useUserQuickQuestions";
import {
  useChatConversations,
  useChatMessages,
  useCreateConversation,
  useUpdateConversationTitle,
  useDeleteConversation,
  useAddChatMessage,
} from "@/hooks/useChatConversations";
import { useChatBookmarks, useToggleBookmark } from "@/hooks/useChatBookmarks";
import { getIconComponent } from "@/components/admin/settings/DomainIconPicker";
import {
  MessageSquare,
  Send,
  Plus,
  Globe,
  Bot,
  Trash2,
  Pencil,
  Check,
  X,
  PanelLeftClose,
  PanelLeft,
  Loader2,
  Bookmark,
  BookmarkCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const AdminChat = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { data: domains } = useDomains();
  const { data: isAdmin } = useIsAdmin();
  const { data: allUserDomains } = useUserDomains();
  const { data: quickQuestionsData } = useQuickQuestions();
  const { data: userQuickQuestionsData } = useUserQuickQuestions();

  const accessibleDomains = isAdmin
    ? domains
    : domains?.filter((d) =>
        allUserDomains?.some((ud) => ud.user_id === user?.id && ud.domain_id === d.id)
      );

  const { data: allConversations, isLoading: convsLoading } = useChatConversations();
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const { data: messages, isLoading: msgsLoading } = useChatMessages(activeConvId);

  const createConv = useCreateConversation();
  const updateTitle = useUpdateConversationTitle();
  const deleteConv = useDeleteConversation();
  const addMessage = useAddChatMessage();
  const { data: bookmarks } = useChatBookmarks();
  const toggleBookmark = useToggleBookmark();

  const isBookmarked = (msgId: string) => bookmarks?.some((b) => b.message_id === msgId) ?? false;

  const [selectedDomain, setSelectedDomain] = useState<string>("all");
  const [inputValue, setInputValue] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Filter conversations by selected domain (strict domain scoping)
  const conversations = allConversations?.filter((c) =>
    selectedDomain === "all" ? c.domain_id === null : c.domain_id === selectedDomain
  );

  // Auto-select conversation from URL query param; sync domain to that conversation
  useEffect(() => {
    const convParam = searchParams.get("conversation");
    const target = allConversations?.find((c) => c.id === convParam);
    if (convParam && target) {
      setSelectedDomain(target.domain_id ?? "all");
      setActiveConvId(convParam);
      searchParams.delete("conversation");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, allConversations]);

  // If domain changes and active conversation doesn't belong, clear it
  useEffect(() => {
    if (!activeConvId) return;
    const conv = allConversations?.find((c) => c.id === activeConvId);
    if (!conv) return;
    const convDomain = conv.domain_id ?? "all";
    if (convDomain !== selectedDomain) setActiveConvId(null);
  }, [selectedDomain, activeConvId, allConversations]);

  useEffect(() => {
    scrollToBottom();
  }, [messages?.length]);

  const activeDomainObj = accessibleDomains?.find((d) => d.id === selectedDomain);
  const domainName = selectedDomain === "all" ? "Data" : activeDomainObj?.name ?? "Data";
  const domainAbbr = activeDomainObj?.abbreviation ?? "";
  const domainColor = selectedDomain === "all" ? "hsl(var(--primary))" : activeDomainObj?.color ?? "hsl(var(--primary))";
  const DomainIcon = activeDomainObj ? getIconComponent(activeDomainObj.icon) : Bot;

  // Merge admin global questions + user personal questions (deduplicated)
  const quickQuestions = (() => {
    const domainKey = selectedDomain === "all" ? "__global__" : selectedDomain;
    const adminQs = (quickQuestionsData?.[domainKey] ?? []).filter((q) => q.trim());
    const userQs = (userQuickQuestionsData?.[domainKey] ?? []).filter((q) => q.trim());
    // Also include __global__ admin questions as fallback for specific domains
    const globalAdminQs = selectedDomain !== "all"
      ? (quickQuestionsData?.["__global__"] ?? []).filter((q) => q.trim())
      : [];
    const combined = [...new Set([...adminQs, ...globalAdminQs, ...userQs])];
    return combined;
  })();

  const createNewChat = async () => {
    if (!user) return;
    const conv = await createConv.mutateAsync({
      user_id: user.id,
      title: "New Chat",
      domain_id: selectedDomain === "all" ? null : selectedDomain,
    });
    setActiveConvId(conv.id);
    setInputValue("");
    inputRef.current?.focus();
  };

  const handleDeleteConversation = async (id: string) => {
    await deleteConv.mutateAsync(id);
    if (activeConvId === id) setActiveConvId(null);
  };

  const handleSend = async (text?: string) => {
    const content = (text ?? inputValue).trim();
    if (!content || !user || sending) return;
    setSending(true);

    try {
      let convId = activeConvId;

      if (!convId) {
        const conv = await createConv.mutateAsync({
          user_id: user.id,
          title: content.slice(0, 40),
          domain_id: selectedDomain === "all" ? null : selectedDomain,
        });
        convId = conv.id;
        setActiveConvId(conv.id);
      } else if (messages?.length === 0) {
        await updateTitle.mutateAsync({ id: convId, title: content.slice(0, 40) });
      }

      await addMessage.mutateAsync({
        conversation_id: convId,
        role: "user",
        content,
      });

      setInputValue("");

      // Build conversation history for the AI
      const history = (messages ?? []).map((m) => ({ role: m.role, content: m.content }));
      history.push({ role: "user", content });

      try {
        const { supabase } = await import("@/integrations/supabase/client");
        const { data, error } = await supabase.functions.invoke("chat-completion", {
          body: {
            messages: history,
            domain_id: selectedDomain === "all" ? null : selectedDomain,
          },
        });
        if (error) throw error;
        const reply =
          (data as any)?.reply ??
          "Sorry, I couldn't generate a response.";
        await addMessage.mutateAsync({
          conversation_id: convId!,
          role: "assistant",
          content: reply,
        });
      } catch (err: any) {
        await addMessage.mutateAsync({
          conversation_id: convId!,
          role: "assistant",
          content: `⚠️ AI error: ${err?.message ?? "Unable to reach the AI service."}`,
        });
      } finally {
        setSending(false);
      }
    } catch {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const sidebarBody = (
    <>
      <div className="p-3 border-b border-border/50 flex items-center gap-2">
        <Button
          onClick={() => {
            createNewChat();
            setMobileSidebarOpen(false);
          }}
          disabled={createConv.isPending}
          className="flex-1 min-w-0 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-10 text-sm font-semibold gap-2"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span className="truncate">New Chat</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(false)}
          className="shrink-0 h-10 w-10 rounded-xl text-muted-foreground hover:text-foreground hidden lg:inline-flex"
        >
          <PanelLeftClose className="w-4 h-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        {convsLoading ? (
          <div className="p-4 flex justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : !conversations?.length ? (
          <div className="p-4 text-center">
            <p className="text-sm text-muted-foreground">No conversations yet</p>
          </div>
        ) : (
          <div className="p-2 space-y-0.5">
            {conversations.map((conv) => {
              const isRenaming = renamingId === conv.id;
              const commitRename = async () => {
                const t = renameValue.trim();
                if (t && t !== conv.title) {
                  await updateTitle.mutateAsync({ id: conv.id, title: t.slice(0, 80) });
                }
                setRenamingId(null);
              };
              return (
                <div
                  key={conv.id}
                  className={cn(
                    "group flex items-start gap-2 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl transition-all duration-200 min-w-0",
                    isRenaming ? "cursor-default" : "cursor-pointer",
                    activeConvId === conv.id
                      ? "bg-primary/10 text-foreground"
                      : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                  )}
                  onClick={() => {
                    if (isRenaming) return;
                    setActiveConvId(conv.id);
                    setMobileSidebarOpen(false);
                  }}
                >
                  <MessageSquare className="w-4 h-4 shrink-0 mt-0.5" />
                  {isRenaming ? (
                    <input
                      autoFocus
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        e.stopPropagation();
                        if (e.key === "Enter") commitRename();
                        if (e.key === "Escape") setRenamingId(null);
                      }}
                      onBlur={commitRename}
                      className="flex-1 min-w-0 bg-background border border-border rounded-md px-2 py-1 text-[13px] sm:text-sm font-medium text-foreground outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  ) : (
                    <span
                      className="flex-1 min-w-0 font-medium leading-snug break-words [overflow-wrap:anywhere] line-clamp-2 text-[13px] sm:text-sm"
                      title={conv.title}
                    >
                      {conv.title}
                    </span>
                  )}
                  <div className="flex items-center gap-0.5 shrink-0 mt-0.5">
                    {isRenaming ? (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            commitRename();
                          }}
                          className="p-1 rounded-md hover:bg-primary/10 hover:text-primary transition-all"
                          aria-label="Save title"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setRenamingId(null);
                          }}
                          className="p-1 rounded-md hover:bg-secondary transition-all"
                          aria-label="Cancel rename"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setRenameValue(conv.title);
                            setRenamingId(conv.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 rounded-md hover:bg-primary/10 hover:text-primary transition-all"
                          aria-label="Rename conversation"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteConversation(conv.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 rounded-md hover:bg-destructive/10 hover:text-destructive transition-all"
                          aria-label="Delete conversation"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </>
  );

  return (
    <AdminLayout allowNonAdmin>
      <div className="flex h-[calc(100vh-0px)] lg:h-screen overflow-hidden">
        {/* ── Desktop Sidebar ── */}
        <div
          className={cn(
            "hidden lg:flex border-r border-border/50 bg-card flex-col transition-all duration-300 shrink-0 min-w-0",
            sidebarOpen ? "w-72" : "w-0 overflow-hidden border-r-0"
          )}
        >
          {sidebarBody}
        </div>

        {/* ── Mobile Sidebar Drawer ── */}
        <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
          <SheetContent side="left" className="p-0 w-[85vw] max-w-sm flex flex-col bg-card">
            {sidebarBody}
          </SheetContent>
        </Sheet>

        {/* ── Main Chat Area ── */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-border/50 bg-card/50 backdrop-blur-sm">
            <div className="flex items-center gap-3 min-w-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileSidebarOpen(true)}
                className="shrink-0 h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground lg:hidden"
                aria-label="Open conversations"
              >
                <PanelLeft className="w-4 h-4" />
              </Button>
              {!sidebarOpen && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(true)}
                  className="shrink-0 h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground hidden lg:inline-flex"
                >
                  <PanelLeft className="w-4 h-4" />
                </Button>
              )}
              <DomainIcon className="w-5 h-5 shrink-0" style={{ color: domainColor }} />
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-heading font-bold text-foreground leading-tight flex items-center gap-2">
                  {domainName} Data Assistant
                  {domainAbbr && (
                    <Badge
                      className="text-[10px] px-1.5 py-0 font-bold border-0"
                      style={{ backgroundColor: domainColor, color: "#fff" }}
                    >
                      {domainAbbr}
                    </Badge>
                  )}
                </h1>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  Ask questions about {domainName.toLowerCase()} performance, reports, and analysis
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Globe className="w-4 h-4 text-muted-foreground hidden sm:block" />
              <Select value={selectedDomain} onValueChange={setSelectedDomain}>
                <SelectTrigger className="w-auto max-w-[200px] sm:max-w-[260px] h-9 rounded-xl border-border/50 bg-card text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: domainColor }}
                    />
                    <span className="truncate"><SelectValue /></span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Domains</SelectItem>
                  {accessibleDomains?.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1">
            <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-6">
              {!activeConvId || (!msgsLoading && (!messages || messages.length === 0)) ? (
                <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-5">
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${domainColor}22` }}
                  >
                    <DomainIcon className="w-10 h-10" style={{ color: domainColor }} />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-xl font-heading font-bold text-foreground flex items-center justify-center gap-2">
                      {domainName} Assistant
                      {domainAbbr && (
                        <Badge
                          className="text-xs px-2 py-0.5 font-bold border-0"
                          style={{ backgroundColor: domainColor, color: "#fff" }}
                        >
                          {domainAbbr}
                        </Badge>
                      )}
                    </h2>
                    <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
                      Welcome to {domainName} Assistant. I can help you with performance metrics, trend
                      analysis, and operational insights.
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Currently using: <span className="font-semibold text-foreground">AI Model</span>
                  </p>

                  {/* Quick Questions */}
                  {quickQuestions.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl pt-2">
                      {quickQuestions.slice(0, 4).map((q, i) => (
                        <button
                          key={i}
                          onClick={() => handleSend(q)}
                          className="text-left text-sm px-4 py-3 rounded-xl border border-border/60 bg-card hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-all duration-200 leading-snug"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : msgsLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-5">
                  {messages?.map((msg) => {
                    const bookmarked = isBookmarked(msg.id);
                    return (
                    <div
                      key={msg.id}
                      className={cn(
                        "group flex gap-3",
                        msg.role === "user" ? "justify-end" : "justify-start"
                      )}
                    >
                      {msg.role === "assistant" && (
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                          style={{ backgroundColor: `${domainColor}22` }}
                        >
                          <DomainIcon className="w-4 h-4" style={{ color: domainColor }} />
                        </div>
                      )}
                      <div className="flex flex-col gap-1 max-w-[80%]">
                        <div
                          className={cn(
                            "rounded-2xl px-4 py-3 text-sm leading-relaxed overflow-x-auto",
                            msg.role === "user"
                              ? "bg-primary text-primary-foreground rounded-br-md"
                              : "bg-secondary/80 text-foreground rounded-bl-md"
                          )}
                        >
                          {msg.role === "assistant" ? (
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                h1: ({ children }) => <h1 className="text-lg font-bold mt-3 mb-2 first:mt-0">{children}</h1>,
                                h2: ({ children }) => <h2 className="text-base font-bold mt-3 mb-2 first:mt-0">{children}</h2>,
                                h3: ({ children }) => <h3 className="text-sm font-bold mt-2 mb-1 first:mt-0">{children}</h3>,
                                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                ul: ({ children }) => <ul className="list-disc pl-5 mb-2 last:mb-0 space-y-0.5">{children}</ul>,
                                ol: ({ children }) => <ol className="list-decimal pl-5 mb-2 last:mb-0 space-y-0.5">{children}</ol>,
                                li: ({ children }) => <li>{children}</li>,
                                table: ({ children }) => (
                                  <div className="overflow-x-auto my-2">
                                    <table className="min-w-full text-xs border-collapse border border-border/60 rounded-md overflow-hidden">
                                      {children}
                                    </table>
                                  </div>
                                ),
                                thead: ({ children }) => <thead className="bg-secondary/60">{children}</thead>,
                                th: ({ children }) => <th className="px-3 py-1.5 text-left font-semibold border border-border/60">{children}</th>,
                                td: ({ children }) => <td className="px-3 py-1.5 border border-border/60">{children}</td>,
                                tr: ({ children }) => <tr className="even:bg-secondary/30">{children}</tr>,
                                code: ({ className, children }) => {
                                  const isBlock = className?.includes("language-");
                                  return isBlock ? (
                                    <pre className="bg-secondary/70 rounded-md p-2 my-2 overflow-x-auto text-xs">
                                      <code className={className}>{children}</code>
                                    </pre>
                                  ) : (
                                    <code className="bg-secondary/70 rounded px-1 py-0.5 text-xs">{children}</code>
                                  );
                                },
                                blockquote: ({ children }) => <blockquote className="border-l-2 border-primary/40 pl-3 italic my-2 text-muted-foreground">{children}</blockquote>,
                                hr: () => <hr className="my-3 border-border/40" />,
                                a: ({ children, href }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80">{children}</a>,
                              }}
                            >
                              {msg.content}
                            </ReactMarkdown>
                          ) : (
                            msg.content
                          )}
                        </div>
                        <button
                          onClick={() =>
                            toggleBookmark.mutate({
                              message_id: msg.id,
                              conversation_id: msg.conversation_id,
                              content: msg.content,
                              role: msg.role,
                              isBookmarked: bookmarked,
                            })
                          }
                          className={cn(
                            "self-start p-1 rounded-md transition-all",
                            bookmarked
                              ? "text-primary"
                              : "text-muted-foreground/40 opacity-0 group-hover:opacity-100 hover:text-primary"
                          )}
                          title={bookmarked ? "Remove bookmark" : "Bookmark message"}
                        >
                          {bookmarked ? (
                            <BookmarkCheck className="w-3.5 h-3.5" />
                          ) : (
                            <Bookmark className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                    );
                  })}
                  {sending && (
                    <div className="flex gap-3 justify-start">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                        style={{ backgroundColor: `${domainColor}22` }}
                      >
                        <DomainIcon className="w-4 h-4" style={{ color: domainColor }} />
                      </div>
                      <div className="rounded-2xl px-4 py-3 bg-secondary/80 rounded-bl-md">
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="border-t border-border/50 bg-card/50 backdrop-blur-sm px-4 sm:px-6 py-3">
            <div className="max-w-3xl mx-auto flex items-end gap-2">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Ask about ${domainName.toLowerCase()} performance, statistics, reports, summary and insights`}
                  rows={1}
                  className="w-full resize-none rounded-xl border border-border/50 bg-background px-4 py-3 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                  style={{ minHeight: "44px", maxHeight: "120px" }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = "44px";
                    target.style.height = Math.min(target.scrollHeight, 120) + "px";
                  }}
                />
              </div>
              <Button
                onClick={() => handleSend()}
                disabled={!inputValue.trim() || sending}
                size="icon"
                className="h-11 w-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shrink-0 disabled:opacity-40"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-center text-[10px] text-muted-foreground mt-2 max-w-3xl mx-auto">
              Powered by AI — Ask questions about uploaded reports and {domainName.toLowerCase()} data
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminChat;
