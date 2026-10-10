import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function AuthForm({ mode }) {
  const registering = mode === 'register';
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState(location.state?.email || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(location.state?.registered ? 'Your account is ready. Sign in with the email and password you just registered.' : '');
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault(); setLoading(true); setError('');
    try {
      if (registering) {
        await register(name, email, password);
        navigate('/login', { replace: true, state: { registered: true, email: email.trim() } });
        return;
      }
      await login(email, password);
      navigate(location.state?.from?.pathname || '/app', { replace: true });
    } catch (requestError) {
      const status = requestError.response?.status;
      const responseData = requestError.response?.data;
      const backendMessage = responseData?.detail || responseData?.message || responseData?.error;
      if (!requestError.response) {
        setError('Cannot reach the backend. Start Spring Boot and MySQL, then try again.');
      } else if (registering && status === 409) {
        setError('An account with this email already exists. Sign in instead or use another email.');
      } else if (status === 400) {
        setError(backendMessage || 'Please check your name, email, and password. Passwords must be at least 8 characters.');
      } else if (registering && status === 401) {
        setError('We couldn’t create your account right now. Please try again. If you already registered, sign in.');
      } else if (status === 401) {
        setError('Incorrect email or password. Check your details and try again.');
      } else {
        setError(backendMessage || `${registering ? 'Registration' : 'Login'} failed (server response ${status}). Check that the backend and database are running.`);
      }
    } finally { setLoading(false); }
  }

  return <main className="auth-screen">
    <aside className="auth-promo">
      <Link to="/" className="auth-promo-brand"><span className="brand-mark">F</span><span>FinanceFlow</span></Link>
      <div className="auth-promo-copy"><p className="auth-promo-kicker">PERSONAL FINANCE, MADE CLEAR</p><h2>Make room for a clearer view.</h2><p>Bring accounts, spending, budgets, upcoming payments, and savings goals together in one place.</p></div>
      <div className="auth-promo-bottom"><span>01</span><span>Simple tools for everyday money decisions</span></div>
      <span className="auth-promo-orbit auth-promo-orbit-one" /><span className="auth-promo-orbit auth-promo-orbit-two" />
    </aside>
    <div className="auth-content"><section className="auth-card"><div className="brand-mark">F</div><p className="eyebrow">PERSONAL FINANCE, MADE CLEAR</p><h1>{registering ? 'Create your account' : 'Welcome back'}</h1><p className="muted">{registering ? 'Start organizing your finances with FinanceFlow.' : 'Sign in to continue to your finances.'}</p>{success && !registering && <p className="notice success" role="status">{success}</p>}<form className="stack-form" onSubmit={submit}>{registering && <label>Name<input autoComplete="name" required maxLength="100" value={name} onChange={(event) => setName(event.target.value)} /></label>}<label>Email<input type="email" autoComplete={registering ? 'email' : 'username'} required value={email} onChange={(event) => setEmail(event.target.value)} /></label><label>Password<div className="password-field"><input type={showPassword ? 'text' : 'password'} autoComplete={registering ? 'new-password' : 'current-password'} required minLength={registering ? 8 : undefined} maxLength="72" value={password} onChange={(event) => setPassword(event.target.value)} /><button type="button" className="password-toggle" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? 'Hide' : 'Show'}</button></div>{registering && <small className="password-hint">Use at least 8 characters. You’ll use this password to sign in.</small>}</label>{error && <p className="notice error" role="alert">{error}</p>}<button className="primary-button full" disabled={loading}>{loading ? 'Please wait…' : registering ? 'Create account' : 'Sign in'}</button></form><p className="auth-switch">{registering ? 'Already have an account?' : 'New to FinanceFlow?'} <Link to={registering ? '/login' : '/register'}>{registering ? 'Sign in' : 'Create account'}</Link></p></section></div>
  </main>;
}
