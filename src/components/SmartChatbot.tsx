import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { XCircle, ArrowRight } from 'lucide-react';
import { aiModel } from '../firebase';
import { subscribeToKnowledgeBase, buildDynamicSystemInstruction, KnowledgeItem } from '../services/aiKnowledgeService';
import aiIcon from '../assets/ai.png';

interface SmartChatbotProps {
  isRTL: boolean;
}

export default function SmartChatbot({ isRTL }: SmartChatbotProps) {
  const [botOpen, setBotOpen] = useState(false);
  const [botInput, setBotInput] = useState('');
  const [botMessages, setBotMessages] = useState<{sender: 'user'|'bot', text: string}[]>([]);
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
        "You are a smart, helpful human-like assistant for USend, an advanced logistics and multi-courier e-commerce shipping gateway in the UAE.",
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
  useEffect(() => {
    if (botMessages.length === 0) {
      const initialGreeting = isRTL 
        ? "مرحباً! أنا المساعد الذكي لـ يو سند. كيف يمكنني مساعدتك اليوم؟" 
        : "Hello! I am the USend smart assistant. How can I help you today?";
      setBotMessages([{ sender: 'bot', text: initialGreeting }]);
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
  }, [botMessages, botOpen]);

  const handleBotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!botInput.trim() || isLoading) return;

    const userInput = botInput.trim();
    setBotMessages(prev => [...prev, { sender: 'user', text: userInput }]);
    setBotInput('');
    setIsLoading(true);

    try {
      const result = await chatSessionRef.current.sendMessage({ message: userInput });
      const responseText = result.text || "Sorry, I couldn't process that.";
      setBotMessages(prev => [...prev, { sender: 'bot', text: responseText }]);
    } catch (error: any) {
      console.error("Chat error:", error);
      const errorMsg = error?.message || error?.toString() || "Unknown error";
      setBotMessages(prev => [...prev, { 
        sender: 'bot', 
        text: `Error details: ${errorMsg}` 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {botOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            className={`fixed bottom-24 ${isRTL ? 'left-4 md:left-8' : 'right-4 md:right-8'} z-50 w-[330px] md:w-96 bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col`}
          >
             {/* Header */}
             <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-5 text-white flex justify-between items-start border-b border-slate-800 relative overflow-hidden">
                {/* Decorative glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#1452D1]/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-12 h-12 rounded-full bg-transparent flex items-center justify-center p-0.5 group cursor-default">
                    <img src={aiIcon} alt="USend AI" className="w-full h-full object-contain transition-all duration-500 group-hover:rotate-12 group-hover:scale-110" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-[14px] tracking-wide font-sans mb-0.5">
                      {isRTL ? 'يو سند الذكي' : 'USend Smart AI'}
                    </h3>
                    <p className="text-[11px] text-emerald-400 font-bold uppercase tracking-widest font-mono flex items-center gap-1.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      {isRTL ? 'متصل الآن' : 'Online'}
                    </p>
                  </div>
                </div>
                <button onClick={() => setBotOpen(false)} className="relative z-10 hover:bg-white/10 p-1.5 rounded-full transition-all duration-300 text-slate-400 hover:text-white hover:rotate-90">
                  <XCircle className="w-5 h-5" />
                </button>
             </div>
             
             {/* Chat Messages */}
             <div className="flex-1 p-5 max-h-[350px] overflow-y-auto bg-slate-50/50 space-y-4 scrollbar-thin scrollbar-thumb-slate-200">
               {botMessages.map((msg, idx) => (
                 <motion.div 
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   key={idx} 
                   className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                 >
                   <div 
                     className={`p-3.5 rounded-2xl max-w-[85%] text-[15px] font-medium leading-relaxed ${
                       msg.sender === 'user' 
                         ? 'bg-gradient-to-br from-[#113f36] to-[#0a2620] text-white rounded-br-sm shadow-md' 
                         : 'bg-white border border-slate-200/60 text-slate-700 rounded-bl-sm shadow-sm'
                     }`}
                     style={{ whiteSpace: 'pre-line' }}
                   >
                     {msg.text}
                   </div>
                 </motion.div>
               ))}
               {isLoading && (
                 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                   <div className="p-4 rounded-2xl bg-white border border-slate-200/60 rounded-bl-sm shadow-sm flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                   </div>
                 </motion.div>
               )}
               <div ref={messagesEndRef} />
             </div>

             {/* Input form */}
             <form onSubmit={handleBotSubmit} className="p-3 bg-white border-t border-slate-100 flex gap-2 items-center">
                <input 
                  type="text" 
                  value={botInput}
                  onChange={(e) => setBotInput(e.target.value)}
                  placeholder={isRTL ? "اكتب رسالتك هنا..." : "Type your message here..."}
                  className="flex-1 outline-none text-[15px] bg-slate-50/80 border border-slate-200 rounded-2xl px-4 py-3 focus:bg-white focus:border-[#113f36]/50 focus:ring-2 focus:ring-[#113f36]/10 transition-all font-medium text-slate-800 placeholder:text-slate-400"
                  disabled={isLoading}
                />
                <button 
                  type="submit" 
                  disabled={isLoading || !botInput.trim()}
                  className="w-11 h-11 bg-slate-900 hover:bg-[#113f36] text-white rounded-xl flex items-center justify-center shadow-md transition-all shrink-0 disabled:opacity-50 disabled:hover:bg-slate-900 active:scale-95"
                >
                  <ArrowRight className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
                </button>
             </form>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setBotOpen(!botOpen)}
        className={`p-2.5 rounded-full bg-white text-slate-900 border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex items-center justify-center transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_12px_40px_rgb(0,0,0,0.16)] active:translate-y-0 active:scale-95 cursor-pointer group`}
        id="docked-bot-trigger"
      >
        <div className="w-12 h-12 flex items-center justify-center bg-transparent rounded-full overflow-hidden">
          <img 
            src={aiIcon} 
            alt="AI Bot" 
            className="w-10 h-10 object-contain transition-all duration-500 group-hover:scale-125 group-hover:-rotate-12" 
          />
        </div>
      </button>
    </>
  );
}
