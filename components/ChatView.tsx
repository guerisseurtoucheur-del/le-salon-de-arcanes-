
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { chatWithGemini } from '../services/geminiService';

const ChatView: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await chatWithGemini(userMessage.content, messages.map(m => ({
        role: m.role,
        content: m.content
      })));
      
      const aiMessage: ChatMessage = {
        role: 'model',
        content: response.text,
        timestamp: Date.now(),
        sources: response.sources
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        role: 'model',
        content: "Hélas, ma plume s'est brisée. Veuillez réitérer votre demande plus tard.",
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto antique-border shadow-2xl overflow-hidden rounded-sm">
      <div className="p-8 border-b-4 border-gold bg-[#2d1b11] flex justify-between items-center">
        <div>
          <h3 className="text-3xl font-serif-ornate font-black text-gold tracking-widest uppercase">Bureau de Correspondance</h3>
          <p className="text-sm font-cursive text-amber-100/60 text-xl">L'Esprit des Arcanes vous répond...</p>
        </div>
        <button 
          onClick={() => setMessages([])} 
          className="w-12 h-12 rounded-full border border-gold/30 flex items-center justify-center hover:bg-gold hover:text-black transition-all"
          title="Brûler les archives"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
          </svg>
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-12 space-y-12 bg-[url('https://www.transparenttextures.com/patterns/dark-wood.png')]">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-gold/30 space-y-6 opacity-40 italic">
            <span className="text-9xl">🖋️</span>
            <p className="text-2xl font-serif">Quelle question tourmente votre esprit ?</p>
          </div>
        )}
        
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] parchment p-8 rounded-sm shadow-xl relative ${
              msg.role === 'user' 
                ? 'bg-[#fff9e6] border-r-8 border-r-amber-900/20' 
                : 'bg-[#f4e4bc] border-l-8 border-l-gold/20'
            }`}>
              {/* Effet de papier déchiré ou timbre */}
              <div className="absolute -top-3 -right-3 w-10 h-10 wax-seal rounded-full flex items-center justify-center text-white text-[10px] opacity-20">ARCANE</div>
              
              <p className={`whitespace-pre-wrap leading-relaxed text-lg ${msg.role === 'model' ? 'font-serif' : 'font-serif'}`}>
                {msg.content}
              </p>
              
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-8 pt-6 border-t border-black/10">
                  <p className="text-[10px] font-serif-ornate font-bold text-black/40 uppercase tracking-widest mb-3">Archives Mondiales</p>
                  <div className="flex flex-wrap gap-3">
                    {msg.sources.map((source, si) => (
                      <a 
                        key={si} 
                        href={source.uri} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs bg-black/5 hover:bg-gold/20 px-3 py-1 rounded-sm border border-black/10 text-amber-900 font-serif italic transition-all"
                      >
                        {source.title}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="parchment px-8 py-4 flex gap-3 italic text-amber-900">
               <span className="animate-pulse">La plume court sur le papier...</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-8 bg-[#2d1b11] border-t-4 border-gold">
        <form onSubmit={handleSubmit} className="relative flex gap-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Confiez votre requête à l'Oracle..."
            className="flex-1 bg-black/40 border-2 border-gold/30 rounded-lg px-6 py-5 text-gold focus:outline-none focus:border-gold transition-all placeholder:text-gold/30 font-serif"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="w-16 bg-gold text-black rounded-lg flex items-center justify-center disabled:opacity-30 hover:scale-105 transition-all shadow-lg"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatView;
