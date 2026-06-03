import { motion } from 'motion/react';
import { Screen } from '../../types';
import MerchantSidebar from '../../components/MerchantSidebar';
import { 
  Boxes, 
  Plus, 
  Search, 
  AlertTriangle, 
  Edit2, 
  Trash2, 
  Sparkles, 
  Upload, 
  Loader2, 
  RefreshCw, 
  CheckCircle2, 
  ArrowRight,
  ClipboardList
} from 'lucide-react';
import { useState, useRef } from 'react';
import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useApp } from '../../context/AppContext';
import { GoogleGenAI, Type } from "@google/genai";

interface MerchantInventoryProps {
  key?: string;
  onNavigate: (screen: Screen) => void;
}

export default function MerchantInventory({ onNavigate }: MerchantInventoryProps) {
  const { t, isRTL } = useLanguage();
  const { merchantActiveTab, setMerchantActiveTab } = useApp();

  const [inventory, setInventory] = useState([
    { id: 'PRD-001', name: 'Wireless AirPods Pro', description: 'Premium wireless earbuds with active noise cancellation and spatial audio.', category: 'Electronics', price: 'AED 249.00', costPrice: 'AED 150.00', weight: '0.2 kg', stock: 45, status: 'In Stock', image: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=400&q=80' },
    { id: 'PRD-002', name: 'Ergonomic Office Chair', description: 'Lumbar support office chair with adjustable armrests and mesh back.', category: 'Furniture', price: 'AED 199.99', costPrice: 'AED 80.00', weight: '15 kg', stock: 5, status: 'Low Stock', image: 'https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?w=400&q=80' },
    { id: 'PRD-003', name: 'Mechanical Keyboard', description: 'RGB mechanical keyboard with tactile blue switches.', category: 'Electronics', price: 'AED 129.50', costPrice: 'AED 60.00', weight: '1.2 kg', stock: 0, status: 'Out of Stock', image: 'https://images.unsplash.com/photo-1595225476474-87563907a212?w=400&q=80' },
    { id: 'PRD-004', name: 'Stainless Steel Water Bottle', description: 'Insulated water bottle that keeps drinks cold for 24 hours.', category: 'Accessories', price: 'AED 24.00', costPrice: 'AED 8.00', weight: '0.4 kg', stock: 120, status: 'In Stock', image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400&q=80' },
  ]);

  const [replenishData, setReplenishData] = useState({
    productId: 'PRD-002',
    qty: '50',
    warehouse: 'Jebel Ali Zone A'
  });

  const [replenishLogs, setReplenishLogs] = useState([
    { id: 'TRF-901', date: 'Today, 09:12 AM', product: 'Wireless AirPods Pro', qty: 100, status: 'In Transit', target: 'Jebel Ali Zone A' },
    { id: 'TRF-882', date: 'Yesterday', product: 'Stainless Steel Water Bottle', qty: 250, status: 'Completed', target: 'Warehouse Terminal 3' }
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', category: 'Electronics', price: '', costPrice: '', weight: '', stock: '', description: '', image: '' });
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewProduct(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAutofillWithAI = async () => {
    if (!newProduct.image && !newProduct.name) return;
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const contents: any[] = [];
      
      let promptText = "Analyze this product and provide realistic inventory details. ";
      
      if (newProduct.image.startsWith('data:image')) {
        const mimeType = newProduct.image.substring(newProduct.image.indexOf(':') + 1, newProduct.image.indexOf(';'));
        const data = newProduct.image.substring(newProduct.image.indexOf(',') + 1);
        contents.push({
          inlineData: { mimeType, data }
        });
        promptText += "Use the provided image to determine the product details. ";
      } else if (newProduct.image) {
        promptText += `The product image is at this URL: ${newProduct.image}. `;
      }

      if (newProduct.name) {
        promptText += `The name or partial name of the product is "${newProduct.name}". `;
      } else {
        promptText += `Determine a catchy and accurate product name based on the image. `;
      }
      
      contents.push({ text: promptText });
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: { parts: contents },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "A catchy product name" },
              description: { type: Type.STRING, description: "A detailed product description" },
              category: { type: Type.STRING, description: "One of: Electronics, Furniture, Accessories, Clothing, Food" },
              price: { type: Type.STRING, description: "Retail price (numbers only), e.g. 19.99" },
              costPrice: { type: Type.STRING, description: "Estimated wholesale cost (numbers only), e.g. 8.50" },
              weight: { type: Type.STRING, description: "Estimated weight, e.g. 1.2 kg" }
            },
            required: ["name", "description", "category", "price", "costPrice", "weight"]
          }
        }
      });

      if (response.text) {
        const result = JSON.parse(response.text);
        setNewProduct(prev => ({
          ...prev,
          name: result.name || prev.name,
          description: result.description || prev.description,
          category: result.category || prev.category,
          price: result.price ? result.price.replace(/[^0-9.]/g, '') : prev.price,
          costPrice: result.costPrice ? result.costPrice.replace(/[^0-9.]/g, '') : prev.costPrice,
          weight: result.weight || prev.weight,
          image: prev.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(result.name || 'Product')}&background=random`
        }));
      }
    } catch (error) {
      console.error("AI Generation error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddProduct = () => {
    if (!newProduct.name || !newProduct.price) return;
    
    const stockNum = parseInt(newProduct.stock) || 0;
    const isNewLowStock = stockNum > 0 && stockNum <= 10;
    const isNewOutOfStock = stockNum === 0;
    const status = isNewOutOfStock ? 'Out of Stock' : (isNewLowStock ? 'Low Stock' : 'In Stock');

    const product = {
      id: `PRD-00${inventory.length + 1}`,
      name: newProduct.name,
      description: newProduct.description,
      category: newProduct.category,
      price: newProduct.price.startsWith('AED') ? newProduct.price : `AED ${newProduct.price}`,
      costPrice: newProduct.costPrice.startsWith('AED') || !newProduct.costPrice ? newProduct.costPrice : `AED ${newProduct.costPrice}`,
      weight: newProduct.weight || '0 kg',
      stock: stockNum,
      status,
      image: newProduct.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(newProduct.name)}&background=random`
    };

    setInventory([product, ...inventory]);
    setShowAddModal(false);
    setNewProduct({ name: '', category: 'Electronics', price: '', costPrice: '', weight: '', stock: '', description: '', image: '' });
  };

  const deleteProduct = (id: string) => {
    setInventory(inventory.filter(i => i.id !== id));
  };

  const handleReplenishStock = (e: React.FormEvent) => {
    e.preventDefault();
    const targetProduct = inventory.find(i => i.id === replenishData.productId);
    if (!targetProduct) return;

    // Create a new replenishment order
    const logId = `TRF-${Math.floor(100 + Math.random() * 900).toString()}`;
    const qtyNum = parseInt(replenishData.qty) || 50;

    setReplenishLogs([{
      id: logId,
      date: 'Just Now',
      product: targetProduct.name,
      qty: qtyNum,
      status: 'In Transit',
      target: replenishData.warehouse
    }, ...replenishLogs]);

    // Update product stock instantly in simulation
    setInventory(inventory.map(item => {
      if (item.id === replenishData.productId) {
        const newStock = item.stock + qtyNum;
        return {
          ...item,
          stock: newStock,
          status: newStock > 10 ? 'In Stock' : (newStock > 0 ? 'Low Stock' : 'Out of Stock')
        };
      }
      return item;
    }));
  };

  const isManageStockMode = merchantActiveTab === 'manage_stock';

  return (
    <div className={`flex flex-col md:flex-row h-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950 w-full ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <MerchantSidebar currentScreen="merchant_inventory" onNavigate={onNavigate} />
      
      <main className="flex-1 p-6 lg:p-10 h-full overflow-y-auto">
        <motion.div
          key={merchantActiveTab}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto space-y-8"
        >
          {/* Main Title Headers */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
            <div>
              <span className="text-blue-600 font-bold text-[12px] uppercase tracking-[0.4em] block">
                {isManageStockMode ? 'Replenishment & Warehousing' : 'Internal SKU Register'}
              </span>
              <h1 className="text-3xl font-display font-medium text-zinc-900 uppercase tracking-tight mt-1">
                {isManageStockMode ? 'Manage Stock Levels' : 'Your Inventory'}
              </h1>
              <p className="text-sm text-zinc-500 mt-1">
                {isManageStockMode 
                  ? 'Initiate express stock Transfers between Dubai freezone warehouse units & clear out of stock states.'
                  : 'Maintain catalog details, weight dimensions and commercial prices synchronized.'}
              </p>
            </div>

            <div className="flex gap-2 self-start sm:self-center">
              <button 
                onClick={() => setMerchantActiveTab('your_inventory')}
                className={`px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
                  !isManageStockMode 
                     ? 'bg-white text-zinc-950 shadow-sm' 
                     : 'text-zinc-500 hover:text-zinc-900'
                }`}
              >
                Your Inventory
              </button>
              <button 
                onClick={() => setMerchantActiveTab('manage_stock')}
                className={`px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
                  isManageStockMode 
                     ? 'bg-white text-zinc-950 shadow-sm' 
                     : 'text-zinc-500 hover:text-zinc-900'
                }`}
              >
                Manage Stock
              </button>
              <button 
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition-all"
              >
                Add Product
              </button>
            </div>
          </div>

          {!isManageStockMode ? (
            /* TAB 1: YOUR INVENTORY TABLE */
            <div className="space-y-6">
              {/* Quick statistics widgets */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
                    <span className="text-[12px] font-bold text-zinc-400 uppercase tracking-wider">Total SKU Catalog</span>
                    <div className="text-3xl font-black text-zinc-900 mt-1">{inventory.length}</div>
                 </div>
                 <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
                    <span className="text-[12px] font-bold text-orange-500 uppercase tracking-wider">Critical Low Stock</span>
                    <div className="text-3xl font-black text-orange-600 mt-1">{inventory.filter(i => i.status === 'Low Stock').length}</div>
                 </div>
                 <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
                    <span className="text-[12px] font-bold text-red-500 uppercase tracking-wider">Out of Stock SKU</span>
                    <div className="text-3xl font-black text-red-600 mt-1">{inventory.filter(i => i.status === 'Out of Stock').length}</div>
                 </div>
              </div>

              {/* Data Table Container */}
              <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-zinc-50 text-zinc-400 text-[12px] font-black uppercase tracking-widest border-b border-zinc-100">
                        <th className="p-4 pl-6">Product Item</th>
                        <th className="p-4">SKU Code</th>
                        <th className="p-4">Direct retail price</th>
                        <th className="p-4">Storage weight</th>
                        <th className="p-4">Quant on hand</th>
                        <th className="p-4 text-center">Delete</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 font-medium">
                      {inventory.map((item) => (
                        <tr key={item.id} className="hover:bg-zinc-50/20 transition-colors group">
                          <td className="p-4 pl-6">
                            <div className="flex items-center gap-4">
                              <img src={item.image} alt="PRD" className="w-12 h-12 rounded-xl object-cover border border-zinc-200 bg-zinc-50 shrink-0" />
                              <div>
                                <h3 className="font-bold text-sm text-zinc-900 leading-tight">{item.name}</h3>
                                <span className="text-[12px] uppercase font-black tracking-widest text-[#4f95cc] mt-1 block">{item.category}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 font-mono text-xs text-zinc-500">{item.id}</td>
                          <td className="p-4 text-sm font-bold text-zinc-900">{item.price}</td>
                          <td className="p-4 text-xs text-zinc-500">{item.weight}</td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                               <span className="font-bold text-sm text-zinc-900">{item.stock}</span>
                               <span className={`px-2.5 py-1 rounded-full text-[13px] font-black uppercase tracking-widest ${
                                  item.status === 'In Stock' ? 'bg-blue-50 text-blue-600' :
                                  item.status === 'Low Stock' ? 'bg-orange-50 text-orange-600' :
                                  'bg-red-50 text-red-650'
                               }`}>
                                  {item.status}
                               </span>
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <button 
                              onClick={() => deleteProduct(item.id)}
                              className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            /* TAB 2: MANAGE STOCK LEVELS & STOCK REPLENISHMENTS */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
              <div className="lg:col-span-2 space-y-6">
                {/* Low Stock Alerts Highlight */}
                <div className="bg-orange-50/40 rounded-[2.5rem] p-8 border border-orange-200/50 space-y-4">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-orange-500 animate-bounce" />
                    <h2 className="font-bold text-base text-orange-950">Immediate replenishment triggers ({inventory.filter(i=>i.stock <= 10).length})</h2>
                  </div>
                  <p className="text-xs text-orange-700">The following SKU codes have depleted below critical threshhold levels. Initiate instant in-transits to avoid channel delays.</p>
                  
                  <div className="space-y-2 pt-2">
                    {inventory.filter(i => i.stock <= 10).map((depleted) => (
                      <div key={depleted.id} className="bg-white p-4 rounded-2xl flex items-center justify-between border border-orange-100">
                        <div className="flex items-center gap-3">
                          <img src={depleted.image} className="w-9 h-9 rounded-lg object-cover" />
                          <div>
                            <span className="font-black text-xs text-zinc-805 block">{depleted.name}</span>
                            <span className="text-[12px] text-zinc-400">Current Qty: <b>{depleted.stock} available</b></span>
                          </div>
                        </div>
                        <button
                          onClick={() => setReplenishData({...replenishData, productId: depleted.id})}
                          className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-[12px] uppercase tracking-wider px-3 py-2 rounded-lg"
                        >
                          Select Replenish
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Transfer Logs list */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-200/80 shadow-sm space-y-5">
                  <span className="text-xs tracking-widest uppercase font-black text-zinc-400 block">Warehousing Transfer Logs</span>
                  <div className="space-y-2">
                    {replenishLogs.map((log) => (
                      <div key={log.id} className="p-4 border border-zinc-100 rounded-2xl flex items-center justify-between bg-zinc-50/40 hover:bg-zinc-50">
                        <div>
                          <span className="font-bold text-xs text-zinc-800 block">{log.product}</span>
                          <span className="text-[12px] text-zinc-400 mt-0.5 block">{log.date} • Transfer lock: <b>{log.qty} Units</b> to {log.target}</span>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-[13px] font-black uppercase tracking-widest ${
                          log.status === 'Completed' ? 'bg-blue-50 text-blue-600' : 'bg-blue-50 text-blue-600 animate-pulse'
                        }`}>
                          {log.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Replenishment formulation panel */}
              <div className="space-y-6">
                <form onSubmit={handleReplenishStock} className="bg-white rounded-[2.5rem] p-8 border border-zinc-200 shadow-md space-y-6">
                  <div className="flex items-center gap-3">
                    <RefreshCw className="w-5 h-5 text-blue-600" />
                    <h2 className="font-bold text-base text-zinc-900">Initiate Replenish</h2>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[12px] font-black uppercase tracking-wider text-zinc-500">Pick Target Product</label>
                    <select
                      value={replenishData.productId}
                      onChange={(e) => setReplenishData({...replenishData, productId: e.target.value})}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 outline-none text-zinc-900 font-bold"
                    >
                      {inventory.map(i => (
                        <option key={i.id} value={i.id}>{i.name} ({i.id})</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[12px] font-black uppercase tracking-wider text-zinc-500">Quantity to Transfer</label>
                    <input 
                      type="number" 
                      value={replenishData.qty}
                      onChange={(e) => setReplenishData({...replenishData, qty: e.target.value})}
                      placeholder="50"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm text-zinc-900 font-bold font-mono"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[12px] font-black uppercase tracking-wider text-zinc-500">Target Freezone Unit</label>
                    <select
                      value={replenishData.warehouse}
                      onChange={(e) => setReplenishData({...replenishData, warehouse: e.target.value})}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 outline-none text-zinc-900 font-bold"
                    >
                      <option value="Jebel Ali Zone A">Jebel Ali South Terminal (Zone A)</option>
                      <option value="Dubai Airport Freezone">Dafza Air Logistics Depot</option>
                      <option value="Sharjah Ports freezone">Sharjah Saifiz Depot Center</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 bg-[#4f95cc] hover:bg-[#3f87bd] text-white rounded-xl font-bold font-display uppercase text-xs tracking-widest shadow-md"
                  >
                    Confirm Stock Transfer
                  </button>
                </form>
              </div>
            </div>
          )}
        </motion.div>
      </main>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className={`relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden ${isRTL ? 'text-right' : 'text-left'} flex flex-col max-h-[85vh]`}
          >
            <div className="p-6 md:p-8 flex-1 overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">{t('add_product') || 'Add New Product'}</h2>
                <button
                  onClick={handleAutofillWithAI}
                  disabled={isGenerating || (!newProduct.image && !newProduct.name)}
                  className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-4 py-2 rounded-xl font-bold transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-purple-500/20 text-sm"
                >
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {isGenerating ? 'Analyzing...' : 'AI Auto-Fill'}
                </button>
              </div>
              
              <div className="space-y-5">
                 <div className="flex flex-col md:flex-row gap-5">
                    <div className="flex-1">
                       <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2 block">Product Name</label>
                       <input 
                         type="text" 
                         value={newProduct.name}
                         onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                         className="w-full bg-zinc-50 dark:bg-zinc-800 border-2 border-transparent focus:border-blue-500 rounded-xl px-4 py-3 outline-none text-zinc-900 dark:text-zinc-100 transition-colors"
                       />
                    </div>
                    
                    <div className="w-full md:w-1/3">
                       <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2 block">Category</label>
                       <select 
                         value={newProduct.category}
                         onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                         className="w-full bg-zinc-50 dark:bg-zinc-800 border-2 border-transparent focus:border-blue-500 rounded-xl px-4 py-3 outline-none text-zinc-900 dark:text-zinc-100 transition-colors appearance-none"
                       >
                         <option value="Electronics">Electronics</option>
                         <option value="Furniture">Furniture</option>
                         <option value="Accessories">Accessories</option>
                         <option value="Clothing">Clothing</option>
                         <option value="Food">Food</option>
                       </select>
                    </div>
                 </div>

                 <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2 block">Description</label>
                    <textarea 
                      value={newProduct.description}
                      onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                      placeholder="Enter product description..."
                      rows={3}
                      className="w-full bg-zinc-50 dark:bg-zinc-805 border-2 border-transparent focus:border-blue-500 rounded-xl px-4 py-3 outline-none text-zinc-900 dark:text-zinc-100 transition-colors resize-none"
                    />
                 </div>

                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                       <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2 block">Price (AED)</label>
                       <input 
                         type="text" 
                         value={newProduct.price}
                         onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                         placeholder="0.00"
                         className="w-full bg-zinc-50 dark:bg-zinc-800 border-2 border-transparent focus:border-blue-500 rounded-xl px-4 py-3 outline-none text-zinc-900 dark:text-zinc-100 transition-colors font-mono"
                       />
                    </div>
                    <div>
                       <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2 block">Cost (AED)</label>
                       <input 
                         type="text" 
                         value={newProduct.costPrice}
                         onChange={(e) => setNewProduct({...newProduct, costPrice: e.target.value})}
                         placeholder="0.00"
                         className="w-full bg-zinc-50 dark:bg-zinc-800 border-2 border-transparent focus:border-blue-500 rounded-xl px-4 py-3 outline-none text-zinc-900 dark:text-zinc-100 transition-colors font-mono"
                       />
                    </div>
                    <div>
                       <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2 block">Weight</label>
                       <input 
                         type="text" 
                         value={newProduct.weight}
                         onChange={(e) => setNewProduct({...newProduct, weight: e.target.value})}
                         placeholder="e.g. 1.5 kg"
                         className="w-full bg-zinc-50 dark:bg-zinc-800 border-2 border-transparent focus:border-blue-500 rounded-xl px-4 py-3 outline-none text-zinc-900 dark:text-zinc-100 transition-colors"
                       />
                    </div>
                    <div>
                       <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2 block">Stock Qty</label>
                       <input 
                         type="number" 
                         value={newProduct.stock}
                         onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})}
                         placeholder="0"
                         className="w-full bg-zinc-50 dark:bg-zinc-800 border-2 border-transparent focus:border-blue-500 rounded-xl px-4 py-3 outline-none text-zinc-900 dark:text-zinc-100 transition-colors font-mono"
                       />
                    </div>
                 </div>

                 <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2 block">Product Image</label>
                    <div className="flex items-center gap-4">
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className={`w-24 h-24 rounded-2xl flex-shrink-0 flex flex-col justify-center items-center cursor-pointer overflow-hidden border-2 border-dashed ${newProduct.image ? 'border-transparent' : 'border-zinc-300 dark:border-zinc-700 hover:border-blue-500 dark:hover:border-blue-500'} bg-zinc-50 dark:bg-zinc-800 transition-colors`}
                      >
                        {newProduct.image ? (
                          <img src={newProduct.image} alt="Product" className="w-full h-full object-cover" />
                        ) : (
                          <>
                            <Upload className="w-6 h-6 text-zinc-400 mb-1" />
                            <span className="text-[12px] font-bold text-zinc-500">Upload</span>
                          </>
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                        <input 
                          type="text" 
                          value={newProduct.image.startsWith('data:image') ? '' : newProduct.image}
                          onChange={(e) => setNewProduct({...newProduct, image: e.target.value})}
                          placeholder="Or paste image URL..."
                          className="w-full bg-zinc-50 dark:bg-zinc-800 border-2 border-transparent focus:border-blue-500 rounded-xl px-4 py-3 outline-none text-zinc-900 dark:text-zinc-100 transition-colors"
                        />
                      </div>
                    </div>
                 </div>
              </div>

              <div className="mt-8 flex gap-3 pt-6 border-t border-zinc-200 dark:border-zinc-800">
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="flex-[1] py-4 font-bold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-2xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddProduct}
                  disabled={!newProduct.name || !newProduct.price}
                  className="flex-[2] py-4 bg-gradient-to-r from-blue-700 to-blue-500 hover:from-blue-600 hover:to-blue-400 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save Product
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
