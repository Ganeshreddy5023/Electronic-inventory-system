import React, { useState } from 'react';
import { User, Lock, Mail, ArrowRight, Zap, ShieldCheck, Cpu, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

const Auth = ({ onLoginSuccess, showNotify }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        email: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const endpoint = isLogin ? 'login' : 'register';

        try {
            const res = await axios.post(`${API_BASE}/${endpoint}`, formData);
            console.log(`Auth response (${endpoint}):`, res.data);
            if (isLogin) {
                showNotify("Login successful.");
                onLoginSuccess(res.data.user);
            } else {
                showNotify("Account created successfully.");
                setIsLogin(true);
            }
        } catch (err) {
            console.error(`Auth error (${endpoint}):`, err.response?.data || err.message);
            showNotify(err.response?.data?.error || "Login failed.", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-mesh-bg"></div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="auth-card glass-card"
            >
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <div className="auth-icon-badge">
                        <Zap size={32} color="white" fill="white" />
                    </div>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'white', letterSpacing: '-0.02em', margin: '20px 0 8px' }}>
                        Electro<span style={{ opacity: 0.6 }}>Ware</span>
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.9rem', letterSpacing: '2px', textTransform: 'uppercase' }}>
                        {isLogin ? 'Sign In' : 'Create Account'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {!isLogin && (
                        <div className="input-group">
                            <Mail className="input-icon" size={18} />
                            <input
                                type="email"
                                placeholder="EMAIL"
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                    )}

                    <div className="input-group">
                        <User className="input-icon" size={18} />
                        <input
                            type="text"
                            placeholder="USERNAME"
                            required
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        />
                    </div>

                    <div className="input-group">
                        <Lock className="input-icon" size={18} />
                        <input
                            type="password"
                            placeholder="PASSWORD"
                            required
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02, boxShadow: '0 0 20px var(--accent-glow)' }}
                        whileTap={{ scale: 0.98 }}
                        className="btn-primary auth-submit"
                        disabled={loading}
                    >
                        {loading ? (
                            <RefreshCw className="animate-spin" size={20} />
                        ) : (
                            <>
                                {isLogin ? 'SIGN IN' : 'SIGN UP'}
                                <ArrowRight size={20} style={{ marginLeft: '12px' }} />
                            </>
                        )}
                    </motion.button>
                </form>

                <div style={{ marginTop: '32px', textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', fontWeight: 600 }}>
                        {isLogin ? "Need an account?" : "Already have an account?"}
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--accent)',
                                fontWeight: 800,
                                marginLeft: '8px',
                                cursor: 'pointer',
                                textDecoration: 'underline'
                            }}
                        >
                            {isLogin ? 'Sign Up' : 'Sign In'}
                        </button>
                    </p>
                </div>

                <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'center', gap: '24px' }}>
                    <div className="status-indicator">
                        <ShieldCheck size={14} color="var(--success)" />
                        <span>SECURE</span>
                    </div>
                    <div className="status-indicator">
                        <Cpu size={14} color="var(--accent)" />
                        <span>AI POWERED</span>
                    </div>
                </div>
            </motion.div>

            <style>{`
        .auth-container {
          height: 100vh;
          width: 100vw;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #020617;
          overflow: hidden;
          position: relative;
        }

        .auth-mesh-bg {
          position: absolute;
          width: 100%;
          height: 100%;
          background: 
            radial-gradient(circle at 20% 30%, rgba(56, 189, 248, 0.15) 0%, transparent 40%),
            radial-gradient(circle at 80% 70%, rgba(99, 102, 241, 0.15) 0%, transparent 40%);
          filter: blur(80px);
        }

        .auth-card {
          width: 100%;
          max-width: 440px;
          padding: 60px 48px;
          z-index: 10;
          background: rgba(15, 23, 42, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .auth-icon-badge {
          background: var(--accent);
          width: 64px;
          height: 64px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto;
          box-shadow: 0 8px 32px var(--accent-glow);
        }

        .input-group {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 16px;
          color: var(--text-dim);
          transition: color 0.3s ease;
        }

        .auth-card input {
          width: 100%;
          padding: 16px 16px 16px 48px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          color: white;
          font-weight: 600;
          font-size: 0.9rem;
          outline: none;
          transition: all 0.3s ease;
        }

        .auth-card input:focus {
          border-color: var(--accent);
          background: rgba(56, 189, 248, 0.05);
          box-shadow: 0 0 15px rgba(56, 189, 248, 0.1);
        }

        .auth-card input:focus + .input-icon {
          color: var(--accent);
        }

        .auth-submit {
          padding: 18px !important;
          font-weight: 800 !important;
          letter-spacing: 1px;
          margin-top: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .status-indicator {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 0.7rem;
            font-weight: 800;
            color: var(--text-dim);
            letter-spacing: 1px;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
        </div>
    );
};

export default Auth;
