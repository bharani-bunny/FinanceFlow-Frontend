import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function AuthForm({ mode }) {
  const registering = mode === 'register';
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault(); setLoading(true); setError('');
    try {
      if (registering) await register(name, email, password);
      else await login(email, password);
      navigate(location.state?.from?.pathname || '/', { replace: true });
    } catch (requestError) {
      const status = requestError.response?.status;
      const responseData = requestError.response?.data;
      const backendMessage = responseData?.detail || responseData?.message || responseData?.error;
      if (!requestError.response) {
        setError('Cannot reach the backend. Start Spring Boot and MySQL, then try again.');
      } else if (requestError.registrationSucceeded) {
        setError('Your account was created, but automatic sign-in failed. Please go to Sign in and try again.');
      } else if (registering && status === 409) {
        setError('An account with this email already exists. Sign in instead or use another email.');
      } else if (status === 400) {
        setError(backendMessage || 'Please check your name, email, and password. Passwords must be at least 8 characters.');
      } else if (status === 401) {
        setError('Incorrect email or password. Check your details and try again.');
      } else {
        setError(backendMessage || `${registering ? 'Registration' : 'Login'} failed (server response ${status}). Check that the backend and database are running.`);
      }
    } finally { setLoading(false); }
  }

  return <main className="auth-screen"><section className="auth-card"><div className="brand-mark">F</div><p className="eyebrow">PERSONAL FINANCE, MADE CLEAR</p><h1>{registering ? 'Create your account' : 'Welcome back'}</h1><p className="muted">{registering ? 'Start organizing your finances with FinanceFlow.' : 'Sign in to continue to your finances.'}</p><form className="stack-form" onSubmit={submit}>{registering && <label>Name<input autoComplete="name" required maxLength="100" value={name} onChange={(event) => setName(event.target.value)} /></label>}<label>Email<input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label><label>Password<input type="password" autoComplete={registering ? 'new-password' : 'current-password'} required minLength={registering ? 8 : undefined} maxLength="72" value={password} onChange={(event) => setPassword(event.target.value)} /></label>{error && <p className="notice error">{error}</p>}<button className="primary-button full" disabled={loading}>{loading ? 'Please wait…' : registering ? 'Create account' : 'Sign in'}</button></form><p className="auth-switch">{registering ? 'Already have an account?' : 'New to FinanceFlow?'} <Link to={registering ? '/login' : '/register'}>{registering ? 'Sign in' : 'Create account'}</Link></p></section></main>;
}
