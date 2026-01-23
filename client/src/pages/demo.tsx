import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity, LogIn, Send, Bot, Info, Settings } from "lucide-react";
import { demoExperiences } from "@/config/demoExperiences";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { SessionHeader } from "@/components/SessionHeader";
import expLogo from "@/assets/exp-logo.png";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function Demo() {
  const [, setLocation] = useLocation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest('POST', '/api/chat', { message });
      return response.json();
    },
    onSuccess: (data) => {
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    },
  });

  const handleOptionClick = (path: string) => {
    setLocation(path);
  };

  const handleSendMessage = () => {
    if (!input.trim() || chatMutation.isPending) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput("");
    chatMutation.mutate(userMessage);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={expLogo} alt="EXP Logo" className="h-6 object-contain" data-testid="img-exp-logo-header" />
            <Link href="/" data-testid="link-home">
              <span className="font-semibold text-lg text-foreground hover:underline cursor-pointer">Lithium Americas</span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <SessionHeader />
            <Button 
              onClick={() => setLocation("/settings")}
              data-testid="button-settings-header"
              variant="ghost"
              size="icon"
            >
              <Settings className="w-5 h-5" />
            </Button>
            <Button 
              onClick={() => setLocation("/login")}
              data-testid="button-login-header"
              className="gap-2"
            >
              <LogIn className="w-4 h-4" />
              Login
            </Button>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-12 px-6">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex items-start justify-between gap-6 mb-12">
            <div className="flex-1 text-center">
              <h1 className="text-4xl font-semibold text-foreground mb-3">
                Demo - Full Sulfuric Acid Plant
              </h1>
              <p className="text-xl text-muted-foreground">
                Sulfuric Acid Operator Training Simulator
              </p>
            </div>
            <div className="flex flex-col gap-3 flex-shrink-0">
              <Button 
                onClick={() => setLocation("/equipment-settings")}
                data-testid="button-equipment-settings"
                className="text-[16px] pl-[16px] pr-[16px] pt-[16px] pb-[16px] gap-2"
              >
                Equipment Sizes
              </Button>
              <Button 
                onClick={() => setLocation("/ots-instructions-videos")}
                data-testid="button-ots-instructions-videos"
                variant="default"
                className="text-[16px] pl-[16px] pr-[16px] pt-[16px] pb-[16px] gap-2"
              >
                OTS Instructions & Videos
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
            <div className="space-y-6">
              {demoExperiences.map((experience) => (
                <div
                  key={experience.id}
                  className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6"
                  data-testid={`option-${experience.id}`}
                >
                  <Button
                    size="lg"
                    variant={experience.id === "unit-operation-simulator" ? "default" : "secondary"}
                    onClick={() => handleOptionClick(experience.path)}
                    data-testid={`button-${experience.id}`}
                    className="w-full sm:max-w-[280px] sm:w-[280px] h-[72px] text-base whitespace-normal leading-snug sm:flex-shrink-0 bg-[#5ee535cc]"
                  >
                    {experience.title}
                  </Button>
                  
                  <div className="flex-1 pt-0 sm:pt-2">
                    <p className="text-base leading-relaxed text-foreground">
                      {experience.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <Card className="border-primary/20">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Info className="w-5 h-5 text-primary" />
                    <CardTitle className="text-lg">AI Assistant Guide</CardTitle>
                  </div>
                  <CardDescription className="text-sm">
                    Ask questions about our training system
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <p className="text-muted-foreground">
                    This AI agent can help you with:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Engineering & Maintenance: Pulls and verifies all needed documents.</li>
                    <li>Safety & Complianance: Job Safety Analysis (JSA) assistance.</li>
                    <li>Training & Knowledge Transfer: Explains proceedures and equipment specs.</li>
                    <li>Legal & Regulatory Outputs: Audit readiness & contract risks checks.</li>
                  </ul>
                  <p className="text-xs text-muted-foreground pt-2">
                    <strong>Try asking:</strong> "Using the vendor specs, how does my compressor work?" or "How is my sulfur flow PID controller configured?"
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Bot className="w-5 h-5 text-primary" />
                    <CardTitle className="text-lg">AI Assistant</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-4">
                      {messages.length === 0 ? (
                        <div className="text-center py-12">
                          <Bot className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                          <p className="text-sm text-muted-foreground">
                            Start a conversation by asking a question below
                          </p>
                        </div>
                      ) : (
                        messages.map((msg, idx) => (
                          <div
                            key={idx}
                            className={`flex gap-3 ${
                              msg.role === 'user' ? 'justify-end' : 'justify-start'
                            }`}
                            data-testid={`message-${idx}`}
                          >
                            <div
                              className={`max-w-[85%] rounded-lg px-4 py-2 ${
                                msg.role === 'user'
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted'
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                            </div>
                          </div>
                        ))
                      )}
                      {chatMutation.isPending && (
                        <div className="flex gap-3 justify-start">
                          <div className="bg-muted rounded-lg px-4 py-2">
                            <p className="text-sm text-muted-foreground">Thinking...</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>

                  <div className="flex gap-2">
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask a question..."
                      disabled={chatMutation.isPending}
                      data-testid="input-chat-message"
                      className="flex-1"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!input.trim() || chatMutation.isPending}
                      size="icon"
                      data-testid="button-send-message"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-border bg-card py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground">
                Custom Process Operator Training Simulator for Lithium Americas
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
