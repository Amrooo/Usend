import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BrainCircuit, Plus, Search, Filter, Sparkles, Check, Trash2, Edit3,
  Copy, RefreshCw, Download, Upload, Eye, ToggleLeft, ToggleRight,
  ShieldCheck, HelpCircle, FileText, Truck, DollarSign, BookOpen,
  Send, Bot, CheckCircle2, XCircle, AlertCircle, Layers, ArrowRight,
  ChevronDown, X, Sparkle
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import {
  KnowledgeItem,
  subscribeToKnowledgeBase,
  saveKnowledgeItem,
  deleteKnowledgeItem,
  toggleKnowledgeItem,
  resetKnowledgeBaseToDefaults,
  buildDynamicSystemInstruction
} from '../../services/aiKnowledgeService';
import { aiModel } from '../../firebase';

export default function AIKnowledgeBasePool() {
  const { t, language, isRTL } = useLanguage();
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<KnowledgeItem | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [copyToast, setCopyToast] = useState<string | null>(null);
  
  // Form State for Add / Edit
  const [formCategory, setFormCategory] = useState<KnowledgeItem['category']>('faq');
  const [formTitle, setFormTitle] = useState('');
  const [formTitleAr, setFormTitleAr] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formContentAr, setFormContentAr] = useState('');
  const [formPriority, setFormPriority] = useState<'high' | 'medium' | 'standard'>('standard');
  const [formTags, setFormTags] = useState('');
  const [formEnabled, setFormEnabled] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Live AI Testing Playground Sandbox
  const [testQuery, setTestQuery] = useState('');
  const [testResponse, setTestResponse] = useState<string | null>(null);
  const [testMatchedItems, setTestMatchedItems] = useState<KnowledgeItem[]>([]);
  const [isTestingAI, setIsTestingAI] = useState(false);

  // Subscribe to Knowledge Base
  useEffect(() => {
    const unsubscribe = subscribeToKnowledgeBase((items) => {
      setKnowledgeItems(items);
    });
    return () => unsubscribe();
  }, []);

  // Compute Categories Counts
  const counts = useMemo(() => {
    const total = knowledgeItems.length;
    const active = knowledgeItems.filter(k => k.enabled).length;
    const rules = knowledgeItems.filter(k => k.category === 'rule').length;
    const faqs = knowledgeItems.filter(k => k.category === 'faq').length;
    const policies = knowledgeItems.filter(k => k.category === 'policy').length;
    const carriers = knowledgeItems.filter(k => k.category === 'carrier').length;
    const paragraphs = knowledgeItems.filter(k => k.category === 'paragraph' || k.category === 'pricing' || k.category === 'custom').length;
    return { total, active, rules, faqs, policies, carriers, paragraphs };
  }, [knowledgeItems]);

  // Extract all unique tags
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    knowledgeItems.forEach(k => k.tags?.forEach(t => tagsSet.add(t)));
    return Array.from(tagsSet);
  }, [knowledgeItems]);

  // Filtered Knowledge Items
  const filteredItems = useMemo(() => {
    return knowledgeItems.filter(item => {
      const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
      const matchesTag = selectedTag === 'all' || item.tags?.includes(selectedTag);
      
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || (
        item.title.toLowerCase().includes(q) ||
        (item.titleAr && item.titleAr.toLowerCase().includes(q)) ||
        item.content.toLowerCase().includes(q) ||
        (item.contentAr && item.contentAr.toLowerCase().includes(q)) ||
        item.tags.some(t => t.toLowerCase().includes(q))
      );

      return matchesCategory && matchesTag && matchesSearch;
    });
  }, [knowledgeItems, activeCategory, selectedTag, searchQuery]);

  // Reset form
  const resetForm = () => {
    setFormCategory('faq');
    setFormTitle('');
    setFormTitleAr('');
    setFormContent('');
    setFormContentAr('');
    setFormPriority('standard');
    setFormTags('');
    setFormEnabled(true);
    setFormError(null);
    setEditingItem(null);
  };

  // Open Edit Modal with item data
  const handleOpenEdit = (item: KnowledgeItem) => {
    setEditingItem(item);
    setFormCategory(item.category);
    setFormTitle(item.title);
    setFormTitleAr(item.titleAr || '');
    setFormContent(item.content);
    setFormContentAr(item.contentAr || '');
    setFormPriority(item.priority || 'standard');
    setFormTags(item.tags ? item.tags.join(', ') : '');
    setFormEnabled(item.enabled);
    setIsAddModalOpen(true);
  };

  // Save / Update Handler
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) {
      setFormError(language === 'ar' ? 'يرجى إدخال العنوان والمحتوى' : 'Title and Content are required.');
      return;
    }

    setIsSaving(true);
    setFormError(null);

    try {
      const tagsArray = formTags
        .split(',')
        .map(t => t.trim().toLowerCase())
        .filter(t => t.length > 0);

      const newItem: KnowledgeItem = {
        id: editingItem ? editingItem.id : `kb-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        title: formTitle.trim(),
        titleAr: formTitleAr.trim() || undefined,
        category: formCategory,
        content: formContent.trim(),
        contentAr: formContentAr.trim() || undefined,
        enabled: formEnabled,
        priority: formPriority,
        tags: tagsArray,
        lastUpdated: new Date().toISOString(),
        author: 'Platform Admin'
      };

      await saveKnowledgeItem(newItem);
      setIsAddModalOpen(false);
      resetForm();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save item.');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Handler
  const handleDeleteItem = async (id: string) => {
    if (window.confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذا العنصر من قاعدة المعرفة؟' : 'Are you sure you want to delete this knowledge item?')) {
      await deleteKnowledgeItem(id);
    }
  };

  // Toggle Item Enabled
  const handleToggle = async (id: string, currentEnabled: boolean) => {
    await toggleKnowledgeItem(id, !currentEnabled);
  };

  // Export JSON
  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(knowledgeItems, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `usend_ai_knowledge_pool_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import JSON
  const handleImportJson = async () => {
    try {
      const parsed = JSON.parse(importJsonText);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (item.title && item.content) {
            await saveKnowledgeItem({
              ...item,
              id: item.id || `kb-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
              enabled: item.enabled ?? true,
              priority: item.priority || 'standard',
              tags: item.tags || [],
              category: item.category || 'faq',
              lastUpdated: new Date().toISOString()
            });
          }
        }
        setIsImportModalOpen(false);
        setImportJsonText('');
      } else {
        alert(language === 'ar' ? 'صيغة JSON غير صالحة' : 'Invalid JSON format. Expected an array of knowledge items.');
      }
    } catch (err: any) {
      alert(language === 'ar' ? 'خطأ في معالجة ملف JSON: ' + err.message : 'Error parsing JSON: ' + err.message);
    }
  };

  // Copy helper
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopyToast(`${label} copied!`);
    setTimeout(() => setCopyToast(null), 2500);
  };

  // Live Test AI Retrieval
  const handleTestQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testQuery.trim() || isTestingAI) return;

    setIsTestingAI(true);
    setTestResponse(null);

    try {
      // Find matching items to highlight
      const q = testQuery.toLowerCase();
      const matched = knowledgeItems.filter(k => 
        k.enabled && (
          k.title.toLowerCase().includes(q) ||
          (k.titleAr && k.titleAr.toLowerCase().includes(q)) ||
          k.content.toLowerCase().includes(q) ||
          k.tags.some(t => q.includes(t.toLowerCase()))
        )
      );
      setTestMatchedItems(matched);

      // Build dynamic system instruction from active knowledge items
      const dynamicInstruction = buildDynamicSystemInstruction(
        "You are the USend Smart AI testing console in the Admin Portal. Answer the test question strictly adhering to the USend Knowledge Base Pool.",
        knowledgeItems
      );

      const session = aiModel.chats.create({
        model: "gemini-3.6-flash",
        config: {
          systemInstruction: dynamicInstruction,
          temperature: 0.4
        }
      });

      const res = await session.sendMessage({ message: testQuery });
      setTestResponse(res.text || 'No response returned from model.');
    } catch (err: any) {
      setTestResponse(`Simulation Error: ${err.message || err.toString()}`);
    } finally {
      setIsTestingAI(false);
    }
  };

  // Get Category Badge Style
  const getCategoryBadge = (cat: KnowledgeItem['category']) => {
    switch (cat) {
      case 'rule':
        return {
          bg: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
          icon: ShieldCheck,
          label: language === 'ar' ? 'قاعدة تشغيلية' : 'Core Rule'
        };
      case 'faq':
        return {
          bg: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
          icon: HelpCircle,
          label: language === 'ar' ? 'سؤال وجواب (FAQ)' : 'FAQ & Q/A'
        };
      case 'policy':
        return {
          bg: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
          icon: FileText,
          label: language === 'ar' ? 'سياسة ولوائح' : 'Policy & Terms'
        };
      case 'carrier':
        return {
          bg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
          icon: Truck,
          label: language === 'ar' ? 'شروط الناقل (3PL)' : 'Carrier Protocol'
        };
      case 'paragraph':
      default:
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
          icon: BookOpen,
          label: language === 'ar' ? 'معلومات الخدمة' : 'Knowledge Paragraph'
        };
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-16">
      {/* Toast Notification */}
      {copyToast && (
        <div className="fixed top-6 right-6 z-[300] bg-zinc-900 text-white px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-bold animate-bounce">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{copyToast}</span>
        </div>
      )}

      {/* Hero Header Card */}
      <div className="bg-gradient-to-br from-[#113F36] via-[#164d43] to-[#0d2e27] rounded-[2.5rem] p-8 lg:p-10 text-white shadow-xl relative overflow-hidden flex flex-col xl:flex-row gap-8 justify-between items-stretch">
        <div className="relative z-10 space-y-4 max-w-2xl">
          <div className="flex items-center gap-3">
            <span className="px-3.5 py-1 rounded-full bg-emerald-400/20 text-emerald-300 text-xs font-black uppercase tracking-widest border border-emerald-400/30 flex items-center gap-2">
              <BrainCircuit className="w-3.5 h-3.5 text-emerald-400" />
              {language === 'ar' ? 'نظام الذكاء الاصطناعي الذاتي' : 'Autonomous AI Intelligence Engine'}
            </span>
            <span className="px-2.5 py-1 rounded-full bg-white/10 text-zinc-300 text-xs font-mono font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Gemini 3.6 Flash
            </span>
          </div>

          <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight">
            {language === 'ar' ? 'مجمع وقاعدة المعرفة للمساعد الذكي' : 'AI Assistant Knowledge Base Pool'}
          </h2>

          <p className="text-sm text-emerald-100/80 leading-relaxed font-medium">
            {language === 'ar'
              ? 'إدارة ديناميكية شاملة لجميع القواعد، الأسئلة الشائعة، سياسات التوصيل والشحن (نون، أرامكس، أسطول يو سند). يتم دمج وتحديث هذه المعرفة فورياً في جلسات الذكاء الاصطناعي للمستخدمين والتجار.'
              : 'Centrally govern verified business rules, FAQs, carrier instructions, and company knowledge. Any rule or paragraph added here is dynamically injected in real-time into customer chatbot sessions.'}
          </p>

          {/* Action Buttons in Hero */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                resetForm();
                setIsAddModalOpen(true);
              }}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-black rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              <span>{language === 'ar' ? 'إضافة قاعدة أو معلومة جديدة' : 'Add Knowledge Entry'}</span>
            </button>

            <button
              onClick={handleExportJson}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition-all border border-white/15 flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>{language === 'ar' ? 'تصدير JSON' : 'Export JSON'}</span>
            </button>

            <button
              onClick={() => setIsImportModalOpen(true)}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition-all border border-white/15 flex items-center gap-2 cursor-pointer"
            >
              <Upload className="w-4 h-4 text-blue-400" />
              <span>{language === 'ar' ? 'استيراد JSON' : 'Import JSON'}</span>
            </button>

            <button
              onClick={() => setIsResetConfirmOpen(true)}
              className="px-4 py-2.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs font-bold rounded-xl transition-all border border-rose-400/30 flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>{language === 'ar' ? 'استعادة الافتراضي' : 'Reset Defaults'}</span>
            </button>
          </div>
        </div>

        {/* Live Context Metric Box */}
        <div className="relative z-10 bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/15 flex flex-col justify-between space-y-4 min-w-[280px]">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-300">
              {language === 'ar' ? 'حالة المزامنة المباشرة' : 'Live Sync Status'}
            </span>
            <div className="flex items-center gap-2 mt-1">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span className="font-bold text-sm text-white">
                {language === 'ar' ? 'متصل ونشط فورياً' : 'Active & Synchronized'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10">
            <div>
              <p className="text-2xl font-black text-white">{counts.total}</p>
              <p className="text-[11px] text-zinc-300 font-medium">
                {language === 'ar' ? 'إجمالي العناصر' : 'Total Items'}
              </p>
            </div>
            <div>
              <p className="text-2xl font-black text-emerald-400">{counts.active}</p>
              <p className="text-[11px] text-zinc-300 font-medium">
                {language === 'ar' ? 'عناصر نشطة ومفعلة' : 'Active / In-Use'}
              </p>
            </div>
          </div>

          <div className="pt-2">
            <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-400 transition-all duration-500 rounded-full"
                style={{ width: `${counts.total > 0 ? (counts.active / counts.total) * 100 : 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: language === 'ar' ? 'القواعد الإلزامية' : 'Core Rules', count: counts.rules, icon: ShieldCheck, color: 'text-rose-600 bg-rose-50 border-rose-200' },
          { label: language === 'ar' ? 'الأسئلة الشائعة (FAQs)' : 'FAQs & Answers', count: counts.faqs, icon: HelpCircle, color: 'text-blue-600 bg-blue-50 border-blue-200' },
          { label: language === 'ar' ? 'السياسات والشروط' : 'Policies & Terms', count: counts.policies, icon: FileText, color: 'text-purple-600 bg-purple-50 border-purple-200' },
          { label: language === 'ar' ? 'إرشادات شركات الشحن' : 'Carrier Protocols', count: counts.carriers, icon: Truck, color: 'text-amber-600 bg-amber-50 border-amber-200' },
          { label: language === 'ar' ? 'معلومات وتعريفات' : 'Knowledge Paragraphs', count: counts.paragraphs, icon: BookOpen, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
        ].map((stat, idx) => (
          <div key={idx} className="p-4 rounded-2xl bg-white border border-zinc-200/80 shadow-xs flex items-center gap-3.5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-black text-zinc-900">{stat.count}</p>
              <p className="text-[11px] text-zinc-500 font-semibold truncate">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Interactive AI Sandbox Simulator */}
      <div className="p-6 rounded-[2rem] bg-white border border-zinc-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-zinc-900">
                {language === 'ar' ? 'منصة اختبار وتجربة الذكاء الاصطناعي (AI Sandbox)' : 'Live Knowledge Retrieval Sandbox'}
              </h3>
              <p className="text-xs text-zinc-500">
                {language === 'ar'
                  ? 'جرب طرح أي سؤال أو استفسار عميل للتأكد من استرجاع القواعد والمعلومات بشكل فوري وصحيح.'
                  : 'Ask any question to test which Knowledge Base rules are retrieved and how the AI chatbot will answer.'}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleTestQuery} className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={testQuery}
              onChange={(e) => setTestQuery(e.target.value)}
              placeholder={language === 'ar' ? 'مثال: كيف تستلم نون أموالها؟ أو ما هي سياسة الإلغاء؟ أو اتصل بالمستلم؟' : 'e.g. How does Noon receive their money? or Can courier call on arrival?'}
              className="w-full pl-4 pr-10 py-3 rounded-2xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:border-[#113F36] text-xs font-semibold outline-none transition-all"
            />
            {testQuery && (
              <button 
                type="button" 
                onClick={() => { setTestQuery(''); setTestResponse(null); setTestMatchedItems([]); }}
                className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={isTestingAI || !testQuery.trim()}
            className="px-6 py-3 bg-[#113F36] hover:bg-[#0d2e27] text-white text-xs font-bold rounded-2xl transition-all shadow-sm flex items-center gap-2 shrink-0 disabled:opacity-50 cursor-pointer"
          >
            {isTestingAI ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span>{language === 'ar' ? 'تجربة الرد' : 'Simulate'}</span>
          </button>
        </form>

        {/* Test Result Display */}
        {testResponse && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                <Bot className="w-4 h-4" />
                {language === 'ar' ? 'رد المساعد الذكي المعتمد على قاعدة المعرفة:' : 'AI Knowledge-Grounded Output:'}
              </span>
              <button
                onClick={() => handleCopy(testResponse, 'AI Response')}
                className="text-xs text-zinc-400 hover:text-zinc-700 flex items-center gap-1"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </button>
            </div>

            <p className="text-xs text-zinc-800 whitespace-pre-line leading-relaxed font-medium bg-white p-4 rounded-xl border border-zinc-200/60 shadow-xs">
              {testResponse}
            </p>

            {testMatchedItems.length > 0 && (
              <div className="pt-2 border-t border-zinc-200/60 flex items-center gap-2 flex-wrap text-[11px]">
                <span className="font-bold text-zinc-500">{language === 'ar' ? 'القواعد المطابقة المسترجعة:' : 'Matched Knowledge Nodes:'}</span>
                {testMatchedItems.map(item => (
                  <span key={item.id} className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-semibold">
                    {item.title}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Knowledge Base Management Section */}
      <div className="p-6 rounded-[2rem] bg-white border border-zinc-200 shadow-sm space-y-6">
        {/* Filter and Search Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 hide-scrollbar">
            {[
              { id: 'all', label: language === 'ar' ? 'الكل' : 'All', count: counts.total },
              { id: 'rule', label: language === 'ar' ? 'القواعد' : 'Rules', count: counts.rules },
              { id: 'faq', label: language === 'ar' ? 'الأسئلة (FAQs)' : 'FAQs', count: counts.faqs },
              { id: 'policy', label: language === 'ar' ? 'السياسات' : 'Policies', count: counts.policies },
              { id: 'carrier', label: language === 'ar' ? 'الناقلين' : 'Carriers', count: counts.carriers },
              { id: 'paragraph', label: language === 'ar' ? 'المعلومات' : 'Paragraphs', count: counts.paragraphs },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                  activeCategory === tab.id
                    ? 'bg-[#113F36] text-white shadow-xs'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  activeCategory === tab.id ? 'bg-white/20 text-white' : 'bg-zinc-200 text-zinc-600'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Box & Tag Filter */}
          <div className="flex items-center gap-2">
            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === 'ar' ? 'بحث في العناوين والقواعد...' : 'Search knowledge items...'}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:border-[#113F36] text-xs font-semibold outline-none transition-all"
              />
            </div>

            {allTags.length > 0 && (
              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-xs font-semibold text-zinc-700 outline-none cursor-pointer"
              >
                <option value="all">{language === 'ar' ? 'جميع الوسوم' : 'All Tags'}</option>
                {allTags.map(t => (
                  <option key={t} value={t}>#{t}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Knowledge Items Grid */}
        {filteredItems.length === 0 ? (
          <div className="p-12 text-center border-2 border-dashed border-zinc-200 rounded-3xl space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto">
              <HelpCircle className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-zinc-700">
              {language === 'ar' ? 'لم يتم العثور على عناصر تطابق البحث' : 'No knowledge entries found'}
            </h4>
            <p className="text-xs text-zinc-400">
              {language === 'ar' ? 'جرب تغيير شروط البحث أو إضافة عنصر جديد لقاعدة المعرفة.' : 'Try changing your search terms or add a new knowledge entry.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredItems.map((item) => {
              const badge = getCategoryBadge(item.category);
              return (
                <div
                  key={item.id}
                  className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between space-y-4 group ${
                    item.enabled
                      ? 'bg-white border-zinc-200/90 hover:border-[#113F36] hover:shadow-md'
                      : 'bg-zinc-50/70 border-zinc-200/50 opacity-60'
                  }`}
                >
                  {/* Top Bar (Category & Actions) */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black border flex items-center gap-1.5 ${badge.bg}`}>
                        <badge.icon className="w-3.5 h-3.5" />
                        {badge.label}
                      </span>

                      {item.priority === 'high' && (
                        <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 text-[10px] font-black uppercase">
                          High Priority
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Active/Inactive Toggle */}
                      <button
                        onClick={() => handleToggle(item.id, item.enabled)}
                        title={item.enabled ? 'Deactivate' : 'Activate'}
                        className="p-1 rounded-lg hover:bg-zinc-100 text-zinc-500 transition-colors cursor-pointer"
                      >
                        {item.enabled ? (
                          <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block shadow-xs" />
                        ) : (
                          <span className="w-3 h-3 rounded-full bg-zinc-300 inline-block" />
                        )}
                      </button>

                      {/* Edit Button */}
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1.5 rounded-lg hover:bg-rose-50 text-zinc-400 hover:text-rose-600 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Titles */}
                  <div className="space-y-1">
                    <h4 className="font-black text-sm text-zinc-900 leading-snug">
                      {item.title}
                    </h4>
                    {item.titleAr && (
                      <p className="text-xs font-bold text-zinc-600 leading-snug font-sans" dir="rtl">
                        {item.titleAr}
                      </p>
                    )}
                  </div>

                  {/* Content Paragraphs */}
                  <div className="bg-zinc-50 rounded-xl p-3 text-xs text-zinc-700 space-y-2 border border-zinc-100">
                    <p className="leading-relaxed font-normal">{item.content}</p>
                    {item.contentAr && (
                      <p className="leading-relaxed text-zinc-600 border-t border-zinc-200/60 pt-2 font-sans" dir="rtl">
                        {item.contentAr}
                      </p>
                    )}
                  </div>

                  {/* Tags and Meta */}
                  <div className="flex items-center justify-between pt-2 border-t border-zinc-100 text-[11px] text-zinc-400">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {item.tags?.map(tag => (
                        <span key={tag} className="px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600 font-mono text-[10px]">
                          #{tag}
                        </span>
                      ))}
                    </div>

                    <span className="text-[10px] text-zinc-400">
                      {new Date(item.lastUpdated).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── ADD / EDIT MODAL ── */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-zinc-200 p-6 md:p-8 overflow-hidden z-10 max-h-[90vh] flex flex-col"
            >
              {/* Modal Top */}
              <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#113F36]/10 text-[#113F36] flex items-center justify-center">
                    <BrainCircuit className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-base text-zinc-900">
                      {editingItem
                        ? (language === 'ar' ? 'تعديل عنصر في قاعدة المعرفة' : 'Edit Knowledge Entry')
                        : (language === 'ar' ? 'إضافة قاعدة أو معلومة جديدة' : 'Add New Knowledge Entry')}
                    </h3>
                    <p className="text-xs text-zinc-500">
                      {language === 'ar' ? 'يتم تطبيق هذه القواعد وتضمينها فورياً في ردود المساعد الذكي' : 'Injected directly into Gemini AI system context'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSaveItem} className="overflow-y-auto py-5 space-y-4 scrollbar-thin">
                {formError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Category & Priority Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                      {language === 'ar' ? 'نوع التصنيف' : 'Category Type'} *
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value as any)}
                      className="w-full p-3 rounded-xl border border-zinc-200 bg-zinc-50 text-xs font-semibold outline-none focus:border-[#113F36]"
                    >
                      <option value="rule">Rule (إلزامية تشغيلية وسلوكية)</option>
                      <option value="faq">FAQ / Q&A (أسئلة وأجوبة شائعة)</option>
                      <option value="policy">Policy (شروط وسياسات واسترجاع)</option>
                      <option value="carrier">Carrier Protocol (تعليمات نون/أرامكس)</option>
                      <option value="paragraph">Paragraph (معلومات عامة وتعريفية)</option>
                      <option value="pricing">Pricing (تسعير وحساب تكاليف)</option>
                      <option value="custom">Custom (تعليمات برمجية مخصصة)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                      {language === 'ar' ? 'درجة الأولوية' : 'Priority Level'}
                    </label>
                    <select
                      value={formPriority}
                      onChange={(e) => setFormPriority(e.target.value as any)}
                      className="w-full p-3 rounded-xl border border-zinc-200 bg-zinc-50 text-xs font-semibold outline-none focus:border-[#113F36]"
                    >
                      <option value="high">High Priority (تطبيق إلزامي حاسم)</option>
                      <option value="medium">Medium Priority (أولوية متوسطة)</option>
                      <option value="standard">Standard Priority (معلومات اعتيادية)</option>
                    </select>
                  </div>
                </div>

                {/* Title (English) */}
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                    {language === 'ar' ? 'العنوان / السؤال (بالإنجليزية)' : 'Title / Question (English)'} *
                  </label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. How does Noon receive their money?"
                    className="w-full p-3 rounded-xl border border-zinc-200 bg-zinc-50 text-xs font-semibold outline-none focus:border-[#113F36]"
                    required
                  />
                </div>

                {/* Title (Arabic) */}
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                    {language === 'ar' ? 'العنوان / السؤال (بالعربية)' : 'Title / Question (Arabic)'}
                  </label>
                  <input
                    type="text"
                    value={formTitleAr}
                    onChange={(e) => setFormTitleAr(e.target.value)}
                    placeholder="مثال: كيف تستلم نون مستحقاتها وكيف تتم تسوية COD؟"
                    className="w-full p-3 rounded-xl border border-zinc-200 bg-zinc-50 text-xs font-semibold outline-none focus:border-[#113F36]"
                    dir="rtl"
                  />
                </div>

                {/* Content / Rule / Answer (English) */}
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                    {language === 'ar' ? 'النص / المحتوى / الإجابة (بالإنجليزية)' : 'Content / Rule / Answer (English)'} *
                  </label>
                  <textarea
                    rows={3}
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    placeholder="Provide the exact factual explanation or rule instruction..."
                    className="w-full p-3 rounded-xl border border-zinc-200 bg-zinc-50 text-xs font-medium outline-none focus:border-[#113F36] resize-none"
                    required
                  />
                </div>

                {/* Content / Rule / Answer (Arabic) */}
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                    {language === 'ar' ? 'النص / المحتوى / الإجابة (بالعربية)' : 'Content / Rule / Answer (Arabic)'}
                  </label>
                  <textarea
                    rows={3}
                    value={formContentAr}
                    onChange={(e) => setFormContentAr(e.target.value)}
                    placeholder="اكتب التوضيح أو القاعدة المعتمدة باللغة العربية..."
                    className="w-full p-3 rounded-xl border border-zinc-200 bg-zinc-50 text-xs font-medium outline-none focus:border-[#113F36] resize-none"
                    dir="rtl"
                  />
                </div>

                {/* Tags and Active Toggle */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                      {language === 'ar' ? 'الوسوم (مفصولة بفواصل)' : 'Tags (comma separated)'}
                    </label>
                    <input
                      type="text"
                      value={formTags}
                      onChange={(e) => setFormTags(e.target.value)}
                      placeholder="e.g. noon, cod, ledger, refund"
                      className="w-full p-3 rounded-xl border border-zinc-200 bg-zinc-50 text-xs font-semibold outline-none focus:border-[#113F36]"
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-4">
                    <input
                      type="checkbox"
                      id="formEnabledToggle"
                      checked={formEnabled}
                      onChange={(e) => setFormEnabled(e.target.checked)}
                      className="w-4 h-4 accent-[#113F36] rounded cursor-pointer"
                    />
                    <label htmlFor="formEnabledToggle" className="text-xs font-bold text-zinc-800 cursor-pointer">
                      {language === 'ar' ? 'تفعيل العنصر فورياً في قاعدة المعرفة' : 'Enable item immediately in AI pool'}
                    </label>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="pt-4 border-t border-zinc-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl border border-zinc-200 text-zinc-600 hover:bg-zinc-50 text-xs font-bold transition-all cursor-pointer"
                  >
                    {language === 'ar' ? 'إلغاء' : 'Cancel'}
                  </button>

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-2.5 bg-[#113F36] hover:bg-[#0d2e27] text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    <span>{editingItem ? (language === 'ar' ? 'حفظ التعديلات' : 'Save Changes') : (language === 'ar' ? 'إضافة إلى قاعدة المعرفة' : 'Save to Pool')}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── IMPORT JSON MODAL ── */}
      <AnimatePresence>
        {isImportModalOpen && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsImportModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-zinc-200 p-6 md:p-8 overflow-hidden z-10 max-h-[90vh] flex flex-col space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                <h3 className="font-extrabold text-base text-zinc-900">
                  {language === 'ar' ? 'استيراد مجموعة عناصر JSON' : 'Import Knowledge Pool JSON'}
                </h3>
                <button onClick={() => setIsImportModalOpen(false)} className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-zinc-500">
                {language === 'ar' ? 'الصق محتوى ملف JSON الذي يحتوي على مصفوفة عناصر المعرفة:' : 'Paste raw JSON array of knowledge entries:'}
              </p>

              <textarea
                rows={8}
                value={importJsonText}
                onChange={(e) => setImportJsonText(e.target.value)}
                placeholder='[ { "title": "...", "content": "...", "category": "faq" } ]'
                className="w-full p-3 font-mono text-xs border border-zinc-200 rounded-xl bg-zinc-50 outline-none focus:border-[#113F36]"
              />

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-zinc-600 rounded-xl border border-zinc-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImportJson}
                  disabled={!importJsonText.trim()}
                  className="px-6 py-2 bg-[#113F36] text-white text-xs font-bold rounded-xl disabled:opacity-50"
                >
                  Import
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── RESET CONFIRM MODAL ── */}
      <AnimatePresence>
        {isResetConfirmOpen && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsResetConfirmOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-zinc-200 p-6 overflow-hidden z-10 space-y-4 text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
                <AlertCircle className="w-6 h-6" />
              </div>

              <h3 className="font-extrabold text-base text-zinc-900">
                {language === 'ar' ? 'استعادة عناصر المعرفة الافتراضية؟' : 'Reset to Verified Defaults?'}
              </h3>

              <p className="text-xs text-zinc-500 leading-relaxed">
                {language === 'ar'
                  ? 'سيتم استرجاع جميع القواعد الافتراضية المعتمدة (تغطية الإمارات، تسوية نون، ربط أرامكس، سياسات الإلغاء والدفع عند الاستلام).'
                  : 'This will restore all verified core operational rules, FAQs, carrier guidelines, and policies to platform factory settings.'}
              </p>

              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={() => setIsResetConfirmOpen(false)}
                  className="px-5 py-2.5 text-xs font-bold text-zinc-600 rounded-xl border border-zinc-200"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  onClick={async () => {
                    await resetKnowledgeBaseToDefaults();
                    setIsResetConfirmOpen(false);
                  }}
                  className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  {language === 'ar' ? 'تأكيد الاستعادة' : 'Confirm Reset'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
