
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, TarotCard } from '../types';
import { chatWithGemini } from '../services/geminiService';

interface ChatViewProps {
  initialContext?: { cards: TarotCard[], text: string } | null;
}

const ChatView: React.FC<ChatViewProps> = ({ initialContext }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialContext && messages.length === 0) {
      // Si on arrive d'un tirage, on initialise avec un message de bienvenue spécial
      const cardList = initialContext.cards.map(c => c.name).join(", ");
      const welcomeMsg: ChatMessage = {
        role: 'model',
        content: `Je vois que les arcanes de ${cardList} vous ont parlé. Votre esprit semble encore vibrer de cette séance. Posez-moi vos questions, mon ami(e). Que souhaitez-vous approfondir dans cette vision ?`,
        timestamp: Date.now()
      };
      setMessages([welcomeMsg]);
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

    const userMessage: ChatMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // On enrichit le prompt avec le contexte du tirage si disponible
      const contextPrompt = initialContext 
        ? `[CONTEXTE DU TIRAGE RÉCENT : Cartes: ${initialContext.cards.map(c => c.name).join(", ")}. Interprétation initiale: ${initialContext.text.substring(0, 500)}...] ${userMessage.content}`
        : userMessage.content;

      const response = await chatWithGemini(contextPrompt, messages.map(m => ({
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
      <div className="p-8 border-b-4 border-gold bg-[#2d1b11] flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="text-center md:text-left">
          <h3 className="text-2xl md:text-3xl font-serif-ornate font-black text-gold tracking-widest uppercase">Le Salon des Murmures</h3>
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

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 md:p-12 space-y-12 bg-[url('https://www.transparenttextures.com/patterns/dark-wood.png')]">
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
              <div className="absolute -top-3 -right-3 w-10 h-10 wax-seal rounded-full flex items-center justify-center text-white text-[10px] opacity-20 shadow-lg">C</div>
              
              <p className={`whitespace-pre-wrap leading-relaxed text-lg font-serif`}>
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
        <form onSubmit={handleSubmit} className="relative flex gap-6 items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Confiez votre requête à l'Oracle..."
            className="flex-1 bg-black/40 border-2 border-gold/30 rounded-lg px-6 py-5 text-gold focus:outline-none focus:border-gold transition-all placeholder:text-gold/30 font-serif text-lg"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={`
              w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300
              shadow-[0_0_20px_rgba(212,175,55,0.4)] relative group
              ${!input.trim() || isLoading 
                ? 'bg-slate-800 border-2 border-slate-700 opacity-30 grayscale cursor-not-allowed' 
                : 'bg-gradient-to-b from-amber-300 via-yellow-500 to-amber-700 border-2 border-amber-900/30 hover:scale-110 hover:shadow-[0_0_30px_rgba(212,175,55,0.6)] active:scale-95'
              }
            `}
          >
            <div className="absolute inset-1 rounded-full border border-white/20 pointer-events-none"></div>
            
            {isLoading ? (
              <div className="w-8 h-8 border-4 border-black/20 border-t-black rounded-full animate-spin"></div>
            ) : (
              <svg 
                className={`w-10 h-10 transition-transform ${!input.trim() ? 'text-slate-500' : 'text-black drop-shadow-md'}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
            
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-black text-gold px-3 py-1 rounded border border-gold text-[10px] font-serif-ornate uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
              SCELLER LA LETTRE
            </div>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatView;
