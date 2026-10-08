import React, { useCallback, useEffect, useState } from 'react';
import api from '../services/api.js';
import PageHeader from '../components/PageHeader.jsx';
import StatusMessage from '../components/StatusMessage.jsx';

const categories = ['Food', 'Transportation', 'Education', 'Shopping', 'Entertainment', 'Bills', 'Health', 'Salary', 'Other'];
const frequencies = ['WEEKLY', 'MONTHLY', 'YEARLY'];
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const money = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(value || 0));
const dateLabel = (value) => value ? new Date(`${value}T00:00:00`).toLocaleDateString('en-IN') : '—';
const messageOf = (error, fallback) => error.response?.data?.message || error.response?.data?.detail || fallback;

export default function RecurringExpenses() {
  const [expenses, setExpenses] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [allResponse, upcomingResponse] = await Promise.all([
        api.get('/recurring-expenses'), api.get('/recurring-expenses/upcoming'),
      ]);
      setExpenses(Array.isArray(allResponse.data) ? allResponse.data : []);
      setUpcoming(Array.isArray(upcomingResponse.data) ? upcomingResponse.data : []);
    } catch (err) { setError(messageOf(err, 'Could not load recurring expenses. Please try again.')); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  function openForm(expense = null) {
    setError(''); setNotice('');
    setForm(expense ? { id: expense.id, name: expense.name, amount: expense.amount, category: expense.category,
      frequency: expense.frequency, nextPaymentDate: expense.nextPaymentDate }
      : { name: '', amount: '', category: 'Bills', frequency: 'MONTHLY', nextPaymentDate: today() });
  }
  async function save(event) {
    event.preventDefault(); setSaving(true); setError(''); setNotice('');
    const payload = { name: form.name.trim(), amount: Number(form.amount), category: form.category,
      frequency: form.frequency, nextPaymentDate: form.nextPaymentDate };
    try {
      if (form.id) await api.put(`/recurring-expenses/${form.id}`, payload); else await api.post('/recurring-expenses', payload);
      setForm(null); setNotice(form.id ? 'Recurring expense updated.' : 'Recurring expense added.'); await load();
    } catch (err) { setError(messageOf(err, 'Could not save recurring expense.')); }
    finally { setSaving(false); }
  }
  async function remove(expense) {
    if (!window.confirm(`Delete “${expense.name}”?`)) return;
    setError(''); setNotice('');
    try { await api.delete(`/recurring-expenses/${expense.id}`); setNotice('Recurring expense deleted.'); await load(); }
    catch (err) { setError(messageOf(err, 'Could not delete recurring expense.')); }
  }

  return <>
    <PageHeader title="Recurring expenses" description="Keep a schedule of regular payments and their next due dates."
      action={<button className="primary-button" onClick={() => openForm()}>＋ Add recurring expense</button>} />
    <StatusMessage error={error} notice={notice} />
    <section className="dashboard-panel recurring-upcoming"><header><div><h2>Upcoming payments</h2><p className="page-description">Your next scheduled recurring payments.</p></div></header>
      {loading ? <p className="muted">Loading upcoming payments…</p> : upcoming.length === 0 ? <p className="panel-empty">No upcoming payments.</p> :
        <div className="upcoming-list">{upcoming.map((expense) => <article className="upcoming-payment" key={expense.id}>
          <div><strong>{expense.name}</strong><small>{expense.category} · {expense.frequency.toLowerCase()}</small></div>
          <div className="upcoming-amount"><strong>{money(expense.amount)}</strong><small>{dateLabel(expense.nextPaymentDate)}</small></div>
        </article>)}</div>}
    </section>
    <div className="section-heading"><h2>All recurring expenses</h2><span>{expenses.length} {expenses.length === 1 ? 'payment' : 'payments'}</span></div>
    {loading ? <p className="muted">Loading recurring expenses…</p> : expenses.length === 0 ?
      <section className="empty-state"><h2>No recurring expenses yet</h2><p>Add a regular payment to keep its next due date in view.</p></section> :
      <section className="table-card"><div className="table-wrap"><table><thead><tr><th>NAME</th><th>AMOUNT</th><th>CATEGORY</th><th>FREQUENCY</th><th>NEXT PAYMENT</th><th>ACTIONS</th></tr></thead>
        <tbody>{expenses.map((expense) => <tr key={expense.id}><td><strong>{expense.name}</strong></td><td>{money(expense.amount)}</td><td>{expense.category}</td><td>{expense.frequency}</td><td>{dateLabel(expense.nextPaymentDate)}</td>
          <td className="row-actions"><button onClick={() => openForm(expense)}>Edit</button><button className="danger-link" onClick={() => remove(expense)}>Delete</button></td></tr>)}</tbody>
      </table></div></section>}
    {form && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setForm(null); }}><section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="recurring-form-title">
      <header><h2 id="recurring-form-title">{form.id ? 'Edit recurring expense' : 'Add recurring expense'}</h2><button className="close-button" aria-label="Close" onClick={() => setForm(null)}>×</button></header>
      <form className="stack-form" onSubmit={save}><label>Name<input required maxLength="100" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
        <label>Amount<input type="number" required min="0.01" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></label>
        <label>Category<select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
        <label>Frequency<select value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })}>{frequencies.map((frequency) => <option key={frequency} value={frequency}>{frequency.charAt(0) + frequency.slice(1).toLowerCase()}</option>)}</select></label>
        <label>Next payment date<input type="date" required value={form.nextPaymentDate} onChange={(e) => setForm({ ...form, nextPaymentDate: e.target.value })} /></label>
        <div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setForm(null)}>Cancel</button><button className="primary-button" disabled={saving}>{saving ? 'Saving…' : 'Save expense'}</button></div>
      </form></section></div>}
  </>;
}
