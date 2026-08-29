import { db } from '../firebase';
import { collection, doc, onSnapshot, setDoc, deleteDoc, getDocs } from 'firebase/firestore';

export interface KnowledgeItem {
  id: string;
  title: string;
  titleAr?: string;
  category: 'rule' | 'faq' | 'policy' | 'carrier' | 'paragraph' | 'pricing' | 'custom';
  content: string;
  contentAr?: string;
  enabled: boolean;
  priority: 'high' | 'medium' | 'standard';
  tags: string[];
  lastUpdated: string;
  author?: string;
}

export const DEFAULT_KNOWLEDGE_POOL: KnowledgeItem[] = [
  {
    id: 'rule-geography-uae',
    title: 'UAE All-Emirate Full Logistics Coverage',
    titleAr: 'تغطية شاملة لجميع إمارات الدولة السبع',
    category: 'rule',
    content: 'USend operates an intelligent multi-carrier logistics network covering all 7 Emirates in the UAE: Dubai, Abu Dhabi, Sharjah, Ajman, Ras Al Khaimah, Umm Al Quwain, and Fujairah. Cross-emirate next-day delivery and same-day on-demand delivery are supported.',
    contentAr: 'تعمل منصة يو سند في جميع الإمارات السبع (دبي، أبوظبي، الشارقة، عجمان، رأس الخيمة، أم القيوين، الفجيرة) وتقدم خدمات التوصيل الفوري في نفس اليوم والتوصيل السريع لليوم التالي بين الإمارات.',
    enabled: true,
    priority: 'high',
    tags: ['coverage', 'uae', 'emirates', 'zones'],
    lastUpdated: new Date().toISOString(),
    author: 'USend Operations'
  },
  {
    id: 'rule-recipient-dropoff-contact',
    title: 'Recipient Drop-Off Contact & Live Pin Calling',
    titleAr: 'الاتصال بالمستلم عند الوصول ومشاركة الموقع الدقيق',
    category: 'rule',
    content: 'When an order has "Call recipient on arrival / for exact drop-off pin" enabled or lacks an exact street address, couriers (Noon RoD riders, Aramex drivers, and USend Fleet) must call the recipient on the provided phone number upon reaching the area to obtain the exact location pin.',
    contentAr: 'عند اختيار خيار "الاتصال بالمستلم عند الوصول لتحديد الموقع الدقيق" أو في حال عدم وجود عنوان تفصيلي، يقوم السائق (نون، أرامكس، أو أسطول يو سند) بالاتصال هاتفياً بالمستلم فور الوصول للمنطقة لاستلام إحداثيات الموقع أو الشارع بدقة.',
    enabled: true,
    priority: 'high',
    tags: ['dropoff', 'phone', 'contact', 'noon', 'aramex', 'pin'],
    lastUpdated: new Date().toISOString(),
    author: 'USend Dispatch'
  },
  {
    id: 'faq-noon-carrier-payment-cod',
    title: 'How Noon Receives Money & Merchant COD Settlement',
    titleAr: 'كيف تستلم نون مستحقاتها وكيف تتم تسوية الدفع عند الاستلام',
    category: 'faq',
    content: 'Noon RoD carrier delivery fees are paid directly through USend platform billing/wallet integration. When Cash on Delivery (COD) is collected by Noon riders, the cash is deposited into the USend central clearing escrow and credited to the merchant\'s Platform Ledger wallet for automated weekly or on-demand bank settlement.',
    contentAr: 'يتم سداد رسوم توصيل نون مباشرة عبر محفظة ونظام فوترة يو سند. وعند تحصيل مبالغ الدفع عند الاستلام (COD) من قبل مناديب نون، تُودع الأموال في محفظة التاجر على منصة يو سند وتتم تسويتها وتحويلها لحسابه البنكي بشكل أسبوعي أو عند الطلب.',
    enabled: true,
    priority: 'high',
    tags: ['noon', 'cod', 'payment', 'ledger', 'settlement'],
    lastUpdated: new Date().toISOString(),
    author: 'Finance Desk'
  },
  {
    id: 'faq-aramex-integration-dispatch',
    title: 'Aramex Domestic & GCC Shipping Workflows',
    titleAr: 'آلية الشحن المحلي والخليجي عبر أرامكس',
    category: 'carrier',
    content: 'Aramex is integrated for both next-day intra-UAE delivery and GCC cross-border dispatches. Waybills, barcodes, and customs manifests are automatically generated via USend API, and scheduled pickups occur directly at merchant warehouses or pickup hubs.',
    contentAr: 'تم ربط أرامكس للشحن المحلي لليوم التالي وللشحن الدولي لدول مجلس التعاون الخليجي. يتم إصدار بوالص الشحن والباركود تلقائياً وتحديد مواعيد استلام الشحنات من مستودعات التجار.',
    enabled: true,
    priority: 'medium',
    tags: ['aramex', 'awb', 'gcc', 'barcodes'],
    lastUpdated: new Date().toISOString(),
    author: 'Carrier Management'
  },
  {
    id: 'policy-cancellation-refunds',
    title: 'Order Cancellation & Refund Regulations',
    titleAr: 'سياسة إلغاء الشحنات واسترداد الرسوم',
    category: 'policy',
    content: 'Orders can be cancelled before rider dispatch with 100% refund of delivery fees back to the user/merchant wallet. If cancelled after rider dispatch, cancellation reason is logged in the live tracking timeline and returned shipments are routed back to the pickup origin.',
    contentAr: 'يمكن إلغاء الطلب قبل تعيين السائق أو انطلاقه مع استرجاع 100% من رسوم الشحن إلى المحفظة. وفي حال الإلغاء بعد انطلاق السائق، يُسجل سبب الإلغاء في سجل مراحل الشحنة ويتم إعادة الطرد إلى عنوان الاستلام.',
    enabled: true,
    priority: 'high',
    tags: ['cancellation', 'refund', 'wallet', 'policy'],
    lastUpdated: new Date().toISOString(),
    author: 'Customer Care'
  },
  {
    id: 'faq-basket-live-tracking',
    title: 'Orders Basket & Live Shipment Tracker',
    titleAr: 'سلة الطلبات ونظام التتبع المباشر من الهيدر',
    category: 'faq',
    content: 'Users can always check their active and past orders from the Orders Basket Dropdown in the header without logging into the full portal. Clicking any order displays the Live Shipment Tracker modal with courier ETA, route origins, and real-time status milestones.',
    contentAr: 'يمكن للعملاء متابعة طلباتهم في أي وقت عبر سلة الطلبات الموجودة في شريط التنقل العلوي دون الحاجة للدخول إلى البوابة. وبالضغط على أي طلب تفتح نافذة التتبع المباشر مع الوقت التقديري ومسار الشحنة.',
    enabled: true,
    priority: 'standard',
    tags: ['tracking', 'basket', 'header', 'status'],
    lastUpdated: new Date().toISOString(),
    author: 'Product Team'
  },
  {
    id: 'paragraph-about-usend-smart-mesh',
    title: 'About USend Logistics Mesh & AI Gateway',
    titleAr: 'نبذة عن شبكة يو سند اللوجستية الذكية',
    category: 'paragraph',
    content: 'USend is an enterprise multi-carrier logistics and AI dispatch gateway designed specifically for UAE e-commerce and merchants. It dynamically aggregates Noon RoD, Aramex, and internal fleets to optimize delivery speed, lowest shipping rates, and maximum COD fulfillment reliability.',
    contentAr: 'يو سند هي منصة وبوابة لوجستية متطورة مصممة للتجارة الإلكترونية والتجار في الإمارات، تربط بين أساطيل نون وأرامكس والأسطول الداخلي بذكاء اصطناعي لتحقيق أسرع توصيل وأقل تكلفة شحن وأعلى موثوقية في تحصيل الدفع عند الاستلام.',
    enabled: true,
    priority: 'standard',
    tags: ['about', 'overview', 'mesh', 'ai'],
    lastUpdated: new Date().toISOString(),
    author: 'Executive Team'
  },
  {
    id: 'rule-anti-hallucination-pricing',
    title: 'Standard Pricing & No Exaggeration Rule',
    titleAr: 'قاعدة التسعير وعدم التخمين أو المبالغة',
    category: 'rule',
    content: 'The assistant must only provide verified delivery rates (Standard intra-city from 15-25 AED, express from 30 AED, same-day delivery from 35 AED) and must never guess nonexistent order numbers or give false promises.',
    contentAr: 'يجب على المساعد الذكي الالتزام بالأسعار المعتمدة فقط (التوصيل القياسي داخل المدينة من 15 إلى 25 درهم، السريع من 30 درهم، وفي نفس اليوم من 35 درهم) وعدم اختلاق أرقام شحنات أو وعود غير معتمدة.',
    enabled: true,
    priority: 'high',
    tags: ['pricing', 'accuracy', 'rules'],
    lastUpdated: new Date().toISOString(),
    author: 'AI Governance'
  }
];

