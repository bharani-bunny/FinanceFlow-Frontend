import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const links = [
  ['/', 'Dashboard'],
  ['/accounts', 'Accounts'],
  ['/transactions', 'Transactions'],
  ['/budgets', 'Budgets'],
  ['/recurring-expenses', 'Recurring expenses'],
  ['/savings-goals', 'Savings goals'],
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  function signOut() { logout(); navigate('/login', { replace: true }); }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">F</span><span>FinanceFlow</span></div>
        <p className="side-label">WORKSPACE</p>
        <nav className="side-nav">
          {links.map(([to, label]) => <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>{label}</NavLink>)}
        </nav>
        <div className="sidebar-bottom">
          <span className="avatar">{(user?.name || 'U').slice(0, 1).toUpperCase()}</span>
          <div className="user-copy"><strong>{user?.name || 'FinanceFlow user'}</strong><small>{user?.email || ''}</small></div>
          <button className="logout-button" onClick={signOut}>Sign out</button>
        </div>
      </aside>
      <main className="main-content"><Outlet /></main>
    </div>
  );
}
