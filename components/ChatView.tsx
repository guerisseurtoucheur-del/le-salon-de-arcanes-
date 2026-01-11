
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, TarotCard } from '../types';
import { chatWithGemini } from '../services/geminiService';

interface ChatViewProps {
  initialContext?: { cards: TarotCard[], text: string } | null;
}

type ChatStep = 'TOURMENT' | 'IDENTITE' | 'CONVERSATION';

const CandleWithDancingFlame: React.FC = () => (
  <div className="relative flex flex-col items-center justify-end w-12 h-24 group">
    {/* Halo de lumière vacillant au sol/base */}
    <div className="absolute -bottom-2 w-10 h-4 bg-amber-900/30 rounded-full blur-md"></div>
    
    {/* Halo de chaleur global */}
    <div className="absolute -top-6 w-16 h-16 bg-amber-500/10 rounded-full blur-2xl animate-pulse"></div>
    
    {/* Conteneur de la Flamme */}
    <div className="absolute top-0 w-6 h-10 flex flex-col items-center">
      {/* Halo de lumière intense autour de la mèche */}
      <div className="absolute top-2 w-8 h-8 bg-amber-400/20 rounded-full blur-lg flame-glow"></div>
      
      {/* Flamme extérieure (Corps) */}
      <div className="w-4 h-9 bg-gradient-to-t from-orange-600 via-amber-400 to-amber-100 rounded-full dancing-flame shadow-[0_0_15px_rgba(251,191,36,0.5)]">
        {/* Flamme intérieure (Noyau chaud) */}
        <div className="absolute inset-x-1 top-2 bottom-1 bg-gradient-to-t from-orange-400 to-white/80 rounded-full inner-flame opacity-80"></div>
      </div>
      
      {/* Base de la flamme (Noyau bleu) */}
      <div className="absolute bottom-0 w-2 h-2 bg-blue-500/60 rounded-full blur-[1px]"></div>
    </div>

    {/* La Mèche */}
    <div className="absolute bottom-12 w-0.5 h-3 bg-black/80 rounded-full z-10"></div>

    {/* Corps de la bougie */}
    <div className="w-7 h-14 bg-gradient-to-b from-[#fdf6e3] via-[#f4e4bc] to-[#d4af37] rounded-sm relative overflow-hidden shadow-2xl antique-border-thin">
      <div className="absolute inset-0 bg-black/10"></div>
      
      {/* Coulures de cire dynamiques */}
      <div className="absolute top-0 left-1 w-2.5 h-6 bg-[#f4e4bc] rounded-full shadow-inner opacity-80"></div>
      <div className="absolute top-2 right-1.5 w-1.5 h-8 bg-[#f4e4bc] rounded-full shadow-inner opacity-90"></div>
      <div className="absolute top-1 left-3 w-1.5 h-4 bg-[#f4e4bc] rounded-full shadow-inner opacity-70"></div>
      
      {/* Grain de la bougie */}
      <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/p6.png')]"></div>
    </div>
  </div>
);

