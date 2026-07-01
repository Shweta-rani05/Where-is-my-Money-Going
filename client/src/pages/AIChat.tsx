import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Bot, User, HelpCircle, ArrowRight } from 'lucide-react';
import { aiService } from '../services/ai.service';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

const quickPrompts = [
  { label: '💰 Spending Summary', query: "What's my spending summary?" },
  { label: '📋 Budget Status', query: "How are my budgets doing?" },
  { label: '🎯 Savings Progress', query: "Show my savings progress" },
  { label: '📂 Top Expenses', query: "What are my top expense categories?" },
  { label: '💡 Financial Advice', query: "Give me financial tips" }
];

export const AIChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: "👋 **Hello! I'm your personal financial AI assistant.**\n\nI can analyze your transactions, budgets, and savings goals from the last 30 days to offer personalized insights. Feel free to type a question or choose one of the quick options below!",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed) return;

    // Add user message
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: trimmed,
      timestamp: new Date()
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const data = await aiService.sendMessage(trimmed);
      
      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: data.response,
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (error: any) {
      toast.error('Failed to get response from AI.');
      const errMsg: Message = {
        id: `error-${Date.now()}`,
        sender: 'ai',
        text: "⚠️ **Error:** I'm having trouble connecting to the financial analysis service right now. Please try again in a moment.",
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(input);
  };

  // Helper to parse simple markdown bold, lists, and headers in chat message text
  const renderMessageContent = (text: string) => {
    return text.split('\n').map((line, idx) => {
      let content: React.ReactNode = line;

      // Handle bullet points
      const bulletMatch = line.match(/^(\s*)[•\-\*]\s+(.*)$/);
      const isBullet = !!bulletMatch;

      const rawText = isBullet ? bulletMatch![2] : line;

      // Parse bold tags **text** or __text__
      const parts = rawText.split(/(\*\*.*?\*\*)/g);
      const parsedParts = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={pIdx} className="font-bold text-text-custom">{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      if (isBullet) {
        return (
          <li key={idx} className="ml-4 list-disc pl-1 mb-1 text-sm text-text-custom leading-relaxed">
            {parsedParts}
          </li>
        );
      }

      // Handle simple headers (e.g. ### Title or **Title**)
      if (line.startsWith('###')) {
        return (
          <h4 key={idx} className="text-sm font-bold text-text-custom mt-3 mb-1.5 uppercase tracking-wide">
            {line.replace('###', '').trim()}
          </h4>
        );
      }

      if (line.trim() === '') {
        return <div key={idx} className="h-2" />;
      }

      return (
        <p key={idx} className="text-sm text-text-custom leading-relaxed mb-1">
          {parsedParts}
        </p>
      );
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] max-h-[800px] space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Bot className="w-8 h-8 text-primary" />
            AI Assistant
          </h1>
          <p className="text-text-muted">Analyze your budget ceilings, saving rates, and expense curves.</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-semibold select-none">
          <Sparkles className="w-3.5 h-3.5" />
          Active Insights Mode
        </div>
      </div>

      {/* Main chat window container */}
      <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-4">
        {/* Left: Chat list panel */}
        <div className="flex-1 flex flex-col rounded-2xl bg-card-custom border border-border-custom shadow-sm overflow-hidden min-h-0">
          
          {/* Scrollable messages logs */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((m) => {
              const isAI = m.sender === 'ai';
              return (
                <div key={m.id} className={`flex gap-3 max-w-[85%] ${isAI ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}>
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 select-none border ${
                    isAI 
                      ? 'bg-primary/10 border-primary/20 text-primary' 
                      : 'bg-card-custom border-border-custom text-text-muted'
                  }`}>
                    {isAI ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>

                  {/* Bubble content */}
                  <div className="space-y-1">
                    <div className={`px-4 py-3 rounded-2xl border shadow-sm ${
                      isAI 
                        ? 'bg-background-custom/40 border-border-custom' 
                        : 'bg-primary border-primary text-white'
                    }`}>
                      <ul className={isAI ? '' : 'text-white'}>
                        {isAI ? renderMessageContent(m.text) : <p className="text-sm leading-relaxed">{m.text}</p>}
                      </ul>
                    </div>
                    {/* Timestamp */}
                    <p className={`text-[10px] text-text-muted ${isAI ? 'pl-1' : 'pr-1 text-right'}`}>
                      {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })}

            {/* AI Typing state indicator bubble */}
            {isLoading && (
              <div className="flex gap-3 max-w-[80%] mr-auto">
                <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 text-primary">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="px-4 py-3 rounded-2xl bg-background-custom/40 border border-border-custom shadow-sm flex items-center justify-center space-x-1.5 h-10">
                  <span className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-primary/80 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick prompt panel at bottom */}
          <div className="px-4 py-3 border-t border-border-custom/50 flex flex-wrap gap-2 bg-background-custom/20">
            {quickPrompts.map((qp) => (
              <button
                key={qp.label}
                onClick={() => handleSendMessage(qp.query)}
                disabled={isLoading}
                className="px-3 py-1.5 text-xs font-semibold rounded-full border border-border-custom hover:border-primary/40 hover:bg-primary/5 transition-all text-text-custom cursor-pointer disabled:opacity-50 flex items-center gap-1 select-none"
              >
                {qp.label}
                <ArrowRight className="w-3 h-3 text-text-muted hover:text-primary" />
              </button>
            ))}
          </div>

          {/* Footer input form */}
          <div className="p-4 border-t border-border-custom bg-card-custom">
            <form onSubmit={handleFormSubmit} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me about your budgets, savings goals, or top expenditures..."
                className="flex-1 px-4 py-3 text-sm rounded-xl border border-border-custom bg-background-custom text-text-custom focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="p-3 rounded-xl bg-primary hover:bg-opacity-95 text-white font-semibold shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Right side helper info column */}
        <div className="hidden lg:flex w-72 flex-col gap-4">
          <div className="p-5 rounded-2xl bg-card-custom border border-border-custom shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-text-custom flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-primary" />
              Suggested Questions
            </h3>
            <div className="space-y-3 text-xs text-text-muted leading-relaxed">
              <p>
                <strong>"What's my spending summary?"</strong>
                <br />
                Aggregates all logs over the last 30 days to calculate net savings rate.
              </p>
              <p>
                <strong>"How are my budgets doing?"</strong>
                <br />
                Checks active category alerts (overruns or near-limit warnings).
              </p>
              <p>
                <strong>"Show my savings progress"</strong>
                <br />
                Lists overall funds deposited across all targets.
              </p>
              <p>
                <strong>"Give me financial tips"</strong>
                <br />
                Triggers logic recommendations specifically tailored to your cashflow pattern.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
