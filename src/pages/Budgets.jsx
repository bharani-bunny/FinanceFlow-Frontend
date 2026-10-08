import React, { useCallback, useEffect, useState } from 'react';
import api from '../services/api.js';
import PageHeader from '../components/PageHeader.jsx';
import StatusMessage from '../components/StatusMessage.jsx';

const categories = ['Food', 'Transportation', 'Education', 'Shopping', 'Entertainment', 'Bills', 'Health', 'Salary', 'Other'];
const monthNow = new Date().getMonth() + 1;
const yearNow = new Date().getFullYear();
const money = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(value || 0));
const messageOf = (error, fallback) => error.response?.data?.message || fallback;

export default function Budgets() {
  const [budgets, setBudgets] = useState([]);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { const { data } = await api.get('/budgets'); setBudgets(Array.isArray(data) ? data : []); }
    catch (err) { setError(messageOf(err, 'Could not load budgets. Please try again.')); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  function openForm(budget = null) {
    setError(''); setNotice('');
    setForm(budget ? { id: budget.id, category: budget.category, amount: budget.amount, month: budget.month, year: budget.year }
      : { category: 'Food', amount: '', month: monthNow, year: yearNow });
  }
  async function save(event) {
    event.preventDefault(); setSaving(true); setError(''); setNotice('');
    const payload = { category: form.category, amount: Number(form.amount), month: Number(form.month), year: Number(form.year) };
    try {
      if (form.id) await api.put(`/budgets/${form.id}`, payload); else await api.post('/budgets', payload);
      setForm(null); setNotice(form.id ? 'Budget updated.' : 'Budget created.'); await load();
    } catch (err) { setError(messageOf(err, 'Could not save budget.')); }
    finally { setSaving(false); }
  }
  async function remove(budget) {
    if (!window.confirm(`Delete the ${budget.category} budget?`)) return;
    setError(''); setNotice('');
    try { await api.delete(`/budgets/${budget.id}`); setNotice('Budget deleted.'); await load(); }
    catch (err) { setError(messageOf(err, 'Could not delete budget.')); }
  }

  return <>
    <PageHeader title="Budgets" description="Set category limits and keep an eye on monthly spending."
      action={<button className="primary-button" onClick={() => openForm()}>＋ Add budget</button>} />
    <StatusMessage error={error} notice={notice} />
    {loading ? <p className="muted">Loading budgets…</p> : budgets.length === 0 ?
      <section className="empty-state"><h2>No budgets yet</h2><p>Create a category budget to track your spending.</p></section> :
      <section className="table-card"><div className="table-wrap"><table><thead><tr><th>CATEGORY</th><th>PERIOD</th><th>BUDGET AMOUNT</th><th>SPENT</th><th>REMAINING</th><th>USED</th><th>ACTIONS</th></tr></thead>
        <tbody>{budgets.map((budget) => {
          const percentage = Number(budget.percentageUsed || 0);
          const state = percentage >= 100 ? 'over' : percentage >= 80 ? 'near' : '';
          const status = percentage >= 100 ? 'Budget exceeded.' : percentage >= 80 ? 'Budget is almost exhausted.' : '';
          return <tr key={budget.id}><td><strong>{budget.category}</strong>{status && <small className={`budget-status ${state}`}>{status}</small>}</td>
            <td>{String(budget.month).padStart(2, '0')}/{budget.year}</td><td>{money(budget.amount)}</td><td>{money(budget.amountSpent)}</td><td>{money(budget.remainingAmount)}</td>
            <td className="budget-usage"><div className="usage-label"><strong>{percentage.toFixed(0)}%</strong></div><div className="progress-track"><span className={state} style={{ width: `${Math.min(Math.max(percentage, 0), 100)}%` }} /></div></td>
            <td className="row-actions"><button onClick={() => openForm(budget)}>Edit</button><button className="danger-link" onClick={() => remove(budget)}>Delete</button></td></tr>;
        })}</tbody>
      </table></div></section>}
    {form && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setForm(null); }}><section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="budget-form-title">
      <header><h2 id="budget-form-title">{form.id ? 'Edit budget' : 'Create budget'}</h2><button className="close-button" aria-label="Close" onClick={() => setForm(null)}>×</button></header>
      <form className="stack-form" onSubmit={save}><label>Category<select required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
        <label>Budget amount<input type="number" required min="0.01" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></label>
        <label>Month<input type="number" required min="1" max="12" step="1" value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })} /></label>
        <label>Year<input type="number" required min="2000" max="9999" step="1" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} /></label>
        <div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setForm(null)}>Cancel</button><button className="primary-button" disabled={saving}>{saving ? 'Saving…' : 'Save budget'}</button></div>
      </form></section></div>}
  </>;
}