const LOCAL_STORAGE_KEY = 'usend_ai_knowledge_base';

/**
 * Loads knowledge items from localStorage cache or defaults.
 */
export function getLocalKnowledgeBase(): KnowledgeItem[] {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to parse cached knowledge base:', err);
  }
  return DEFAULT_KNOWLEDGE_POOL;
}

/**
 * Saves knowledge base to localStorage cache.
 */
export function setLocalKnowledgeBase(items: KnowledgeItem[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    console.warn('Failed to write to local knowledge base cache:', err);
  }
}

/**
 * Subscribes to real-time Knowledge Base updates from Firestore,
 * falling back gracefully to local storage if offline or unauthenticated.
 */
export function subscribeToKnowledgeBase(
  callback: (items: KnowledgeItem[]) => void
): () => void {
  const localItems = getLocalKnowledgeBase();
  callback(localItems);

  try {
    const colRef = collection(db, 'ai_knowledge_base');
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const items: KnowledgeItem[] = [];
          snapshot.forEach((docSnap) => {
            items.push({ ...(docSnap.data() as KnowledgeItem), id: docSnap.id });
          });
          setLocalKnowledgeBase(items);
          callback(items);
        } else {
          // If Firestore collection is empty, seed with defaults
          callback(localItems);
        }
      },
      (error) => {
        console.warn('Knowledge Base Firestore sync notice:', error.message);
        callback(getLocalKnowledgeBase());
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn('Firestore subscription failed, maintaining local knowledge state:', err);
    return () => {};
  }
}

