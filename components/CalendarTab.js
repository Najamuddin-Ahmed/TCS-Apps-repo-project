'use client';
import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/client';
import { addDays, eachDay, todayISO, dow } from '@/lib/dates';
import { buildMonth, buildYear, nextMonthAnchor, prevMonthAnchor, dayNumber, hijriShort, WEEKDAYS } from '@/lib/cal';
import { useApp } from './ui';
import DayPanel from './DayPanel';
import { LeaveModal } from './LeavesTab';

export default function CalendarTab() {
  const { t, lang, anchor, setAnchor, view, setView, rev, settings } = useApp();
  const [sel, setSel] = useState(todayISO());
  const [leaves, setLeaves] = useState([]);
  const [assigns, setAssigns] = useState([]);
  const [leaveModal, setLeaveModal] = useState(false);
  const today = todayISO();

  const month = useMemo(() => buildMonth(anchor, lang), [anchor, lang]);
  const year = useMemo(() => (view === 'year' ? buildYear(anchor, lang) : null), [anchor, lang, view]);
  const from = view === 'year' ? year.first : month.first;
  const to = view === 'year' ? year.last : month.last;

  useEffect(() => {
    let off = false;
    const jobs = [api(`leaves?from=${from}&to=${to}`)];
    if (view === 'month') jobs.push(api(`assignments?from=${from}&to=${to}`));
    Promise.all(jobs).then(([l, a]) => {
      if (off) return;
      setLeaves(l.leaves.filter((x) => x.status !== 'rejected'));
      setAssigns(a ? a.assignments : []);
    }).catch(() => {});
    return () => { off = true; };
  }, [from, to, view, rev]);

  const leaveByDay = useMemo(() => {
    const m = {};
    for (const l of leaves) {
      const s = l.from > from ? l.from : from;
      const e = l.to < to ? l.to : to;
      for (const d of eachDay(s, e)) m[d] = (m[d] || 0) + 1;
    }
    return m;
  }, [leaves, from, to]);

  const dutyByDay = useMemo(() => {
    const m = {};
    for (const a of assigns) m[a.date] = (m[a.date] || 0) + 1;
    return m;
  }, [assigns]);

  const max = settings.maxConcurrent;
  const prev = () => setAnchor(view === 'year' ? year.prevAnchor : prevMonthAnchor(month));
  const next = () => setAnchor(view === 'year' ? year.nextAnchor : nextMonthAnchor(month));
  const goToday = () => { setAnchor(today); setSel(today); };
  const title = view === 'year' ? year.label : month.label;

  return (
    <>
      <div className="cal-head">
        <div className="cal-title">{title}</div>
        <div className="row no-print">
          <div className="seg">
            <button className={view === 'month' ? 'on' : ''} onClick={() => setView('month')}>{t('month')}</button>
            <button className={view === 'year' ? 'on' : ''} onClick={() => setView('year')}>{t('year')}</button>
          </div>
          <button className="btn btn-ghost" onClick={prev}>{lang === 'ar' ? '›' : '‹'} {t('prev')}</button>
          <button className="btn btn-ghost" onClick={goToday}>{t('today')}</button>
          <button className="btn btn-ghost" onClick={next}>{t('next')} {lang === 'ar' ? '‹' : '›'}</button>
          <button className="btn btn-primary" onClick={() => setLeaveModal(true)}>🌴 {t('newLeave')}</button>
        </div>
      </div>

      {view === 'month' ? (
        <div className="cal-layout">
          <div className="card">
            <div className="cal-grid">
              {WEEKDAYS[lang].map((d) => <div key={d} className="cal-dow">{d}</div>)}
              {Array.from({ length: month.lead }).map((_, i) => <div key={'e' + i} className="cal-cell empty" />)}
              {month.days.map((d) => {
                const lc = leaveByDay[d] || 0;
                const dc = dutyByDay[d] || 0;
                const full = lc >= max;
                const wd = dow(d);
                return (
                  <button
                    key={d}
                    className={['cal-cell', d === today && 'today', d === sel && 'sel', full && 'full', (wd === 5 || wd === 6) && 'weekend'].filter(Boolean).join(' ')}
                    onClick={() => setSel(d)}
                  >
                    <span className="d">{dayNumber(d, lang)}</span>
                    {lang === 'ar' && <span className="g">{Number(d.slice(8))}/{Number(d.slice(5, 7))}</span>}
                    {lc > 0 && <span className={'pill leave' + (full ? ' full' : '')}>🌴 {lc}/{max}{full ? ' · ' + t('full') : ''}</span>}
                    {dc > 0 && <span className="pill duty">👩‍⚕️ {dc}</span>}
                  </button>
                );
              })}
            </div>
            <div className="legend">
              <span><i style={{ background: '#ffe9d6' }} />{t('onLeave')}</span>
              <span><i style={{ background: 'var(--pink)' }} />{t('full')} ({max}/{max})</span>
              <span><i style={{ background: '#dff3ff' }} />{t('onDuty')}</span>
              <span className="muted">{t('clickDay')}</span>
            </div>
          </div>
          <div className="daypanel"><DayPanel date={sel} /></div>
        </div>
      ) : (
        <>
          <p className="muted small">{t('leaveHeat')}: 1 · 2 · {max}</p>
          <div className="year-grid">
            {year.months.map((m) => (
              <div className="mini" key={m.first}>
                <h4 onClick={() => { setAnchor(m.first); setView('month'); }}>{m.label}</h4>
                <div className="mini-grid">
                  {WEEKDAYS[lang].map((d, i) => <span key={i} className="dw">{d.slice(0, lang === 'ar' ? 2 : 1)}</span>)}
                  {Array.from({ length: m.lead }).map((_, i) => <span key={'b' + i} className="blank" />)}
                  {m.days.map((d) => {
                    const c = leaveByDay[d] || 0;
                    const cls = c === 0 ? '' : c >= max ? 'l4' : 'l' + Math.min(c, 3);
                    return (
                      <span key={d} className={cls} title={`${d}${c ? ' · ' + c : ''}`}
                        onClick={() => { setSel(d); setAnchor(d); setView('month'); }}>
                        {dayNumber(d, lang)}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className="legend">
            <span><i style={{ background: '#d6f5e9' }} />1</span>
            <span><i style={{ background: '#ffe7a8' }} />2</span>
            <span><i style={{ background: '#ff9d6c' }} />3</span>
            <span><i style={{ background: 'var(--pink)' }} />{t('full')}</span>
            {lang === 'ar' && <span className="muted">{hijriShort(today)}</span>}
          </div>
        </>
      )}
      {leaveModal && <LeaveModal defaults={{ from: sel, to: sel }} onClose={() => setLeaveModal(false)} />}
    </>
  );
}
