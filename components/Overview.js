'use client';
import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/client';
import { addDays, eachDay, todayISO, yearOf } from '@/lib/dates';
import { dayNumber, fullDate, shortDate, num } from '@/lib/cal';
import { useApp } from './ui';

export default function Overview() {
  const { t, lang, user, staff, settings, isMain, rev, reload, notify, setTab } = useApp();
  const today = todayISO();
  const [leaves, setLeaves] = useState([]);
  const [todayAssign, setTodayAssign] = useState([]);

  useEffect(() => {
    const y = yearOf(today);
    Promise.all([api(`leaves?from=${y}-01-01&to=${y + 1}-12-31`), api(`assignments?from=${today}&to=${today}`)])
      .then(([l, a]) => { setLeaves(l.leaves); setTodayAssign(a.assignments); })
      .catch((e) => notify(e.message, 'bad'));
  }, [today, rev, notify]);

  const live = leaves.filter((l) => l.status !== 'rejected');
  const onLeaveToday = live.filter((l) => l.status === 'approved' && l.from <= today && l.to >= today).length;
  const dutyToday = new Set(todayAssign.map((a) => a.staffId)).size;
  const pending = leaves.filter((l) => l.status === 'pending');
  const removals = staff.filter((s) => s.removalRequest);

  const next14 = useMemo(() => eachDay(today, addDays(today, 13)).map((d) => ({
    d, c: live.filter((l) => l.from <= d && l.to >= d).length,
  })), [live, today]);

  async function decide(l, action) {
    try {
      await api(`leaves/${l.id}`, { method: 'PATCH', body: { action } });
      notify(action === 'approve' ? t('leaveApprovedMsg') : t('leaveRejectedMsg'));
      reload();
    } catch (e) { notify(e.message, 'bad'); }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h2>{t('welcome', { name: user.name })}</h2>
          <div className="muted">{fullDate(today, lang)}</div>
        </div>
      </div>
      <div className="grid g4" style={{ marginBottom: 18 }}>
        <div className="stat s1"><div className="n">{num(staff.length, lang)}</div><div className="l">🧑‍⚕️ {t('totalStaff')}</div></div>
        <div className="stat s2"><div className="n">{num(onLeaveToday, lang)}/{num(settings.maxConcurrent, lang)}</div><div className="l">🌴 {t('onLeaveToday')}</div></div>
        <div className="stat s3"><div className="n">{num(dutyToday, lang)}</div><div className="l">👩‍⚕️ {t('onDutyToday')}</div></div>
        <div className="stat s4"><div className="n">{num(pending.length + removals.length, lang)}</div><div className="l">⏳ {t('pendingApprovals')}</div></div>
      </div>

      <div className="grid g2">
        <div className="card">
          <h2>📊 {t('leaveCapacity')}</h2>
          <p className="muted small" style={{ marginTop: -6 }}>{t('capacityHint', { n: num(settings.maxConcurrent, lang) })}</p>
          <div className="row" style={{ alignItems: 'flex-end', gap: 6, height: 150, flexWrap: 'nowrap' }}>
            {next14.map((x) => {
              const full = x.c >= settings.maxConcurrent;
              return (
                <div key={x.d} style={{ flex: 1, textAlign: 'center' }} title={`${x.d}: ${x.c}`}>
                  <div style={{ fontSize: 11, fontWeight: 800 }}>{x.c || ''}</div>
                  <div style={{
                    height: 8 + (x.c / settings.maxConcurrent) * 92, borderRadius: 8,
                    background: x.c === 0 ? '#e4e7fb' : full ? 'linear-gradient(180deg,#ff7a3d,#ef476f)' : 'linear-gradient(180deg,#14b8a6,#0ea5e9)',
                  }} />
                  <div style={{ fontSize: 11, color: '#6b6f8d', marginTop: 3 }}>{dayNumber(x.d, lang)}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <h2>⏳ {t('pendingTitle')}</h2>
          {pending.length === 0 && removals.length === 0 && <div className="muted">{t('noPending')}</div>}
          {pending.slice(0, 6).map((l) => (
            <div className="leaveitem" key={l.id} style={{ background: '#fff8e6' }}>
              <span>
                <b>{l.staffName}</b><br />
                <span className="small muted">{shortDate(l.from, lang)} → {shortDate(l.to, lang)} · {num(l.days, lang)} · {l.requestedBy?.name}</span>
              </span>
              {isMain && (
                <span className="row" style={{ gap: 6 }}>
                  <button className="btn btn-green btn-sm" onClick={() => decide(l, 'approve')}>✔</button>
                  <button className="btn btn-danger btn-sm" onClick={() => decide(l, 'reject')}>✕</button>
                </span>
              )}
            </div>
          ))}
          {pending.length > 6 && <button className="btn btn-ghost btn-sm" onClick={() => setTab('leaves')}>… {t('nav_leaves')}</button>}
          {removals.length > 0 && (
            <>
              <h3 style={{ marginTop: 12 }}>🗑 {t('removalRequests')}</h3>
              {removals.map((s) => (
                <div className="leaveitem" key={s.id}>
                  <span><b>{s.name}</b> <span className="small muted">· {t('requestedBy', { name: s.removalRequest.by })}</span></span>
                  {isMain && <button className="btn btn-ghost btn-sm" onClick={() => setTab('staff')}>{t('nav_staff')} →</button>}
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </>
  );
}