/**
 * Saves or updates a knowledge item in Firestore and local cache.
 */
export async function saveKnowledgeItem(item: KnowledgeItem): Promise<void> {
  const current = getLocalKnowledgeBase();
  const index = current.findIndex(i => i.id === item.id);
  const updatedItem: KnowledgeItem = {
    ...item,
    lastUpdated: new Date().toISOString()
  };

  let updatedList: KnowledgeItem[];
  if (index >= 0) {
    updatedList = [...current];
    updatedList[index] = updatedItem;
  } else {
    updatedList = [updatedItem, ...current];
  }

  setLocalKnowledgeBase(updatedList);

  try {
    const docRef = doc(db, 'ai_knowledge_base', item.id);
    await setDoc(docRef, updatedItem, { merge: true });
  } catch (err) {
    console.warn('Firestore write skipped for knowledge item, saved locally:', err);
  }
}

/**
 * Deletes a knowledge item from Firestore and local cache.
 */
export async function deleteKnowledgeItem(id: string): Promise<void> {
  const current = getLocalKnowledgeBase();
  const updatedList = current.filter(i => i.id !== id);
  setLocalKnowledgeBase(updatedList);

  try {
    const docRef = doc(db, 'ai_knowledge_base', id);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('Firestore delete skipped for knowledge item, deleted locally:', err);
  }
}

/**
 * Toggles the enabled state of a knowledge item.
 */
