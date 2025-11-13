import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { X, Sparkles, Send, RotateCw, FileText, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface AIDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  clientName?: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export function AIDrawer({ isOpen, onClose, clientName }: AIDrawerProps) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: `Hi! I'm your AI co-pilot. I can help you prepare for ${clientName || "your client"}'s meeting, generate insights, or answer questions about their portfolio.`,
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const quickActions = [
    { label: "Summarize last 3 months", icon: Clock },
    { label: "Prepare meeting brief", icon: FileText },
    { label: "Identify tax opportunities", icon: Sparkles },
    { label: "Check portfolio risks", icon: Sparkles },
  ];

  const aiQueryMutation = trpc.ai.query.useMutation();

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const queryText = input;
    setInput("");
    setIsLoading(true);

    try {
      const result = await aiQueryMutation.mutateAsync({
        query: queryText,
        queryType: "meeting_prep",
      });

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: result.response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error processing your request. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (action: string) => {
    setInput(action);
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          "fixed inset-0 bg-black/50 z-40 transition-opacity",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={cn(
          "fixed top-0 right-0 h-screen w-full md:w-[500px] bg-card border-l-2 border-primary shadow-2xl z-50 transition-transform duration-300 flex flex-col",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-primary/5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">AI Co-Pilot</h2>
            {clientName && (
              <Badge variant="secondary" className="ml-2">
                {clientName}
              </Badge>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              <Card
                className={cn(
                  "max-w-[85%]",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary"
                )}
              >
                <CardContent className="p-3">
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p
                    className={cn(
                      "text-xs mt-2",
                      message.role === "user"
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground"
                    )}
                  >
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </CardContent>
              </Card>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <Card className="bg-secondary">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                    <span className="text-sm text-muted-foreground">Thinking...</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="p-4 border-t border-border bg-secondary/30">
          <p className="text-xs font-medium text-muted-foreground mb-2">Quick Actions</p>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.label}
                  variant="outline"
                  size="sm"
                  className="justify-start text-xs h-auto py-2"
                  onClick={() => handleQuickAction(action.label)}
                >
                  <Icon className="w-3 h-3 mr-1.5" />
                  {action.label}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask me anything about this client..."
              className="min-h-[80px] resize-none"
            />
            <div className="flex flex-col gap-2">
              <Button
                size="icon"
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
              >
                <Send className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                onClick={() => {
                  setMessages([messages[0]]);
                }}
              >
                <RotateCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-muted-foreground">Press Enter to send, Shift+Enter for new line</p>
            <Button variant="ghost" size="sm" className="text-xs h-auto py-1">
              <FileText className="w-3 h-3 mr-1" />
              Add to Report
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
