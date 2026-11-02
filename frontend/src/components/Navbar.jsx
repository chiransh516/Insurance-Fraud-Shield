import { NavLink, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { LayoutDashboard, FileText, History, TrendingUp, Activity, ShieldCheck, Info, LogOut, User } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

export function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', label: 'Overview', Icon: LayoutDashboard, role: 'admin' },
    { path: '/claim-entry', label: 'New Claim', Icon: FileText, role: 'any' },
    { path: '/claims-history', label: user?.role === 'admin' ? 'Claim Management' : 'Claims History', Icon: History, role: 'any' },
    { path: '/fraud-trends', label: 'Fraud Trends', Icon: TrendingUp, role: 'admin' },
    { path: '/admin', label: 'Model Metrics', Icon: Activity, role: 'admin' }
  ];

  return (
    <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', height: '70px', background: 'white', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 100 }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <ShieldCheck size={26} color="#4318ff" />
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1e293b', margin: 0, letterSpacing: '-0.02em' }}>Insurance Fraud Shield</h2>
      </div>

      {/* Navigation */}
      <nav style={{ display: 'flex', gap: '8px' }}>
        {navItems.map((item) => {
          if (item.role === 'admin' && user?.role !== 'admin') return null;
          
          const Icon = item.Icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              end={item.path === '/'}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '0.9rem',
                color: isActive ? '#4318ff' : '#64748b',
                background: isActive ? '#eff6ff' : 'transparent',
                transition: 'all 0.2s ease',
              })}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <NavLink 
          to="/about" 
          style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}
        >
          <Info size={18} />
          <span>About</span>
        </NavLink>

        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingLeft: '24px', borderLeft: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155', fontSize: '0.9rem', fontWeight: 600 }}>
              <User size={18} color="#64748b" />
              <span>{user.full_name || user.username}</span>
              <span style={{ fontSize: '0.75rem', padding: '2px 8px', backgroundColor: user.role === 'admin' ? '#e0e7ff' : '#ccfbf1', color: user.role === 'admin' ? '#4318ff' : '#0f766e', borderRadius: '12px', fontWeight: 700 }}>
                {user.role === 'admin' ? 'Admin' : 'User'}
              </span>
            </div>
            <button 
              onClick={handleLogout}
              style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

export function StatusBadge({ status }) {
  const label = status?.charAt(0).toUpperCase() + status?.slice(1);
  return <span className={`badge badge-${status}`}>{label}</span>;
}

export function RiskBadge({ level }) {
  return <span className={`badge badge-${level?.toLowerCase()}`}>{level}</span>;
}

export function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div className="loading-overlay">
      <div className="spinner" />
      <p>{message}</p>
    </div>
  );
}
