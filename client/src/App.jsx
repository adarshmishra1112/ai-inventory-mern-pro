import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  LayoutDashboard, Package, PlusCircle, LogOut, Sparkles,
  AlertTriangle, IndianRupee, TrendingUp, BarChart3, Search,
  Trash2, CheckCircle2, RefreshCw, MessageSquare, Send, Bot,
  Download, Globe, Store, ShoppingBag, ScanBarcode, Receipt, Printer, X, Layers
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const API_URL = 'https://ai-inventory-mern-pro-1.onrender.com/api';

const BarcodeStrip = ({ code }) => (
  <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', background: '#fff', padding: '4px 8px', borderRadius: '6px' }}>
    <div style={{ display: 'flex', alignItems: 'center', height: '22px' }}>
      {(code || 'IND-000').split('').map((_, idx) => (
        <span
          key={idx}
          style={{
            display: 'inline-block',
            height: '100%',
            background: '#0f172a',
            width: idx % 3 === 0 ? '3px' : idx % 2 === 0 ? '2px' : '1px',
            marginRight: idx % 2 === 0 ? '2px' : '1px'
          }}
        />
      ))}
    </div>
    <span style={{ fontSize: '10px', fontWeight: 700, color: '#0f172a', letterSpacing: '1px', marginTop: '2px' }}>{code}</span>
  </div>
);

