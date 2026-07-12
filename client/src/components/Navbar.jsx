import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { path: '/', label: 'Dashboard', icon: '📊' },
  { path: '/vehicles', label: 'Vehicles', icon: '🚛' },
  { path: '/drivers', label: 'Drivers', icon: '👤' },
  { path: '/trips', label: 'Trips', icon: '🗺️' },
  { path: '/maintenance', label: 'Maintenance', icon: '🔧' },
  { path: '/fuel', label: 'Fuel & Expenses', icon: '⛽' },
  { path: '/reports', label: 'Analytics', icon: '📈' },
];

const roleColors = {
  fleet_manager: { bg: '#EDE9FE', text: '#5B21B6', label: 'Fleet Manager' },
  dispatcher: { bg: '#DBEAFE', text: '#1E40AF', label: 'Dispatcher' },
  safety_officer: { bg: '#D1FAE5', text: '#065F46', label: 'Safety Officer' },
  financial_analyst: { bg: '#FEF3C7', text: '#92400E', label: 'Financial Analyst' },
};

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
  const role = roleColors[user?.role] || { bg: '#F1F5F9', text: '#475569', label: user?.role };

  return (
    <header className="topnav">
      {/* Brand */}
      <div className="topnav-brand">
        <div className="topnav-logo-icon">🚌</div>
        <div className="topnav-logo-text">
          <span className="topnav-logo-name">TransitOps</span>
          <span className="topnav-logo-sub">Smart Transport Platform</span>
        </div>
      </div>

      {/* Navigation links */}
      <nav className="topnav-links">
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) => `topnav-link${isActive ? ' active' : ''}`}
          >
            <span className="topnav-link-icon">{item.icon}</span>
            <span className="topnav-link-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="topnav-user">
        <span className="topnav-role-badge" style={{ background: role.bg, color: role.text }}>
          {role.label}
        </span>
        <div className="topnav-avatar" title={user?.name}>{initials}</div>
        <button className="topnav-logout" onClick={handleLogout} title="Logout">
          ⎋
        </button>
      </div>
    </header>
  );
};

export default Navbar;
