'use client';
import { useState } from 'react';
import { api } from '@/lib/client';
import { useApp, Modal } from './ui';

export default function AdminsTab() {
  const { t, admins, settings, isMain, user, reload, notify } = useApp();
  const [modal, setModal] = useState(null); // 'add' | {reset: admin}
  const [cfg, setCfg] = useState({
    maxConcurrent: settings.maxConcurrent, quota: settings.quota, departments: settings.departments.join(', '),
  });
  const [error, setError] = useState('');

  async function saveSettings(e) {
    e.preventDefault();
    setError('');
    try {
      await api('settings', {
        method: 'PATCH',
        body: { maxConcurrent: cfg.maxConcurrent, quota: cfg.quota, departments: cfg.departments.split(',').map((x) => x.trim()).filter(Boolean) },
      });
      notify(t('saved'));
      reload();
    } catch (err) { setError(err.message); }
  }
  async function del(a) {
    if (!confirm(`${t('remove')}: ${a.name}?`)) return;
    try { await api(`admins/${a.id}`, { method: 'DELETE' }); reload(); } catch (e) { notify(e.message, 'bad'); }
  }

  const P = [
    ['perm_staff', 'allowed', 'allowed'],
    ['perm_roster', 'allowed', 'allowed'],
    ['perm_shifts', 'allowed', 'allowed'],
    ['perm_leave', 'allowed', 'with_approval'],
    ['perm_approve', 'allowed', 'onlyMain'],
    ['perm_removeStaff', 'allowed', 'with_approval'],
    ['perm_delShift', 'allowed', 'onlyMain'],
    ['perm_admins', 'allowed', 'onlyMain'],
  ];

  return (
    <>
      <div className="page-head">
        <h2>🛡️ {t('nav_admins')}</h2>
        {isMain && <button className="btn btn-primary" disabled={admins.length >= 3} onClick={() => setModal('add')}>➕ {t('addAdmin')}</button>}
      </div>
      <div className="grid g2">
        <div className="card">
          <h2>{t('admins')} ({admins.length}/3)</h2>
          <p className="muted small" style={{ marginTop: -6 }}>{t('maxAdmins')}</p>
          {admins.map((a) => (
            <div className="person" key={a.id} style={{ marginBottom: 8 }}>
              <div>
                <div className="nm">{a.name} <span className={'badge ' + (a.role === 'main' ? 'b-main' : 'b-admin')}>{t(a.role === 'main' ? 'role_main' : 'role_admin')}</span></div>
                <div className="sub">@{a.username} · {a.designation}</div>
              </div>
              {isMain && a.role !== 'main' && (
                <div className="acts">
                  <button className="iconbtn" onClick={() => setModal({ reset: a })}>🔑 {t('resetPassword')}</button>
                  <button className="iconbtn red" onClick={() => del(a)}>✕</button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="card">
          <h2>⚙️ {t('settings')}</h2>
          {error && <div className="err">{error}</div>}
          <form onSubmit={saveSettings}>
            <div className="form-grid">
              <label className="f">{t('maxConcurrent')}<input type="number" min="1" max="40" value={cfg.maxConcurrent} disabled={!isMain} onChange={(e) => setCfg({ ...cfg, maxConcurrent: e.target.value })} /></label>
              <label className="f">{t('quota')}<input type="number" min="1" max="366" value={cfg.quota} disabled={!isMain} onChange={(e) => setCfg({ ...cfg, quota: e.target.value })} /></label>
            </div>
            <label className="f">{t('departments')}<textarea rows="3" value={cfg.departments} disabled={!isMain} onChange={(e) => setCfg({ ...cfg, departments: e.target.value })} /></label>
            {isMain && <button className="btn btn-primary">{t('save')}</button>}
          </form>
        </div>
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <h2>🔐 {t('permissions')}</h2>
        <div className="tablewrap">
          <table className="t">
            <thead><tr><th></th><th className="num">{t('role_main')}</th><th className="num">{t('role_admin')}</th></tr></thead>
            <tbody>
              {P.map(([k, a, b]) => (
                <tr key={k}><td>{t(k)}</td><td className="num"><span className="badge b-approved">✔ {t(a)}</span></td><td className="num"><span className={'badge ' + (b === 'allowed' ? 'b-approved' : b === 'onlyMain' ? 'b-rejected' : 'b-pending')}>{b === 'allowed' ? '✔ ' : b === 'onlyMain' ? '✖ ' : '⏳ '}{t(b)}</span></td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal === 'add' && <AddAdminModal onClose={() => setModal(null)} />}
      {modal?.reset && <ResetModal admin={modal.reset} onClose={() => setModal(null)} />}
    </>
  );
}

function AddAdminModal({ onClose }) {
  const { t, reload, notify } = useApp();
  const [f, setF] = useState({ name: '', username: '', designation: '', password: '' });
  const [error, setError] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  async function submit(e) {
    e.preventDefault();
    try {
      await api('admins', { method: 'POST', body: f });
      notify(t('saved'));
      reload();
      onClose();
    } catch (err) { setError(err.message); }
  }
  return (
    <Modal title={t('addAdmin')} onClose={onClose}>
      <form onSubmit={submit}>
        {error && <div className="err">{error}</div>}
        <label className="f">{t('fullName')}<input value={f.name} onChange={set('name')} required autoFocus /></label>
        <div className="form-grid">
          <label className="f">{t('username')}<input value={f.username} onChange={set('username')} required autoComplete="off" /></label>
          <label className="f">{t('designation')}<input value={f.designation} onChange={set('designation')} required /></label>
        </div>
        <label className="f">{t('password')}<input type="password" minLength={8} value={f.password} onChange={set('password')} required autoComplete="new-password" /></label>
        <div className="modal-f">
          <button type="button" className="btn btn-ghost" onClick={onClose}>{t('cancel')}</button>
          <button className="btn btn-primary">{t('save')}</button>
        </div>
      </form>
    </Modal>
  );
}

function ResetModal({ admin, onClose }) {
  const { t, notify } = useApp();
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  async function submit(e) {
    e.preventDefault();
    try {
      await api(`admins/${admin.id}`, { method: 'PATCH', body: { password: pw } });
      notify(t('saved'));
      onClose();
    } catch (err) { setError(err.message); }
  }
  return (
    <Modal title={`${t('resetPassword')} · ${admin.name}`} onClose={onClose}>
      <form onSubmit={submit}>
        {error && <div className="err">{error}</div>}
        <label className="f">{t('newPassword')}<input type="password" minLength={8} value={pw} onChange={(e) => setPw(e.target.value)} required autoFocus autoComplete="new-password" /></label>
        <div className="modal-f">
          <button type="button" className="btn btn-ghost" onClick={onClose}>{t('cancel')}</button>
          <button className="btn btn-primary">{t('save')}</button>
        </div>
      </form>
    </Modal>
  );
}