function App() {
  const [token, setToken] = useState(() => {
    const t = localStorage.getItem('token');
    return t && t !== 'undefined' ? t : '';
  });
  const [user, setUser] = useState(() => {
    try {
      const u = localStorage.getItem('user');
      return u && u !== 'undefined' ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  });
  const [isRegister, setIsRegister] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Admin');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const [activeNav, setActiveNav] = useState('command');
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedChannel, setSelectedChannel] = useState('All');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');

  // Barcode POS & GST Invoice
  const [scanInput, setScanInput] = useState('');
  const scanInputRef = useRef(null);
  const [invoiceItem, setInvoiceItem] = useState(null);
  const [invoiceQty, setInvoiceQty] = useState(1);
  const [customerName, setCustomerName] = useState('Walk-in Retail Customer');
  const [customerGSTIN, setCustomerGSTIN] = useState('09AABCU9603R1ZM');

  // Add Product Form (Matches backend schema 100%)
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: 'Electronics',
    quantity: '',
    minStockLevel: '10',
    price: '',
    dailySalesAvg: '2',
    supplier: 'Bharat Supply Corp'
  });

  // AI Copilot
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState([
    { sender: 'ai', text: 'Namaste! Main aapka AI Supply Chain Copilot hoon. Low-stock alerts, WhatsApp restock, Barcode POS billing, ya 18% GST invoice ke baare mein poochhein!' }
  ]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const authHeaders = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/products`, authHeaders);
      const list = Array.isArray(res.data) ? res.data : res.data.products || [];
      setProducts(list);
    } catch (err) {
      console.error('Fetch products error:', err);
      showToast('Backend waking up or fetch failed — click Refresh in 5s');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProducts();
    }
  }, [token]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login';
      const payload = isRegister ? { name, email, password, role } : { email, password };
      const res = await axios.post(`${API_URL}${endpoint}`, payload);
      const receivedToken = res.data.token;
      const receivedUser = res.data.user || { name: name || email.split('@')[0], email, role };
      if (!receivedToken) throw new Error('Token missing');
      localStorage.setItem('token', receivedToken);
      localStorage.setItem('user', JSON.stringify(receivedUser));
      setToken(receivedToken);
      setUser(receivedUser);
    } catch (err) {
      setAuthError(err.response?.data?.message || 'Authentication failed. Check credentials or wait 30s for server wake-up.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken('');
    setUser(null);
    setProducts([]);
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.sku.trim()) {
      showToast('Please enter Product Name and SKU!');
      return;
    }
    const payload = {
      name: formData.name.trim(),
      sku: formData.sku.trim().toUpperCase(),
      category: formData.category || 'Electronics',
      quantity: Number(formData.quantity) || 0,
      minStockLevel: Number(formData.minStockLevel) || 10,
      price: Number(formData.price) || 0,
      dailySalesAvg: Number(formData.dailySalesAvg) || 2
    };
    try {
      await axios.post(`${API_URL}/products`, payload, authHeaders);
      showToast(`Added ${payload.name} (${payload.sku})!`);
      setFormData({
        name: '',
        sku: '',
        category: 'Electronics',
        quantity: '',
        minStockLevel: '10',
        price: '',
        dailySalesAvg: '2',
        supplier: 'Bharat Supply Corp'
      });
      fetchProducts();
    } catch (err) {
      const msg = err.response?.data?.message || 'Error adding product (Check unique SKU)';
      showToast(msg);
    }
  };

  const handleLoadDemoData = async () => {
    setLoading(true);
    const demoItems = [
      { name: 'Apple MacBook Air M3', sku: 'IND-101', category: 'Electronics', quantity: 28, minStockLevel: 10, price: 114900, dailySalesAvg: 2 },
      { name: 'boAt Rockerz 450 Pro', sku: 'IND-102', category: 'Audio', quantity: 6, minStockLevel: 15, price: 1999, dailySalesAvg: 6 },
      { name: 'Samsung Galaxy S24 Ultra', sku: 'IND-103', category: 'Mobiles', quantity: 14, minStockLevel: 12, price: 129999, dailySalesAvg: 3 },
      { name: 'Tata Tea Gold 1kg Pack', sku: 'IND-104', category: 'FMCG Grocery', quantity: 4, minStockLevel: 20, price: 540, dailySalesAvg: 8 },
      { name: 'Nike Air Zoom Pegasus', sku: 'IND-105', category: 'Footwear', quantity: 42, minStockLevel: 15, price: 8995, dailySalesAvg: 2 },
      { name: 'HP LaserJet Pro Printer', sku: 'IND-106', category: 'Office Tech', quantity: 0, minStockLevel: 8, price: 18500, dailySalesAvg: 1 }
    ];
    let addedCount = 0;
    for (const item of demoItems) {
      try {
        await axios.post(`${API_URL}/products`, item, authHeaders);
        addedCount++;
      } catch {
        // Skip if SKU already exists
      }
    }
    await fetchProducts();
    setLoading(false);
    showToast(addedCount > 0 ? `Loaded ${addedCount} Indian Enterprise SKUs!` : 'Demo catalog already loaded!');
  };

  const handleUpdateStock = async (item, delta) => {
    const newQty = Math.max(0, Number(item.quantity) + delta);
    try {
      await axios.put(`${API_URL}/products/${item._id}`, { quantity: newQty }, authHeaders);
      setProducts((prev) =>
        prev.map((p) => (p._id === item._id ? { ...p, quantity: newQty } : p))
      );
      showToast(`${item.name} stock updated to ${newQty}`);
    } catch {
      showToast('Failed to update stock');
    }
  };

  const handleDelete = async (id, itemName) => {
    try {
      await axios.delete(`${API_URL}/products/${id}`, authHeaders);
      setProducts((prev) => prev.filter((p) => p._id !== id));
      showToast(`Deleted ${itemName}`);
    } catch {
      showToast('Delete failed');
    }
  };

  const handleWhatsAppAlert = (item, restockQty) => {
    const qtyToOrder = restockQty > 0 ? restockQty : Math.max(15, (item.minStockLevel || 10) * 2);
    const message = `Namaste! Urgent AI Inventory Restock Alert:%0A• Product: *${item.name}* (${item.sku})%0A• Current Live Stock: *${item.quantity} units*%0A• AI Recommended Restock Order: *${qtyToOrder} units*%0A• Estimated Order Value: *₹${(qtyToOrder * item.price).toLocaleString('en-IN')}*%0APlease confirm dispatch timeline.`;
    window.open(`https://wa.me/?text=${message}`, '_blank');
    showToast(`Opened WhatsApp Supplier Alert for ${item.name}`);
  };

  const handleBarcodeScan = async (e) => {
    e.preventDefault();
    const query = scanInput.trim().toUpperCase();
    if (!query) return;
    const found = products.find(
      (p) => p.sku.toUpperCase() === query || p.name.toUpperCase().includes(query)
    );
    if (!found) {
      showToast(`SKU "${query}" not found in inventory!`);
      return;
    }
    if (found.quantity <= 0) {
      showToast(`${found.name} is Out of Stock! Trigger WhatsApp restock.`);
      return;
    }
    await handleUpdateStock(found, -1);
    setInvoiceItem(found);
    setInvoiceQty(1);
    setScanInput('');
  };

  const handleExportCSV = () => {
    if (!products.length) {
      showToast('No products to export!');
      return;
    }
    const headers = ['Product Name', 'SKU', 'Category', 'Stock', 'Min Stock', 'Price (INR)', 'Daily Sales Avg', 'Total Value (INR)'];
    const rows = products.map((p) => [
      `"${p.name}"`,
      p.sku,
      p.category,
      p.quantity,
      p.minStockLevel,
      p.price,
      p.dailySalesAvg || 2,
      p.quantity * p.price
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'India_AI_Inventory_Report.csv';
    a.click();
    showToast('Exported CSV Inventory Report!');
  };

  const handleChatSend = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const q = chatInput.trim();
    const lowItems = enrichedProducts.filter((p) => p.isLow);
    const totalVal = enrichedProducts.reduce((acc, p) => acc + p.quantity * p.price, 0);

    let reply = `Warehouse mein abhi ${enrichedProducts.length} SKUs hain, total valuation ₹${totalVal.toLocaleString('en-IN')} hai.`;
    if (q.toLowerCase().includes('low') || q.toLowerCase().includes('stock') || q.toLowerCase().includes('alert')) {
      reply = lowItems.length
        ? `Abhi ${lowItems.length} items low/out-of-stock hain: ${lowItems.map((i) => `${i.name} (${i.quantity} left)`).join(', ')}. Table mein green WhatsApp button dabakar supplier ko turant order bhej dein!`
        : 'Sabhi items healthy stock level par hain!';
    } else if (q.toLowerCase().includes('gst') || q.toLowerCase().includes('bill') || q.toLowerCase().includes('barcode')) {
      reply = 'Upar Barcode POS Scanner mein SKU (jaise IND-101) type karke Enter dabayein, ya kisi bhi row mein Bill icon dabakar 18% GST Invoice print karein.';
    }

    setMessages((prev) => [...prev, { sender: 'user', text: q }, { sender: 'ai', text: reply }]);
    setChatInput('');
  };

  // Enrich products with AI Insights
  const enrichedProducts = products.map((item) => {
    const dailyRate = Math.max(1, Number(item.dailySalesAvg) || 2);
    const qty = Number(item.quantity) || 0;
    const minLevel = Number(item.minStockLevel) || 10;
    const daysLeft = Math.floor(qty / dailyRate);
    const isOut = qty === 0;
    const isLow = qty <= minLevel;
    const recommendedRestock = isLow ? Math.max(15, dailyRate * 10 - qty) : 0;
    const velocity = dailyRate >= 5 ? 'Fast-Moving' : dailyRate >= 2 ? 'Moderate' : 'Slow-Moving';
    return {
      ...item,
      daysLeft,
      isOut,
      isLow,
      recommendedRestock,
      velocity,
      aiStatus: isOut ? 'Out of Stock' : isLow ? 'Low Stock Alert' : 'Healthy'
    };
  });

  // Filtered products
  const filteredProducts = enrichedProducts.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'All' ||
      (statusFilter === 'Low' && p.isLow) ||
      (statusFilter === 'Healthy' && !p.isLow);

    const matchesNav = activeNav !== 'restock' || p.isLow;

    const matchesChannel =
      selectedChannel === 'All' ||
      (selectedChannel === 'Amazon India' && ['Electronics', 'Mobiles'].includes(p.category)) ||
      (selectedChannel === 'Flipkart' && ['Audio', 'Footwear', 'Electronics'].includes(p.category)) ||
      (selectedChannel === 'Shopify D2C' && ['FMCG Grocery', 'Footwear'].includes(p.category)) ||
      selectedChannel === 'Offline POS';

    return matchesSearch && matchesStatus && matchesNav && matchesChannel;
  });

  // KPI Metrics
  const totalUnits = enrichedProducts.reduce((s, p) => s + Number(p.quantity), 0);
  const totalValuation = enrichedProducts.reduce((s, p) => s + Number(p.quantity) * Number(p.price), 0);
  const criticalCount = enrichedProducts.filter((p) => p.isLow).length;
  const revenueAtRisk = enrichedProducts
    .filter((p) => p.isLow)
    .reduce((s, p) => s + p.recommendedRestock * Number(p.price), 0);

  const barData = enrichedProducts.slice(0, 6).map((p) => ({
    name: p.name.length > 10 ? p.name.slice(0, 10) + '..' : p.name,
    CurrentStock: p.quantity,
    AIRestock: p.recommendedRestock
  }));

  const forecastData = [
    { day: 'Day 1', Demand: 18, Stock: Math.max(20, totalUnits) },
    { day: 'Day 2', Demand: 24, Stock: Math.max(15, Math.round(totalUnits * 0.85)) },
    { day: 'Day 3', Demand: 21, Stock: Math.max(12, Math.round(totalUnits * 0.72)) },
    { day: 'Day 4', Demand: 29, Stock: Math.max(10, Math.round(totalUnits * 0.58)) },
    { day: 'Day 5', Demand: 35, Stock: Math.max(8, Math.round(totalUnits * 0.44)) },
    { day: 'Day 6', Demand: 42, Stock: Math.max(5, Math.round(totalUnits * 0.30)) },
    { day: 'Day 7', Demand: 38, Stock: Math.max(4, Math.round(totalUnits * 0.18)) }
  ];

  const healthyCount = enrichedProducts.filter((p) => !p.isLow).length;
  const lowOnlyCount = enrichedProducts.filter((p) => p.isLow && !p.isOut).length;
  const outOnlyCount = enrichedProducts.filter((p) => p.isOut).length;
  const pieData = [
    { name: 'Healthy', value: healthyCount || 1, color: '#10b981' },
    { name: 'Low Stock', value: lowOnlyCount, color: '#f59e0b' },
    { name: 'Out of Stock', value: outOnlyCount, color: '#ef4444' }
  ];

  // LOGIN / REGISTER SCREEN
  if (!token) {
    return (
      <div style={{ minHeight: '100vh', background: 'radial-gradient(circle at top, #1e1b4b, #090d16)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', color: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div style={{ width: '100%', maxWidth: '420px', background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: '18px', padding: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.6)' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <span style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#a5b4fc', padding: '4px 12px', borderRadius: '999px', fontSize: '11px', fontWeight: 700, letterSpacing: '1px' }}>
              ENTERPRISE AI SAAS
            </span>
            <h1 style={{ fontSize: '28px', fontWeight: 800, margin: '10px 0 4px' }}>AI Inventory Pro</h1>
            <p style={{ color: '#94a3b8', fontSize: '13px' }}>Predictive Supply Chain, WhatsApp Alerts & 18% GST POS</p>
          </div>

          {authError && (
            <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#fca5a5', padding: '10px 12px', borderRadius: '10px', fontSize: '13px', marginBottom: '16px', textAlign: 'center' }}>
              {authError}
            </div>
          )}

          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {isRegister && (
              <>
                <input
                  type="text"
                  placeholder="Full Name (e.g. Adarsh Mishra)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  style={inputStyle}
                />
                <select value={role} onChange={(e) => setRole(e.target.value)} style={inputStyle}>
                  <option value="Admin">Role: Admin / Owner</option>
                  <option value="Manager">Role: Warehouse Manager</option>
                </select>
              </>
            )}
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={inputStyle}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={inputStyle}
            />
            <button
              type="submit"
              disabled={authLoading}
              style={{ background: 'linear-gradient(135deg, #6366f1, #3b82f6)', color: '#fff', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', marginTop: '4px' }}
            >
              {authLoading ? 'Connecting to Server (Wait 30s)...' : isRegister ? 'Create Enterprise Account' : 'Sign In to Command Center'}
            </button>
          </form>

          <p
            onClick={() => { setIsRegister(!isRegister); setAuthError(''); }}
            style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px', marginTop: '18px', cursor: 'pointer' }}
          >
            {isRegister ? 'Already registered? Sign In' : 'New here? Create Enterprise Account'}
          </p>
        </div>
      </div>
    );
  }

  // MAIN ENTERPRISE DASHBOARD
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#070b14', color: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Toast Notification */}
      {toast && (
        <div style={{ position: 'fixed', top: '18px', right: '20px', zIndex: 9999, background: '#1e293b', border: '1px solid #6366f1', color: '#fff', padding: '12px 18px', borderRadius: '10px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', fontSize: '13px', fontWeight: 600 }}>
          {toast}
        </div>
      )}

      {/* LEFT SIDEBAR (Restored from your original design) */}
      <aside style={{ width: '235px', background: '#0b1120', borderRight: '1px solid #1e293b', padding: '20px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0 8px 20px', borderBottom: '1px solid #1e293b' }}>
            <div style={{ background: 'linear-gradient(135deg, #6366f1, #3b82f6)', padding: '8px', borderRadius: '10px' }}>
              <Sparkles size={20} color="#fff" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '16px' }}>AI Inventory Pro</div>
              <div style={{ fontSize: '10px', color: '#64748b' }}>Bharat Enterprise Edition</div>
            </div>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '18px' }}>
            <button onClick={() => setActiveNav('command')} style={navBtnStyle(activeNav === 'command')}>
              <LayoutDashboard size={17} /> Command Center
            </button>
            <button onClick={() => setActiveNav('catalog')} style={navBtnStyle(activeNav === 'catalog')}>
              <Package size={17} /> Smart Catalog
            </button>
            <button onClick={() => setActiveNav('restock')} style={navBtnStyle(activeNav === 'restock')}>
              <AlertTriangle size={17} /> AI Restock Hub
              {criticalCount > 0 && (
                <span style={{ marginLeft: 'auto', background: '#ef4444', color: '#fff', fontSize: '11px', fontWeight: 700, padding: '1px 7px', borderRadius: '999px' }}>
                  {criticalCount}
                </span>
              )}
            </button>
            <button onClick={() => setActiveNav('channels')} style={navBtnStyle(activeNav === 'channels')}>
              <Layers size={17} /> Omnichannel Sync
            </button>
          </nav>
        </div>

        <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '12px', padding: '12px', fontSize: '11px' }}>
          <div style={{ color: '#34d399', fontWeight: 700, marginBottom: '4px' }}>● AI Engine v3.0 Active</div>
          <div style={{ color: '#94a3b8' }}>Predictive Forecasting • WhatsApp Supplier Sync • 18% GST POS</div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main style={{ flex: 1, padding: '22px 26px', overflowY: 'auto' }}>
        {/* Top Header */}
        <header style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px', background: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '16px 20px', marginBottom: '18px' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>AI Inventory Management System</h1>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: '3px 0 0' }}>
              Welcome, <strong style={{ color: '#e2e8f0' }}>{user?.name || 'Admin'}</strong> • Unified Zoho Simplicity + Unicommerce Scale
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button onClick={handleLoadDemoData} style={topBtnStyle('#3b82f6')}>
              <Sparkles size={15} /> Load Demo Data
            </button>
            <button onClick={handleExportCSV} style={topBtnStyle('#10b981')}>
              <Download size={15} /> Export Report
            </button>
            <button onClick={fetchProducts} title="Refresh Data" style={topBtnStyle('#334155')}>
              <RefreshCw size={15} />
            </button>
            <button onClick={handleLogout} style={topBtnStyle('#ef4444')}>
              <LogOut size={15} /> Logout
            </button>
          </div>
        </header>

        {/* Barcode POS Scanner Bar */}
        <form onSubmit={handleBarcodeScan} style={{ display: 'flex', gap: '10px', alignItems: 'center', background: '#0f172a', border: '1px solid rgba(99, 102, 241, 0.35)', borderRadius: '12px', padding: '10px 14px', marginBottom: '18px' }}>
          <ScanBarcode size={20} color="#818cf8" />
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#a5b4fc', whiteSpace: 'nowrap' }}>Barcode POS Scanner:</span>
          <input
            ref={scanInputRef}
            type="text"
            placeholder="Scan Barcode or Type SKU (e.g. IND-101) & Press Enter for Instant POS Billing (-1)..."
            value={scanInput}
            onChange={(e) => setScanInput(e.target.value)}
            style={{ flex: 1, background: 'transparent', border: 'none', color: '#fff', outline: 'none', fontSize: '13px' }}
          />
          <button type="submit" style={{ background: '#4f46e5', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}>
            Scan & Bill (-1)
          </button>
        </form>

        {/* 8 KPI Cards (Original Layout) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px', marginBottom: '16px' }}>
          <div style={kpiCardStyle}>
            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>QTY IN HAND</div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#38bdf8', margin: '4px 0' }}>{totalUnits}</div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>Total physical units</div>
          </div>
          <div style={kpiCardStyle}>
            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>TO BE PACKED</div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#a78bfa', margin: '4px 0' }}>{Math.max(12, Math.round(totalUnits * 0.25))}</div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>Pending POS/Online orders</div>
          </div>
          <div style={kpiCardStyle}>
            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>IN TRANSIT (SHIPPED)</div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#fbbf24', margin: '4px 0' }}>{Math.max(8, Math.round(totalUnits * 0.18))}</div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>Delhivery / BlueDart active</div>
          </div>
          <div style={kpiCardStyle}>
            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>DELIVERED (14D)</div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#34d399', margin: '4px 0' }}>{Math.max(45, totalUnits * 2)}</div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>Completed customer orders</div>
          </div>
          <div style={kpiCardStyle}>
            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>TOTAL CATALOG SKUs</div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#f8fafc', margin: '4px 0' }}>{enrichedProducts.length}</div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>Across all warehouses</div>
          </div>
          <div style={kpiCardStyle}>
            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>AI CRITICAL ALERTS</div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#f87171', margin: '4px 0' }}>{criticalCount}</div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>Immediate restock needed</div>
          </div>
          <div style={kpiCardStyle}>
            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>WAREHOUSE ASSET VALUE</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#34d399', margin: '4px 0' }}>₹{totalValuation.toLocaleString('en-IN')}</div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>Live stock valuation</div>
          </div>
          <div style={kpiCardStyle}>
            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>REVENUE AT RISK</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#fb7185', margin: '4px 0' }}>₹{revenueAtRisk.toLocaleString('en-IN')}</div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>Saved via AI auto-replenish</div>
          </div>
        </div>

        {/* 4 Omnichannel Sync Filter Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px', marginBottom: '18px' }}>
          {[
            { label: 'Amazon India', sub: 'Real-time FBA & EasyShip Sync', icon: <Globe size={16} /> },
            { label: 'Flipkart', sub: 'Auto Stock & Order Allocation', icon: <ShoppingBag size={16} /> },
            { label: 'Shopify D2C', sub: 'Live Checkout Inventory Lock', icon: <Store size={16} /> },
            { label: 'Offline POS', sub: 'GST Billing & Barcode Counter', icon: <ScanBarcode size={16} /> }
          ].map((ch) => {
            const active = selectedChannel === ch.label;
            return (
              <div
                key={ch.label}
                onClick={() => setSelectedChannel(active ? 'All' : ch.label)}
                style={{
                  background: active ? 'rgba(99, 102, 241, 0.18)' : '#0f172a',
                  border: active ? '1px solid #6366f1' : '1px solid #1e293b',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>{ch.icon} {ch.label}</div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{ch.sub}</div>
                </div>
                <span style={{ fontSize: '11px', color: '#34d399', fontWeight: 700 }}>● {active ? 'Filtered' : 'Synced'}</span>
              </div>
            );
          })}
        </div>

        {/* 3 Analytics Charts */}
        {activeNav === 'command' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '14px', marginBottom: '18px' }}>
            <div style={panelStyle}>
              <h3 style={panelTitleStyle}><TrendingUp size={15} color="#38bdf8" /> 7-Day AI Demand Forecast vs Stock</h3>
              <ResponsiveContainer width="100%" height={190}>
                <AreaChart data={forecastData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155' }} />
                  <Area type="monotone" dataKey="Stock" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.2} />
                  <Area type="monotone" dataKey="Demand" stroke="#a855f7" fill="#a855f7" fillOpacity={0.25} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div style={panelStyle}>
              <h3 style={panelTitleStyle}><BarChart3 size={15} color="#a855f7" /> Stock vs AI Restock Needed</h3>
              <ResponsiveContainer width="100%" height={190}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155' }} />
                  <Bar dataKey="CurrentStock" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="AIRestock" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={panelStyle}>
              <h3 style={panelTitleStyle}><CheckCircle2 size={15} color="#10b981" /> Health Ratio</h3>
              <ResponsiveContainer width="100%" height={190}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" innerRadius={48} outerRadius={72} paddingAngle={4}>
                    {pieData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155' }} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Horizontal Add Product Bar (Matches your original Screenshot 539/540) */}
        <div style={{ ...panelStyle, marginBottom: '18px' }}>
          <h3 style={{ ...panelTitleStyle, color: '#38bdf8', marginBottom: '12px' }}>
            <PlusCircle size={16} /> Add New Product to AI Inventory
          </h3>
          <form onSubmit={handleAddProduct} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', alignItems: 'end' }}>
            <div>
              <label style={labelStyle}>PRODUCT NAME *</label>
              <input
                type="text"
                placeholder="e.g. OnePlus 13 5G"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                style={smallInputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>SKU CODE *</label>
              <input
                type="text"
                placeholder="e.g. IND-107"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                required
                style={smallInputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>CATEGORY *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                style={smallInputStyle}
              >
                <option value="Electronics">Electronics</option>
                <option value="Mobiles">Mobiles</option>
                <option value="Audio">Audio</option>
                <option value="FMCG Grocery">FMCG Grocery</option>
                <option value="Footwear">Footwear</option>
                <option value="Office Tech">Office Tech</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>QUANTITY *</label>
              <input
                type="number"
                placeholder="15"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                required
                style={smallInputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>MIN ALERT LEVEL *</label>
              <input
                type="number"
                placeholder="10"
                value={formData.minStockLevel}
                onChange={(e) => setFormData({ ...formData, minStockLevel: e.target.value })}
                required
                style={smallInputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>PRICE (₹) *</label>
              <input
                type="number"
                placeholder="64999"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
                style={smallInputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>DAILY SALES AVG</label>
              <input
                type="number"
                placeholder="2"
                value={formData.dailySalesAvg}
                onChange={(e) => setFormData({ ...formData, dailySalesAvg: e.target.value })}
                style={smallInputStyle}
              />
            </div>
            <button
              type="submit"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', color: '#fff', border: 'none', padding: '10px 14px', borderRadius: '8px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', height: '38px' }}
            >
              + Add Item
            </button>
          </form>
        </div>

        {/* Search & Status Filter Bar */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '220px', display: 'flex', alignItems: 'center', gap: '8px', background: '#0f172a', border: '1px solid #1e293b', borderRadius: '10px', padding: '8px 14px' }}>
            <Search size={16} color="#64748b" />
            <input
              type="text"
              placeholder="Search by product name, SKU, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ flex: 1, background: 'transparent', border: 'none', color: '#fff', outline: 'none', fontSize: '13px' }}
            />
            {searchTerm && (
              <X size={15} color="#94a3b8" style={{ cursor: 'pointer' }} onClick={() => setSearchTerm('')} />
            )}
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ background: '#0f172a', border: '1px solid #1e293b', color: '#e2e8f0', borderRadius: '10px', padding: '8px 14px', fontSize: '13px' }}
          >
            <option value="All">All AI Status</option>
            <option value="Low">Low / Out of Stock</option>
            <option value="Healthy">Healthy Stock</option>
          </select>
        </div>

        {/* LIVE INVENTORY LEDGER TABLE (All Features Combined!) */}
        <div style={{ ...panelStyle, overflowX: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>Loading live warehouse inventory...</div>
          ) : filteredProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: '#94a3b8', fontSize: '13px' }}>
              No items found! Click <strong style={{ color: '#60a5fa' }}>"Load Demo Data"</strong> on top-right or add a product above.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1e293b', color: '#64748b', fontSize: '11px', textAlign: 'left' }}>
                  <th style={thStyle}>PRODUCT</th>
                  <th style={thStyle}>BARCODE / SKU</th>
                  <th style={thStyle}>VELOCITY</th>
                  <th style={thStyle}>LIVE STOCK</th>
                  <th style={thStyle}>PRICE</th>
                  <th style={thStyle}>AI HEALTH</th>
                  <th style={thStyle}>STOCKOUT ETA</th>
                  <th style={thStyle}>AI RESTOCK & WHATSAPP</th>
                  <th style={thStyle}>GST BILL</th>
                  <th style={thStyle}>DEL</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((item) => (
                  <tr key={item._id} style={{ borderBottom: '1px solid rgba(30, 41, 59, 0.7)' }}>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 700, color: '#f8fafc' }}>{item.name}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{item.category}</div>
                    </td>
                    <td style={tdStyle}>
                      <BarcodeStrip code={item.sku} />
                    </td>
                    <td style={tdStyle}>
                      <span style={{ background: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600 }}>
                        ⚡ {item.velocity}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#1e293b', padding: '4px 8px', borderRadius: '8px' }}>
                        <button onClick={() => handleUpdateStock(item, -1)} style={qtyBtnStyle}>-</button>
                        <span style={{ fontWeight: 800, minWidth: '22px', textAlign: 'center' }}>{item.quantity}</span>
                        <button onClick={() => handleUpdateStock(item, 1)} style={qtyBtnStyle}>+</button>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <strong>₹{Number(item.price).toLocaleString('en-IN')}</strong>
                    </td>
                    <td style={tdStyle}>
                      <span style={{
                        padding: '3px 9px',
                        borderRadius: '999px',
                        fontSize: '11px',
                        fontWeight: 700,
                        background: item.isOut ? 'rgba(239,68,68,0.18)' : item.isLow ? 'rgba(245,158,11,0.18)' : 'rgba(16,185,129,0.18)',
                        color: item.isOut ? '#f87171' : item.isLow ? '#fbbf24' : '#34d399'
                      }}>
                        {item.aiStatus}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ color: item.isLow ? '#f87171' : '#94a3b8', fontWeight: 600 }}>
                        ~{item.daysLeft} days
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {item.isLow ? (
                          <button
                            onClick={() => handleUpdateStock(item, item.recommendedRestock)}
                            title="One-Click AI Auto Restock"
                            style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '5px 9px', borderRadius: '7px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                          >
                            +{item.recommendedRestock}
                          </button>
                        ) : (
                          <span style={{ color: '#34d399', fontSize: '11px', fontWeight: 600 }}>✓ Optimal</span>
                        )}
                        <button
                          onClick={() => handleWhatsAppAlert(item, item.recommendedRestock)}
                          style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '7px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <MessageSquare size={12} /> WhatsApp
                        </button>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <button
                        onClick={() => { setInvoiceItem(item); setInvoiceQty(1); }}
                        style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#a5b4fc', border: '1px solid rgba(99, 102, 241, 0.4)', padding: '5px 9px', borderRadius: '7px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Receipt size={12} /> GST Bill
                      </button>
                    </td>
                    <td style={tdStyle}>
                      <button
                        onClick={() => handleDelete(item._id, item.name)}
                        style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: 'none', padding: '6px', borderRadius: '7px', cursor: 'pointer' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* 18% GST INVOICE MODAL */}
      {invoiceItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div style={{ background: '#ffffff', color: '#0f172a', width: '100%', maxWidth: '480px', borderRadius: '16px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: '12px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>TAX INVOICE (18% GST)</h2>
                <div style={{ fontSize: '11px', color: '#64748b' }}>AI Inventory Enterprise POS • GSTIN: 09AABCU9603R1ZM</div>
              </div>
              <button onClick={() => setInvoiceItem(null)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', padding: '6px', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', margin: '14px 0' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569' }}>Customer Name</label>
                <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} style={{ width: '100%', padding: '7px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }} />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569' }}>Customer GSTIN</label>
                <input value={customerGSTIN} onChange={(e) => setCustomerGSTIN(e.target.value)} style={{ width: '100%', padding: '7px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }} />
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span><strong>Item:</strong> {invoiceItem.name} ({invoiceItem.sku})</span>
                <span><strong>Rate:</strong> ₹{Number(invoiceItem.price).toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span><strong>Billed Qty:</strong></span>
                <input
                  type="number"
                  min="1"
                  value={invoiceQty}
                  onChange={(e) => setInvoiceQty(Math.max(1, Number(e.target.value)))}
                  style={{ width: '70px', padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>
              <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Taxable Subtotal:</span>
                  <span>₹{(invoiceItem.price * invoiceQty).toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                  <span>CGST (9%) + SGST (9%):</span>
                  <span>₹{Math.round(invoiceItem.price * invoiceQty * 0.18).toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                  <span>Grand Total:</span>
                  <span>₹{Math.round(invoiceItem.price * invoiceQty * 1.18).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button
                onClick={() => window.print()}
                style={{ flex: 1, background: '#4f46e5', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <Printer size={16} /> Print GST Invoice
              </button>
              <button
                onClick={() => setInvoiceItem(null)}
                style={{ background: '#e2e8f0', color: '#0f172a', border: 'none', padding: '10px 16px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING AI COPILOT */}
      <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 999 }}>
        {chatOpen && (
          <div style={{ width: '320px', background: '#0f172a', border: '1px solid #334155', borderRadius: '14px', boxShadow: '0 20px 40px rgba(0,0,0,0.6)', marginBottom: '10px', overflow: 'hidden' }}>
            <div style={{ background: 'linear-gradient(135deg, #4f46e5, #3b82f6)', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700, fontSize: '13px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Bot size={16} /> AI Supply Chain Copilot</span>
              <X size={16} style={{ cursor: 'pointer' }} onClick={() => setChatOpen(false)} />
            </div>
            <div style={{ height: '220px', overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
              {messages.map((m, i) => (
                <div key={i} style={{
                  alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                  background: m.sender === 'user' ? '#4f46e5' : '#1e293b',
                  padding: '8px 11px',
                  borderRadius: '10px',
                  maxWidth: '85%'
                }}>
                  {m.text}
                </div>
              ))}
            </div>
            <form onSubmit={handleChatSend} style={{ display: 'flex', borderTop: '1px solid #1e293b', padding: '8px' }}>
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about low stock, GST, restock..."
                style={{ flex: 1, background: 'transparent', border: 'none', color: '#fff', outline: 'none', fontSize: '12px' }}
              />
              <button type="submit" style={{ background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '7px', padding: '6px 10px', cursor: 'pointer' }}>
                <Send size={13} />
              </button>
            </form>
          </div>
        )}
        <button
          onClick={() => setChatOpen(!chatOpen)}
          style={{ background: 'linear-gradient(135deg, #6366f1, #3b82f6)', color: '#fff', border: 'none', padding: '12px 18px', borderRadius: '999px', fontWeight: 700, fontSize: '13px', boxShadow: '0 10px 25px rgba(79,70,229,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}
        >
          <Bot size={18} /> Ask AI Copilot
        </button>
      </div>
    </div>
  );
}

const inputStyle = {
  background: '#1e293b',
  border: '1px solid #334155',
  color: '#fff',
  padding: '11px 14px',
  borderRadius: '10px',
  fontSize: '13px',
  outline: 'none'
};

const smallInputStyle = {
  width: '100%',
  background: '#1e293b',
  border: '1px solid #334155',
  color: '#fff',
  padding: '8px 10px',
  borderRadius: '8px',
  fontSize: '12px',
  outline: 'none',
  height: '38px',
  boxSizing: 'border-box'
};

const labelStyle = {
  display: 'block',
  fontSize: '10px',
  fontWeight: 700,
  color: '#64748b',
  marginBottom: '4px'
};

const navBtnStyle = (active) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '10px 12px',
  borderRadius: '10px',
  border: active ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid transparent',
  background: active ? 'rgba(99, 102, 241, 0.16)' : 'transparent',
  color: active ? '#a5b4fc' : '#94a3b8',
  fontWeight: active ? 700 : 500,
  fontSize: '13px',
  cursor: 'pointer',
  textAlign: 'left'
});

const topBtnStyle = (bg) => ({
  background: bg,
  color: '#fff',
  border: 'none',
  padding: '8px 13px',
  borderRadius: '9px',
  fontWeight: 700,
  fontSize: '12px',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px'
});

const kpiCardStyle = {
  background: '#0f172a',
  border: '1px solid #1e293b',
  borderRadius: '12px',
  padding: '14px 16px'
};

const panelStyle = {
  background: '#0f172a',
  border: '1px solid #1e293b',
  borderRadius: '14px',
  padding: '16px'
};

const panelTitleStyle = {
  fontSize: '13px',
  fontWeight: 700,
  margin: '0 0 12px',
  display: 'flex',
  alignItems: 'center',
  gap: '7px'
};

const thStyle = {
  padding: '10px 12px'
};

const tdStyle = {
  padding: '12px'
};

const qtyBtnStyle = {
  background: '#334155',
  color: '#fff',
  border: 'none',
  width: '22px',
  height: '22px',
  borderRadius: '6px',
  fontWeight: 800,
  cursor: 'pointer'
};

export default App;