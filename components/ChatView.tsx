
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
        content: "Hélas, ma plume s'est brisée sur le parchemin du destin. Veuillez réitérer votre murmure.",
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto antique-border shadow-2xl overflow-hidden rounded-sm bg-[#1a0f0a]">
      {/* HEADER TRANSFORMÉ */}
      <div className="relative p-10 border-b-4 border-gold bg-[#2d1b11] overflow-hidden">
        {/* Effets de lumière en arrière-plan */}
        <div className="absolute inset-0 bg-gradient-to-r from-amber-900/20 via-transparent to-amber-900/20 opacity-50"></div>
        <div className="absolute top-0 left-1/4 w-1/2 h-1 bg-gradient-to-r from-transparent via-gold/50 to-transparent"></div>
        
        <div className="relative flex flex-col items-center gap-6 z-10">
          <div className="text-center space-y-2">
            <h3 className="text-xl md:text-2xl font-serif-ornate font-black text-gold/60 tracking-[0.5em] uppercase">Le Salon des Murmures</h3>
          </div>

          <div className="flex items-center justify-center gap-8 w-full">
            <span className="text-4xl hidden md:block animate-pulse opacity-60">🕯️</span>
            <div className="flex flex-col items-center">
              <p className="font-cursive text-5xl md:text-7xl lg:text-8xl text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-gold to-amber-600 drop-shadow-[0_0_20px_rgba(212,175,55,0.6)] py-2">
                L'Esprit des Oracles vous répond...
              </p>
              <div className="h-[2px] w-3/4 bg-gradient-to-r from-transparent via-gold to-transparent opacity-40 mt-2"></div>
            </div>
            <span className="text-4xl hidden md:block animate-pulse opacity-60">🕯️</span>
          </div>
        </div>

        <button 
          onClick={() => setMessages([])} 
          className="absolute top-6 right-6 w-14 h-14 rounded-full border-2 border-gold/20 flex items-center justify-center text-gold/40 hover:bg-gold hover:text-black hover:border-gold transition-all duration-500 group z-20"
          title="Brûler les archives"
        >
          <svg className="w-8 h-8 transition-transform group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
          </svg>
        </button>
      </div>

      {/* ZONE DE CHAT */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 md:p-16 space-y-16 bg-[url('https://www.transparenttextures.com/patterns/dark-wood.png')] custom-scrollbar">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-gold/20 space-y-8 opacity-30 italic animate-in fade-in zoom-in duration-1000">
            <span className="text-[12rem] drop-shadow-[0_0_50px_rgba(212,175,55,0.2)]">🖋️</span>
            <p className="text-3xl font-serif tracking-widest uppercase">Quelle ombre hante votre esprit ?</p>
          </div>
        )}
        
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-8 duration-700`}>
            <div className={`max-w-[85%] parchment p-10 rounded-sm shadow-2xl relative transition-all hover:scale-[1.01] ${
              msg.role === 'user' 
                ? 'bg-[#fffcf0] border-r-[12px] border-r-amber-900/30' 
                : 'bg-[#fdf6e3] border-l-[12px] border-l-gold/40'
            }`}>
              {/* Sceau de cire décoratif */}
              <div className="absolute -top-4 -right-4 w-12 h-12 wax-seal rounded-full flex items-center justify-center text-white/40 text-xs shadow-xl rotate-12">C</div>
              
              <p className={`whitespace-pre-wrap leading-relaxed text-xl font-serif text-amber-950`}>
                {msg.content}
              </p>
              
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-10 pt-8 border-t border-black/10">
                  <p className="text-xs font-serif-ornate font-bold text-black/50 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <span className="w-4 h-px bg-black/20"></span> Archives des Mondes <span className="w-4 h-px bg-black/20"></span>
                  </p>
                  <div className="flex flex-wrap gap-4">
                    {msg.sources.map((source, si) => (
                      <a 
                        key={si} 
                        href={source.uri} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm bg-black/5 hover:bg-gold/30 px-4 py-2 rounded-sm border border-black/5 text-amber-900 font-serif italic transition-all shadow-sm hover:shadow-md"
                      >
                        📜 {source.title}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start animate-pulse">
            <div className="parchment px-10 py-6 flex items-center gap-4 italic text-amber-900 text-lg">
               <span className="text-2xl">🖋️</span>
               <span>La plume de l'Oracle court sur le papier...</span>
            </div>
          </div>
        )}
      </div>

      {/* INPUT TRANSFORMÉ */}
      <div className="p-10 bg-[#2d1b11] border-t-4 border-gold shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        <form onSubmit={handleSubmit} className="relative flex gap-8 items-center max-w-4xl mx-auto">
          <div className="relative flex-1 group">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Confiez votre tourment à l'Esprit des Oracles..."
              className="w-full bg-black/60 border-2 border-gold/30 rounded-2xl px-8 py-6 text-gold focus:outline-none focus:border-gold focus:ring-4 focus:ring-gold/10 transition-all placeholder:text-gold/20 font-serif text-xl shadow-inner"
            />
            <div className="absolute right-6 top-1/2 -translate-y-1/2 text-gold/10 text-3xl pointer-events-none group-focus-within:opacity-40 transition-opacity">✨</div>
          </div>
          
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={`
              w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500
              shadow-[0_0_40px_rgba(212,175,55,0.4)] relative group
              ${!input.trim() || isLoading 
                ? 'bg-slate-900 border-2 border-slate-800 opacity-20 grayscale cursor-not-allowed' 
                : 'bg-gradient-to-b from-amber-300 via-yellow-500 to-amber-700 border-2 border-amber-900/40 hover:scale-110 hover:rotate-3 hover:shadow-[0_0_50px_rgba(212,175,55,0.7)] active:scale-95'
              }
            `}
          >
            <div className="absolute inset-1.5 rounded-full border border-white/30 pointer-events-none"></div>
            
            {isLoading ? (
              <div className="w-10 h-10 border-4 border-black/30 border-t-black rounded-full animate-spin"></div>
            ) : (
              <svg 
                className={`w-12 h-12 transition-transform duration-500 ${!input.trim() ? 'text-slate-600' : 'text-black drop-shadow-lg group-hover:scale-110'}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
            
            <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-black text-gold px-4 py-2 rounded-lg border-2 border-gold text-[10px] font-serif-ornate font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all pointer-events-none shadow-2xl scale-50 group-hover:scale-100">
              SCELLER LA LETTRE
            </div>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatView;
