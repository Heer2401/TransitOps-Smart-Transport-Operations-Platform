import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { path: '/', icon: '📊', label: 'Dashboard', roles: ['fleet_manager', 'dispatcher', 'safety_officer', 'financial_analyst'] },
  { path: '/vehicles', icon: '🚛', label: 'Vehicles', roles: ['fleet_manager', 'dispatcher', 'safety_officer', 'financial_analyst'] },
  { path: '/drivers', icon: '👤', label: 'Drivers', roles: ['fleet_manager', 'dispatcher', 'safety_officer', 'financial_analyst'] },
  { path: '/trips', icon: '🗺️', label: 'Trips', roles: ['fleet_manager', 'dispatcher', 'safety_officer', 'financial_analyst'] },
  { path: '/maintenance', icon: '🔧', label: 'Maintenance', roles: ['fleet_manager', 'dispatcher', 'safety_officer', 'financial_analyst'] },
  { path: '/fuel', icon: '⛽', label: 'Fuel & Expenses', roles: ['fleet_manager', 'dispatcher', 'safety_officer', 'financial_analyst'] },
  { path: '/reports', icon: '📈', label: 'Reports & Analytics', roles: ['fleet_manager', 'dispatcher', 'safety_officer', 'financial_analyst'] },
];

const roleLabel = {
  fleet_manager: 'Fleet Manager',
  dispatcher: 'Dispatcher',
  safety_officer: 'Safety Officer',
  financial_analyst: 'Financial Analyst'
};

const Sidebar = () => {
  const { user, logout } = useAuth();

  const visibleItems = navItems.filter(item => item.roles.includes(user?.role));

  const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">🚌</div>
        <div className="logo-text">
          <h2>TransitOps</h2>
          <span>Smart Transport Platform</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-title">Navigation</div>
        {visibleItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            end={item.path === '/'}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-card" onClick={logout}>
          <div className="user-avatar">{getInitials(user?.name)}</div>
          <div className="user-info">
            <div className="user-name">{user?.name}</div>
            <div className="user-role">{roleLabel[user?.role] || user?.role}</div>
          </div>
          <button className="logout-btn" title="Logout">⬛</button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
