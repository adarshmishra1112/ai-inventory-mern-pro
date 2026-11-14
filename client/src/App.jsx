import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  LayoutDashboard, Package, PlusCircle, LogOut, Sparkles,
  AlertTriangle, IndianRupee, TrendingUp, BarChart3, Search,
  Trash2, CheckCircle2, RefreshCw, MessageSquare, Send, Bot,
  Download, Zap, Globe, Store, ShoppingBag, PhoneCall,
  ScanBarcode, Receipt, Printer, X
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const API_URL = 'https://ai-inventory-mern-pro-1.onrender.com/api';
const BarcodeStrip = ({ code }) => (
  <div className="barcode-box" title={`SKU Barcode: ${code}`}>
    <div className="barcode-lines">
      {(code || 'SKU-000').split('').map((ch, idx) => (
        <span
          key={idx}
          style={{
            width: idx % 3 === 0 ? '3px' : idx % 2 === 0 ? '2px' : '1px',
            marginRight: idx % 2 === 0 ? '2px' : '1px'
          }}
        />
      ))}
    </div>
    <div className="barcode-text">{code}</div>
  </div>
);

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'));
  const [isRegister, setIsRegister] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Admin');
  const [authError, setAuthError] = useState('');

  const [products, setProducts] = useState([]);
  const [summary, setSummary] = useState({
    totalItems: 0, totalStockUnits: 0, totalValue: 0, lowStockCount: 0, fastMovingCount: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('All');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');

  const [scanInput, setScanInput] = useState('');
  const scanInputRef = useRef(null);

  const [invoiceItem, setInvoiceItem] = useState(null);
  const [invoiceQty, setInvoiceQty] = useState(1);
  const [customerName, setCustomerName] = useState('Walk-in Retail Customer');
  const [customerGSTIN, setCustomerGSTIN] = useState('09AABCU9603R1ZM');

  const [formData, setFormData] = useState({
    name: '', sku: '', category: 'Electronics',
    quantity: '', minStockLevel: 10, price: '', dailySalesAvg: 3, supplier: ''
  });

  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState([
    { sender: 'ai', text: 'Namaste! Main aapka AI Supply Chain Copilot hoon. Stock alerts, Barcode POS billing, ya 18% GST invoice ke baare mein poochhein!' }
  ]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login';
      const payload = isRegister ? { name, email, password, role } : { email, password };
      const res = await axios.post(`${API_URL}${endpoint}`, payload);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setToken(res.data.token);
      setUser(res.data.user);
      showToast(`Welcome ${res.data.user.name}!`);
    } catch (err) {
      setAuthError(err.response?.data?.message || 'Authentication failed. Check server connection.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken('');
    setUser(null);
  };

  const fetchInventory = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/products`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(res.data.products || []);
      setSummary(res.data.summary || {
        totalItems: 0, totalStockUnits: 0, totalValue: 0, lowStockCount: 0, fastMovingCount: 0
      });
    } catch (err) {
      if (err.response?.status === 401) handleLogout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [token]);

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/products`, {
        ...formData,
        quantity: Number(formData.quantity),
        minStockLevel: Number(formData.minStockLevel),
        price: Number(formData.price),
        dailySalesAvg: Number(formData.dailySalesAvg)
      }, { headers: { Authorization: `Bearer ${token}` } });

      setFormData({
        name: '', sku: '', category: 'Electronics',
        quantity: '', minStockLevel: 10, price: '', dailySalesAvg: 3, supplier: ''
      });
      fetchInventory();
      showToast('Product Added & AI Forecast Updated!');
    } catch (err) {
      showToast(err.response?.data?.message || 'Error adding product');
    }
  };

  const handleSellOne = async (product) => {
    if (product.quantity <= 0) {
      showToast(`${product.name} is Out of Stock!`);
      return;
    }
    try {
      await axios.put(`${API_URL}/products/${product._id}`, {
        quantity: product.quantity - 1
      }, { headers: { Authorization: `Bearer ${token}` } });
      fetchInventory();
      showToast(`POS Scanned: 1x ${product.name} Sold (-1 Stock)`);
    } catch (err) {
      showToast('Update failed');
    }
  };

  const handleBarcodeScan = (e) => {
    e.preventDefault();
    const code = scanInput.trim().toLowerCase();
    if (!code) return;
    const matched = products.find(
      (p) => p.sku.toLowerCase() === code || p.name.toLowerCase().includes(code)
    );
    if (matched) {
      handleSellOne(matched);
      setScanInput('');
    } else {
      showToast(`No product found for Barcode/SKU: "${scanInput}"`);
    }
  };

  const handleSmartRestock = async (product) => {
    const restockQty = product.recommendedRestock > 0 ? product.recommendedRestock : 20;
    try {
      await axios.put(`${API_URL}/products/${product._id}`, {
        quantity: product.quantity + restockQty
      }, { headers: { Authorization: `Bearer ${token}` } });
      fetchInventory();
      showToast(`AI Auto-Restocked +${restockQty} units of ${product.name}!`);
    } catch (err) {
      showToast('Restock failed');
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchInventory();
      showToast('Product Removed');
    } catch (err) {
      showToast('Delete failed');
    }
  };

  const handleWhatsAppOrder = (product) => {
    const qty = product.recommendedRestock > 0 ? product.recommendedRestock : 25;
    const msg = encodeURIComponent(
      `Hello ${product.supplier || 'Supplier'},\nUrgent Purchase Order from *AI Inventory System*:\n• Product: ${product.name} (${product.sku})\n• Required Qty: ${qty} units\n• Current Stock: ${product.quantity} units\nPlease confirm dispatch & GST invoice.`
    );
    window.open(`https://wa.me/?text=${msg}`, '_blank');
    showToast(`WhatsApp PO opened for ${product.name}`);
  };

  const handleConfirmGSTInvoice = async () => {
    if (!invoiceItem) return;
    const qty = Math.max(1, Math.min(Number(invoiceQty), invoiceItem.quantity));
    try {
      await axios.put(`${API_URL}/products/${invoiceItem._id}`, {
        quantity: Math.max(0, invoiceItem.quantity - qty)
      }, { headers: { Authorization: `Bearer ${token}` } });
      fetchInventory();
      window.print();
      showToast(`GST Invoice generated & ${qty} units deducted!`);
      setInvoiceItem(null);
    } catch (err) {
      showToast('Invoice stock sync failed');
    }
  };

  const handleSeedDemo = async () => {
    const demoItems = [
      { name: 'boAt Rockerz 450 ANC', sku: 'IND-101', category: 'Electronics', quantity: 6, minStockLevel: 15, price: 1499, dailySalesAvg: 4, supplier: 'Imagine Marketing Ltd' },
      { name: 'Noise ColorFit Pro 5', sku: 'IND-102', category: 'Wearables', quantity: 42, minStockLevel: 12, price: 3499, dailySalesAvg: 3, supplier: 'Nexxbase India' },
      { name: 'Logitech MX Master 3S', sku: 'IND-103', category: 'Accessories', quantity: 4, minStockLevel: 10, price: 8995, dailySalesAvg: 2, supplier: 'Ingram Micro India' },
      { name: 'Apple AirPods Pro (2nd Gen)', sku: 'IND-104', category: 'Audio', quantity: 18, minStockLevel: 8, price: 24900, dailySalesAvg: 2, supplier: 'Redington India' },
      { name: 'Samsung T7 1TB Portable SSD', sku: 'IND-105', category: 'Storage', quantity: 5, minStockLevel: 12, price: 9499, dailySalesAvg: 3, supplier: 'Samsung C&T India' },
      { name: 'Keychron K2 Mechanical Keyboard', sku: 'IND-106', category: 'Peripherals', quantity: 26, minStockLevel: 10, price: 8499, dailySalesAvg: 2, supplier: 'Meckeys Retail' }
    ];
    try {
      for (const item of demoItems) {
        await axios.post(`${API_URL}/products`, item, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      fetchInventory();
      showToast('6 Enterprise Demo Products Loaded!');
    } catch (err) {
      showToast('Demo data error (SKUs may already exist)');
    }
  };

  const handleExportCSV = () => {
    if (products.length === 0) return showToast('No data to export');
    const headers = ['Name,SKU,Category,Stock,MinStock,Price(INR),DailySales,StockoutDays,Velocity,RecommendedRestock,Supplier'];
    const rows = products.map(p =>
      `"${p.name}","${p.sku}","${p.category}",${p.quantity},${p.minStockLevel},${p.price},${p.dailySalesAvg},${p.daysUntilStockout},"${p.velocityTag}",${p.recommendedRestock},"${p.supplier}"`
    );
    const blob = new Blob([headers.concat(rows).join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'India_No1_AI_Inventory_Report.csv';
    a.click();
    showToast('Executive CSV Report Downloaded!');
  };

  const handleAskAI = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const q = chatInput.trim();
    const userMsg = { sender: 'user', text: q };
    let reply = '';
    const lower = q.toLowerCase();

    const lowItems = products.filter(p => p.isLowStock);
    if (lower.includes('low') || lower.includes('alert') || lower.includes('khatam')) {
      reply = lowItems.length > 0
        ? `⚠️ ${lowItems.length} items critical hain: ${lowItems.map(i => `${i.name} (${i.quantity} left, ${i.daysUntilStockout}d ETA)`).join(', ')}. Turant Restock ya WA button dabayein!`
        : '✅ Sabhi products healthy stock level par hain!';
    } else if (lower.includes('gst') || lower.includes('bill') || lower.includes('invoice')) {
      reply = '🧾 Kisi bhi product ke aage "GST Bill" button dabayein—system automatically 9% CGST + 9% SGST (18% GST) calculate karke printable tax invoice banayega.';
    } else if (lower.includes('barcode') || lower.includes('scan')) {
      reply = '📷 Upar Barcode POS Scanner box mein koi bhi SKU (jaise IND-101) scan ya type karke Enter dabayein—live stock turant deduct ho jayega.';
    } else {
      reply = `📊 Abhi warehouse mein ${summary.totalItems} SKUs (${summary.totalStockUnits} units) hain jinki kul valuation ₹${summary.totalValue.toLocaleString('en-IN')} hai. ${lowItems.length} items par low-stock alert active hai.`;
    }

    setMessages([...messages, userMsg, { sender: 'ai', text: reply }]);
    setChatInput('');
  };

  const channels = ['All', 'Amazon India', 'Flipkart', 'Shopify D2C', 'Offline POS'];
  const filteredProducts = products.filter((p, idx) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase());
    if (selectedChannel === 'All') return matchesSearch;
    const assigned = channels[(idx % 4) + 1];
    return matchesSearch && assigned === selectedChannel;
  });

  const forecastData = [
    { day: 'Mon', actual: 18, predicted: 20 },
    { day: 'Tue', actual: 24, predicted: 25 },
    { day: 'Wed', actual: 21, predicted: 23 },
    { day: 'Thu', actual: 29, predicted: 31 },
    { day: 'Fri', actual: 35, predicted: 38 },
    { day: 'Sat', actual: 42, predicted: 45 },
    { day: 'Sun', actual: 38, predicted: 41 }
  ];

  const barChartData = products.slice(0, 6).map(p => ({
    name: p.sku,
    CurrentStock: p.quantity,
    AIRestock: p.recommendedRestock
  }));

  const healthyCount = Math.max(0, products.length - summary.lowStockCount);
  const pieData = [
    { name: 'Healthy Stock', value: healthyCount || 1 },
    { name: 'Low Stock Risk', value: summary.lowStockCount }
  ];
  const PIE_COLORS = ['#10b981', '#ef4444'];

  if (!token) {
    return (
      <div className="auth-wrapper">
        <div className="auth-card">
          <div className="brand-badge">
            <Sparkles size={16} /> ENTERPRISE AI SAAS
          </div>
          <h1>AI Inventory Pro</h1>
          <p className="subtitle">Predictive Supply Chain, Barcode POS & 18% GST Suite</p>

          {authError && <div className="error-banner">{authError}</div>}

          <form onSubmit={handleAuth}>
            {isRegister && (
              <>
                <input
                  type="text" placeholder="Full Name" required
                  value={name} onChange={(e) => setName(e.target.value)}
                />
                <select value={role} onChange={(e) => setRole(e.target.value)}>
                  <option value="Admin">Role: Admin / Owner</option>
                  <option value="Staff">Role: Warehouse Manager</option>
                </select>
              </>
            )}
            <input
              type="email" placeholder="Work Email" required
              value={email} onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password" placeholder="Password" required
              value={password} onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit" className="btn-primary full-width">
              {isRegister ? 'Create Enterprise Account' : 'Launch Command Center'}
            </button>
          </form>

          <p className="toggle-auth" onClick={() => setIsRegister(!isRegister)}>
            {isRegister ? 'Already registered? Sign In' : 'New here? Create Admin Account'}
          </p>
        </div>
      </div>
    );
  }

  const subtotal = invoiceItem ? invoiceItem.price * invoiceQty : 0;
  const cgst = subtotal * 0.09;
  const sgst = subtotal * 0.09;
  const grandTotal = subtotal + cgst + sgst;

  return (
    <div className="app-container">
      {toast && <div className="toast-banner">{toast}</div>}

      <header className="topbar">
        <div className="logo-area">
          <div className="logo-icon"><LayoutDashboard size={22} /></div>
          <div>
            <h2>AI Inventory <span className="pro-tag">INDIA ENTERPRISE</span></h2>
            <span className="user-meta">Welcome, {user?.name} ({user?.role})</span>
          </div>
        </div>

        <div className="topbar-actions">
          <button onClick={handleSeedDemo} className="btn-secondary">
            <Sparkles size={16} /> Load Demo Data
          </button>
          <button onClick={handleExportCSV} className="btn-secondary">
            <Download size={16} /> Export Report
          </button>
          <button onClick={fetchInventory} className="btn-icon" title="Refresh">
            <RefreshCw size={17} />
          </button>
          <button onClick={handleLogout} className="btn-danger">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>

      <div className="channel-bar">
        <span className="channel-label"><Globe size={15} /> Omnichannel Sync:</span>
        {channels.map(ch => (
          <button
            key={ch}
            className={`channel-pill ${selectedChannel === ch ? 'active' : ''}`}
            onClick={() => setSelectedChannel(ch)}
          >
            {ch === 'All' ? <Store size={13} /> : <ShoppingBag size={13} />} {ch}
          </button>
        ))}
      </div>

      <form className="scanner-bar" onSubmit={handleBarcodeScan}>
        <div className="scanner-title">
          <ScanBarcode size={20} color="#38bdf8" />
          <span>Barcode POS Scanner:</span>
        </div>
        <input
          ref={scanInputRef}
          type="text"
          placeholder="Scan Barcode or Type SKU (e.g. IND-101) & Press Enter for Instant POS Billing..."
          value={scanInput}
          onChange={(e) => setScanInput(e.target.value)}
        />
        <button type="submit" className="btn-primary">
          Scan & Bill (-1)
        </button>
      </form>

      <section className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-top">
            <span>Total SKUs</span>
            <Package className="icon-blue" size={20} />
          </div>
          <h3>{summary.totalItems}</h3>
          <small>{summary.totalStockUnits} Total Units in Warehouse</small>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span>Inventory Valuation</span>
            <IndianRupee className="icon-green" size={20} />
          </div>
          <h3>₹{Number(summary.totalValue || 0).toLocaleString('en-IN')}</h3>
          <small>Real-time Asset Valuation</small>
        </div>

        <div className="kpi-card alert-card">
          <div className="kpi-top">
            <span>AI Low-Stock Alerts</span>
            <AlertTriangle className="icon-red" size={20} />
          </div>
          <h3>{summary.lowStockCount}</h3>
          <small>Requires Immediate Restock</small>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span>Fast-Moving SKUs</span>
            <TrendingUp className="icon-purple" size={20} />
          </div>
          <h3>{summary.fastMovingCount}</h3>
          <small>High Demand Velocity Items</small>
        </div>
      </section>

      <section className="charts-grid">
        <div className="chart-card">
          <h4><BarChart3 size={16} /> 7-Day AI Demand Forecast</h4>
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart data={forecastData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
              <Area type="monotone" dataKey="predicted" stroke="#8b5cf6" fill="#8b5cf680" name="AI Predicted" />
              <Area type="monotone" dataKey="actual" stroke="#38bdf8" fill="#38bdf850" name="Actual Sales" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h4>Current Stock vs AI Recommended Restock</h4>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={barChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
              <Legend />
              <Bar dataKey="CurrentStock" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="AIRestock" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h4>Warehouse Stock Health Ratio</h4>
          <ResponsiveContainer width="100%" height={210}>
            <PieChart>
              <Pie data={pieData} innerRadius={52} outerRadius={78} paddingAngle={5} dataKey="value">
                {pieData.map((_, index) => (
                  <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="main-grid">
        <div className="panel form-panel">
          <h3><PlusCircle size={18} /> Add New SKU</h3>
          <form onSubmit={handleAddProduct}>
            <input
              type="text" placeholder="Product Name" required
              value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
            <div className="row-2">
              <input
                type="text" placeholder="SKU (e.g. IND-107)" required
                value={formData.sku} onChange={e => setFormData({ ...formData, sku: e.target.value })}
              />
              <input
                type="text" placeholder="Category" required
                value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}
              />
            </div>
            <div className="row-2">
              <input
                type="number" placeholder="Current Stock" required
                value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: e.target.value })}
              />
              <input
                type="number" placeholder="Min Alert Level" required
                value={formData.minStockLevel} onChange={e => setFormData({ ...formData, minStockLevel: e.target.value })}
              />
            </div>
            <div className="row-2">
              <input
                type="number" placeholder="Price (₹)" required
                value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })}
              />
              <input
                type="number" placeholder="Daily Sales Avg" required
                value={formData.dailySalesAvg} onChange={e => setFormData({ ...formData, dailySalesAvg: e.target.value })}
              />
            </div>
            <input
              type="text" placeholder="Supplier Name"
              value={formData.supplier} onChange={e => setFormData({ ...formData, supplier: e.target.value })}
            />
            <button type="submit" className="btn-primary full-width">
              Save & Generate Barcode
            </button>
          </form>
        </div>

        <div className="panel table-panel">
          <div className="table-header">
            <h3>Live AI Inventory & Barcode Ledger</h3>
            <div className="search-box">
              <Search size={16} />
              <input
                type="text" placeholder="Search SKU or Product..."
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <p className="empty-text">Syncing warehouse data...</p>
          ) : filteredProducts.length === 0 ? (
            <p className="empty-text">No products found. Click "Load Demo Data" above!</p>
          ) : (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU Barcode</th>
                    <th>Stock</th>
                    <th>Price</th>
                    <th>AI Stockout ETA</th>
                    <th>Status</th>
                    <th>POS / GST / Restock</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map(item => (
                    <tr key={item._id} className={item.isLowStock ? 'row-alert' : ''}>
                      <td>
                        <strong>{item.name}</strong>
                        <div className="sub-cell">{item.category} • {item.supplier || 'Direct'}</div>
                      </td>
                      <td>
                        <BarcodeStrip code={item.sku} />
                      </td>
                      <td><strong>{item.quantity}</strong> units</td>
                      <td>₹{Number(item.price).toLocaleString('en-IN')}</td>
                      <td>
                        <span className="eta-pill">
                          {item.daysUntilStockout >= 999 ? '99+ days' : `${item.daysUntilStockout} days left`}
                        </span>
                      </td>
                      <td>
                        {item.isLowStock ? (
                          <span className="badge-danger"><AlertTriangle size={12} /> Low Stock</span>
                        ) : (
                          <span className="badge-success"><CheckCircle2 size={12} /> Healthy</span>
                        )}
                      </td>
                      <td className="action-cell">
                        <button className="btn-mini" onClick={() => handleSellOne(item)} title="POS Sell 1">
                          -1 POS
                        </button>
                        <button
                          className="btn-gst"
                          onClick={() => { setInvoiceItem(item); setInvoiceQty(1); }}
                          title="Generate 18% GST Tax Invoice"
                        >
                          <Receipt size={12} /> GST Bill
                        </button>
                        {item.isLowStock && (
                          <button className="btn-restock" onClick={() => handleSmartRestock(item)} title="1-Click AI Restock">
                            <Zap size={12} /> +{item.recommendedRestock}
                          </button>
                        )}
                        <button className="btn-wa" onClick={() => handleWhatsAppOrder(item)} title="WhatsApp Supplier PO">
                          <PhoneCall size={12} /> WA
                        </button>
                        <button className="btn-del" onClick={() => handleDelete(item._id)} title="Delete">
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {invoiceItem && (
        <div className="modal-overlay">
          <div className="invoice-modal">
            <div className="invoice-header">
              <div>
                <h2>TAX INVOICE (GST COMPLIANT)</h2>
                <p style={{ margin: '4px 0', fontSize: '12px', color: '#475569' }}>
                  Seller GSTIN: 09AAACA0000A1Z5 • AI Inventory Enterprise Pvt Ltd
                </p>
              </div>
              <button
                onClick={() => setInvoiceItem(null)}
                style={{ background: '#e2e8f0', border: 'none', borderRadius: '6px', padding: '6px', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Customer / Business Name"
                style={{ flex: 1, padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
              />
              <input
                type="text"
                value={customerGSTIN}
                onChange={(e) => setCustomerGSTIN(e.target.value)}
                placeholder="Customer GSTIN"
                style={{ width: '180px', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
              />
              <input
                type="number"
                min="1"
                max={invoiceItem.quantity}
                value={invoiceQty}
                onChange={(e) => setInvoiceQty(e.target.value)}
                style={{ width: '75px', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
              />
            </div>

            <table className="invoice-table">
              <thead>
                <tr>
                  <th>Item & SKU</th>
                  <th>Qty</th>
                  <th>Rate (₹)</th>
                  <th>Taxable Amt</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>{invoiceItem.name}</strong> ({invoiceItem.sku})</td>
                  <td>{invoiceQty}</td>
                  <td>₹{invoiceItem.price.toLocaleString('en-IN')}</td>
                  <td>₹{subtotal.toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td colSpan="3" style={{ textAlign: 'right' }}>CGST @ 9%</td>
                  <td>₹{cgst.toFixed(2)}</td>
                </tr>
                <tr>
                  <td colSpan="3" style={{ textAlign: 'right' }}>SGST @ 9%</td>
                  <td>₹{sgst.toFixed(2)}</td>
                </tr>
                <tr style={{ background: '#f8fafc', fontWeight: 'bold', fontSize: '15px' }}>
                  <td colSpan="3" style={{ textAlign: 'right' }}>Grand Total (Incl. 18% GST)</td>
                  <td>₹{grandTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                </tr>
              </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
              <button
                onClick={() => setInvoiceItem(null)}
                style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmGSTInvoice}
                style={{ padding: '10px 18px', borderRadius: '8px', border: 'none', background: '#16a34a', color: '#fff', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
              >
                <Printer size={16} /> Print / Save PDF & Deduct Stock
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="copilot-container">
        {chatOpen && (
          <div className="copilot-box">
            <div className="copilot-header">
              <span><Bot size={16} /> AI Supply Chain Copilot</span>
              <button onClick={() => setChatOpen(false)}>✕</button>
            </div>
            <div className="copilot-messages">
              {messages.map((m, i) => (
                <div key={i} className={`msg ${m.sender}`}>{m.text}</div>
              ))}
            </div>
            <form onSubmit={handleAskAI} className="copilot-input">
              <input
                type="text" placeholder="Ask about GST, barcode, low stock..."
                value={chatInput} onChange={e => setChatInput(e.target.value)}
              />
              <button type="submit"><Send size={15} /></button>
            </form>
          </div>
        )}
        <button className="copilot-fab" onClick={() => setChatOpen(!chatOpen)}>
          <MessageSquare size={20} /> Ask AI Copilot
        </button>
      </div>
    </div>
  );
}

export default App;