'use client';
import { useState } from 'react';
import { api } from '@/lib/client';
import { useApp, Modal } from './ui';

export default function ShiftsTab() {
  const { t, shifts, isMain, reload, notify } = useApp();
  const [modal, setModal] = useState(null);

  async function del(s) {
    if (!confirm(`${t('delete')}: ${s.name}?`)) return;
    try { await api(`shifts/${s.id}`, { method: 'DELETE' }); reload(); } catch (e) { notify(e.message, 'bad'); }
  }

  return (
    <>
      <div className="page-head">
        <h2>⏰ {t('nav_shifts')}</h2>
        <button className="btn btn-primary" onClick={() => setModal({})}>➕ {t('addShift')}</button>
      </div>
      <p className="muted">{t('shiftsHelp')}</p>
      <div className="cards">
        {shifts.map((s) => (
          <div className="shiftcard" key={s.id} style={{ background: `linear-gradient(135deg, ${s.color}, ${s.color}cc)` }}>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{s.name}</div>
            <div className="tm">{s.start} – {s.end}</div>
            <div className="row" style={{ marginTop: 12, gap: 8 }}>
              <button className="btn btn-sm" style={{ background: '#fff', color: '#333' }} onClick={() => setModal({ shift: s })}>✎ {t('edit')}</button>
              {isMain && <button className="btn btn-sm" style={{ background: 'rgba(0,0,0,.25)', color: '#fff' }} onClick={() => del(s)}>🗑 {t('delete')}</button>}
            </div>
          </div>
        ))}
      </div>
      {modal && <ShiftModal shift={modal.shift} onClose={() => setModal(null)} />}
    </>
  );
}

function ShiftModal({ shift: s, onClose }) {
  const { t, reload, notify } = useApp();
  const [f, setF] = useState({ name: s?.name || '', start: s?.start || '08:00', end: s?.end || '16:00', color: s?.color || '#0ea5e9' });
  const [error, setError] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  async function submit(e) {
    e.preventDefault();
    try {
      if (s) await api(`shifts/${s.id}`, { method: 'PATCH', body: f });
      else await api('shifts', { method: 'POST', body: f });
      notify(t('saved'));
      reload();
      onClose();
    } catch (err) { setError(err.message); }
  }
  return (
    <Modal title={s ? t('editShift') : t('addShift')} onClose={onClose}>
      <form onSubmit={submit}>
        {error && <div className="err">{error}</div>}
        <label className="f">{t('shiftName')}<input value={f.name} onChange={set('name')} required autoFocus /></label>
        <div className="form-grid">
          <label className="f">{t('startTime')}<input type="time" value={f.start} onChange={set('start')} required /></label>
          <label className="f">{t('endTime')}<input type="time" value={f.end} onChange={set('end')} required /></label>
        </div>
        <label className="f">{t('color')}<input type="color" value={f.color} onChange={set('color')} style={{ height: 44, padding: 4 }} /></label>
        <div className="modal-f">
          <button type="button" className="btn btn-ghost" onClick={onClose}>{t('cancel')}</button>
          <button className="btn btn-primary">{t('save')}</button>
        </div>
      </form>
    </Modal>
  );
}
