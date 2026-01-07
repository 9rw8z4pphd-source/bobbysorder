import { storage } from './firebase.js';
import React, { useState, useEffect } from 'react';
import { Calendar, Package, Settings, CheckCircle, Circle, Plus, Trash2, Edit2, Save, X } from 'lucide-react';

const CafeOrderingApp = () => {
  const [view, setView] = useState('supervisor');
  const [suppliers, setSuppliers] = useState([]);
  const [orderHistory, setOrderHistory] = useState({});
  const [orderQuantities, setOrderQuantities] = useState({});
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    loadData();
    
    // Auto-refresh every 30 seconds
    const refreshInterval = setInterval(() => {
      loadData();
    }, 30000);
    
    // Cleanup interval on unmount
    return () => clearInterval(refreshInterval);
  }, []);

  const loadData = async () => {
    try {
      const suppliersResult = await window.storage.get('cafe-suppliers');
      const historyResult = await window.storage.get('cafe-order-history');
      const quantitiesResult = await window.storage.get('cafe-order-quantities');
      
      if (suppliersResult) {
        setSuppliers(JSON.parse(suppliersResult.value));
      }
      if (historyResult) {
        setOrderHistory(JSON.parse(historyResult.value));
      }
      if (quantitiesResult) {
        setOrderQuantities(JSON.parse(quantitiesResult.value));
      }
      
      setLastRefresh(new Date());
    } catch (error) {
      console.log('No existing data found');
    }
  };

  const saveSuppliers = async (newSuppliers) => {
    try {
      await window.storage.set('cafe-suppliers', JSON.stringify(newSuppliers));
      setSuppliers(newSuppliers);
    } catch (error) {
      console.error('Error saving suppliers:', error);
    }
  };

  const saveOrderHistory = async (newHistory) => {
    try {
      await window.storage.set('cafe-order-history', JSON.stringify(newHistory));
      setOrderHistory(newHistory);
    } catch (error) {
      console.error('Error saving order history:', error);
    }
  };

  const saveOrderQuantities = async (newQuantities) => {
    try {
      await window.storage.set('cafe-order-quantities', JSON.stringify(newQuantities));
      setOrderQuantities(newQuantities);
    } catch (error) {
      console.error('Error saving quantities:', error);
    }
  };

  const getTodayKey = () => {
    const today = new Date();
    return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  };

  const getDayOfWeek = () => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[new Date().getDay()];
  };

  const getTodaySuppliers = () => {
    const today = getDayOfWeek();
    return suppliers.filter(s => s.orderDays.includes(today));
  };

  const toggleOrder = (supplierId) => {
    const todayKey = getTodayKey();
    const newHistory = { ...orderHistory };
    
    if (!newHistory[todayKey]) {
      newHistory[todayKey] = {};
    }
    
    newHistory[todayKey][supplierId] = !newHistory[todayKey][supplierId];
    saveOrderHistory(newHistory);
  };

  const isOrderCompleted = (supplierId) => {
    const todayKey = getTodayKey();
    return orderHistory[todayKey]?.[supplierId] || false;
  };

  const updateQuantity = (supplierId, productId, quantity) => {
    const todayKey = getTodayKey();
    const newQuantities = { ...orderQuantities };
    
    if (!newQuantities[todayKey]) {
      newQuantities[todayKey] = {};
    }
    if (!newQuantities[todayKey][supplierId]) {
      newQuantities[todayKey][supplierId] = {};
    }
    
    newQuantities[todayKey][supplierId][productId] = quantity;
    saveOrderQuantities(newQuantities);
  };

  const getQuantity = (supplierId, productId) => {
    const todayKey = getTodayKey();
    return orderQuantities[todayKey]?.[supplierId]?.[productId] || '';
  };

  const addSupplier = (supplier) => {
    const newSuppliers = [...suppliers, { ...supplier, id: Date.now().toString() }];
    saveSuppliers(newSuppliers);
    setShowAddSupplier(false);
  };

  const updateSupplier = (updatedSupplier) => {
    const newSuppliers = suppliers.map(s => 
      s.id === updatedSupplier.id ? updatedSupplier : s
    );
    saveSuppliers(newSuppliers);
    setEditingSupplier(null);
  };

  const deleteSupplier = (id) => {
    if (window.confirm('Are you sure you want to delete this supplier?')) {
      const newSuppliers = suppliers.filter(s => s.id !== id);
      saveSuppliers(newSuppliers);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      {/* Header */}
      <div className="bg-amber-900 text-white p-4 shadow-lg">
        <div className="flex justify-between items-start">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="w-7 h-7" />
            Bobby's Order List
          </h1>
          <div className="text-xs text-amber-200">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => setView('supervisor')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              view === 'supervisor' 
                ? 'bg-white text-amber-900' 
                : 'bg-amber-800 text-white hover:bg-amber-700'
            }`}
          >
            Today's Orders
          </button>
          <button
            onClick={() => setView('manager')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              view === 'manager' 
                ? 'bg-white text-amber-900' 
                : 'bg-amber-800 text-white hover:bg-amber-700'
            }`}
          >
            Manager View
          </button>
          <button
            onClick={() => setView('admin')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              view === 'admin' 
                ? 'bg-white text-amber-900' 
                : 'bg-amber-800 text-white hover:bg-amber-700'
            }`}
          >
            <Settings className="w-4 h-4 inline mr-1" />
            Admin
          </button>
        </div>
      </div>

      <div className="container mx-auto p-4 max-w-5xl">
        {view === 'supervisor' && <SupervisorView 
          suppliers={getTodaySuppliers()} 
          toggleOrder={toggleOrder}
          isOrderCompleted={isOrderCompleted}
          updateQuantity={updateQuantity}
          getQuantity={getQuantity}
        />}
        
        {view === 'manager' && <ManagerView 
          suppliers={suppliers}
          orderHistory={orderHistory}
          orderQuantities={orderQuantities}
        />}
        
        {view === 'admin' && <AdminView 
          suppliers={suppliers}
          addSupplier={addSupplier}
          updateSupplier={updateSupplier}
          deleteSupplier={deleteSupplier}
          editingSupplier={editingSupplier}
          setEditingSupplier={setEditingSupplier}
          showAddSupplier={showAddSupplier}
          setShowAddSupplier={setShowAddSupplier}
        />}
      </div>
    </div>
  );
};

const SupervisorView = ({ suppliers, toggleOrder, isOrderCompleted, updateQuantity, getQuantity }) => {
  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  if (suppliers.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <Calendar className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">No Orders Today</h2>
        <p className="text-gray-500">You don't have any suppliers scheduled for today.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          {today}
        </h2>
      </div>

      <div className="space-y-4">
        {suppliers.map(supplier => {
          const completed = isOrderCompleted(supplier.id);
          return (
            <div 
              key={supplier.id} 
              className={`bg-white rounded-lg shadow-md p-6 transition-all ${
                completed ? 'border-l-4 border-green-500' : 'border-l-4 border-orange-500'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{supplier.name}</h3>
                  <p className="text-gray-600 text-sm mt-1">
                    Orders on: {supplier.orderDays.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ')}
                  </p>
                </div>
                <button
                  onClick={() => toggleOrder(supplier.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                    completed 
                      ? 'bg-green-500 text-white hover:bg-green-600' 
                      : 'bg-orange-500 text-white hover:bg-orange-600'
                  }`}
                >
                  {completed ? (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Completed
                    </>
                  ) : (
                    <>
                      <Circle className="w-5 h-5" />
                      Mark Complete
                    </>
                  )}
                </button>
              </div>

              <div>
                <h4 className="font-semibold text-gray-700 mb-3">Products to Order:</h4>
                <div className="space-y-3">
                  {supplier.products.map((product, idx) => (
                    <div key={idx} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-800">{product.name}</span>
                        <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-semibold">
                          Par Level: {product.parLevel}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <label className="text-sm text-gray-600 whitespace-nowrap">Quantity to Order:</label>
                        <input
                          type="number"
                          min="0"
                          value={getQuantity(supplier.id, product.id)}
                          onChange={(e) => updateQuantity(supplier.id, product.id, e.target.value)}
                          className="flex-1 p-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-lg font-semibold"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ManagerView = ({ suppliers, orderHistory, orderQuantities }) => {
  const getLast7Days = () => {
    const days = [];
    for (let i = 3; i >= -3; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const isToday = i === 0;
      days.push({
        key: `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`,
        display: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        isToday
      });
    }
    return days;
  };

  const days = getLast7Days();

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Order Status - 3 Days Before & After</h2>
      
      <div className="bg-white rounded-lg shadow-md overflow-x-auto">
        <table className="w-full">
          <thead className="bg-amber-100">
            <tr>
              <th className="p-3 text-left font-semibold text-gray-700">Supplier</th>
              {days.map(day => (
                <th key={day.key} className={`p-3 text-center font-semibold ${day.isToday ? 'bg-amber-200' : ''}`}>
                  <div className={day.isToday ? 'font-bold' : ''}>{day.dayName}</div>
                  <div className="text-xs font-normal">{day.display}</div>
                  {day.isToday && <div className="text-xs text-amber-800 font-semibold">TODAY</div>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {suppliers.map((supplier, idx) => (
              <tr key={supplier.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="p-3 font-medium text-gray-800">{supplier.name}</td>
                {days.map(day => {
                  const dayOfWeek = new Date(day.key).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
                  const shouldOrder = supplier.orderDays.includes(dayOfWeek);
                  const completed = orderHistory[day.key]?.[supplier.id];
                  const quantities = orderQuantities[day.key]?.[supplier.id];
                  
                  return (
                    <td key={day.key} className={`p-3 text-center ${day.isToday ? 'bg-amber-50' : ''}`}>
                      {shouldOrder ? (
                        <div className="flex flex-col items-center gap-1">
                          {completed ? (
                            <CheckCircle className="w-6 h-6 text-green-500" />
                          ) : (
                            <Circle className="w-6 h-6 text-orange-400" />
                          )}
                          {quantities && Object.keys(quantities).length > 0 && (
                            <div className="text-xs text-gray-600">
                              {Object.values(quantities).filter(q => q).length} items
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail view for today */}
      <div className="mt-6 space-y-4">
        <h3 className="text-xl font-bold text-gray-800">Today's Order Details</h3>
        {suppliers.map(supplier => {
          const todayKey = days.find(d => d.isToday)?.key;
          const dayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
          const shouldOrder = supplier.orderDays.includes(dayOfWeek);
          
          if (!shouldOrder) return null;

          const quantities = orderQuantities[todayKey]?.[supplier.id] || {};
          const completed = orderHistory[todayKey]?.[supplier.id];

          return (
            <div key={supplier.id} className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-gray-800">{supplier.name}</h4>
                {completed ? (
                  <span className="text-green-600 font-semibold flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    Completed
                  </span>
                ) : (
                  <span className="text-orange-600 font-semibold flex items-center gap-1">
                    <Circle className="w-4 h-4" />
                    Pending
                  </span>
                )}
              </div>
              <div className="space-y-2">
                {supplier.products.map(product => {
                  const qty = quantities[product.id] || 0;
                  return (
                    <div key={product.id} className="flex justify-between text-sm">
                      <span className="text-gray-700">{product.name} (Par: {product.parLevel})</span>
                      <span className="font-semibold text-gray-900">
                        {qty ? `${qty} ordered` : 'Not set'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const AdminView = ({ suppliers, addSupplier, updateSupplier, deleteSupplier, editingSupplier, setEditingSupplier, showAddSupplier, setShowAddSupplier }) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Manage Suppliers</h2>
        <button
          onClick={() => setShowAddSupplier(true)}
          className="bg-amber-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-amber-700 font-medium"
          disabled={suppliers.length >= 5}
        >
          <Plus className="w-5 h-5" />
          Add Supplier
        </button>
      </div>

      {suppliers.length >= 5 && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded-lg mb-4">
          Maximum of 5 suppliers reached
        </div>
      )}

      {(showAddSupplier || editingSupplier) && (
        <SupplierForm
          supplier={editingSupplier}
          onSave={editingSupplier ? updateSupplier : addSupplier}
          onCancel={() => {
            setShowAddSupplier(false);
            setEditingSupplier(null);
          }}
        />
      )}

      <div className="space-y-4">
        {suppliers.map(supplier => (
          <div key={supplier.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-800">{supplier.name}</h3>
                <p className="text-gray-600 text-sm mt-1">
                  Orders: {supplier.orderDays.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ')}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingSupplier(supplier)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => deleteSupplier(supplier.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Products ({supplier.products.length}):</h4>
              <div className="space-y-2">
                {supplier.products.map((product, idx) => (
                  <div key={idx} className="bg-amber-50 px-3 py-2 rounded-lg flex justify-between items-center">
                    <span className="text-gray-800">{product.name}</span>
                    <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-semibold">
                      Par: {product.parLevel}
                    </span>
                  </div>
                ))}
              </div>
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
      alert('Please fill in supplier name, at least one product with par level, and select order days');
      return;
    }

    onSave({
      ...(supplier || {}),
      name: name.trim(),
      products: validProducts,
      orderDays
    });
  };

  const addProduct = () => {
    if (products.length < 30) {
      setProducts([...products, { id: Date.now().toString(), name: '', parLevel: '' }]);
    }
  };

  const updateProduct = (idx, field, value) => {
    const newProducts = [...products];
    newProducts[idx][field] = value;
    setProducts(newProducts);
  };

  const removeProduct = (idx) => {
    setProducts(products.filter((_, i) => i !== idx));
  };

  const toggleDay = (day) => {
    setOrderDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6 border-2 border-amber-200">
      <h3 className="text-xl font-bold text-gray-800 mb-4">
        {supplier ? 'Edit Supplier' : 'Add New Supplier'}
      </h3>
      
      <div>
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">Supplier Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="Enter supplier name"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">Order Days *</label>
          <div className="flex flex-wrap gap-2">
            {days.map(day => (
              <button
                key={day}
                onClick={() => toggleDay(day)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  orderDays.includes(day)
                    ? 'bg-amber-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {day.charAt(0).toUpperCase() + day.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-gray-700 font-medium">Products * (max 30)</label>
            <button
              onClick={addProduct}
              disabled={products.length >= 30}
              className="text-amber-600 hover:text-amber-700 font-medium text-sm disabled:text-gray-400"
            >
              + Add Product
            </button>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {products.map((product, idx) => (
              <div key={product.id} className="flex gap-2 bg-gray-50 p-3 rounded-lg">
                <input
                  type="text"
                  value={product.name}
                  onChange={(e) => updateProduct(idx, 'name', e.target.value)}
                  className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder={`Product ${idx + 1} name`}
                />
                <input
                  type="number"
                  min="0"
                  value={product.parLevel}
                  onChange={(e) => updateProduct(idx, 'parLevel', e.target.value)}
                  className="w-24 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="Par"
                />
                {products.length > 1 && (
                  <button
                    onClick={() => removeProduct(idx)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSubmit}
            className="flex-1 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 font-medium flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            Save Supplier
          </button>
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default CafeOrderingApp;
