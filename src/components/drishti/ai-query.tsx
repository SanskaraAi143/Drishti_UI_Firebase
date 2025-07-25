'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { queryIncidentAnomalies } from '@/ai/flows/query-incident-anomalies';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bot, User, Send, Loader } from 'lucide-react';
import type { Message } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const QuerySchema = z.object({
  prompt: z.string().min(1, 'Please enter a question.'),
});
type QueryForm = z.infer<typeof QuerySchema>;

export default function AiQuery() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: 'assistant',
      text: 'How can I assist you? Ask me about security concerns or incident anomalies in any zone.',
    },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const form = useForm<QueryForm>({
    resolver: zodResolver(QuerySchema),
    defaultValues: { prompt: '' },
  });

  useEffect(() => {
    // Auto-scroll to bottom
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messages]);

  const onSubmit: SubmitHandler<QueryForm> = async (data) => {
    setIsSubmitting(true);
    const userMessage: Message = { id: Date.now(), role: 'user', text: data.prompt };
    const loadingMessage: Message = { id: Date.now() + 1, role: 'assistant', text: '', isLoading: true };

    setMessages(prev => [...prev, userMessage, loadingMessage]);
    form.reset();

    try {
      const result = await queryIncidentAnomalies({ query: data.prompt });
      const assistantMessage: Message = { id: Date.now() + 2, role: 'assistant', text: result.summary };
      setMessages(prev => [...prev.slice(0, -1), assistantMessage]);
    } catch (error) {
      console.error("AI query failed:", error);
      const errorMessage: Message = { id: Date.now() + 2, role: 'assistant', text: "Sorry, I couldn't process your request." };
      setMessages(prev => [...prev.slice(0, -1), errorMessage]);
      toast({
        variant: "destructive",
        title: "AI Query Error",
        description: "There was a problem communicating with the AI agent.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardContent className="p-4 flex-grow flex flex-col overflow-hidden">
        <ScrollArea className="flex-grow mb-4 pr-4" ref={scrollAreaRef}>
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
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-center gap-2">
          <Input
            {...form.register('prompt')}
            placeholder="e.g. 'Summarize security concerns...'"
            autoComplete="off"
            disabled={isSubmitting}
          />
          <Button type="submit" size="icon" disabled={isSubmitting}>
            {isSubmitting ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
