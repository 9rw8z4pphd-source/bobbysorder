import { storage } from './firebase.js';
import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Package, Settings, CheckCircle, Circle, Plus, Trash2, Edit2, Save, X, Loader2 } from 'lucide-react';

const CafeOrderingApp = () => {
  const [view, setView] = useState('supervisor');
  const [suppliers, setSuppliers] = useState([]);
  const [orderHistory, setOrderHistory] = useState({});
  const [orderQuantities, setOrderQuantities] = useState({});
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);

  // 1. Unified Data Loader with better error handling
  const loadData = useCallback(async () => {
    try {
      const [suppliersRes, historyRes, quantitiesRes] = await Promise.all([
        storage.get('cafe-suppliers'),
        storage.get('cafe-order-history'),
        storage.get('cafe-order-quantities')
      ]);

      if (suppliersRes?.value) setSuppliers(JSON.parse(suppliersRes.value));
      if (historyRes?.value) setOrderHistory(JSON.parse(historyRes.value));
      if (quantitiesRes?.value) setOrderQuantities(JSON.parse(quantitiesRes.value));
      
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Sync Error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const refreshInterval = setInterval(loadData, 30000);
    return () => clearInterval(refreshInterval);
  }, [loadData]);

  // 2. Optimized Save Functions
  const saveSuppliers = async (newSuppliers) => {
    setSuppliers(newSuppliers); // Optimistic Update
    await storage.set('cafe-suppliers', JSON.stringify(newSuppliers));
  };

  const saveOrderHistory = async (newHistory) => {
    setOrderHistory(newHistory);
    await storage.set('cafe-order-history', JSON.stringify(newHistory));
  };

  const saveOrderQuantities = async (newQuantities) => {
    setOrderQuantities(newQuantities);
    await storage.set('cafe-order-quantities', JSON.stringify(newQuantities));
  };

  const getTodayKey = () => {
    const today = new Date();
    return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  };

  const getDayOfWeek = () => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[new Date().getDay()];
  };

  const toggleOrder = (supplierId) => {
    const todayKey = getTodayKey();
    const newHistory = { ...orderHistory };
    if (!newHistory[todayKey]) newHistory[todayKey] = {};
    newHistory[todayKey][supplierId] = !newHistory[todayKey][supplierId];
    saveOrderHistory(newHistory);
  };

  const updateQuantity = (supplierId, productId, quantity) => {
    const todayKey = getTodayKey();
    const newQuantities = { ...orderQuantities };
    if (!newQuantities[todayKey]) newQuantities[todayKey] = {};
    if (!newQuantities[todayKey][supplierId]) newQuantities[todayKey][supplierId] = {};
    newQuantities[todayKey][supplierId][productId] = quantity;
    saveOrderQuantities(newQuantities);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-amber-50">
        <Loader2 className="w-10 h-10 animate-spin text-amber-700" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      <header className="bg-amber-900 text-white p-4 shadow-lg sticky top-0 z-50">
        <div className="container mx-auto max-w-5xl flex justify-between items-center">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Package className="w-6 h-6" />
            Bobby's Cafe
          </h1>
          <div className="text-[10px] text-amber-200 uppercase tracking-widest">
            Sync: {lastRefresh.toLocaleTimeString()}
          </div>
        </div>
        <nav className="flex gap-2 mt-4 container mx-auto max-w-5xl">
          {['supervisor', 'manager', 'admin'].map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${
                view === v ? 'bg-white text-amber-900' : 'bg-amber-800 hover:bg-amber-700'
              }`}
            >
              {v === 'supervisor' ? "Today's Orders" : v}
            </button>
          ))}
        </nav>
      </header>

      <main className="container mx-auto p-4 max-w-5xl">
        {view === 'supervisor' && (
          <SupervisorView 
            suppliers={suppliers.filter(s => s.orderDays.includes(getDayOfWeek()))} 
            toggleOrder={toggleOrder}
            isOrderCompleted={(id) => orderHistory[getTodayKey()]?.[id] || false}
            updateQuantity={updateQuantity}
            getQuantity={(sid, pid) => orderQuantities[getTodayKey()]?.[sid]?.[pid] || ''}
          />
        )}
        {view === 'manager' && <ManagerView suppliers={suppliers} orderHistory={orderHistory} orderQuantities={orderQuantities} />}
        {view === 'admin' && (
          <AdminView 
            suppliers={suppliers}
            addSupplier={(s) => {
              saveSuppliers([...suppliers, { ...s, id: Date.now().toString() }]);
              setShowAddSupplier(false);
            }}
            updateSupplier={(s) => {
              saveSuppliers(suppliers.map(orig => orig.id === s.id ? s : orig));
              setEditingSupplier(null);
            }}
            deleteSupplier={(id) => {
              if (window.confirm('Delete this supplier?')) {
                saveSuppliers(suppliers.filter(s => s.id !== id));
              }
            }}
            editingSupplier={editingSupplier}
            setEditingSupplier={setEditingSupplier}
            showAddSupplier={showAddSupplier}
            setShowAddSupplier={setShowAddSupplier}
          />
        )}
      </main>
    </div>
  );
};

// ... [Keep your SupervisorView and ManagerView components as they are, or paste them below]
// NOTE: Ensure AdminView uses the updated SupplierForm logic below.

const AdminView = ({ suppliers, addSupplier, updateSupplier, deleteSupplier, editingSupplier, setEditingSupplier, showAddSupplier, setShowAddSupplier }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Suppliers</h2>
        <button
          onClick={() => setShowAddSupplier(true)}
          className="bg-amber-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-amber-700"
          disabled={suppliers.length >= 10}
        >
          <Plus className="w-5 h-5" /> Add New
        </button>
      </div>

      {(showAddSupplier || editingSupplier) && (
        <SupplierForm
          supplier={editingSupplier}
          onSave={editingSupplier ? updateSupplier : addSupplier}
          onCancel={() => { setShowAddSupplier(false); setEditingSupplier(null); }}
        />
      )}

      <div className="grid gap-4">
        {suppliers.map(s => (
          <div key={s.id} className="bg-white p-4 rounded-xl shadow-sm border border-amber-100 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-lg">{s.name}</h3>
              <p className="text-sm text-gray-500">{s.products.length} items • {s.orderDays.join(', ')}</p>
            </div>
            <div className="flex gap-1">
              <button onClick={() => setEditingSupplier(s)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 className="w-5 h-5" /></button>
              <button onClick={() => deleteSupplier(s.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-5 h-5" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const SupplierForm = ({ supplier, onSave, onCancel }) => {
  const [name, setName] = useState(supplier?.name || '');
  const [products, setProducts] = useState(supplier?.products || [{ id: Date.now().toString(), name: '', parLevel: '' }]);
  const [orderDays, setOrderDays] = useState(supplier?.orderDays || []);

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  const handleSubmit = () => {
    const validProducts = products.filter(p => p.name.trim() && p.parLevel);
    if (!name.trim() || validProducts.length === 0 || orderDays.length === 0) {
      alert('Required: Name, 1+ Product with Par, and Order Days');
      return;
    }
    onSave({ ...supplier, name: name.trim(), products: validProducts, orderDays });
  };

  return (
    <div className="bg-white rounded-xl shadow-xl p-6 border-2 border-amber-500 animate-in fade-in zoom-in duration-200">
      <div className="space-y-4">
        <input 
          className="w-full text-xl font-bold border-b-2 border-gray-100 focus:border-amber-500 outline-none pb-2"
          placeholder="Supplier Name"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        
        <div>
          <label className="text-sm font-semibold text-gray-500 uppercase">Order Days</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {days.map(d => (
              <button 
                key={d}
                onClick={() => setOrderDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${orderDays.includes(d) ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-400'}`}
              >
                {d.slice(0,3).toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-500 uppercase">Products & Par Levels</label>
          {products.map((p, idx) => (
            <div key={p.id} className="flex gap-2">
              <input 
                className="flex-1 p-2 bg-gray-50 rounded-lg" 
                placeholder="Item Name" 
                value={p.name}
                onChange={e => {
                  const newP = [...products];
                  newP[idx].name = e.target.value;
                  setProducts(newP);
                }}
              />
              <input 
                className="w-20 p-2 bg-gray-50 rounded-lg" 
                type="number" 
                placeholder="Par" 
                value={p.parLevel}
                onChange={e => {
                  const newP = [...products];
                  newP[idx].parLevel = e.target.value;
                  setProducts(newP);
                }}
              />
              <button onClick={() => setProducts(products.filter((_, i) => i !== idx))} className="text-red-400"><X className="w-5 h-5"/></button>
            </div>
          ))}
          <button onClick={() => setProducts([...products, { id: Date.now().toString(), name: '', parLevel: '' }])} className="text-amber-600 text-sm font-bold">+ Add Item</button>
        </div>

        <div className="flex gap-3 pt-4">
          <button onClick={handleSubmit} className="flex-1 bg-amber-600 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2">
            <Save className="w-5 h-5"/> Save Changes
          </button>
          <button onClick={onCancel} className="px-6 py-3 bg-gray-100 text-gray-500 rounded-lg font-bold">Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default CafeOrderingApp;
