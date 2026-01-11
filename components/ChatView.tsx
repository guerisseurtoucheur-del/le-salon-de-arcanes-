
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, TarotCard } from '../types';
import { chatWithGemini } from '../services/geminiService';

interface ChatViewProps {
  initialContext?: { cards: TarotCard[]; text: string } | null;
}

const ChatView: React.FC<ChatViewProps> = ({ initialContext }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialContext && messages.length === 0) {
      const cardList = initialContext.cards.map(c => c.name).join(", ");
      setMessages([{
        role: 'model',
        content: `L'encre de votre destin a séché sur ces cartes : ${cardList}. Que souhaitez-vous que je lise entre les lignes de cette vision ?`,
        timestamp: Date.now()
      }]);
    } else if (messages.length === 0) {
      setMessages([{
        role: 'model',
        content: "Bienvenue dans le Chapitre des Murmures. Quelle ombre ou quelle lumière souhaitez-vous explorer dans les pages de votre vie ?",
        timestamp: Date.now()
      }]);
    }
  }, [initialContext]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', content: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await chatWithGemini(input, messages.map(m => ({ role: m.role, content: m.content })));
      setMessages(prev => [...prev, {
        role: 'model',
        content: response.text,
        timestamp: Date.now(),
        sources: response.sources
      }]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full animate-in slide-in-from-right-10 duration-700">
      <div className="mb-8 pb-4 border-b border-ink/10">
        <h3 className="font-uncial text-2xl text-center text-red-950 uppercase tracking-widest">Murmures d'Encre</h3>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-8 pr-2 custom-scrollbar min-h-[50vh]">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[90%] p-4 font-serif text-lg leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-black/5 border-l-2 border-ink/20 italic text-ink/70' 
                : 'text-ink font-bold first-letter:text-3xl first-letter:font-uncial first-letter:text-red-900'
            }`}>
              {msg.content}
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-4 pt-2 border-t border-ink/5 text-xs opacity-50 font-medieval">
                  Références : {msg.sources.map(s => s.title).join(", ")}
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-3 text-red-900/40 italic font-medieval animate-pulse">
            <span className="text-2xl">🖋️</span> L'Oracle écrit votre destinée...
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-8 pt-6 border-t border-ink/10 flex flex-col gap-4">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Écrivez votre tourment ici..."
            className="w-full bg-transparent border-b-2 border-ink/20 py-3 px-2 font-serif text-xl focus:outline-none focus:border-red-900/50 transition-colors italic placeholder:opacity-30"
          />
          <button 
            type="submit" 
            className="absolute right-2 top-3 text-red-900 hover:scale-110 transition-transform disabled:opacity-20"
            disabled={!input.trim() || isLoading}
          >
            <span className="text-2xl">✒️</span>
          </button>
        </div>
        <p className="text-[10px] uppercase font-medieval tracking-widest opacity-40 text-center">Appuyez sur Entrée pour sceller votre message</p>
      </form>
    </div>
  );
};

export default ChatView;
