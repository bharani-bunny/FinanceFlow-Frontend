import React, { useCallback, useEffect, useState } from 'react';
import api from '../services/api.js';
import PageHeader from '../components/PageHeader.jsx';
import StatusMessage from '../components/StatusMessage.jsx';

const money = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(value || 0));
const messageOf = (error, fallback) => error.response?.data?.message || error.response?.data?.detail || fallback;
const dateLabel = (value) => value ? new Date(`${value}T00:00:00`).toLocaleDateString('en-IN') : '—';

export default function SavingsGoals() {
  const [goals, setGoals] = useState([]);
  const [form, setForm] = useState(null);
  const [progressForm, setProgressForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { const { data } = await api.get('/savings-goals'); setGoals(Array.isArray(data) ? data : []); }
    catch (err) { setError(messageOf(err, 'Could not load savings goals. Please try again.')); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  function openForm(goal = null) {
    setError(''); setNotice('');
    setForm(goal ? { id: goal.id, name: goal.name, targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount, targetDate: goal.targetDate || '' }
      : { name: '', targetAmount: '', currentAmount: '0', targetDate: '' });
  }
  async function save(event) {
    event.preventDefault(); setSaving(true); setError(''); setNotice('');
    const payload = { name: form.name.trim(), targetAmount: Number(form.targetAmount), currentAmount: Number(form.currentAmount),
      targetDate: form.targetDate || null };
    try {
      if (form.id) await api.put(`/savings-goals/${form.id}`, payload); else await api.post('/savings-goals', payload);
      setForm(null); setNotice(form.id ? 'Savings goal updated.' : 'Savings goal added.'); await load();
    } catch (err) { setError(messageOf(err, 'Could not save savings goal.')); }
    finally { setSaving(false); }
  }
  function openProgress(goal) { setError(''); setNotice(''); setProgressForm({ id: goal.id, name: goal.name, currentAmount: goal.currentAmount }); }
  async function saveProgress(event) {
    event.preventDefault(); setSaving(true); setError(''); setNotice('');
    try {
      await api.put(`/savings-goals/${progressForm.id}/progress`, { currentAmount: Number(progressForm.currentAmount) });
      setProgressForm(null); setNotice('Current savings updated.'); await load();
    } catch (err) { setError(messageOf(err, 'Could not update current savings.')); }
    finally { setSaving(false); }
  }
  async function remove(goal) {
    if (!window.confirm(`Delete the “${goal.name}” goal?`)) return;
    setError(''); setNotice('');
    try { await api.delete(`/savings-goals/${goal.id}`); setNotice('Savings goal deleted.'); await load(); }
    catch (err) { setError(messageOf(err, 'Could not delete savings goal.')); }
  }

  return <>
    <PageHeader title="Savings goals" description="Track how your savings are progressing toward each target."
      action={<button className="primary-button" onClick={() => openForm()}>＋ Add goal</button>} />
    <StatusMessage error={error} notice={notice} />
    {loading ? <p className="muted">Loading savings goals…</p> : goals.length === 0 ?
      <section className="empty-state"><h2>No savings goals yet</h2><p>Add a goal to track progress toward something you’re saving for.</p></section> :
      <section className="goal-grid">{goals.map((goal) => {
        const progress = Number(goal.progressPercentage || 0);
        const clampedProgress = Math.min(Math.max(progress, 0), 100);
        return <article className="goal-card" key={goal.id}>
          <header><div><h2>{goal.name}</h2><p>{goal.targetDate ? `Target date · ${dateLabel(goal.targetDate)}` : 'No target date set'}</p></div>
            <div className="row-actions"><button onClick={() => openForm(goal)}>Edit</button><button className="danger-link" onClick={() => remove(goal)}>Delete</button></div></header>
          <div className="goal-amounts"><div><span>Saved</span><strong>{money(goal.currentAmount)}</strong></div><div><span>Target</span><strong>{money(goal.targetAmount)}</strong></div></div>
          <div className="goal-progress-label"><span>Progress</span><strong>{progress.toFixed(0)}%</strong></div>
          <div className="progress-track goal-progress-track"><span style={{ width: `${clampedProgress}%` }} /></div>
          <button className="secondary-button update-savings-button" onClick={() => openProgress(goal)}>Update current savings</button>
        </article>;
      })}</section>}
    {form && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setForm(null); }}><section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="goal-form-title">
      <header><h2 id="goal-form-title">{form.id ? 'Edit savings goal' : 'Add savings goal'}</h2><button className="close-button" aria-label="Close" onClick={() => setForm(null)}>×</button></header>
      <form className="stack-form" onSubmit={save}><label>Goal name<input required maxLength="100" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
        <label>Target amount<input type="number" required min="0.01" step="0.01" value={form.targetAmount} onChange={(e) => setForm({ ...form, targetAmount: e.target.value })} /></label>
        <label>Current savings<input type="number" required min="0" step="0.01" value={form.currentAmount} onChange={(e) => setForm({ ...form, currentAmount: e.target.value })} /></label>
        <label>Target date (optional)<input type="date" value={form.targetDate} onChange={(e) => setForm({ ...form, targetDate: e.target.value })} /></label>
        <div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setForm(null)}>Cancel</button><button className="primary-button" disabled={saving}>{saving ? 'Saving…' : 'Save goal'}</button></div>
      </form></section></div>}
    {progressForm && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setProgressForm(null); }}><section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="progress-form-title">
      <header><h2 id="progress-form-title">Update savings</h2><button className="close-button" aria-label="Close" onClick={() => setProgressForm(null)}>×</button></header>
      <p className="muted progress-goal-name">{progressForm.name}</p><form className="stack-form" onSubmit={saveProgress}>
        <label>Current savings<input type="number" required min="0" step="0.01" value={progressForm.currentAmount} onChange={(e) => setProgressForm({ ...progressForm, currentAmount: e.target.value })} /></label>
        <div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setProgressForm(null)}>Cancel</button><button className="primary-button" disabled={saving}>{saving ? 'Saving…' : 'Update savings'}</button></div>
      </form></section></div>}
  </>;
}
