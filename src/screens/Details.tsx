import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Camera, MapPin, Calendar, Clock, ArrowRight, Mic, Home, Briefcase, Package, Plus, CheckCircle2, Sparkles, Loader2 } from 'lucide-react';
import { Screen } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { GoogleGenAI } from "@google/genai";

const PACKAGE_IMAGES: Record<string, string> = {
  'Furniture': 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=400&auto=format&fit=crop',
  'Electronics': 'https://images.unsplash.com/photo-1498049794561-7780e7231661?q=80&w=400&auto=format&fit=crop',
  'Documents': 'https://images.unsplash.com/photo-1586769852044-692d6e671f0a?q=80&w=400&auto=format&fit=crop',
  'Custom Load': ''
};

function AddressAutocomplete({ placeholder, initialValue, onChange }: { placeholder: string, initialValue: string, onChange: (val: string) => void }) {
  const [query, setQuery] = useState(initialValue);
  const [results, setResults] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const skipSearchRef = useRef(false);
  const { isRTL } = useLanguage();

  useEffect(() => {
    if (skipSearchRef.current) {
      skipSearchRef.current = false;
      return;
    }

    const timer = setTimeout(async () => {
      if (query.length > 2) {
        setIsLoading(true);
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`);
          const data = await res.json();
          setResults(data);
          setIsOpen(true);
        } catch (e) {
          console.error(e);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsOpen(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="relative w-full">
      <div className="flex items-center">
        <input 
          type="text" 
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(e.target.value);
          }}
          onFocus={() => { if (results.length > 0) setIsOpen(true); }}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          className="w-full text-sm font-semibold text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-300 dark:placeholder:text-zinc-600 focus:outline-none bg-transparent transition-colors duration-300 text-left rtl:text-right"
        />
        {isLoading && <div className={`w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin ${isRTL ? 'mr-2' : 'ml-2'}`}></div>}
      </div>
      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-800 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] border border-zinc-100 dark:border-zinc-700 overflow-hidden z-50 max-h-60 overflow-y-auto">
          {results.map((res, i) => (
            <button
              key={i}
              onClick={() => {
                skipSearchRef.current = true;
                setQuery(res.display_name);
                onChange(res.display_name);
                setIsOpen(false);
              }}
              className="w-full text-left rtl:text-right px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 border-b border-zinc-100 dark:border-zinc-700 last:border-0 transition-colors"
            >
              <div className="font-medium text-zinc-900 dark:text-zinc-100 truncate">{res.name || res.display_name.split(',')[0]}</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{res.display_name}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface DetailsProps {
  key?: string;
  onNavigate: (screen: Screen) => void;
}

export default function Details({ onNavigate }: DetailsProps) {
  const [description, setDescription] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [packageType, setPackageType] = useState('Furniture');
  const [weight, setWeight] = useState('');
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [pickupAddress, setPickupAddress] = useState('221B Baker St, London');
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [isPickupSheetOpen, setIsPickupSheetOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const { t, isRTL } = useLanguage();

  const savedAddresses = [
    { id: 1, title: 'Home', address: '221B Baker St, London', icon: <Home className="w-5 h-5" /> },
    { id: 2, title: 'Work', address: '10 Downing St, London', icon: <Briefcase className="w-5 h-5" /> },
    { id: 3, title: 'Warehouse', address: 'Unit 4, Industrial Estate', icon: <Package className="w-5 h-5" /> },
  ];

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = isRTL ? 'ar-SA' : 'en-US';

        recognitionRef.current.onresult = (event: any) => {
          let interimTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              setDescription((prev) => prev + transcript + ' ');
            } else {
              interimTranscript += transcript;
            }
          }
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error', event.error);
          if (event.error === 'not-allowed') {
            setMicError('Microphone access denied. Please check your browser permissions.');
          } else {
            setMicError(`Speech recognition error: ${event.error}`);
          }
          setIsListening(false);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
    }
  }, [isRTL]);

  const toggleListening = async () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setMicError(null);
      
      // Explicitly check for microphone permission first
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Stop the tracks immediately, we just wanted to check/request permission
        stream.getTracks().forEach(track => track.stop());

        if (!recognitionRef.current) {
          setMicError('Speech recognition is not supported in this browser.');
          return;
        }

        recognitionRef.current.start();
        setIsListening(true);
      } catch (e: any) {
        console.error('Microphone permission error', e);
        if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
          setMicError('Microphone access denied. Please enable it in your browser settings.');
        } else {
          setMicError('Could not access microphone. Please ensure it is connected.');
        }
        setIsListening(false);
      }
    }
  };

  const analyzeImage = async (base64Data: string) => {
    setIsAnalyzing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            parts: [
              { text: "Analyze this image and identify the object. Suggest the most appropriate package type from this list: Furniture, Electronics, Documents, Custom Load. Also provide a brief description of the item, an estimated weight in kg, and dimensions (length, width, height) in cm. Return the result in JSON format: { \"suggestion\": \"Type\", \"description\": \"Brief description\", \"weight\": number, \"length\": number, \"width\": number, \"height\": number }" },
              {
                inlineData: {
                  mimeType: "image/jpeg",
                  data: base64Data.split(',')[1]
                }
              }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json"
        }
      });

      const result = JSON.parse(response.text || '{}');
      if (result.suggestion) {
        setPackageType(result.suggestion);
      }
      if (result.description) {
        setDescription(result.description);
      }
      if (result.weight) setWeight(result.weight.toString());
      if (result.length) setLength(result.length.toString());
      if (result.width) setWidth(result.width.toString());
      if (result.height) setHeight(result.height.toString());
    } catch (e) {
      console.error('AI Analysis failed', e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCapture = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setCapturedImage(base64);
        analyzeImage(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: isRTL ? -100 : 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: isRTL ? 100 : -100 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="absolute inset-0 bg-zinc-50 flex flex-col transition-colors duration-300 overflow-hidden"
    >
      {/* Header - Adjusted for notch */}
      <div className="px-6 pt-12 pb-4 flex items-center justify-between bg-zinc-50/80 backdrop-blur-md z-10 transition-colors duration-300">
        <button 
          onClick={() => onNavigate('home')}
          className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-zinc-900 active:scale-95 transition-all duration-300"
        >
          <ChevronLeft className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
        </button>
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 transition-colors duration-300">{t('delivery_details')}</h2>
        <div className="w-10"></div> {/* Spacer */}
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar px-6 space-y-8 pb-32 pt-4 relative z-10">
        {/* Smart Scan */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 transition-colors duration-300">{t('smart_scan')}</h3>
            <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-500 text-[12px] font-bold tracking-wider uppercase flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              {t('ai_powered')}
            </span>
          </div>
          
          <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-4 shadow-sm border border-zinc-100 dark:border-zinc-800 transition-colors duration-300">
            <input 
              type="file" 
              accept="image/*" 
              capture="environment" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleCapture}
            />
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="relative h-48 bg-zinc-100 dark:bg-zinc-800 rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 flex flex-col items-center justify-center gap-3 overflow-hidden group cursor-pointer transition-colors duration-300"
            >
              {capturedImage ? (
                <>
                  <img src={capturedImage} alt="Captured" className="absolute inset-0 w-full h-full object-cover" />
                  {isAnalyzing && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center text-white gap-2">
                      <Loader2 className="w-8 h-8 animate-spin" />
                      <span className="text-xs font-bold tracking-widest uppercase">AI Analyzing...</span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <img src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=800&auto=format&fit=crop" alt="Warehouse" className="absolute inset-0 w-full h-full object-cover opacity-40 dark:opacity-20 group-hover:scale-105 transition-all duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/50 dark:from-zinc-950/80 to-transparent"></div>
                  <div className="w-12 h-12 rounded-full bg-[#f5502c] flex items-center justify-center text-white shadow-lg relative z-10 group-hover:scale-110 transition-transform">
                    <Camera className="w-6 h-6" />
                  </div>
                  <span className="font-semibold text-white relative z-10 shadow-sm">{t('snap_photo')}</span>
                </>
              )}
            </div>

            <div className="mt-6">
              <p className="text-[12px] font-bold tracking-widest text-zinc-400 dark:text-zinc-500 uppercase mb-3 text-left rtl:text-right">{t('package_type')}</p>
              <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1 -mx-4 px-4">
                {['Furniture', 'Electronics', 'Documents', 'Custom Load'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setPackageType(type)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-300 active:scale-95 ${
                      packageType === type
                        ? 'bg-[#f5502c] text-white shadow-md shadow-[#f5502c]/20'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[12px] font-bold tracking-widest text-zinc-400 dark:text-zinc-500 uppercase text-left rtl:text-right">{t('describe_manually')}</p>
                {isListening && (
                  <span className="text-[12px] font-bold text-blue-500 animate-pulse uppercase tracking-wider flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                    Listening...
                  </span>
                )}
              </div>
              <div className="relative">
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t('describe_placeholder')}
                  className={`w-full h-24 bg-zinc-50 dark:bg-zinc-950/50 rounded-2xl p-4 pr-12 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none border transition-all duration-300 text-left rtl:text-right ${micError ? 'border-red-500' : isListening ? 'border-blue-500 ring-2 ring-green-500/10' : 'border-zinc-200 dark:border-zinc-800'}`}
                ></textarea>
                <button
                  onClick={toggleListening}
                  className={`absolute ${isRTL ? 'left-3' : 'right-3'} bottom-3 p-2 rounded-full transition-all duration-300 ${
                    isListening 
                      ? 'bg-[#f5502c] text-white shadow-lg shadow-[#f5502c]/40 scale-110' 
                      : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-300 dark:hover:bg-zinc-700'
                  }`}
                >
                  <Mic className={`w-4 h-4 ${isListening ? 'animate-pulse' : ''}`} />
                </button>
              </div>
              {micError && (
                <p className="mt-2 text-[12px] font-bold text-red-500 uppercase tracking-widest animate-pulse">
                  {micError}
                </p>
              )}
            </div>

            <div className="mt-4">
              <p className="text-[12px] font-bold tracking-widest text-zinc-400 dark:text-zinc-500 uppercase mb-2 text-left rtl:text-right">{t('dimensions')}</p>
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <input 
                    type="number" 
                    placeholder="L" 
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                    className="w-full h-12 bg-zinc-50 dark:bg-zinc-950/50 rounded-xl px-4 pr-8 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 border border-zinc-200 dark:border-zinc-800 transition-colors duration-300 text-left rtl:text-right" 
                  />
                  <span className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-[12px] text-zinc-400 font-medium`}>cm</span>
                </div>
                <div className="flex-1 relative">
                  <input 
                    type="number" 
                    placeholder="W" 
                    value={width}
                    onChange={(e) => setWidth(e.target.value)}
                    className="w-full h-12 bg-zinc-50 dark:bg-zinc-950/50 rounded-xl px-4 pr-8 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 border border-zinc-200 dark:border-zinc-800 transition-colors duration-300 text-left rtl:text-right" 
                  />
                  <span className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-[12px] text-zinc-400 font-medium`}>cm</span>
                </div>
                <div className="flex-1 relative">
                  <input 
                    type="number" 
                    placeholder="H" 
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className="w-full h-12 bg-zinc-50 dark:bg-zinc-950/50 rounded-xl px-4 pr-8 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 border border-zinc-200 dark:border-zinc-800 transition-colors duration-300 text-left rtl:text-right" 
                  />
                  <span className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-[12px] text-zinc-400 font-medium`}>cm</span>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-[12px] font-bold tracking-widest text-zinc-400 dark:text-zinc-500 uppercase mb-2 text-left rtl:text-right">{t('weight')}</p>
              <div className="relative">
                <input 
                  type="number" 
                  placeholder="0.0" 
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full h-12 bg-zinc-50 dark:bg-zinc-950/50 rounded-xl px-4 pr-8 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 border border-zinc-200 dark:border-zinc-800 transition-colors duration-300 text-left rtl:text-right" 
                />
                <span className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-[12px] text-zinc-400 font-medium`}>kg</span>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-[12px] font-bold tracking-widest text-zinc-400 dark:text-zinc-500 uppercase mb-2 text-left rtl:text-right">{t('ai_suggested')}</p>
              <div className="flex flex-wrap gap-2">
                {weight && (
                  <span className="px-3 py-1.5 rounded-full border border-blue-500/30 text-blue-700 dark:text-blue-400 text-xs font-semibold bg-blue-500/5 flex items-center gap-1.5 transition-colors duration-300">
                    <Package className="w-3.5 h-3.5" />
                    ~{weight} kg
                  </span>
                )}
                <span className="px-3 py-1.5 rounded-full border border-blue-500/30 text-blue-700 dark:text-blue-400 text-xs font-semibold bg-blue-500/5 flex items-center gap-1.5 transition-colors duration-300">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {packageType}
                </span>
                <button 
                  onClick={() => {
                    setWeight('');
                    setLength('');
                    setWidth('');
                    setHeight('');
                    setDescription('');
                  }}
                  className="px-3 py-1.5 rounded-full text-zinc-500 dark:text-zinc-400 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors duration-300"
                >
                  {t('clear_details')}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Logistics */}
        <section>
          <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-4 transition-colors duration-300 text-left rtl:text-right">{t('logistics')}</h3>
          <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-5 shadow-sm border border-zinc-100 dark:border-zinc-800 relative transition-colors duration-300">
            {/* Connecting Line */}
            <div className={`absolute ${isRTL ? 'right-[33px]' : 'left-[33px]'} top-[45px] bottom-[45px] w-[2px] bg-zinc-100 dark:bg-zinc-800 transition-colors duration-300`}></div>

            <div className="flex gap-4 mb-6 relative z-10">
              <div className="w-6 h-6 rounded-full border-[3px] border-blue-500 bg-white dark:bg-zinc-900 flex-shrink-0 mt-1 transition-colors duration-300"></div>
              <div className={`flex-1 border-b border-zinc-100 dark:border-zinc-800 pb-4 transition-colors duration-300 text-left rtl:text-right`}>
                <p className="text-[12px] font-bold tracking-widest text-zinc-400 dark:text-zinc-500 uppercase mb-1">{t('pickup_address')}</p>
                <button 
                  onClick={() => setIsPickupSheetOpen(true)}
                  className="w-full text-sm font-semibold text-zinc-900 dark:text-zinc-100 focus:outline-none bg-transparent transition-colors duration-300 text-left rtl:text-right py-1"
                >
                  {pickupAddress || t('enter_pickup')}
                </button>
              </div>
            </div>

            <div className="flex gap-4 relative z-10">
              <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-1 transition-colors duration-300">
                <MapPin className="w-3.5 h-3.5 text-red-500 dark:text-red-400" />
              </div>
              <div className="flex-1 text-left rtl:text-right">
                <p className="text-[12px] font-bold tracking-widest text-zinc-400 dark:text-zinc-500 uppercase mb-1">{t('dropoff_address')}</p>
                <AddressAutocomplete 
                  placeholder={t('enter_destination')}
                  initialValue={dropoffAddress}
                  onChange={setDropoffAddress}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Schedule */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 transition-colors duration-300">{t('schedule')}</h3>
            <button className="text-xs font-bold text-blue-600 dark:text-blue-500 tracking-wider uppercase">{t('asap')}</button>
          </div>
          
          <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2 -mx-6 px-6">
            {[
              { day: t('today'), date: '24', month: 'OCT', active: true },
              { day: 'FRI', date: '25', month: 'OCT' },
              { day: 'SAT', date: '26', month: 'OCT' },
              { day: 'SUN', date: '27', month: 'OCT' },
            ].map((d, i) => (
              <button 
                key={i}
                className={`flex-shrink-0 w-20 py-4 rounded-2xl flex flex-col items-center gap-1 transition-all duration-300 active:scale-95 ${
                  d.active 
                    ? 'bg-blue-700 text-white shadow-lg shadow-green-700/30 dark:shadow-none' 
                    : 'bg-white dark:bg-zinc-900 text-zinc-400 dark:text-zinc-500 border border-zinc-100 dark:border-zinc-800'
                }`}
              >
                <span className={`text-[12px] font-bold tracking-widest uppercase ${d.active ? 'text-blue-200' : ''}`}>{d.day}</span>
                <span className={`text-2xl font-black ${d.active ? 'text-white' : 'text-zinc-900 dark:text-zinc-100'}`}>{d.date}</span>
                <span className={`text-[12px] font-bold tracking-widest uppercase ${d.active ? 'text-blue-200' : ''}`}>{d.month}</span>
              </button>
            ))}
          </div>

          <div className="mt-4 bg-white dark:bg-zinc-900 rounded-2xl p-4 flex items-center justify-between border border-zinc-100 dark:border-zinc-800 shadow-sm transition-colors duration-300">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400 transition-colors duration-300">
                <Clock className="w-5 h-5" />
              </div>
              <div className="text-left rtl:text-right">
                <p className="text-[12px] font-bold tracking-widest text-zinc-400 dark:text-zinc-500 uppercase">{t('pickup_window')}</p>
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">09:00 AM - 11:00 AM</p>
              </div>
            </div>
            <button className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
            </button>
          </div>
        </section>
      </div>

      {/* Fixed Bottom Action */}
      <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-zinc-50 via-zinc-50 to-transparent pt-12 pointer-events-none transition-colors duration-300 z-20">
        <button
          onClick={() => onNavigate('confirm')}
          className="pointer-events-auto w-full h-16 bg-[#f5502c] rounded-2xl flex items-center justify-center gap-2 text-white font-semibold text-lg shadow-[0_8px_30px_rgb(245,80,44,0.4)] dark:shadow-none transition-transform active:scale-95"
        >
          {t('calculate_quote')}
          <ArrowRight className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Pickup Address Bottom Sheet */}
      {isPickupSheetOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsPickupSheetOpen(false)}
            className="absolute inset-0 bg-black/40 dark:bg-black/60 z-40 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 rounded-t-[2rem] z-50 shadow-2xl overflow-hidden flex flex-col max-h-[80%]"
          >
            <div className="w-full pt-4 pb-2 flex justify-center touch-none">
              <div className="w-12 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full"></div>
            </div>
            <div className="px-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{t('pickup_address')}</h3>
            </div>
            <div className="overflow-y-auto p-6 space-y-4">
              {savedAddresses.map((addr) => (
                <button
                  key={addr.id}
                  onClick={() => {
                    setPickupAddress(addr.address);
                    setIsPickupSheetOpen(false);
                  }}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors text-left rtl:text-right"
                >
                  <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400">
                    {addr.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{addr.title}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{addr.address}</p>
                  </div>
                  {pickupAddress === addr.address && (
                    <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-500" />
                  )}
                </button>
              ))}
              <button className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors text-left rtl:text-right">
                <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400">
                  <Plus className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Add New Address</p>
                </div>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </motion.div>
  );
}