const ChatView: React.FC<ChatViewProps> = ({ initialContext }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatStep, setChatStep] = useState<ChatStep>('TOURMENT');
  
  // Infos utilisateur
  const [userName, setUserName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [zodiac, setZodiac] = useState('');

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialContext && messages.length === 0) {
      const cardList = initialContext.cards.map(c => c.name).join(", ");
      const welcomeMsg: ChatMessage = {
        role: 'model',
        content: `Je vois que les arcanes de ${cardList} vous ont parlé. Posez-moi vos questions, mon ami(e). Que souhaitez-vous approfondir dans cette vision ?`,
        timestamp: Date.now()
      };
      setMessages([welcomeMsg]);
      setChatStep('CONVERSATION');
    }
  }, [initialContext]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, chatStep]);

  const getZodiacSign = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return "Bélier";
    if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return "Taureau";
    if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return "Gémeaux";
    if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return "Cancer";
    if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return "Lion";
    if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return "Vierge";
    if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return "Balance";
    if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return "Scorpion";
    if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return "Sagittaire";
    if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return "Capricorne";
    if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return "Verseau";
    return "Poissons";
  };

  const handleInitialTourment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: Date.now()
    };

    setMessages([userMessage]);
    setInput('');
    setChatStep('IDENTITE');
  };

  const handleIdentitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !birthDate) return;

    const sign = getZodiacSign(birthDate);
    setZodiac(sign);
    setIsLoading(true);
    setChatStep('CONVERSATION');

    try {
      const tourment = messages[0].content;
      const response = await chatWithGemini(tourment, [], { 
        name: userName, 
        zodiac: sign, 
        birthDate: birthDate 
      });
      
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
        content: "Hélas, les astres sont voilés. Veuillez réitérer votre murmure.",
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNormalSubmit = async (e: React.FormEvent) => {
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
        ? `[CONTEXTE DU TIRAGE: ${initialContext.cards.map(c => c.name).join(", ")}] ${userMessage.content}`
        : userMessage.content;

      const response = await chatWithGemini(contextPrompt, messages.map(m => ({
        role: m.role,
        content: m.content
      })), { name: userName, zodiac: zodiac });
      
      const aiMessage: ChatMessage = {
        role: 'model',
        content: response.text,
        timestamp: Date.now(),
        sources: response.sources
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto antique-border shadow-2xl overflow-hidden rounded-sm bg-[#1a0f0a]">
      {/* HEADER */}
      <div className="relative p-10 border-b-4 border-gold bg-[#2d1b11] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-900/20 via-transparent to-amber-900/20 opacity-50"></div>
        <div className="relative flex flex-col items-center gap-6 z-10">
          <h3 className="text-xl md:text-2xl font-serif-ornate font-black text-gold/60 tracking-[0.5em] uppercase text-center">Le Salon des Murmures</h3>
          <div className="flex items-center justify-center gap-12 w-full">
            <div className="hidden md:block"><CandleWithDancingFlame /></div>
            <div className="flex flex-col items-center">
              <p className="font-cursive text-5xl md:text-7xl lg:text-8xl text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-gold to-amber-600 drop-shadow-[0_0_20px_rgba(212,175,55,0.6)] py-2 text-center leading-tight">
                L'Esprit des Oracles vous répond...
              </p>
            </div>
            <div className="hidden md:block"><CandleWithDancingFlame /></div>
          </div>
        </div>
      </div>

      {/* ZONE DE CHAT */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 md:p-16 space-y-16 bg-[url('https://www.transparenttextures.com/patterns/dark-wood.png')] custom-scrollbar">
        {messages.length === 0 && chatStep === 'TOURMENT' && (
          <div className="h-full flex flex-col items-center justify-center text-gold/20 space-y-8 opacity-30 italic animate-in fade-in zoom-in duration-1000">
            <span className="text-[12rem] drop-shadow-[0_0_50px_rgba(212,175,55,0.2)]">🖋️</span>
            <p className="text-3xl font-serif tracking-widest uppercase">Quelle ombre hante votre esprit ?</p>
          </div>
        )}
        
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-8 duration-700`}>
            <div className={`max-w-[85%] parchment p-10 rounded-sm shadow-2xl relative ${
              msg.role === 'user' ? 'bg-[#fffcf0] border-r-[12px] border-r-amber-900/30' : 'bg-[#fdf6e3] border-l-[12px] border-l-gold/40'
            }`}>
              <div className="absolute -top-4 -right-4 w-12 h-12 wax-seal rounded-full flex items-center justify-center text-white/40 text-xs shadow-xl rotate-12">C</div>
              <p className="whitespace-pre-wrap leading-relaxed text-xl font-serif text-amber-950">{msg.content}</p>
            </div>
          </div>
        ))}

        {chatStep === 'IDENTITE' && (
          <div className="flex justify-start animate-in fade-in slide-in-from-left-8 duration-700">
             <div className="max-w-[85%] parchment p-10 rounded-sm shadow-2xl bg-[#fdf6e3] border-l-[12px] border-l-gold/40 relative">
               <div className="absolute -top-4 -right-4 w-12 h-12 wax-seal rounded-full flex items-center justify-center text-white/40 text-xs shadow-xl rotate-12">C</div>
               <p className="text-xl font-serif text-amber-950 italic mb-6">
                 "Je sens votre trouble... Pour que les astres m'éclairent sur votre destinée, confiez-moi votre nom et votre date de venue au monde."
               </p>
             </div>
          </div>
        )}
        
        {isLoading && (
          <div className="flex justify-start animate-pulse">
            <div className="parchment px-10 py-6 flex items-center gap-4 italic text-amber-900 text-lg">
               <span className="text-2xl">🖋️</span>
               <span>L'Oracle déchiffre votre thème astral...</span>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER / INPUT */}
      <div className="p-10 bg-[#2d1b11] border-t-4 border-gold shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        {chatStep === 'TOURMENT' && (
          <form onSubmit={handleInitialTourment} className="relative flex gap-8 items-center max-w-4xl mx-auto">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Confiez votre tourment ici..."
              className="flex-1 bg-black/60 border-2 border-gold/30 rounded-2xl px-8 py-6 text-gold focus:outline-none focus:border-gold transition-all font-serif text-xl shadow-inner"
            />
            <button type="submit" disabled={!input.trim()} className="w-20 h-20 bg-gold/10 border-2 border-gold text-gold rounded-full flex items-center justify-center hover:bg-gold hover:text-black transition-all shadow-lg active:scale-95">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            </button>
          </form>
        )}

        {chatStep === 'IDENTITE' && (
          <form onSubmit={handleIdentitySubmit} className="max-w-4xl mx-auto p-8 parchment rounded-xl border-2 border-gold shadow-2xl animate-in zoom-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="block text-xs font-serif-ornate uppercase tracking-widest text-amber-900 font-bold">Votre Prénom</label>
                <input
                  type="text"
                  required
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Ex: Camille"
                  className="w-full bg-white/50 border-b-2 border-amber-900/20 px-4 py-3 text-xl font-serif text-amber-950 focus:outline-none focus:border-amber-900 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-serif-ornate uppercase tracking-widest text-amber-900 font-bold">Date de naissance</label>
                <input
                  type="date"
                  required
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full bg-white/50 border-b-2 border-amber-900/20 px-4 py-3 text-xl font-serif text-amber-950 focus:outline-none focus:border-amber-900 transition-all"
                />
              </div>
            </div>
            <button 
              type="submit"
              className="mt-8 w-full bg-amber-900 text-gold font-serif-ornate font-bold py-4 rounded-lg hover:bg-black transition-all tracking-[0.2em] uppercase text-sm shadow-xl active:scale-[0.98]"
            >
              Révéler mon Identité Céleste
            </button>
          </form>
        )}

        {chatStep === 'CONVERSATION' && (
          <form onSubmit={handleNormalSubmit} className="relative flex gap-8 items-center max-w-4xl mx-auto">
            <div className="flex-1 relative group">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`Répondez à l'Oracle, ${userName}...`}
                className="w-full bg-black/60 border-2 border-gold/30 rounded-2xl px-8 py-6 text-gold focus:outline-none focus:border-gold transition-all font-serif text-xl shadow-inner"
              />
              <div className="absolute left-0 -top-8 text-[10px] font-serif-ornate uppercase text-gold/40 tracking-widest">
                Identité : {userName} • {zodiac}
              </div>
            </div>
            <button type="submit" disabled={!input.trim() || isLoading} className="w-20 h-20 bg-gold text-black rounded-full flex items-center justify-center hover:scale-110 transition-all shadow-lg active:scale-95">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ChatView;
