'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { queryIncidentAnomalies } from '@/ai/flows/query-incident-anomalies';
import { summarizeIncidents } from '@/ai/flows/summarize-incidents-flow';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bot, User, Send, Loader, Sparkles, MessageSquareQuote } from 'lucide-react';
import type { Message } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useSidebar } from '../ui/sidebar';

const QuerySchema = z.object({
  prompt: z.string().min(1, 'Please enter a question.'),
});
type QueryForm = z.infer<typeof QuerySchema>;

type AiAction = 'query' | 'summarize';

const DEFAULT_QUESTIONS = [
    "Summarize all high-severity alerts in the last hour.",
    "Is there unusual crowd activity near the main stage?",
    "Show me available medical staff near Zone C.",
    "What are the current weather conditions?"
]

export default function AiChatWidget({ incidents }: { incidents: any[] }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: 'assistant',
      text: 'How can I assist you? Ask me about security concerns or summarize all current incidents.',
    },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { open: sidebarOpen } = useSidebar();

  const form = useForm<QueryForm>({
    resolver: zodResolver(QuerySchema),
    defaultValues: { prompt: '' },
  });

  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messages]);

  const handleAiAction = async (prompt: string, action: AiAction) => {
    setIsSubmitting(true);
    const userMessage: Message = { id: Date.now(), role: 'user', text: prompt };
    setMessages(prev => [...prev, userMessage]);
    form.reset();

    // Add loading message immediately after user message
    const loadingMessage: Message = { id: Date.now() + 1, role: 'assistant', text: '', isLoading: true };
    setMessages(prev => [...prev, loadingMessage]);

    try {
      let result;
      if (action === 'summarize') {
        result = await summarizeIncidents(incidents);
      } else {
        result = await queryIncidentAnomalies({ query: prompt });
      }
      const assistantMessage: Message = { id: Date.now() + 2, role: 'assistant', text: result.summary };
      setMessages(prev => [...prev.slice(0, -1), assistantMessage]);
    } catch (error) {
      console.error(`AI ${action} failed:`, error);
      const errorMessage: Message = { id: Date.now() + 2, role: 'assistant', text: `Sorry, I couldn't process your ${action} request.` };
      setMessages(prev => [...prev.slice(0, -1), errorMessage]);
      toast({
        variant: "destructive",
        title: `AI ${action.charAt(0).toUpperCase() + action.slice(1)} Error`,
        description: "There was a problem communicating with the AI agent.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };


  const onSubmit: SubmitHandler<QueryForm> = (data) => {
    handleAiAction(data.prompt, 'query');
  };
  
  const handleDefaultQuestionClick = (question: string) => {
    form.setValue('prompt', question);
    handleAiAction(question, 'query');
  };


  return (
    <div className={cn("fixed bottom-6 right-6 z-50 transition-transform duration-300", sidebarOpen ? "translate-x-[-380px]" : "translate-x-0")}>
      <Popover>
        <PopoverTrigger asChild>
          <Button size="icon" className="rounded-full w-14 h-14 shadow-lg">
            <Bot className="w-7 h-7" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
            side="top" 
            align="end" 
            className="w-[400px] h-[600px] p-0 flex flex-col"
            sideOffset={16}
        >
            <div className="flex items-center p-4 border-b">
                <Sparkles className="w-6 h-6 mr-3 text-accent"/>
                <h3 className="font-headline text-lg font-semibold">AI Assistant</h3>
            </div>
            <ScrollArea className="flex-grow p-4" ref={scrollAreaRef}>
              <div className="space-y-6">
                {messages.map((message) => (
                  <div key={message.id} className={cn('flex items-start gap-3', message.role === 'user' ? 'justify-end' : 'justify-start')}>
                    {message.role === 'assistant' && (
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-primary text-primary-foreground"><Bot className="w-5 h-5" /></AvatarFallback>
                      </Avatar>
                    )}
                    <div className={cn('max-w-[80%] rounded-lg px-4 py-2 text-sm', message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                      {message.isLoading ? (
                        <div className="flex items-center space-x-2">
                          <Loader className="w-4 h-4 animate-spin" />
                          <span>Thinking...</span>
                        </div>
                      ) : (
                        <p>{message.text}</p>
                      )}
                    </div>
                    {message.role === 'user' && (
                      <Avatar className="w-8 h-8">
                        <AvatarFallback><User className="w-5 h-5" /></AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="p-4 border-t">
                {messages.length <= 1 && (
                    <div className="grid grid-cols-2 gap-2 mb-4">
                        {DEFAULT_QUESTIONS.map((q) => (
                            <Button 
                                key={q}
                                variant="outline" 
                                size="sm" 
                                className="h-auto text-wrap text-left justify-start"
                                onClick={() => handleDefaultQuestionClick(q)}
                                disabled={isSubmitting}
                            >
                                {q}
                            </Button>
                        ))}
                    </div>
                )}
                 <div className="mb-4">
                    <Button 
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => handleAiAction('Summarize all current incidents.', 'summarize')}
                        disabled={isSubmitting || incidents.length === 0}
                    >
                        <MessageSquareQuote className="mr-2 h-4 w-4"/>
                        Summarize all current incidents
                    </Button>
                </div>
                <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-center gap-2">
                    <Input
                        {...form.register('prompt')}
                        placeholder="Ask the AI..."
                        autoComplete="off"
                        disabled={isSubmitting}
                    />
                    <Button type="submit" size="icon" disabled={isSubmitting}>
                        {isSubmitting ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                </form>
            </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
