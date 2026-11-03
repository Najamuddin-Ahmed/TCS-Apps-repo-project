'use client';
import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/client';
import { overlapDays } from '@/lib/dates';
import { num } from '@/lib/cal';
import { useApp, Modal, colorFor, initials } from './ui';

export default function StaffTab() {
  const { t, lang, staff, settings, isMain, rev, reload, notify } = useApp();
  const year = new Date().getFullYear();
  const [leaves, setLeaves] = useState([]);
  const [q, setQ] = useState('');
  const [dept, setDept] = useState('');
  const [modal, setModal] = useState(null); // {staff?}

  useEffect(() => {
    api(`leaves?from=${year}-01-01&to=${year}-12-31`).then((d) => setLeaves(d.leaves)).catch(() => {});
  }, [year, rev]);

  const usage = useMemo(() => {
    const u = {};
    for (const l of leaves) {
      if (l.status === 'rejected') continue;
      const d = overlapDays(l.from, l.to, `${year}-01-01`, `${year}-12-31`);
      u[l.staffId] ||= { used: 0, pending: 0 };
      if (l.status === 'approved') u[l.staffId].used += d;
      else u[l.staffId].pending += d;
    }
    return u;
  }, [leaves, year]);

  const rows = staff.filter(
    (s) => (s.name + s.role + s.designation).toLowerCase().includes(q.toLowerCase()) && (!dept || s.department === dept)
  );
  const depts = [...new Set([...settings.departments, ...staff.map((s) => s.department)])];

  async function remove(s) {
    if (!confirm(`${isMain ? t('removeStaff') : t('requestRemoval')}: ${s.name}?`)) return;
    try {
      const r = await api(`staff/${s.id}`, { method: 'DELETE' });
      notify(r.requested ? t('removalSent') : t('removedMsg'));
      reload();
    } catch (e) { notify(e.message, 'bad'); }
  }
  async function decline(s) {
    try { await api(`staff/${s.id}`, { method: 'PATCH', body: { clearRemovalRequest: true } }); reload(); } catch (e) { notify(e.message, 'bad'); }
  }

  return (
    <>
      <div className="page-head">
        <h2>🧑‍⚕️ {t('nav_staff')} <span className="muted" style={{ fontSize: 16 }}>({num(staff.length, lang)})</span></h2>
        <button className="btn btn-primary" onClick={() => setModal({})}>➕ {t('addStaff')}</button>
      </div>
      <div className="row" style={{ marginBottom: 16 }}>
        <input className="input" style={{ maxWidth: 260 }} placeholder={t('search')} value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input" style={{ maxWidth: 220 }} value={dept} onChange={(e) => setDept(e.target.value)}>
          <option value="">{t('all')} · {t('department')}</option>
          {depts.map((d) => <option key={d}>{d}</option>)}
        </select>
      </div>
      <div className="cards">
        {rows.map((s) => {
          const u = usage[s.id] || { used: 0, pending: 0 };
          const c = colorFor(s.name);
          return (
            <div className="staffcard" key={s.id} style={{ '--c': c }}>
              <div className="row" style={{ flexWrap: 'nowrap' }}>
                <div className="avatar">{initials(s.name)}</div>
                <div style={{ minWidth: 0 }}>
                  <b style={{ fontSize: 16 }}>{s.name}</b>
                  <div className="small muted">{s.role} · {s.designation}</div>
                  <div className="small"><span className="badge b-admin">{s.department}</span></div>
                </div>
              </div>
              <div style={{ marginTop: 12 }}>
                <div className="row between small"><b>{t('leaveBalance')}</b><span>{num(u.used, lang)} {t('used')} · {num(u.pending, lang)} {t('pendingDays')} / {num(settings.quota, lang)}</span></div>
                <div className="meter">
                  <i className="u" style={{ width: Math.min(100, (u.used / settings.quota) * 100) + '%' }} />
                  <i className="p" style={{ width: Math.min(100, (u.pending / settings.quota) * 100) + '%' }} />
                </div>
              </div>
              {s.removalRequest && <div className="info" style={{ marginTop: 8 }}>⚠ {t('removalPending', { name: s.removalRequest.by })}</div>}
              <div className="row" style={{ marginTop: 10, gap: 6 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setModal({ staff: s })}>✎ {t('edit')}</button>
                {s.removalRequest && isMain ? (
                  <>
                    <button className="btn btn-danger btn-sm" onClick={() => remove(s)}>✔ {t('approveRemoval')}</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => decline(s)}>{t('declineRemoval')}</button>
                  </>
                ) : (
                  !s.removalRequest && <button className="btn btn-danger btn-sm" onClick={() => remove(s)}>🗑 {isMain ? t('remove') : t('requestRemoval')}</button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {modal && <StaffModal staff={modal.staff} onClose={() => setModal(null)} />}
    </>
  );
}

function StaffModal({ staff: s, onClose }) {
  const { t, settings, reload, notify } = useApp();
  const [f, setF] = useState({ name: s?.name || '', role: s?.role || '', designation: s?.designation || '', department: s?.department || '', phone: s?.phone || '' });
  const [error, setError] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    try {
      if (s) await api(`staff/${s.id}`, { method: 'PATCH', body: f });
      else await api('staff', { method: 'POST', body: f });
      notify(t('saved'));
      reload();
      onClose();
    } catch (err) { setError(err.message); }
  }
  return (
    <Modal title={s ? t('editStaff') : t('addStaff')} onClose={onClose}>
      <form onSubmit={submit}>
        {error && <div className="err">{error}</div>}
        <label className="f">{t('staffName')}<input value={f.name} onChange={set('name')} required autoFocus /></label>
        <div className="form-grid">
          <label className="f">{t('staffRole')}<input value={f.role} onChange={set('role')} required placeholder="Nurse" /></label>
          <label className="f">{t('designation')}<input value={f.designation} onChange={set('designation')} required placeholder="Senior Staff Nurse" /></label>
        </div>
        <div className="form-grid">
          <label className="f">{t('department')}
            <input list="deptlist" value={f.department} onChange={set('department')} required />
            <datalist id="deptlist">{settings.departments.map((d) => <option key={d} value={d} />)}</datalist>
          </label>
          <label className="f">{t('phone')}<input value={f.phone} onChange={set('phone')} /></label>
        </div>
        <div className="modal-f">
          <button type="button" className="btn btn-ghost" onClick={onClose}>{t('cancel')}</button>
          <button className="btn btn-primary">{t('save')}</button>
        </div>
      </form>
    </Modal>
  );
}
