import React, { useCallback, useEffect, useState } from 'react';
import api from '../services/api.js';
import PageHeader from './PageHeader.jsx';
import StatusMessage from './StatusMessage.jsx';

export default function ResourcePage({ title, description, endpoint, fields, singular }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const { data } = await api.get(endpoint);
      setItems(Array.isArray(data) ? data : []);
    } catch (requestError) { setError(requestError.response?.data?.message || `Could not load ${title.toLowerCase()}.`); }
    finally { setLoading(false); }
  }, [endpoint, title]);

  useEffect(() => { load(); }, [load]);

  function newItem() {
    const value = {};
    fields.forEach((field) => { value[field.name] = field.defaultValue ?? ''; });
    setForm(value); setError(''); setNotice('');
  }

  function editItem(item) {
    const value = { id: item.id };
    fields.forEach((field) => { value[field.name] = item[field.name] ?? ''; });
    setForm(value); setError(''); setNotice('');
  }

  async function save(event) {
    event.preventDefault(); setError(''); setNotice('');
    const payload = {};
    fields.forEach((field) => {
      const value = form[field.name];
      payload[field.name] = field.type === 'number' && value !== '' ? Number(value) : value === '' && field.nullable ? null : value;
    });
    try {
      if (form.id) await api.put(`${endpoint}/${form.id}`, payload);
      else await api.post(endpoint, payload);
      setForm(null); setNotice(`${singular} saved.`); await load();
    } catch (requestError) { setError(requestError.response?.data?.message || `Could not save ${singular.toLowerCase()}.`); }
  }

  async function remove(item) {
    if (!window.confirm(`Delete this ${singular.toLowerCase()}?`)) return;
    try { await api.delete(`${endpoint}/${item.id}`); setNotice(`${singular} deleted.`); await load(); }
    catch (requestError) { setError(requestError.response?.data?.message || `Could not delete ${singular.toLowerCase()}.`); }
  }

  return <>
    <PageHeader title={title} description={description} action={<button className="primary-button" onClick={newItem}>＋ Add {singular.toLowerCase()}</button>} />
    <StatusMessage error={error} notice={notice} />
    {loading ? <p className="muted">Loading from FinanceFlow…</p> : items.length === 0 ? <section className="empty-state"><h2>No {title.toLowerCase()} yet</h2><p>Add a {singular.toLowerCase()} to get started.</p></section> : (
      <section className="table-card"><div className="table-wrap"><table><thead><tr>{fields.map((field) => <th key={field.name}>{field.label.toUpperCase()}</th>)}<th>ACTIONS</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}>{fields.map((field) => <td key={field.name}>{formatValue(item[field.name], field, item)}</td>)}<td className="row-actions"><button onClick={() => editItem(item)}>Edit</button><button className="danger-link" onClick={() => remove(item)}>Delete</button></td></tr>)}</tbody></table></div></section>
    )}
    {form && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setForm(null); }}><section className="modal-card"><header><h2>{form.id ? `Edit ${singular.toLowerCase()}` : `Add ${singular.toLowerCase()}`}</h2><button className="close-button" onClick={() => setForm(null)}>×</button></header><form className="stack-form" onSubmit={save}>{fields.map((field) => <label key={field.name}>{field.label}{field.options ? <select required={field.required !== false} value={form[field.name]} onChange={(event) => setForm({ ...form, [field.name]: event.target.value })}>{field.options.map((option) => <option key={option.value ?? option} value={option.value ?? option}>{option.label ?? option}</option>)}</select> : <input type={field.type || 'text'} required={field.required !== false} min={field.min} max={field.max} step={field.step} maxLength={field.maxLength} value={form[field.name]} onChange={(event) => setForm({ ...form, [field.name]: event.target.value })} />}</label>)}<div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setForm(null)}>Cancel</button><button className="primary-button">Save</button></div></form></section></div>}
  </>;
}

function formatValue(value, field, item) {
  if (value === null || value === undefined || value === '') return '—';
  if (field.name === 'accountId' && item.accountName) return item.accountName;
  if (field.name.toLowerCase().includes('amount') || field.name === 'balance') return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(value));
  if (field.name === 'date' || field.name.toLowerCase().includes('date')) return new Date(`${value}T00:00:00`).toLocaleDateString('en-IN');
  return String(value);
}
