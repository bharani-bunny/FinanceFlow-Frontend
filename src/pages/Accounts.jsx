import React, { useCallback, useEffect, useState } from 'react';
import api from '../services/api.js';
import PageHeader from '../components/PageHeader.jsx';
import StatusMessage from '../components/StatusMessage.jsx';

const accountTypes = ['CASH', 'BANK', 'SAVINGS', 'WALLET'];
const money = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(value || 0));
const messageOf = (error, fallback) => error.response?.data?.message || fallback;

export default function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { const { data } = await api.get('/accounts'); setAccounts(Array.isArray(data) ? data : []); }
    catch (err) { setError(messageOf(err, 'Could not load accounts. Please try again.')); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  function openForm(account = null) {
    setError(''); setNotice('');
    setForm(account ? { id: account.id, name: account.name, type: account.type, balance: account.balance }
      : { name: '', type: 'CASH', balance: '0.00' });
  }
  async function save(event) {
    event.preventDefault(); setSaving(true); setError(''); setNotice('');
    const payload = { name: form.name.trim(), type: form.type, balance: Number(form.balance) };
    try {
      if (form.id) await api.put(`/accounts/${form.id}`, payload); else await api.post('/accounts', payload);
      setForm(null); setNotice(form.id ? 'Account updated.' : 'Account added.'); await load();
    } catch (err) { setError(messageOf(err, 'Could not save account.')); }
    finally { setSaving(false); }
  }
  async function remove(account) {
    if (!window.confirm(`Delete “${account.name}”?`)) return;
    setError(''); setNotice('');
    try { await api.delete(`/accounts/${account.id}`); setNotice('Account deleted.'); await load(); }
    catch (err) { setError(messageOf(err, 'Could not delete account.')); }
  }

  return <>
    <PageHeader title="Accounts" description="Manage your cash, bank, savings, and wallet accounts."
      action={<button className="primary-button" onClick={() => openForm()}>＋ Add account</button>} />
    <StatusMessage error={error} notice={notice} />
    {loading ? <p className="muted">Loading accounts…</p> : accounts.length === 0 ?
      <section className="empty-state"><h2>No accounts yet</h2><p>Add an account to start tracking your money.</p></section> :
      <section className="table-card"><div className="table-wrap"><table><thead><tr><th>ACCOUNT NAME</th><th>ACCOUNT TYPE</th><th>BALANCE</th><th>ACTIONS</th></tr></thead>
        <tbody>{accounts.map((account) => <tr key={account.id}><td><strong>{account.name}</strong></td><td>{account.type}</td><td>{money(account.balance)}</td>
          <td className="row-actions"><button onClick={() => openForm(account)}>Edit</button><button className="danger-link" onClick={() => remove(account)}>Delete</button></td></tr>)}</tbody>
      </table></div></section>}
    {form && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setForm(null); }}><section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="account-form-title">
      <header><h2 id="account-form-title">{form.id ? 'Edit account' : 'Add account'}</h2><button className="close-button" aria-label="Close" onClick={() => setForm(null)}>×</button></header>
      <form className="stack-form" onSubmit={save}><label>Account name<input required maxLength="100" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
        <label>Account type<select required value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>{accountTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
        <label>Balance<input type="number" required min="0" step="0.01" value={form.balance} onChange={(event) => setForm({ ...form, balance: event.target.value })} /></label>
        <div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setForm(null)}>Cancel</button><button className="primary-button" disabled={saving}>{saving ? 'Saving…' : 'Save account'}</button></div>
      </form></section></div>}
  </>;
}
