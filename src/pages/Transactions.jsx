import React, { useCallback, useEffect, useState } from 'react';
import api from '../services/api.js';
import PageHeader from '../components/PageHeader.jsx';
import StatusMessage from '../components/StatusMessage.jsx';

const categories = ['Food', 'Transportation', 'Education', 'Shopping', 'Entertainment', 'Bills', 'Health', 'Salary', 'Other'];
const types = ['INCOME', 'EXPENSE'];
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const money = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(value || 0));
const messageOf = (error, fallback) => error.response?.data?.message || fallback;

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [filters, setFilters] = useState({ type: '', category: '', date: '', accountId: '' });
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadAccounts = useCallback(async () => {
    setAccountsLoading(true);
    try { const { data } = await api.get('/accounts'); setAccounts(Array.isArray(data) ? data : []); }
    catch (err) { setError(messageOf(err, 'Could not load accounts for the transaction form.')); }
    finally { setAccountsLoading(false); }
  }, []);
  const loadTransactions = useCallback(async () => {
    setLoading(true); setError('');
    const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== ''));
    try { const { data } = await api.get('/transactions', { params }); setTransactions(Array.isArray(data) ? data : []); }
    catch (err) { setError(messageOf(err, 'Could not load transactions. Please try again.')); }
    finally { setLoading(false); }
  }, [filters]);
  useEffect(() => { loadAccounts(); }, [loadAccounts]);
  useEffect(() => { loadTransactions(); }, [loadTransactions]);

  function openForm(transaction = null) {
    setError(''); setNotice('');
    setForm(transaction ? { id: transaction.id, amount: transaction.amount, type: transaction.type, category: transaction.category,
      description: transaction.description || '', date: transaction.date, accountId: String(transaction.accountId) }
      : { amount: '', type: 'EXPENSE', category: 'Food', description: '', date: today(), accountId: accounts[0] ? String(accounts[0].id) : '' });
  }
  async function save(event) {
    event.preventDefault(); setSaving(true); setError(''); setNotice('');
    const payload = { amount: Number(form.amount), type: form.type, category: form.category,
      description: form.description.trim() || null, date: form.date, accountId: Number(form.accountId) };
    try {
      if (form.id) await api.put(`/transactions/${form.id}`, payload); else await api.post('/transactions', payload);
      setForm(null); setNotice(form.id ? 'Transaction updated.' : 'Transaction added.'); await loadTransactions();
    } catch (err) { setError(messageOf(err, 'Could not save transaction.')); }
    finally { setSaving(false); }
  }
  async function remove(transaction) {
    if (!window.confirm('Delete this transaction?')) return;
    setError(''); setNotice('');
    try { await api.delete(`/transactions/${transaction.id}`); setNotice('Transaction deleted.'); await loadTransactions(); }
    catch (err) { setError(messageOf(err, 'Could not delete transaction.')); }
  }
  function updateFilter(key, value) { setFilters((current) => ({ ...current, [key]: value })); }

  return <>
    <PageHeader title="Transactions" description="Record and review income and expenses across your accounts."
      action={<button className="primary-button" onClick={() => openForm()} disabled={accountsLoading || accounts.length === 0}>＋ Add transaction</button>} />
    <StatusMessage error={error} notice={notice} />
    {accounts.length === 0 && !accountsLoading && <p className="notice">Add an account before recording a transaction.</p>}
    <section className="filter-bar" aria-label="Transaction filters">
      <label>Type<select value={filters.type} onChange={(e) => updateFilter('type', e.target.value)}><option value="">All types</option>{types.map((type) => <option key={type}>{type}</option>)}</select></label>
      <label>Category<select value={filters.category} onChange={(e) => updateFilter('category', e.target.value)}><option value="">All categories</option>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
      <label>Date<input type="date" value={filters.date} onChange={(e) => updateFilter('date', e.target.value)} /></label>
      <label>Account<select value={filters.accountId} onChange={(e) => updateFilter('accountId', e.target.value)}><option value="">All accounts</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label>
      <button type="button" className="secondary-button" onClick={() => setFilters({ type: '', category: '', date: '', accountId: '' })}>Clear filters</button>
    </section>
    {loading ? <p className="muted">Loading transactions…</p> : transactions.length === 0 ?
      <section className="empty-state"><h2>No transactions found</h2><p>{Object.values(filters).some(Boolean) ? 'Try changing or clearing your filters.' : 'Add a transaction to start tracking activity.'}</p></section> :
      <section className="table-card"><div className="table-wrap"><table><thead><tr><th>DATE</th><th>DESCRIPTION</th><th>CATEGORY</th><th>ACCOUNT</th><th>TYPE</th><th>AMOUNT</th><th>ACTIONS</th></tr></thead>
        <tbody>{transactions.map((transaction) => <tr key={transaction.id}><td>{new Date(`${transaction.date}T00:00:00`).toLocaleDateString('en-IN')}</td><td>{transaction.description || '—'}</td><td>{transaction.category}</td><td>{transaction.accountName}</td>
          <td><span className={`transaction-type ${transaction.type.toLowerCase()}`}>{transaction.type}</span></td><td className={transaction.type === 'INCOME' ? 'income-value' : ''}>{transaction.type === 'EXPENSE' ? '−' : '+'}{money(transaction.amount)}</td>
          <td className="row-actions"><button onClick={() => openForm(transaction)}>Edit</button><button className="danger-link" onClick={() => remove(transaction)}>Delete</button></td></tr>)}</tbody>
      </table></div></section>}
    {form && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setForm(null); }}><section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="transaction-form-title">
      <header><h2 id="transaction-form-title">{form.id ? 'Edit transaction' : 'Add transaction'}</h2><button className="close-button" aria-label="Close" onClick={() => setForm(null)}>×</button></header>
      <form className="stack-form" onSubmit={save}><label>Amount<input type="number" required min="0.01" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></label>
        <label>Type<select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>{types.map((type) => <option key={type}>{type}</option>)}</select></label>
        <label>Category<select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
        <label>Description<input maxLength="255" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
        <label>Date<input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></label>
        <label>Account<select required value={form.accountId} onChange={(e) => setForm({ ...form, accountId: e.target.value })}>{accounts.map((account) => <option key={account.id} value={account.id}>{account.name} ({account.type})</option>)}</select></label>
        <div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setForm(null)}>Cancel</button><button className="primary-button" disabled={saving}>{saving ? 'Saving…' : 'Save transaction'}</button></div>
      </form></section></div>}
  </>;
}