export async function toggleKnowledgeItem(id: string, enabled: boolean): Promise<void> {
  const current = getLocalKnowledgeBase();
  const item = current.find(i => i.id === id);
  if (item) {
    await saveKnowledgeItem({ ...item, enabled });
  }
}

/**
 * Resets the entire knowledge base pool to the verified defaults.
 */
export async function resetKnowledgeBaseToDefaults(): Promise<KnowledgeItem[]> {
  setLocalKnowledgeBase(DEFAULT_KNOWLEDGE_POOL);
  try {
    for (const item of DEFAULT_KNOWLEDGE_POOL) {
      const docRef = doc(db, 'ai_knowledge_base', item.id);
      await setDoc(docRef, item, { merge: true });
    }
  } catch (err) {
    console.warn('Firestore reset skipped, reset locally:', err);
  }
  return DEFAULT_KNOWLEDGE_POOL;
}

/**
 * Compiles all enabled Knowledge Base items into a comprehensive, structured system prompt
 * for Google Gemini (aiModel) in USend.
 */
export function buildDynamicSystemInstruction(
  baseInstruction: string = "You are a smart, helpful human-like assistant for USend, an advanced logistics and multi-courier e-commerce shipping gateway in the UAE.",
  items?: KnowledgeItem[]
): string {
  const knowledge = items || getLocalKnowledgeBase();
  const activeItems = knowledge.filter(k => k.enabled);

  const rules = activeItems.filter(k => k.category === 'rule');
  const faqs = activeItems.filter(k => k.category === 'faq');
  const policies = activeItems.filter(k => k.category === 'policy');
  const carriers = activeItems.filter(k => k.category === 'carrier');
  const paragraphs = activeItems.filter(k => k.category === 'paragraph' || k.category === 'pricing' || k.category === 'custom');

  let prompt = `${baseInstruction}

=== VERIFIED USEND KNOWLEDGE BASE POOL ===
You must strictly follow and utilize the verified facts, operational rules, FAQs, and policies provided below:

`;

  if (rules.length > 0) {
    prompt += `## CORE OPERATIONAL RULES:\n`;
    rules.forEach((r, idx) => {
      prompt += `${idx + 1}. [${r.title}]: ${r.content} (Arabic note: ${r.contentAr || ''})\n`;
    });
    prompt += `\n`;
  }

  if (faqs.length > 0) {
    prompt += `## FREQUENTLY ASKED QUESTIONS & ANSWERS:\n`;
    faqs.forEach((f, idx) => {
      prompt += `Q${idx + 1}: ${f.title} (${f.titleAr || ''})\nA${idx + 1}: ${f.content} (${f.contentAr || ''})\n`;
    });
    prompt += `\n`;
  }

  if (policies.length > 0) {
    prompt += `## POLICIES & REGULATIONS:\n`;
    policies.forEach((p, idx) => {
      prompt += `- [${p.title}]: ${p.content} (${p.contentAr || ''})\n`;
    });
    prompt += `\n`;
  }

  if (carriers.length > 0) {
    prompt += `## CARRIER INTEGRATIONS (Noon, Aramex, USend Fleet):\n`;
    carriers.forEach((c, idx) => {
      prompt += `- [${c.title}]: ${c.content} (${c.contentAr || ''})\n`;
    });
    prompt += `\n`;
  }

  if (paragraphs.length > 0) {
    prompt += `## COMPANY & SERVICE KNOWLEDGE:\n`;
    paragraphs.forEach((p, idx) => {
      prompt += `- [${p.title}]: ${p.content} (${p.contentAr || ''})\n`;
    });
    prompt += `\n`;
  }

  prompt += `
=== COMMUNICATION GUIDELINES ===
- If the user writes in Arabic, respond in fluent, professional, and friendly Arabic.
- If the user writes in English, respond in fluent, professional, and friendly English.
- Always be concise, helpful, and transparent.
- If a question pertains to a specific policy or courier workflow above, explain it accurately based on the Knowledge Base.
- Never invent nonexistent tracking IDs, rates, or features not stated in this Knowledge Base.`;

  return prompt;
}
