import { useState, useEffect, useRef } from "react";
import { User, Bot, Sparkles, Send, Stethoscope } from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string | React.ReactNode;
}

const AnimatedChatDemo = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTypingInInput, setIsTypingInInput] = useState(false);
  const [isTypingBot, setIsTypingBot] = useState(false);
  const [showSendButton, setShowSendButton] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const userMessage = "Review the current KPI performance for Emergency Department (ED) for April 2025";

  const botResponseLines = [
    { label: "Patient Visits", value: "7,450", color: "text-foreground" },
    { label: "Door to Doctor", value: "5 min", color: "text-sky-500 font-bold" },
    { label: "Doctor to Decision", value: "6 min", color: "text-sky-500 font-bold" },
    { label: "Decision to Disposition", value: "0:45 min", color: "text-green-500 font-bold" },
    { label: "Urgent", value: "51%", color: "text-foreground" },
    { label: "Non-Urgent", value: "49%", color: "text-foreground" },
    { label: "Door to Disposition", value: "99%", color: "text-sky-500 font-bold" },
    { label: "DAMA", value: "35 (0.5%)", color: "text-foreground" },
    { label: "Mortality Rate", value: "0.03% (2 patients)", color: "text-foreground" },
  ];

  const insightText = "💡 Key Findings: ED efficiency is 12% above target. Door-to-doctor times show excellent triage performance. Consider minor workflow adjustments for disposition delays.";

  // Auto-scroll to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isTypingBot]);

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const typeInInput = async (text: string) => {
    setIsTypingInInput(true);
    for (let i = 0; i <= text.length; i++) {
      setInputText(text.substring(0, i));
      // Realistic typing speed: 50-100ms with slight randomness
      await delay(60 + Math.random() * 40);
    }
    setIsTypingInInput(false);
    setShowSendButton(true);
  };

  // Animation sequence
  useEffect(() => {
    const runAnimation = async () => {
      // Reset state
      setMessages([]);
      setInputText("");
      setShowSendButton(false);
      setIsTypingBot(false);

      // Step 1: Wait initial delay
      await delay(1500);

      // Step 2: Type in the input textbox (character by character)
      await typeInInput(userMessage);
      
      // Step 3: Brief pause showing "send" ready state
      await delay(800);
      
      // Step 4: "Send" the message - clear input and add to messages with animation
      setInputText("");
      setShowSendButton(false);
      setMessages([{ role: "user", content: userMessage }]);
      
      // Step 5: Show bot typing indicator after a realistic delay
      await delay(1000);
      setIsTypingBot(true);
      
      // Step 6: Bot "typing" for realistic duration
      await delay(2000);
      setIsTypingBot(false);

      // Step 7: Show bot response with KPI data
      const botContent = (
        <div className="space-y-2">
          {botResponseLines.map((line, index) => (
            <div 
              key={index} 
              className="flex items-center gap-2 opacity-0 animate-[fade-in_0.3s_ease-out_forwards]" 
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <span className="text-muted-foreground">{line.label}:</span>
              <span className={line.color}>{line.value}</span>
            </div>
          ))}
          <div 
            className="mt-4 pt-3 border-t border-border/50 opacity-0 animate-[fade-in_0.3s_ease-out_forwards]" 
            style={{ animationDelay: "1200ms" }}
          >
            <p className="text-sm text-muted-foreground italic leading-relaxed">{insightText}</p>
          </div>
        </div>
      );

      setMessages(prev => [...prev, { role: "assistant", content: botContent }]);

      // Wait and restart animation
      await delay(10000);
      runAnimation();
    };

    runAnimation();

    return () => {
      // Cleanup handled by component unmount
    };
  }, []);

  return (
    <div className="relative max-w-2xl mx-auto">
      {/* Chat Container */}
      <div className="bg-card rounded-2xl shadow-elegant border border-border/50 overflow-hidden">
        {/* Chat Header */}
        <div className="bg-muted/30 px-4 py-3 border-b border-border/50 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
          </div>
          <div className="flex-1 text-center">
            <span className="text-sm font-medium text-muted-foreground">AI Data Assistant</span>
          </div>
          <Stethoscope className="h-4 w-4 text-primary" />
        </div>

        {/* Messages Area */}
        <div 
          ref={chatContainerRef}
          className="p-4 md:p-6 space-y-4 min-h-[280px] max-h-[350px] overflow-y-auto scroll-smooth"
        >
          {/* Rendered messages with slide-up animation */}
          {messages.map((message, index) => (
            <div 
              key={index} 
              className={`flex items-start gap-3 opacity-0 translate-y-4 animate-[slide-fade-in_0.4s_ease-out_forwards] ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
              style={{ animationDelay: message.role === "assistant" ? "100ms" : "0ms" }}
            >
              {message.role === "assistant" && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-accent-foreground" />
                </div>
              )}
              <div 
                className={`rounded-2xl px-4 py-3 max-w-[85%] ${
                  message.role === "user" 
                    ? "bg-primary text-primary-foreground rounded-tr-md" 
                    : "bg-muted/50 rounded-tl-md"
                }`}
              >
                {typeof message.content === "string" ? (
                  <p className="text-sm leading-relaxed text-left">{message.content}</p>
                ) : (
                  <div className="text-sm">{message.content}</div>
                )}
              </div>
              {message.role === "user" && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
              )}
            </div>
          ))}

          {/* Bot typing indicator with animated dots */}
          {isTypingBot && (
            <div className="flex items-start gap-3 justify-start opacity-0 translate-y-4 animate-[slide-fade-in_0.3s_ease-out_forwards]">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                <Bot className="h-4 w-4 text-accent-foreground" />
              </div>
              <div className="bg-muted/50 rounded-2xl rounded-tl-md px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm text-muted-foreground mr-1">typing</span>
                  <span className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-[typing-dot_1.4s_ease-in-out_infinite]" />
                  <span className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-[typing-dot_1.4s_ease-in-out_0.2s_infinite]" />
                  <span className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-[typing-dot_1.4s_ease-in-out_0.4s_infinite]" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Interactive Input Area */}
        <div className="px-4 pb-4">
          <div className={`flex items-center gap-3 bg-muted/30 rounded-xl px-4 py-3 border transition-all duration-300 ${
            isTypingInInput 
              ? "border-primary/50 shadow-[0_0_20px_rgba(var(--primary-rgb),0.15)] ring-1 ring-primary/20" 
              : "border-border/50"
          }`}>
            <div className="flex-1 min-h-[24px] flex items-center">
              {inputText ? (
                <span className="text-sm text-foreground">
                  {inputText}
                  {isTypingInInput && (
                    <span className="inline-block w-0.5 h-4 bg-primary ml-0.5 animate-[blink_1s_step-end_infinite]" />
                  )}
                </span>
              ) : (
                <span className="text-muted-foreground text-sm">Ask about your healthcare data...</span>
              )}
            </div>
            <div 
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
                showSendButton 
                  ? "bg-primary scale-110" 
                  : "bg-primary/50"
              }`}
            >
              {showSendButton ? (
                <Send className="h-4 w-4 text-primary-foreground animate-[pulse_0.5s_ease-in-out]" />
              ) : (
                <Stethoscope className="h-4 w-4 text-primary-foreground/70" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/5 rounded-full blur-xl pointer-events-none" />
      <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-accent/10 rounded-full blur-xl pointer-events-none" />

      {/* Custom animations */}
      <style>{`
        @keyframes slide-fade-in {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes typing-dot {
          0%, 60%, 100% {
            opacity: 0.3;
            transform: translateY(0);
          }
          30% {
            opacity: 1;
            transform: translateY(-4px);
          }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default AnimatedChatDemo;
