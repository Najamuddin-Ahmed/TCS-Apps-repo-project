'use client';
import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/client';
import { countDays, overlapDays, todayISO, yearOf } from '@/lib/dates';
import { shortDate, hijriShort, num } from '@/lib/cal';
import { useApp, Modal, StatusBadge } from './ui';

export default function LeavesTab() {
  const { t, lang, isMain, user, rev, reload, notify, anchor } = useApp();
  const [year, setYear] = useState(Number(anchor.slice(0, 4)) || new Date().getFullYear());
  const [leaves, setLeaves] = useState([]);
  const [status, setStatus] = useState('all');
  const [q, setQ] = useState('');
  const [modal, setModal] = useState(false);

  useEffect(() => {
    api(`leaves?from=${year}-01-01&to=${year}-12-31`).then((d) => setLeaves(d.leaves)).catch((e) => notify(e.message, 'bad'));
  }, [year, rev, notify]);

  const rows = useMemo(
    () => leaves.filter((l) => (status === 'all' || l.status === status) && l.staffName.toLowerCase().includes(q.toLowerCase())),
    [leaves, status, q]
  );
  const pendingN = leaves.filter((l) => l.status === 'pending').length;

  async function decide(l, action) {
    try {
      const r = await api(`leaves/${l.id}`, { method: 'PATCH', body: { action } });
      notify(action === 'approve' ? t('leaveApprovedMsg') + (r.removedAssignments ? ` (${r.removedAssignments} duty slot(s) freed)` : '') : t('leaveRejectedMsg'));
      reload();
    } catch (e) { notify(e.message, 'bad'); }
  }
  async function del(l) {
    if (!confirm(t('confirmDelete'))) return;
    try { await api(`leaves/${l.id}`, { method: 'DELETE' }); reload(); } catch (e) { notify(e.message, 'bad'); }
  }

  return (
    <>
      <div className="page-head">
        <h2>🌴 {t('nav_leaves')}</h2>
        <button className="btn btn-primary" onClick={() => setModal(true)}>➕ {t('newLeave')}</button>
      </div>
      <div className="card">
        <div className="row between no-print" style={{ marginBottom: 14 }}>
          <div className="row">
            <button className="btn btn-ghost btn-sm" onClick={() => setYear(year - 1)}>‹</button>
            <b style={{ fontSize: 18 }}>{num(year, 'en')}</b>
            <button className="btn btn-ghost btn-sm" onClick={() => setYear(year + 1)}>›</button>
          </div>
          <div className="row">
            <input className="input" style={{ width: 200 }} placeholder={t('search')} value={q} onChange={(e) => setQ(e.target.value)} />
            <select className="input" style={{ width: 160 }} value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="all">{t('all')}</option>
              <option value="pending">{t('pending')} {pendingN ? `(${pendingN})` : ''}</option>
              <option value="approved">{t('approved')}</option>
              <option value="rejected">{t('rejected')}</option>
            </select>
          </div>
        </div>
        <div className="tablewrap">
          <table className="t">
            <thead>
              <tr><th>{t('staff')}</th><th>{t('dates')}</th><th className="num">{t('days')}</th><th>{t('status')}</th><th>{t('requested')}</th><th>{t('reason')}</th><th>{t('actions')}</th></tr>
            </thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan="7" className="muted">{t('noRecords')}</td></tr>}
              {rows.map((l) => (
                <tr key={l.id}>
                  <td><b>{l.staffName}</b></td>
                  <td>
                    {shortDate(l.from, lang)} → {shortDate(l.to, lang)}
                    {lang === 'ar' && <div className="small muted">{hijriShort(l.from)} → {hijriShort(l.to)}</div>}
                  </td>
                  <td className="num"><b>{num(l.days, lang)}</b></td>
                  <td><StatusBadge status={l.status} /></td>
                  <td className="small">{l.requestedBy?.name}</td>
                  <td className="small muted">{l.reason}</td>
                  <td>
                    <div className="row" style={{ gap: 6 }}>
                      {isMain && l.status === 'pending' && (
                        <>
                          <button className="btn btn-green btn-sm" onClick={() => decide(l, 'approve')}>✔ {t('approve')}</button>
                          <button className="btn btn-danger btn-sm" onClick={() => decide(l, 'reject')}>✕ {t('reject')}</button>
                        </>
                      )}
                      {(isMain || (l.status === 'pending' && l.requestedBy?.id === user.id)) && (
                        <button className="iconbtn red" onClick={() => del(l)}>🗑</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {modal && <LeaveModal onClose={() => setModal(false)} />}
    </>
  );
}

// Assign leave from date to date for a staff member
export function LeaveModal({ onClose, defaults = {}, staffId: presetStaff = '' }) {
  const { t, lang, staff, settings, isMain, reload, notify } = useApp();
  const [staffId, setStaffId] = useState(presetStaff);
  const [from, setFrom] = useState(defaults.from || todayISO());
  const [to, setTo] = useState(defaults.to || defaults.from || todayISO());
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [yearLeaves, setYearLeaves] = useState([]);
  const year = yearOf(from);

  useEffect(() => {
    api(`leaves?from=${year}-01-01&to=${year}-12-31`).then((d) => setYearLeaves(d.leaves)).catch(() => {});
  }, [year]);

  const used = useMemo(() => {
    if (!staffId) return 0;
    return yearLeaves
      .filter((l) => l.staffId === staffId && l.status !== 'rejected')
      .reduce((a, l) => a + overlapDays(l.from, l.to, `${year}-01-01`, `${year}-12-31`), 0);
  }, [yearLeaves, staffId, year]);

  const days = to >= from ? countDays(from, to) : 0;

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const r = await api('leaves', { method: 'POST', body: { staffId, from, to, reason } });
      notify(r.leave.status === 'approved' ? t('leaveSaved') : t('leaveRequested'));
      reload();
      onClose();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <Modal title={'🌴 ' + t('newLeave')} onClose={onClose}>
      <form onSubmit={submit}>
        {error && <div className="err">{error}</div>}
        <div className={isMain ? 'ok' : 'info'}>{isMain ? t('leaveApprovedNow') : t('leaveSentForApproval')}</div>
        <label className="f">{t('staffMember')}
          <select value={staffId} onChange={(e) => setStaffId(e.target.value)} required>
            <option value="">—</option>
            {staff.map((s) => <option key={s.id} value={s.id}>{s.name} · {s.role}</option>)}
          </select>
        </label>
        <div className="form-grid">
          <label className="f">{t('leaveFrom')}
            <input type="date" value={from} required onChange={(e) => { setFrom(e.target.value); if (to < e.target.value) setTo(e.target.value); }} />
            {lang === 'ar' && from && <span className="small muted">{hijriShort(from)}</span>}
          </label>
          <label className="f">{t('leaveTo')}
            <input type="date" min={from} value={to} required onChange={(e) => setTo(e.target.value)} />
            {lang === 'ar' && to && <span className="small muted">{hijriShort(to)}</span>}
          </label>
        </div>
        {staffId && (
          <div className="info">
            <b>{t('daysCount', { n: num(days, lang) })}</b> · {t('leftDays', { n: num(Math.max(0, settings.quota - used), lang), q: num(settings.quota, lang), y: num(year, 'en') })}
          </div>
        )}
        <label className="f">{t('reason')}<input value={reason} maxLength={300} onChange={(e) => setReason(e.target.value)} /></label>
        <div className="modal-f">
          <button type="button" className="btn btn-ghost" onClick={onClose}>{t('cancel')}</button>
          <button className="btn btn-primary" disabled={busy || !staffId}>{t('save')}</button>
        </div>
      </form>
    </Modal>
  );
}
