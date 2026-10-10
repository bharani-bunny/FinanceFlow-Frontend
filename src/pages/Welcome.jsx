import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const features = [
  { icon: '↗', title: 'See your money clearly', copy: 'Bring accounts, income, and spending into one personal overview.' },
  { icon: '◷', title: 'Stay ahead of bills', copy: 'Keep recurring payments and their next due dates in view.' },
  { icon: '◎', title: 'Build better habits', copy: 'Set category budgets, follow savings goals, and review simple spending insights.' },
];

export default function Welcome() {
  const { token } = useAuth();
  const primaryPath = token ? '/app' : '/register';
  return <main className="welcome-page">
    <header className="welcome-nav">
      <Link to="/" className="welcome-brand"><span className="brand-mark">F</span><span>FinanceFlow</span></Link>
      <nav aria-label="Main navigation"><Link className="welcome-signin" to={token ? '/app' : '/login'}>{token ? 'Dashboard' : 'Sign in'}</Link><Link className="primary-button welcome-nav-cta" to={primaryPath}>{token ? 'Continue' : 'Get started'} <span aria-hidden="true">↗</span></Link></nav>
    </header>

    <section className="welcome-hero">
      <div className="welcome-copy">
        <p className="welcome-kicker"><span /> PERSONAL FINANCE, MADE CLEAR</p>
        <h1>Feel more in control of <em>your money.</em></h1>
        <p className="welcome-intro">FinanceFlow brings your accounts, everyday spending, budgets, upcoming bills, and savings goals together in one calm, clear place.</p>
        <div className="welcome-actions"><Link className="primary-button welcome-primary" to={primaryPath}>{token ? 'Open dashboard' : 'Get started'} <span aria-hidden="true">→</span></Link><Link className="welcome-secondary" to={token ? '/app' : '/login'}>{token ? 'Continue where you left off' : 'I already have an account'}</Link></div>
        <p className="welcome-note">A simple personal finance workspace. Your records stay yours.</p>
      </div>
      <div className="welcome-art" aria-label="FinanceFlow keeps your financial picture connected">
        <div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" />
        <div className="art-center"><span className="art-mark">F</span><strong>Your money,<br />in one place.</strong><small>Accounts · budgets · goals</small></div>
        <div className="art-chip chip-accounts"><span className="chip-icon">▤</span><span><strong>Accounts</strong><small>One clear picture</small></span></div>
        <div className="art-chip chip-budgets"><span className="chip-icon">◉</span><span><strong>Budgets</strong><small>Spend with awareness</small></span></div>
        <div className="art-chip chip-goals"><span className="chip-icon">⌁</span><span><strong>Savings goals</strong><small>Progress that adds up</small></span></div>
        <span className="art-spark spark-one">✳</span><span className="art-spark spark-two">✦</span>
      </div>
    </section>

    <section className="welcome-features">
      <div className="welcome-section-heading"><p className="welcome-kicker">A CLEARER FINANCIAL ROUTINE</p><h2>Everything you need to stay on top of it.</h2><p>Organize the essentials, then understand how they fit together.</p></div>
      <div className="welcome-feature-grid">{features.map((feature, index) => <article className="welcome-feature" key={feature.title}><span className={`feature-icon feature-${index}`}>{feature.icon}</span><h3>{feature.title}</h3><p>{feature.copy}</p></article>)}</div>
    </section>
    <footer className="welcome-footer"><span>FinanceFlow</span><span>Personal finance, made clear.</span></footer>
  </main>;
}
