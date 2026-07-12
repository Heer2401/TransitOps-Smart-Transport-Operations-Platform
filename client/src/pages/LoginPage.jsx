import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import loginHero from '../assets/login_hero.png';

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'dispatcher'
  });
  
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isLogin) {
        await login(form.email, form.password);
      } else {
        await register(form);
      }
      toast.success(`Welcome to TransitOps${isLogin ? '' : ' — Account created!'}`, { theme: 'dark' });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = async (email) => {
    setForm({ ...form, email, password: 'password123' });
    setLoading(true);
    try {
      await login(email, 'password123');
      toast.success('Demo login successful!', { theme: 'dark' });
      navigate('/');
    } catch {
      toast.error('Demo user not found. Please seed the database first.', { theme: 'dark' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg"></div>
      
      <div className="auth-container">
        {/* Left Column: Visual Illustration */}
        <div className="auth-illustration">
          <img src={loginHero} alt="TransitOps Hub" className="auth-illustration-img" />
          <div className="auth-illustration-info">
            <h2>Optimize Fleet Logistics</h2>
            <p>Monitor real-time sensor telematics, manage driver safety audits, track maintenance lifecycles, and gain visual business metrics.</p>
          </div>
        </div>

        {/* Right Column: Card Form */}
        <div className="auth-card">
          <div className="auth-logo">
            <div className="auth-logo-icon">🚌</div>
            <h1>TransitOps</h1>
            <p>Smart Transport Operations Platform</p>
          </div>

          {error && (
            <div className="alert alert-error">
              ⚠️ {error}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  name="name"
                  placeholder="Enter your full name"
                  value={form.name}
                  onChange={handleChange}
                  required={!isLogin}
                />
              </div>
            )}

            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                name="email"
                placeholder="your@email.com"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                name="password"
                placeholder="Min. 6 characters"
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>

            {!isLogin && (
              <div className="form-group">
                <label>Role</label>
                <select name="role" value={form.role} onChange={handleChange}>
                  <option value="dispatcher">Dispatcher</option>
                  <option value="fleet_manager">Fleet Manager</option>
                  <option value="safety_officer">Safety Officer</option>
                  <option value="financial_analyst">Financial Analyst</option>
                </select>
              </div>
            )}

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? '⏳ Please wait...' : isLogin ? '🚀 Sign In' : '✨ Create Account'}
            </button>
          </form>

          {isLogin && (
            <>
              <div className="auth-divider"><span>Quick Demo Access</span></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {[
                  { label: '🏢 Fleet Manager', email: 'manager@transitops.com' },
                  { label: '🗺️ Dispatcher', email: 'dispatcher@transitops.com' },
                  { label: '🛡️ Safety Officer', email: 'safety@transitops.com' },
                  { label: '💰 Financial Analyst', email: 'finance@transitops.com' }
                ].map(d => (
                  <button
                    key={d.email}
                    onClick={() => demoLogin(d.email)}
                    className="topbar-btn btn-secondary"
                    style={{ fontSize: '12px', padding: '8px', justifyContent: 'center' }}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </>
          )}

          <div className="auth-toggle">
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <a onClick={() => { setIsLogin(!isLogin); setError(''); }}>
              {isLogin ? 'Sign Up' : 'Sign In'}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

