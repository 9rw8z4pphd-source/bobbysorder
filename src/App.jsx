import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set } from "firebase/database";
import {
  ShoppingCart,
  History,
  Settings,
  Wine,
  Lock,
  Plus,
  Edit3,
  Trash2,
  Save,
  X,
  Loader2,
  CheckCircle2,
  Circle,
  LogOut,
  Bell,
  Calendar
} from 'lucide-react';

// === FIREBASE CONFIG ===
const firebaseConfig = {
  apiKey: "AIzaSyDL7h0nWWE4YV_IMXO7_gupvf1QUZamHGU",
  authDomain: "bobbys-cafe.firebaseapp.com",
  databaseURL: "https://bobbys-cafe-default-rtdb.firebaseio.com",
  projectId: "bobbys-cafe",
  storageBucket: "bobbys-cafe.firebasestorage.app",
  messagingSenderId: "605393276080",
  appId: "1:605393276080:web:e62049aadf7940b5b23f75"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const colors = {
  primary: '#8E3A3A',    // Warm Terracotta
  secondary: '#F9F4F0',  // Soft Parchment
  accent: '#D4AF37',     // Soft Gold
  background: '#F4EBE2', // Warm Sand
  textDark: '#432C2C',   // Deep Cocoa
  success: '#5B8C5A',    // Sage Green
};

const ADMIN_PIN = "8923";

const CafeOrderingApp = () => {
  const [view, setView] = useState('orders');
  const [suppliers, setSuppliers] = useState([]);
  const [orderHistory, setOrderHistory] = useState({});
  const [orderQuantities, setOrderQuantities] = useState({});
  const [loading, setLoading] = useState(true);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState("");

  useEffect(() => {
    const dataRef = ref(db, 'cafe_data');
    return onValue(dataRef, (snapshot) => {
      const data = snapshot.val() || {};
      setSuppliers(data.suppliers || []);
      setOrderHistory(data.history || {});
      setOrderQuantities(data.quantities || {});
      setLoading(false);
    });
  }, []);

  const saveToFirebase = (path, data) => set(ref(db, `cafe_data/${path}`), data);

  if (loading) return (
    <div className="h-screen flex items-center justify-center" style={{ backgroundColor: colors.background }}>
      <Loader2 className="w-10 h-10 animate-spin" style={{ color: colors.primary }} />
    </div>
  );

  return (
    <div className="min-h-screen pb-28" style={{ backgroundColor: colors.background, color: colors.textDark }}>
      
      {/* POPPED HEADER */}
      <header className="sticky top-0 z-50 p-4">
        <div className="max-w-4xl mx-auto rounded-3xl shadow-2xl p-5 flex items-center justify-between border-b-4" 
             style={{ backgroundColor: colors.primary, borderColor: colors.accent }}>
          <div className="flex flex-col">
            <span className="text-3xl font-serif tracking-widest text-white uppercase leading-none">BOBBY'S</span>
            <span className="text-[10px] font-bold tracking-[0.4em] text-white/60 mt-1 uppercase">Management</span>
          </div>
          <div className="bg-white/10 p-2 rounded-full">
            <Wine className="w-6 h-6 text-white" />
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4">
        {view === 'orders' && <OrdersView suppliers={suppliers} history={orderHistory} quantities={orderQuantities} onSave={saveToFirebase} />}
        {view === 'history' && <HistoryView suppliers={suppliers} history={orderHistory} quantities={orderQuantities} />}
        {view === 'admin' && (
          !isAdminAuthenticated ? (
            <PinPad pinInput={pinInput} setPinInput={setPinInput} onAuth={() => setIsAdminAuthenticated(true)} />
          ) : (
            <div className="animate-in slide-in-from-bottom-4">
                <div className="flex justify-between items-center mb-6 px-2">
                    <h2 className="text-xl font-serif">Suppliers List</h2>
                    <button onClick={() => setIsAdminAuthenticated(false)} className="px-4 py-2 rounded-full bg-white text-xs font-bold text-red-500 shadow-sm">Logout</button>
                </div>
                <AdminView suppliers={suppliers} onSave={(newList) => saveToFirebase('suppliers', newList)} />
            </div>
          )
        )}
      </main>

      {/* FLOATING NAV */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-50">
        <div className="rounded-full shadow-2xl border-2 p-2 flex justify-around items-center backdrop-blur-md" 
             style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', borderColor: colors.accent }}>
          <NavButton icon={ShoppingCart} active={view === 'orders'} onClick={() => setView('orders')} />
          <NavButton icon={History} active={view === 'history'} onClick={() => setView('history')} />
          <NavButton icon={Settings} active={view === 'admin'} onClick={() => setView('admin')} />
        </div>
      </nav>
    </div>
  );
};

// --- SUB-COMPONENTS ---

const NavButton = ({ icon: Icon, active, onClick }) => (
  <button onClick={onClick} className={`p-4 rounded-full transition-all duration-500 ${active ? 'shadow-inner' : ''}`}
          style={{ backgroundColor: active ? colors.primary : 'transparent', color: active ? '#fff' : colors.primary }}>
    <Icon className="w-6 h-6" />
  </button>
);

const OrdersView = ({ suppliers, history, quantities, onSave }) => {
  const todayKey = `${new Date().getFullYear()}-${new Date().getMonth() + 1}-${new Date().getDate()}`;
  const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][new Date().getDay()];
  const todaysSuppliers = suppliers.filter(s => s.days?.includes(dayName));

  return (
    <div className="space-y-6">
      {todaysSuppliers.map(s => {
        const isCompleted = history[todayKey]?.[s.id];
        return (
          <div key={s.id} className="rounded-[40px] shadow-xl border-t-8 bg-white p-6 overflow-hidden transition-all" 
               style={{ borderColor: isCompleted ? colors.success : colors.primary }}>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-serif text-stone-800">{s.name}</h3>
                <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">Order for {dayName}</span>
              </div>
              <button onClick={() => {
                const newHistory = { ...history };
                if (!newHistory[todayKey]) newHistory[todayKey] = {};
                newHistory[todayKey][s.id] = !newHistory[todayKey][s.id];
                onSave('history', newHistory);
              }} className="p-3 rounded-full shadow-lg" style={{ backgroundColor: isCompleted ? colors.success : colors.background }}>
                <CheckCircle2 className={`w-6 h-6 ${isCompleted ? 'text-white' : 'text-stone-300'}`} />
              </button>
            </div>
            <div className="space-y-4">
              {s.items?.map(item => (
                <div key={item.id} className="flex items-center justify-between p-4 rounded-3xl bg-stone-50 border border-stone-100">
                  <span className="font-bold text-sm text-stone-600 uppercase">{item.name}</span>
                  <input type="number" placeholder="0" className="w-20 p-3 rounded-full border-none bg-white shadow-inner text-center font-bold text-lg outline-none focus:ring-2 focus:ring-amber-500"
                    value={quantities[todayKey]?.[s.id]?.[item.id] || ''} 
                    onChange={(e) => {
                      const newQ = { ...quantities };
                      if (!newQ[todayKey]) newQ[todayKey] = {};
                      if (!newQ[todayKey][s.id]) newQ[todayKey][s.id] = {};
                      newQ[todayKey][s.id][item.id] = e.target.value;
                      onSave('quantities', newQ);
                    }} 
                  />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const HistoryView = ({ suppliers, history, quantities }) => {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - i);
    return { key: `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`, label: d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }) };
  });

  return (
    <div className="space-y-6">
      <div className="rounded-[30px] bg-white p-6 shadow-xl">
        <h2 className="text-center font-serif text-lg mb-4">Weekly Compliance</h2>
        <div className="flex justify-between">
          {days.reverse().map(d => {
            const completedCount = Object.values(history[d.key] || {}).filter(v => v).length;
            return (
              <div key={d.key} className="flex flex-col items-center gap-2">
                <div className="w-8 h-20 bg-stone-100 rounded-full relative overflow-hidden">
                  <div className="absolute bottom-0 w-full rounded-full transition-all duration-1000" 
                       style={{ height: `${completedCount * 33}%`, backgroundColor: colors.primary }}></div>
                </div>
                <span className="text-[10px] font-bold text-stone-400">{d.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-serif text-xl px-2">Recent Order Logs</h3>
        {days.reverse().map(d => {
            const dayData = quantities[d.key];
            if (!dayData) return null;
            return (
                <div key={d.key} className="p-5 rounded-3xl bg-white/50 border border-stone-200">
                    <div className="flex items-center gap-2 mb-3">
                        <Calendar className="w-4 h-4 text-stone-400" />
                        <span className="font-bold text-xs uppercase">{d.label}</span>
                    </div>
                    {Object.entries(dayData).map(([sId, items]) => {
                        const sName = suppliers.find(s => s.id === sId)?.name || 'Supplier';
                        return (
                            <div key={sId} className="mb-2">
                                <p className="text-[10px] font-black text-amber-600 uppercase mb-1">{sName}</p>
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(items).map(([itemId, qty]) => {
                                        const itemName = suppliers.find(s => s.id === sId)?.items.find(i => i.id.toString() === itemId)?.name || 'Item';
                                        return <span key={itemId} className="px-3 py-1 bg-white rounded-full text-[10px] font-bold shadow-sm">{itemName}: {qty}</span>
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            );
        })}
      </div>
    </div>
  );
};

const PinPad = ({ pinInput, setPinInput, onAuth }) => {
  const handleDigit = (d) => {
    const next = pinInput + d;
    if (next.length <= 4) {
      setPinInput(next);
      if (next === ADMIN_PIN) { onAuth(); setPinInput(""); }
    }
  };
  return (
    <div className="flex flex-col items-center py-10">
      <div className="flex gap-4 mb-12">
        {[...Array(4)].map((_, i) => (
          <div key={i} className={`w-5 h-5 rounded-full border-2 transition-all ${pinInput.length > i ? 'bg-amber-600 border-amber-600 scale-125' : 'border-stone-300'}`} />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, "C", 0, "⌫"].map(btn => (
          <button key={btn} onClick={() => {
            if (btn === "C") setPinInput("");
            else if (btn === "⌫") setPinInput(pinInput.slice(0, -1));
            else handleDigit(btn);
          }} className="w-20 h-20 rounded-full bg-white shadow-xl text-2xl font-bold active:scale-90 transition-transform">{btn}</button>
        ))}
      </div>
    </div>
  );
};

const AdminView = ({ suppliers, onSave }) => {
    const [mode, setMode] = useState('list');
    const [formData, setFormData] = useState(null);
  
    const startEdit = (supplier) => {
      setFormData(supplier ? { ...supplier } : { id: Date.now().toString(), name: '', days: [], items: [] });
      setMode('form');
    };
  
    if (mode === 'form') return <SupplierForm initialData={formData} onSave={(data) => {
      const newList = !suppliers.find(s => s.id === data.id) ? [...suppliers, data] : suppliers.map(s => s.id === data.id ? data : s);
      onSave(newList); setMode('list');
    }} onCancel={() => setMode('list')} />;
  
    return (
      <div className="space-y-4">
        {suppliers.map(s => (
          <div key={s.id} className="p-6 rounded-[30px] bg-white flex justify-between items-center shadow-lg border border-stone-100">
            <span className="font-serif text-lg">{s.name}</span>
            <div className="flex gap-2">
              <button onClick={() => startEdit(s)} className="p-3 bg-stone-50 rounded-full text-stone-400"><Edit3 className="w-5 h-5" /></button>
              <button onClick={() => window.confirm("Delete?") && onSave(suppliers.filter(x => x.id !== s.id))} className="p-3 bg-stone-50 rounded-full text-red-300"><Trash2 className="w-5 h-5" /></button>
            </div>
          </div>
        ))}
        <button onClick={() => startEdit(null)} className="w-full p-6 rounded-[30px] border-4 border-dashed border-stone-200 text-stone-300 flex justify-center hover:bg-white transition-all"><Plus className="w-8 h-8" /></button>
      </div>
    );
};

const SupplierForm = ({ initialData, onSave, onCancel }) => {
    const [data, setData] = useState(initialData);
    const addItem = () => setData({ ...data, items: [...(data.items || []), { id: Date.now(), name: '', par: '' }] });
  
    return (
      <div className="bg-white rounded-[40px] shadow-2xl p-8 animate-in slide-in-from-bottom-12">
        <div className="flex justify-between items-center mb-8">
          <h3 className="font-serif text-2xl">Supplier Profile</h3>
          <X onClick={onCancel} className="w-6 h-6 text-stone-300 cursor-pointer" />
        </div>
        <input className="w-full p-5 rounded-3xl bg-stone-50 text-xl mb-6 outline-none focus:ring-2 focus:ring-amber-500" placeholder="Name" value={data.name} onChange={e => setData({...data, name: e.target.value})} />
        <div className="flex flex-wrap gap-2 mb-8">
          {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
            <button key={day} onClick={() => {
              const days = data.days?.includes(day) ? data.days.filter(d => d !== day) : [...(data.days || []), day];
              setData({...data, days});
            }} className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${data.days?.includes(day) ? 'bg-stone-800 text-white border-stone-800' : 'bg-white text-stone-300 border-stone-200'}`}>{day.slice(0,3)}</button>
          ))}
        </div>
        <div className="space-y-3 mb-8">
          {data.items?.map((item, i) => (
            <div key={i} className="flex gap-2">
              <input className="flex-1 p-4 rounded-2xl bg-stone-50 text-xs font-bold outline-none" placeholder="Item" value={item.name} onChange={e => {
                const items = [...data.items]; items[i].name = e.target.value; setData({...data, items});
              }} />
              <input className="w-20 p-4 rounded-2xl bg-stone-50 text-xs text-center font-bold outline-none" placeholder="Par" value={item.par} onChange={e => {
                const items = [...data.items]; items[i].par = e.target.value; setData({...data, items});
              }} />
            </div>
          ))}
          <button onClick={addItem} className="text-xs font-black uppercase tracking-widest text-amber-600">+ Add Product</button>
        </div>
        <button onClick={() => onSave(data)} className="w-full py-5 bg-stone-900 text-white rounded-full font-black uppercase tracking-widest shadow-2xl active:scale-95">Save Supplier</button>
      </div>
    );
};

export default CafeOrderingApp;
