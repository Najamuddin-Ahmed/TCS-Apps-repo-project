'use client';
import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/client';
import { addDays, toMin, crossesMidnight } from '@/lib/dates';
import { fullDate, hijriShort, num } from '@/lib/cal';
import { useApp, Modal } from './ui';

const HOURS = [0, 3, 6, 9, 12, 15, 18, 21, 24];

export default function DayPanel({ date }) {
  const { t, lang, shifts, staff, settings, rev, reload, notify } = useApp();
  const [data, setData] = useState({ leaves: [], assigns: [] });
  const [modal, setModal] = useState(null); // {type, seg}

  useEffect(() => {
    let off = false;
    Promise.all([api(`leaves?from=${date}&to=${date}`), api(`assignments?from=${addDays(date, -1)}&to=${date}`)])
      .then(([l, a]) => !off && setData({ leaves: l.leaves.filter((x) => x.status !== 'rejected'), assigns: a.assignments }))
      .catch((e) => notify(e.message, 'bad'));
    return () => { off = true; };
  }, [date, rev, notify]);

  const staffById = useMemo(() => Object.fromEntries(staff.map((s) => [s.id, s])), [staff]);
  const shiftsById = useMemo(() => Object.fromEntries(shifts.map((s) => [s.id, s])), [shifts]);

  // Build the 24-hour segments for this day (including a night shift that started yesterday)
  const segs = useMemo(() => {
    const out = [];
    for (const a of data.assigns) {
      const sh = shiftsById[a.shiftId];
      const st = staffById[a.staffId];
      if (!sh || !st) continue;
      const s = toMin(sh.start);
      const e = toMin(sh.end);
      if (a.date === date) out.push({ a, sh, st, start: s, end: crossesMidnight(sh) ? 1440 : e, carry: false });
      else if (crossesMidnight(sh)) out.push({ a, sh, st, start: 0, end: e, carry: true });
    }
    return out.sort((x, y) => x.start - y.start || x.st.name.localeCompare(y.st.name));
  }, [data.assigns, date, shiftsById, staffById]);

  const lc = data.leaves.length;
  const max = settings.maxConcurrent;
  const hhmm = (m) => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

  async function removeSeg(seg) {
    if (!confirm(`${t('removeFromShift')}: ${seg.st.name}?`)) return;
    try {
      await api(`assignments/${seg.a.id}`, { method: 'DELETE' });
      reload();
    } catch (e) { notify(e.message, 'bad'); }
  }

  return (
    <div className="card">
      <h2>{fullDate(date, lang)}</h2>
      {lang === 'ar' && <div className="muted small">{date}</div>}
      {lang === 'en' && <div className="muted small no-print">{date}</div>}

      <div className="cap">
        <span className="small"><b>{t('capacity')}</b></span>
        <div className="bar"><i className={lc >= max ? 'full' : ''} style={{ width: Math.min(100, (lc / max) * 100) + '%' }} /></div>
        <b>{num(lc, lang)}/{num(max, lang)}</b>
      </div>

      <button className="btn btn-primary btn-sm" onClick={() => setModal({ type: 'assign' })}>➕ {t('assignStaff')}</button>

      <h3 style={{ marginTop: 16 }}>⏱ {t('timeline')}</h3>
      {segs.length === 0 ? (
        <div className="muted small">{t('noDuty')}</div>
      ) : (
        <div className="timeline">
          <div className="tl-scale" style={{ marginInlineEnd: 84 }}>
            {HOURS.map((h) => <span key={h} style={{ left: (h / 24) * 100 + '%' }}>{String(h).padStart(2, '0')}</span>)}
          </div>
          {segs.map((g, i) => (
            <div className="tl-row" key={g.a.id + i}>
              <div className="tl-name" title={g.st.name}>{g.st.name}</div>
              <div className="tl-track">
                <div className="tl-bar" style={{ left: (g.start / 1440) * 100 + '%', width: ((g.end - g.start) / 1440) * 100 + '%', background: g.sh.color }} />
              </div>
              <div className="tl-time">{hhmm(g.start)}–{g.end === 1440 ? '24:00' : hhmm(g.end)}</div>
            </div>
          ))}
        </div>
      )}

      {shifts.map((sh) => {
        const list = segs.filter((g) => g.sh.id === sh.id);
        if (!list.length) return null;
        return (
          <div className="shiftbox" key={sh.id}>
            <div className="hd" style={{ background: sh.color }}>
              <span>{sh.name}</span>
              <span dir="ltr">{sh.start} – {sh.end}</span>
            </div>
            <div className="bd">
              {list.map((g) => (
                <div className="person" key={g.a.id}>
                  <div>
                    <div className="nm">{g.st.name}</div>
                    <div className="sub">{g.st.role} · {g.a.department}{g.carry ? ' · ' + t('continuesFromPrev') : ''}</div>
                  </div>
                  {!g.carry && (
                    <div className="acts no-print">
                      <button className="iconbtn" onClick={() => setModal({ type: 'sub', seg: g })}>🔁 {t('substitute')}</button>
                      <button className="iconbtn" onClick={() => setModal({ type: 'move', seg: g })}>🏥 {t('transfer')}</button>
                      <button className="iconbtn red" onClick={() => removeSeg(g)}>✕</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <h3 style={{ marginTop: 14 }}>🌴 {t('onLeave')}</h3>
      {lc === 0 ? <div className="muted small">{t('noLeave')}</div> : data.leaves.map((l) => (
        <div className="leaveitem" key={l.id}>
          <span>{l.staffName}</span>
          <span className={'badge b-' + l.status}>{t(l.status)}</span>
        </div>
      ))}

      {modal?.type === 'assign' && <AssignModal date={date} onClose={() => setModal(null)} />}
      {modal?.type === 'sub' && <SubstituteModal seg={modal.seg} date={date} assigns={data.assigns} leaves={data.leaves} onClose={() => setModal(null)} />}
      {modal?.type === 'move' && <TransferModal seg={modal.seg} date={date} onClose={() => setModal(null)} />}
    </div>
  );
}

function AssignModal({ date, onClose }) {
  const { t, lang, shifts, staff, settings, reload, notify } = useApp();
  const [shiftId, setShiftId] = useState(shifts[0]?.id || '');
  const [from, setFrom] = useState(date);
  const [to, setTo] = useState(date);
  const [dept, setDept] = useState('');
  const [pick, setPick] = useState([]);
  const [q, setQ] = useState('');
  const [leaves, setLeaves] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!from || !to || to < from) return;
    api(`leaves?from=${from}&to=${to}`).then((d) => setLeaves(d.leaves.filter((l) => l.status === 'approved'))).catch(() => {});
  }, [from, to]);

  const onLeaveIds = new Set(leaves.map((l) => l.staffId));
  const list = staff.filter((s) => (s.name + s.role + s.department).toLowerCase().includes(q.toLowerCase()));
  const toggle = (id) => setPick((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const r = await api('assignments', { method: 'POST', body: { shiftId, from, to, department: dept, staffIds: pick } });
      let msg = t('assigned', { n: r.created });
      if (r.skippedCount) msg += ` · ${t('skippedN', { n: r.skippedCount })} (${r.skipped[0].staff}: ${r.skipped[0].reason})`;
      notify(msg, r.created ? 'good' : 'bad');
      reload();
      onClose();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <Modal title={t('assignTitle')} onClose={onClose} wide>
      <form onSubmit={submit}>
        {error && <div className="err">{error}</div>}
        <div className="form-grid">
          <label className="f">{t('shift')}
            <select value={shiftId} onChange={(e) => setShiftId(e.target.value)} required>
              {shifts.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.start}–{s.end})</option>)}
            </select>
          </label>
          <label className="f">{t('department')}
            <select value={dept} onChange={(e) => setDept(e.target.value)}>
              <option value="">— {lang === 'ar' ? 'قسم كل موظف' : "each person's own department"} —</option>
              {settings.departments.map((d) => <option key={d}>{d}</option>)}
            </select>
          </label>
          <label className="f">{t('leaveFrom')}<input type="date" value={from} onChange={(e) => { setFrom(e.target.value); if (to < e.target.value) setTo(e.target.value); }} required /></label>
          <label className="f">{t('leaveTo')}<input type="date" min={from} value={to} onChange={(e) => setTo(e.target.value)} required /></label>
        </div>
        <label className="f">{t('chooseStaff')} <span className="muted">({t('selected', { n: pick.length })})</span>
          <input placeholder={t('search')} value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <div className="checklist">
          {list.map((s) => (
            <label key={s.id}>
              <input type="checkbox" checked={pick.includes(s.id)} onChange={() => toggle(s.id)} />
              <span><b>{s.name}</b> <span className="muted small">· {s.role} · {s.department}</span></span>
              {onLeaveIds.has(s.id) && <span className="badge b-pending">🌴 {t('unavailable')}</span>}
            </label>
          ))}
        </div>
        <div className="modal-f">
          <button type="button" className="btn btn-ghost" onClick={onClose}>{t('cancel')}</button>
          <button className="btn btn-primary" disabled={busy || !pick.length}>{t('assignStaff')}</button>
        </div>
      </form>
    </Modal>
  );
}

function SubstituteModal({ seg, date, assigns, leaves, onClose }) {
  const { t, staff, reload, notify } = useApp();
  const [sid, setSid] = useState('');
  const [error, setError] = useState('');
  const taken = new Set(assigns.filter((a) => a.shiftId === seg.sh.id && a.date === date).map((a) => a.staffId));
  const away = new Set(leaves.filter((l) => l.status === 'approved').map((l) => l.staffId));
  const options = staff.filter((s) => !taken.has(s.id) && !away.has(s.id));

  async function submit(e) {
    e.preventDefault();
    try {
      await api(`assignments/${seg.a.id}`, { method: 'PATCH', body: { staffId: sid } });
      notify(t('swapped'));
      reload();
      onClose();
    } catch (err) { setError(err.message); }
  }
  return (
    <Modal title={t('substituteTitle')} onClose={onClose}>
      <form onSubmit={submit}>
        {error && <div className="err">{error}</div>}
        <p><b>{seg.st.name}</b> · {seg.sh.name} ({seg.sh.start}–{seg.sh.end}) · {seg.a.department}</p>
        <label className="f">{t('replaceWith')}
          <select value={sid} onChange={(e) => setSid(e.target.value)} required>
            <option value="">—</option>
            {options.map((s) => <option key={s.id} value={s.id}>{s.name} · {s.role} · {s.department}</option>)}
          </select>
        </label>
        <div className="modal-f">
          <button type="button" className="btn btn-ghost" onClick={onClose}>{t('cancel')}</button>
          <button className="btn btn-primary" disabled={!sid}>{t('substitute')}</button>
        </div>
      </form>
    </Modal>
  );
}

function TransferModal({ seg, date, onClose }) {
  const { t, settings, reload, notify } = useApp();
  const [dept, setDept] = useState('');
  const [to, setTo] = useState(date);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    try {
      const r = await api('assignments/transfer', { method: 'POST', body: { staffId: seg.st.id, department: dept, from: date, to } });
      notify(`${t('swapped')} (${r.updated})`);
      reload();
      onClose();
    } catch (err) { setError(err.message); }
  }
  return (
    <Modal title={t('transferTitle')} onClose={onClose}>
      <form onSubmit={submit}>
        {error && <div className="err">{error}</div>}
        <p><b>{seg.st.name}</b> · {seg.a.department} → ?</p>
        <label className="f">{t('newDepartment')}
          <select value={dept} onChange={(e) => setDept(e.target.value)} required>
            <option value="">—</option>
            {settings.departments.filter((d) => d !== seg.a.department).map((d) => <option key={d}>{d}</option>)}
          </select>
        </label>
        <label className="f">{t('applyUntil')}<input type="date" min={date} value={to} onChange={(e) => setTo(e.target.value)} required /></label>
        <div className="modal-f">
          <button type="button" className="btn btn-ghost" onClick={onClose}>{t('cancel')}</button>
          <button className="btn btn-primary" disabled={!dept}>{t('transfer')}</button>
        </div>
      </form>
    </Modal>
  );
}
