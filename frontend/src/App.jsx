import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Package, TrendingUp, AlertCircle, ShoppingCart, Smartphone, Laptop, BarChart3,
  Settings, Bell, Search, Plus, Edit, Trash2, X, Check, Save, Activity, Layout,
  Globe, ChevronRight, RefreshCw, Cpu, Zap, CreditCard
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import Auth from './Auth';

const API_BASE = 'http://localhost:5000/api';

const formatINR = (value) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0
}).format(value);

const App = () => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [data, setData] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('dashboard');
  const [selectedCategory, setSelectedCategory] = useState('Smartphone');

  // UI States
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [currentProduct, setCurrentProduct] = useState({ name: '', category: 'Smartphone', current_stock: 0, price: 0, min_threshold: 20 });
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    if (user) {
      refreshAllData();
    }
  }, [user]);

  const refreshAllData = async () => {
    setLoading(true);
    try {
      const [dashRes, invRes] = await Promise.all([
        axios.get(`${API_BASE}/dashboard`),
        axios.get(`${API_BASE}/inventory`)
      ]);
      setData(dashRes.data);
      setInventory(invRes.data);

      const predRes = await axios.get(`${API_BASE}/predict?category=${selectedCategory}`);
      setPredictions(predRes.data);

      setLoading(false);
    } catch (err) {
      console.error("Error fetching data", err);
      setLoading(false);
    }
  };

  const showNotify = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handlePredict = async (cat) => {
    setSelectedCategory(cat);
    try {
      const res = await axios.get(`${API_BASE}/predict?category=${cat}`);
      setPredictions(res.data);
    } catch (err) {
      console.error("Prediction error", err);
    }
  };

  const handleDelete = async (name) => {
    if (window.confirm(`Delete ${name} permanently?`)) {
      try {
        await axios.delete(`${API_BASE}/product/${name}`);
        showNotify(`${name} removed from inventory`);
        refreshAllData();
      } catch (err) {
        showNotify("Failed to delete product", "error");
      }
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      if (modalMode === 'add') {
        await axios.post(`${API_BASE}/product`, currentProduct);
        showNotify("Product added successfully");
      } else {
        await axios.put(`${API_BASE}/product/${currentProduct.name}`, currentProduct);
        showNotify("Product updated successfully");
      }
      setShowModal(false);
      refreshAllData();
    } catch (err) {
      showNotify(err.response?.data?.error || "Error saving product", "error");
    }
  };

  const handleSell = async (name, quantity) => {
    try {
      showNotify(`Processing sale for ${name}...`, 'info');
      await axios.post(`${API_BASE}/sell`, { name, quantity });
      showNotify(`Transaction successful: -${quantity} units of ${name}`);
      refreshAllData();
    } catch (err) {
      showNotify(err.response?.data?.error || "Sale failed", "error");
    }
  };

  const handleRestock = async (name, quantity) => {
    try {
      showNotify(`Initiating restock for ${name}...`, 'info');
      await axios.post(`${API_BASE}/restock`, { name, quantity });
      showNotify(`Successfully added ${quantity} units to ${name}`);
      refreshAllData();
    } catch (err) {
      showNotify("Restock failed", "error");
    }
  };

  const openModal = (mode, product = null) => {
    setModalMode(mode);
    setCurrentProduct(product || { name: '', category: 'Smartphone', current_stock: 0, price: 0, min_threshold: 20 });
    setShowModal(true);
  };

  const handleLoginSuccess = (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const SidebarItem = ({ id, icon: Icon, label }) => (
    <motion.div
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => setActiveView(id)}
      className={`sidebar-item ${activeView === id ? 'active' : ''}`}
    >
      <Icon size={20} strokeWidth={2.5} />
      <span style={{ fontWeight: 700, letterSpacing: '-0.02em' }}>{label}</span>
      {id === 'orders' && data?.stats.low_stock_count > 0 && (
        <div style={{ marginLeft: 'auto', background: 'var(--danger)', color: 'white', fontSize: '10px', padding: '2px 8px', borderRadius: '10px', fontWeight: 900 }}>
          {data.stats.low_stock_count}
        </div>
      )}
    </motion.div>
  );

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setData(null);
    setLoading(true);
    showNotify("Session Terminated. Redirecting...");
  };

  if (!user) {
    return <Auth onLoginSuccess={handleLoginSuccess} showNotify={showNotify} />;
  }

  if (loading || !data) return (
    <div style={{ background: 'var(--bg-main)', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <Cpu size={64} strokeWidth={1.5} className="animate-pulse" color="var(--accent)" />
      <p style={{ marginTop: '32px', color: 'var(--text-secondary)', letterSpacing: '4px', fontSize: '0.9rem', fontWeight: 700, fontFamily: 'var(--font-header)' }}>
        {loading ? 'CALIBRATING ELECTRO WARE' : 'SYSTEM OFFLINE'}
      </p>
      {!loading && !data && <button onClick={refreshAllData} className="btn-primary" style={{ marginTop: '32px' }}>REINITIALIZE</button>}
    </div>
  );

  const inventoryCats = [
    'Smartphone', 'Laptop', 'Tablet', 'Headphones', 'Smartwatch', 'Camera', 'TV', 'Charger', 'Accessory',
    'Gaming Console', 'Drone', 'VR Headset', 'Speaker', 'Projector'
  ];

  return (
    <div className="main-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <motion.div
          onClick={() => setActiveView('dashboard')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '64px', padding: '0 8px', cursor: 'pointer' }}
        >
          <div style={{ background: 'var(--accent)', padding: '10px', borderRadius: '12px', boxShadow: '0 8px 24px var(--accent-glow)' }}>
            <Zap size={24} color="white" fill="white" />
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'white', letterSpacing: '-0.02em', fontFamily: 'var(--font-header)' }}>Electro<span style={{ opacity: 0.6 }}>Ware</span></h2>
        </motion.div>

        <nav style={{ flex: 1 }}>
          <SidebarItem id="dashboard" icon={Layout} label="Dashboard" />
          <SidebarItem id="inventory" icon={Package} label="Products" />
          <SidebarItem id="analytics" icon={BarChart3} label="Predictions" />
          <SidebarItem id="sales" icon={CreditCard} label="Sales" />
          <SidebarItem id="orders" icon={ShoppingCart} label="Restock" />
        </nav>

        <div className="glass-card" style={{ padding: '16px', background: 'rgba(255,255,255,0.03)' }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600 }}>SYSTEM STATUS</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
            <div style={{ width: '8px', height: '8px', background: 'var(--success)', borderRadius: '50%' }}></div>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Active Node</span>
          </div>
        </div>

        <motion.button
          whileHover={{ x: 4 }}
          onClick={handleLogout}
          className="sidebar-item"
          style={{ marginTop: 'auto', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: '1px solid rgba(239, 68, 68, 0.2)' }}
        >
          <X size={20} />
          <span style={{ fontWeight: 700 }}>Terminate Session</span>
        </motion.button>
      </aside>

      {/* Main Content */}
      <main className="content">
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -50, opacity: 0 }}
              style={{ position: 'fixed', top: '24px', right: '24px', zIndex: 1000 }}
            >
              <div className="glass-card" style={{
                background: notification.type === 'error' ? 'var(--danger)' : 'var(--bg-color)',
                padding: '12px 24px', border: '1px solid var(--card-border)',
                display: 'flex', alignItems: 'center', gap: '12px'
              }}>
                <AlertCircle size={18} color="white" />
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{notification.msg}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '64px' }}>
          <div>
            <h1 style={{ fontSize: '3.5rem', fontWeight: 800, margin: 0, lineHeight: 1 }}>
              {activeView === 'dashboard' && 'Dashboard'}
              {activeView === 'inventory' && 'Product List'}
              {activeView === 'analytics' && 'Demand Predictions'}
              {activeView === 'sales' && 'Sales Terminal'}
              {activeView === 'orders' && 'Restock Center'}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginTop: '16px', fontWeight: 500 }}>{data.stats.total_products} active assets under management</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={refreshAllData} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 28px' }}
          >
            <RefreshCw size={20} strokeWidth={2.5} /> Synchronize
          </motion.button>
        </header>

        {activeView === 'dashboard' && (
          <motion.div
            initial="hidden" animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: { opacity: 1, transition: { staggerChildren: 0.1 } }
            }}
            className="kpi-grid"
          >
            <motion.div variants={{ hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1 } }} className="glass-card">
              <p style={{ color: 'var(--text-dim)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Repository Size</p>
              <h2 style={{ fontSize: '2.5rem', marginTop: '12px', fontWeight: 700 }}>{data.stats.total_products}</h2>
            </motion.div>

            <motion.div variants={{ hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1 } }} className="glass-card">
              <p style={{ color: 'var(--text-dim)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Estimated Valuation</p>
              <h2 style={{ fontSize: '2.5rem', marginTop: '12px', fontWeight: 700, color: 'var(--accent)' }}>{formatINR(data.stats.stock_value)}</h2>
            </motion.div>

            <motion.div variants={{ hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1 } }} className="glass-card">
              <p style={{ color: 'var(--text-dim)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Anomalies Detected</p>
              <h2 style={{ fontSize: '2.5rem', marginTop: '12px', fontWeight: 700, color: data.stats.low_stock_count > 0 ? 'var(--danger)' : 'var(--success)' }}>
                {data.stats.low_stock_count}
              </h2>
            </motion.div>

            <motion.div variants={{ hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1 } }} className="glass-card bento-large">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <h3 style={{ margin: 0, fontSize: '1.4rem' }}>Global Velocity</h3>
                <div className="badge badge-success">Live Stream</div>
              </div>
              <div style={{ height: '340px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.sales_trend}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                    <XAxis dataKey="date" hide />
                    <Tooltip
                      contentStyle={{ background: 'var(--glass-thick)', border: '1px solid var(--glass-border)', borderRadius: '12px', backdropFilter: 'blur(10px)' }}
                      itemStyle={{ color: 'white', fontWeight: 700 }}
                    />
                    <Area type="monotone" dataKey="quantity_sold" stroke="var(--accent)" strokeWidth={4} fillOpacity={1} fill="url(#colorSales)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            <motion.div variants={{ hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1 } }} className="glass-card bento-medium">
              <h3 style={{ marginBottom: '24px', fontSize: '1.4rem' }}>Restock Alerts</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {data.recommendations.slice(0, 5).map((rec, i) => (
                  <div key={i} style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <p style={{ fontWeight: 700, fontSize: '0.95rem', margin: 0 }}>{rec.product}</p>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 600 }}>{rec.priority.toUpperCase()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', alignItems: 'center' }}>
                      <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>Suggest +{rec.suggested_order}</span>
                      <motion.button
                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        className="btn-restock" style={{ fontSize: '0.7rem' }}
                        onClick={() => handleRestock(rec.product, rec.suggested_order)}
                      >
                        Execute
                      </motion.button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}

        {activeView === 'inventory' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="animate-in"
          >
            <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
              <div className="glass-card" style={{ flex: 1, padding: '14px 24px', display: 'flex', alignItems: 'center', gap: '16px', background: 'var(--glass-thick)' }}>
                <Search size={20} color="var(--accent)" strokeWidth={2.5} />
                <input
                  type="text" placeholder="Filter repository by asset name..."
                  style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', width: '100%', fontWeight: 600, fontSize: '1rem' }}
                  value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <select
                className="glass-card"
                style={{ padding: '0 24px', background: 'var(--glass-thick)', color: 'white', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}
                value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="All" style={{ background: '#020617' }}>SEGMENT: ALL</option>
                {inventoryCats.map(c => <option key={c} value={c} style={{ background: '#020617' }}>{c.toUpperCase()}</option>)}
              </select>
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
                onClick={() => openModal('add')}
              >
                <Plus size={20} strokeWidth={3} /> Register Asset
              </motion.button>
            </div>

            <div className="glass-card" style={{ padding: '0', overflow: 'hidden', background: 'var(--glass-thick)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <th style={{ textAlign: 'left', padding: '16px' }}>Product Name</th>
                    <th style={{ textAlign: 'left', padding: '16px' }}>Category</th>
                    <th style={{ textAlign: 'left', padding: '16px' }}>Stock Level</th>
                    <th style={{ textAlign: 'left', padding: '16px' }}>Price</th>
                    <th style={{ textAlign: 'left', padding: '16px' }}>Status</th>
                    <th style={{ textAlign: 'right', padding: '16px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.filter(i =>
                    i.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
                    (categoryFilter === 'All' || i.category === categoryFilter)
                  ).map((item, i) => (
                    <motion.tr
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                      key={i} style={{ borderBottom: '1px solid var(--glass-border)' }}
                    >
                      <td style={{ fontWeight: 700, color: 'white', padding: '16px' }}>{item.name}</td>
                      <td style={{ color: 'var(--text-dim)', fontWeight: 500, padding: '16px' }}>{item.category}</td>
                      <td style={{ fontWeight: 600, padding: '16px' }}>{item.current_stock}</td>
                      <td style={{ fontWeight: 700, color: 'var(--accent)', padding: '16px' }}>{formatINR(item.price)}</td>
                      <td style={{ padding: '16px' }}>
                        <span className={`badge ${item.current_stock > item.min_threshold ? 'badge-success' : 'badge-danger'}`}>
                          {item.current_stock > item.min_threshold ? 'Optimal' : 'Depleted'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', padding: '16px' }}>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                          <motion.button whileHover={{ scale: 1.1 }} onClick={() => openModal('edit', item)} className="btn-restock" style={{ padding: '8px', borderRadius: '50%' }}><Edit size={16} /></motion.button>
                          <motion.button whileHover={{ scale: 1.1 }} onClick={() => handleDelete(item.name)} className="btn-restock" style={{ padding: '8px', color: 'var(--danger)', borderRadius: '50%' }}><Trash2 size={16} /></motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {activeView === 'analytics' && (
          <motion.div
            initial="hidden" animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: { opacity: 1, transition: { staggerChildren: 0.1 } }
            }}
          >
            <motion.div variants={{ hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1 } }} className="glass-card" style={{ marginBottom: '32px', background: 'var(--glass-thick)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.6rem' }}>Demand Predictor</h3>
                  <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginTop: '4px' }}>Predict future product demand using AI.</p>
                </div>
                <div className="badge badge-warning">30-Day Outlook</div>
              </div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {inventoryCats.map(cat => (
                  <motion.button
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    key={cat}
                    onClick={() => handlePredict(cat)}
                    className={`btn-restock ${selectedCategory === cat ? 'active' : ''}`}
                  >
                    {cat.toUpperCase()}
                  </motion.button>
                ))}
              </div>
            </motion.div>

            <motion.div variants={{ hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1 } }} className="glass-card" style={{ height: '440px', background: 'var(--glass-thick)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <h3 style={{ margin: 0, fontSize: '1.4rem' }}>{selectedCategory} Velocity Curve</h3>
                <div style={{ display: 'flex', gap: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', background: 'var(--accent)', borderRadius: '50%' }}></div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)' }}>PROJECTION</span>
                  </div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={predictions}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis dataKey="date" hide />
                  <Tooltip
                    contentStyle={{ background: 'var(--glass-thick)', border: '1px solid var(--glass-border)', borderRadius: '12px', backdropFilter: 'blur(10px)' }}
                    itemStyle={{ color: 'white', fontWeight: 700 }}
                  />
                  <Line type="monotone" dataKey="predicted_demand" stroke="var(--accent)" strokeWidth={4} dot={false} animationDuration={1000} />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>
          </motion.div>
        )}

        {activeView === 'sales' && (
          <motion.div
            initial="hidden" animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: { opacity: 1, transition: { staggerChildren: 0.05 } }
            }}
          >
            <div className="glass-card" style={{ marginBottom: '32px', background: 'var(--glass-thick)', border: '1px solid var(--accent-glow)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.6rem' }}>Terminal Interface</h3>
                  <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginTop: '4px' }}>Process high-velocity asset transfers across the global registry.</p>
                </div>
                <div className="badge badge-success">Encrypted Connection</div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginBottom: '8px', overflowX: 'auto', paddingBottom: '16px', whiteSpace: 'nowrap' }} className="custom-scrollbar">
                <motion.button
                  whileHover={{ y: -2 }}
                  onClick={() => setCategoryFilter('All')}
                  className={`btn-restock ${categoryFilter === 'All' ? 'active' : ''}`}
                >
                  ALL SEGMENTS
                </motion.button>
                {inventoryCats.map(cat => (
                  <motion.button
                    whileHover={{ y: -2 }}
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`btn-restock ${categoryFilter === cat ? 'active' : ''}`}
                  >
                    {cat.toUpperCase()}
                  </motion.button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
              {inventory.filter(i =>
                i.current_stock > 0 &&
                (categoryFilter === 'All' || i.category === categoryFilter)
              ).map((item, i) => (
                <motion.div
                  variants={{ hidden: { opacity: 0, scale: 0.9 }, show: { opacity: 1, scale: 1 } }}
                  key={i} className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', background: 'var(--glass-thick)' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <p style={{ fontWeight: 800, fontSize: '1.1rem', margin: 0, color: 'white' }}>{item.name}</p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '4px', fontWeight: 600 }}>{item.category} • {formatINR(item.price)}</p>
                    </div>
                    <span className={`badge ${item.current_stock < 10 ? 'badge-danger' : 'badge-success'}`}>
                      {item.current_stock} units
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <input
                      type="number" min="1" max={item.current_stock} defaultValue="1" id={`qty-${i}`}
                      className="glass-card" style={{ width: '80px', padding: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', color: 'white', textAlign: 'center', fontWeight: 700, borderRadius: '12px' }}
                    />
                    <motion.button
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      className="btn-primary" style={{ flex: 1, fontSize: '0.9rem' }}
                      onClick={() => {
                        const qty = parseInt(document.getElementById(`qty-${i}`).value);
                        handleSell(item.name, qty);
                      }}
                    >
                      Confirm Order
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {activeView === 'orders' && (
          <motion.div
            initial="hidden" animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: { opacity: 1, transition: { staggerChildren: 0.1 } }
            }}
            className="animate-in"
          >
            <div className="glass-card" style={{ marginBottom: '32px', background: 'var(--glass-thick)', border: '1px solid var(--accent-glow)' }}>
              <h3 style={{ margin: 0, fontSize: '1.6rem' }}>Restock Queue</h3>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginTop: '4px' }}>Optimize logistical loops based on projected supply-chain stress.</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {data.recommendations.map((rec, i) => (
                <motion.div
                  variants={{ hidden: { opacity: 0, x: -20 }, show: { opacity: 1, x: 0 } }}
                  key={i} className="glass-card" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1.2fr', alignItems: 'center', background: 'var(--glass-thick)' }}
                >
                  <div>
                    <p style={{ fontWeight: 800, fontSize: '1.1rem', margin: 0, color: 'white' }}>{rec.product}</p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginTop: '4px', fontWeight: 500 }}>30D Projection: {rec.predicted_demand_30d} units</p>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 700, letterSpacing: '0.05em' }}>REGISTRY</p>
                    <p style={{ fontWeight: 800, color: 'var(--danger)', fontSize: '1.2rem', margin: '4px 0' }}>{rec.current_stock}</p>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 700, letterSpacing: '0.05em' }}>PROPOSAL</p>
                    <p style={{ fontWeight: 800, color: 'var(--accent)', fontSize: '1.2rem', margin: '4px 0' }}>+{rec.suggested_order}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <motion.button
                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      className="btn-primary" style={{ padding: '12px 24px' }}
                      onClick={() => handleRestock(rec.product, rec.suggested_order)}
                    >
                      Authorize Loop
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Modal */}
        {showModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card" style={{ width: '400px', background: '#0f172a' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3>{modalMode === 'add' ? 'Add New Product' : 'Edit Product'}</h3>
                <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X /></button>
              </div>
              <form onSubmit={handleSaveProduct}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.8rem' }}>Name</label>
                  <input
                    type="text" required disabled={modalMode === 'edit'} className="glass-card" style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--card-border)', color: 'white' }}
                    value={currentProduct.name} onChange={(e) => setCurrentProduct({ ...currentProduct, name: e.target.value })}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.8rem' }}>Category</label>
                    <select className="glass-card" style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--card-border)', color: 'white' }} value={currentProduct.category} onChange={(e) => setCurrentProduct({ ...currentProduct, category: e.target.value })}>
                      {inventoryCats.map(c => <option key={c} value={c} style={{ background: '#0f172a' }}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.8rem' }}>Price</label>
                    <input type="number" required className="glass-card" style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--card-border)', color: 'white' }} value={currentProduct.price} onChange={(e) => setCurrentProduct({ ...currentProduct, price: e.target.value })} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.8rem' }}>Stock</label>
                    <input type="number" required className="glass-card" style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--card-border)', color: 'white' }} value={currentProduct.current_stock} onChange={(e) => setCurrentProduct({ ...currentProduct, current_stock: e.target.value })} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.8rem' }}>Threshold</label>
                    <input type="number" required className="glass-card" style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--card-border)', color: 'white' }} value={currentProduct.min_threshold} onChange={(e) => setCurrentProduct({ ...currentProduct, min_threshold: e.target.value })} />
                  </div>
                </div>
                <button type="submit" className="btn-primary" style={{ width: '100%', padding: '12px' }}>
                  {modalMode === 'add' ? 'Register Product' : 'Apply Changes'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
