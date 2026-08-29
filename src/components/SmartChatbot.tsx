import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Send, Sparkles, RefreshCw, Bot, User, Package, 
  DollarSign, ShieldCheck, Clock, Zap, ChevronRight, MessageSquare 
} from 'lucide-react';
import { aiModel } from '../firebase';
import { subscribeToKnowledgeBase, buildDynamicSystemInstruction, KnowledgeItem } from '../services/aiKnowledgeService';
import aiIcon from '../assets/ai.png';

interface SmartChatbotProps {
  isRTL: boolean;
}

export default function SmartChatbot({ isRTL }: SmartChatbotProps) {
  const [botOpen, setBotOpen] = useState(false);
  const [botInput, setBotInput] = useState('');
  const [botMessages, setBotMessages] = useState<{ sender: 'user' | 'bot'; text: string; time?: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>([]);
  const chatSessionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Subscribe to real-time Knowledge Base Pool
  useEffect(() => {
    const unsubscribe = subscribeToKnowledgeBase((items) => {
      setKnowledgeItems(items);
      // Re-initialize or update chat session with latest dynamic instruction
      const dynamicInstruction = buildDynamicSystemInstruction(
        "You are USend's official intelligent AI assistant for logistics and e-commerce shipping in the United Arab Emirates. Provide clear, accurate, human-friendly responses in the user's language (Arabic or English).",
        items
      );
      
      chatSessionRef.current = aiModel.chats.create({
        model: "gemini-3.6-flash",
        config: {
          systemInstruction: dynamicInstruction,
          temperature: 0.6
        }
      });
    });
    return () => unsubscribe();
  }, []);

  // Initialize initial greeting message
  const initGreeting = () => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const initialGreeting = isRTL 
      ? "مرحباً بك! 👋 كيف يمكنني مساعدتك اليوم في تتبع الشحنات أو خدمات يو سند؟" 
      : "Hello! 👋 How can I help you with tracking or shipping services today?";
    setBotMessages([{ sender: 'bot', text: initialGreeting, time: timeStr }]);
  };

  useEffect(() => {
    if (botMessages.length === 0) {
      initGreeting();
    }
  }, [isRTL]);

  // Listen for global open event
  useEffect(() => {
    const handleOpen = () => setBotOpen(true);
    window.addEventListener('open-smart-bot', handleOpen);
    return () => window.removeEventListener('open-smart-bot', handleOpen);
  }, []);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [botMessages, botOpen, isLoading]);

  const sendQuery = async (queryText: string) => {
    if (!queryText.trim() || isLoading) return;

    const userInput = queryText.trim();
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setBotMessages(prev => [...prev, { sender: 'user', text: userInput, time: timeStr }]);
    setBotInput('');
    setIsLoading(true);

    try {
      if (!chatSessionRef.current) {
        const dynamicInstruction = buildDynamicSystemInstruction(
          "You are USend's official intelligent AI assistant for logistics and shipping in the UAE.",
          knowledgeItems
        );
        chatSessionRef.current = aiModel.chats.create({
          model: "gemini-3.6-flash",
          config: { systemInstruction: dynamicInstruction, temperature: 0.6 }
        });
      }

      const result = await chatSessionRef.current.sendMessage({ message: userInput });
      const responseText = result.text || (isRTL ? "عذراً، لم أتمكن من معالجة هذا الطلب." : "Sorry, I couldn't process that.");
      setBotMessages(prev => [...prev, { 
        sender: 'bot', 
        text: responseText, 
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      }]);
    } catch (error: any) {
      console.error("Chat error:", error);
      const errorMsg = error?.message || error?.toString() || "Unknown error";
      setBotMessages(prev => [...prev, { 
        sender: 'bot', 
        text: isRTL ? `حدث خطأ تقني: ${errorMsg}` : `AI Connection note: ${errorMsg}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendQuery(botInput);
  };

  const quickPrompts = isRTL ? [
    { label: '📦 تتبع الشحنة', query: 'كيف يمكنني تتبع شحنتي أو طلبي؟' },
    { label: '💰 أسعار الشحن المحلي', query: 'ما هي تكلفة وأسعار الشحن بين الإمارات؟' },
    { label: '🏢 تسجيل التجار والـ API', query: 'كيف يمكن للتجار وأصحاب المتاجر الربط والتسجيل في يو سند؟' },
    { label: '⏱️ مواعيد التوصيل السريع', query: 'ما هي خيارات ومواعيد التوصيل السريع والتوصيل في نفس اليوم؟' },
  ] : [
    { label: '📦 Track Order', query: 'How do I track my shipment or order?' },
    { label: '💰 Domestic Rates', query: 'What are the delivery rates across UAE Emirates?' },
    { label: '🏢 Merchant API', query: 'How can merchants connect their store and use the API?' },
    { label: '⏱️ Express Delivery', query: 'What are the delivery timeframes for same-day and inter-emirate shipping?' },
  ];

  return (
    <>
      <AnimatePresence>
        {botOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.94 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed bottom-24 right-4 sm:right-8 z-50 w-[92vw] sm:w-[390px] bg-white rounded-[2rem] shadow-2xl border border-zinc-200/90 overflow-hidden flex flex-col max-h-[520px] h-[480px] font-sans"
          >
            {/* ── Luxury Header ── */}
            <div className="bg-gradient-to-r from-[#113F36] via-[#164e43] to-[#0a2721] p-4 text-white flex justify-between items-center relative overflow-hidden shrink-0 shadow-sm">
              {/* Subtle glowing radial background */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-400/15 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex items-center gap-3 relative z-10">
                {/* AI Avatar with Ring */}
                <div className="relative w-11 h-11 rounded-2xl bg-white/10 p-0.5 border border-white/25 flex items-center justify-center shrink-0 backdrop-blur-md shadow-inner overflow-hidden">
                  <img 
                    src={aiIcon} 
                    alt="USend AI" 
                    className="w-full h-full object-cover rounded-xl filter drop-shadow"
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border-2 border-[#113F36]"></span>
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-extrabold text-[14.5px] tracking-tight leading-none text-white">
                      {isRTL ? 'مساعد يو سند الذكي' : 'USend Smart Assistant'}
                    </h3>
                    <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                  </div>
                  <p className="text-[10px] text-emerald-200/90 font-bold mt-1 tracking-wide flex items-center gap-1">
                    <span>{isRTL ? 'مدعوم بقاعدة المعرفة الفورية' : '⚡ Powered by USend AI Knowledge'}</span>
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1 relative z-10">
                <button 
                  onClick={initGreeting} 
                  title={isRTL ? 'إعادة ضبط المحادثة' : 'Reset chat'}
                  className="p-1.5 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={() => setBotOpen(false)} 
                  className="p-1.5 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>

            {/* ── Messages Stream ── */}
            <div className="flex-1 p-3.5 sm:p-4 overflow-y-auto bg-zinc-50/70 space-y-3 text-xs font-normal">
              {botMessages.map((msg, idx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  key={idx} 
                  className={`flex gap-2 items-end ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.sender === 'bot' && (
                    <div className="w-6 h-6 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0 mb-1 overflow-hidden shadow-2xs">
                      <img src={aiIcon} alt="USend AI" className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div className="max-w-[85%] space-y-0.5">
                    <div 
                      className={`p-3 rounded-2xl text-[13px] leading-relaxed shadow-xs ${
                        msg.sender === 'user' 
                          ? 'bg-[#113F36] text-white rounded-br-xs font-medium' 
                          : 'bg-white border border-zinc-200/80 text-zinc-800 rounded-bl-xs font-normal'
                      }`}
                      style={{ whiteSpace: 'pre-line' }}
                    >
                      {msg.text}
                    </div>
                    {msg.time && (
                      <p className={`text-[9px] text-zinc-400 font-bold px-1 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                        {msg.time}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}

              {/* Typing indicator */}
              {isLoading && (
                <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2 items-end justify-start">
                  <div className="w-6 h-6 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0 mb-1 overflow-hidden shadow-2xs">
                    <img src={aiIcon} alt="USend AI" className="w-full h-full object-cover" />
                  </div>
                  <div className="p-3 rounded-2xl bg-white border border-zinc-200/80 rounded-bl-xs shadow-xs flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '160ms' }} />
                    <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '320ms' }} />
                    <span className="text-[10.5px] font-bold text-zinc-400 ml-1">
                      {isRTL ? 'جاري التحليل...' : 'Thinking...'}
                    </span>
                  </div>
                </motion.div>
              )}

              {/* Quick Prompts on initial load - Compact chips that fit without scrolling */}
              {botMessages.length <= 1 && (
                <div className="pt-1.5 space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400 px-1">
                    {isRTL ? 'استفسارات سريعة:' : 'Quick Questions:'}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {quickPrompts.map((p, pIdx) => (
                      <button
                        key={pIdx}
                        onClick={() => sendQuery(p.query)}
                        className="p-2 px-3 bg-white hover:bg-emerald-50/80 border border-zinc-200/90 hover:border-emerald-400 rounded-full text-[11.5px] font-bold text-zinc-700 hover:text-[#113F36] transition-all flex items-center gap-1 group shadow-2xs cursor-pointer select-none"
                      >
                        <span>{p.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* ── Chat Input Footer ── */}
            <div className="p-3 bg-white border-t border-zinc-100 shrink-0">
              <form onSubmit={handleBotSubmit} className="flex gap-2 items-center">
                <input 
                  type="text" 
                  value={botInput}
                  onChange={(e) => setBotInput(e.target.value)}
                  placeholder={isRTL ? "اكتب سؤالك هنا أو رقم التتبع..." : "Ask a question or enter tracking #..."}
                  className="flex-1 outline-none text-[12.5px] bg-zinc-50 border border-zinc-250 focus:border-[#113F36] rounded-2xl px-3.5 py-2.5 focus:bg-white focus:ring-3 focus:ring-[#113F36]/10 transition-all font-medium text-zinc-800 placeholder:text-zinc-400"
                  disabled={isLoading}
                />
                <button 
                  type="submit" 
                  disabled={isLoading || !botInput.trim()}
                  className="w-10 h-10 bg-[#113F36] hover:bg-[#0a2721] text-white rounded-xl flex items-center justify-center shadow-md shadow-[#113F36]/20 transition-all shrink-0 disabled:opacity-40 disabled:hover:bg-[#113F36] active:scale-95 cursor-pointer"
                  title={isRTL ? 'إرسال' : 'Send'}
                >
                  <Send className={`w-4 h-4 ${isRTL ? '-scale-x-100' : ''}`} />
                </button>
              </form>
              <div className="flex justify-between items-center px-1 pt-1.5 text-[9px] text-zinc-400 font-medium">
                <span>{isRTL ? 'إجابات فورية مدعومة بالذكاء الاصطناعي' : 'AI-powered instant assistance'}</span>
                <span>{knowledgeItems.filter(k => k.enabled).length} {isRTL ? 'قاعدة نشطة' : 'active rules'}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Floating Docked Bot Button with Animated Gradient Border ── */}
      <button
        onClick={() => setBotOpen(!botOpen)}
        className="fixed bottom-6 right-6 z-40 p-[2.5px] rounded-full bg-gradient-to-tr from-[#113F36] via-[#cca073] via-emerald-400 to-[#113F36] shadow-[0_10px_35px_rgba(17,63,54,0.3)] flex items-center justify-center transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_18px_45px_rgba(204,160,115,0.45)] active:translate-y-0 active:scale-95 cursor-pointer group"
        id="docked-bot-trigger"
        aria-label="Open AI Assistant"
      >
        {/* Subtle pulsing background glow ring */}
        <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-[#113F36] via-[#cca073] to-emerald-400 blur-md opacity-40 group-hover:opacity-85 transition duration-500 animate-pulse -z-10" />

        <div className="relative w-14 h-14 flex items-center justify-center bg-gradient-to-br from-[#113F36] to-[#0a2721] rounded-full overflow-hidden shadow-inner p-1">
          <img 
            src={aiIcon} 
            alt="AI Bot" 
            className="w-full h-full object-cover rounded-full filter drop-shadow transition-all duration-500 group-hover:scale-110 relative z-10" 
          />
          {/* Online badge */}
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#113F36] rounded-full z-20" />
        </div>
      </button>
    </>
  );
}
