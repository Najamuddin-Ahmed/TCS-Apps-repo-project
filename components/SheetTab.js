'use client';
import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/client';
import { overlapDays, todayISO } from '@/lib/dates';
import { buildYear, num } from '@/lib/cal';
import { useApp } from './ui';

// The annual attendance sheet: approved leave days per staff per month
export default function SheetTab() {
  const { t, lang, staff, settings, rev, anchor, notify } = useApp();
  const [a, setA] = useState(anchor || todayISO());
  const [leaves, setLeaves] = useState([]);
  const year = useMemo(() => buildYear(a, lang), [a, lang]);

  useEffect(() => {
    api(`leaves?from=${year.first}&to=${year.last}`).then((d) => setLeaves(d.leaves.filter((l) => l.status !== 'rejected'))).catch((e) => notify(e.message, 'bad'));
  }, [year.first, year.last, rev, notify]);

  const rows = useMemo(() => staff.map((s) => {
    const mine = leaves.filter((l) => l.staffId === s.id);
    const months = year.months.map((m) => mine.filter((l) => l.status === 'approved').reduce((x, l) => x + overlapDays(l.from, l.to, m.first, m.last), 0));
    const total = months.reduce((x, y) => x + y, 0);
    const pend = mine.filter((l) => l.status === 'pending').reduce((x, l) => x + overlapDays(l.from, l.to, year.first, year.last), 0);
    return { s, months, total, pend };
  }), [staff, leaves, year]);

  const heat = (n) => 'heat h' + (n === 0 ? 0 : n < 5 ? 1 : n < 10 ? 2 : 3);

  function exportCsv() {
    const head = ['Name', 'Role', 'Department', ...year.months.map((m) => m.label), 'Total approved', 'Pending'];
    const lines = [head, ...rows.map((r) => [r.s.name, r.s.role, r.s.department, ...r.months, r.total, r.pend])];
    const csv = '﻿' + lines.map((l) => l.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const el = document.createElement('a');
    el.href = url;
    el.download = `annual-attendance-${year.label}.csv`;
    el.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <div className="page-head">
        <h2>📋 {t('sheetTitle')} · {year.label}</h2>
        <div className="row no-print">
          <button className="btn btn-ghost" onClick={() => setA(year.prevAnchor)}>‹ {t('prev')}</button>
          <button className="btn btn-ghost" onClick={() => setA(todayISO())}>{t('today')}</button>
          <button className="btn btn-ghost" onClick={() => setA(year.nextAnchor)}>{t('next')} ›</button>
          <button className="btn btn-green" onClick={exportCsv}>⬇ {t('exportCsv')}</button>
          <button className="btn btn-primary" onClick={() => window.print()}>🖨 {t('print')}</button>
        </div>
      </div>
      <div className="card">
        <p className="muted small" style={{ marginTop: 0 }}>{t('sheetHelp')}</p>
        <div className="tablewrap">
          <table className="t">
            <thead>
              <tr>
                <th>{t('staff')}</th>
                {year.months.map((m) => <th key={m.first} className="num">{m.label.split(' ')[0]}</th>)}
                <th className="num">{t('total')}</th>
                <th className="num">{t('pending')}</th>
                {lang === 'en' && <th className="num">{t('remaining')}</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.s.id}>
                  <td><b>{r.s.name}</b><div className="small muted">{r.s.role} · {r.s.department}</div></td>
                  {r.months.map((n, i) => <td key={i} className="num"><span className={heat(n)}>{n || '·'}</span></td>)}
                  <td className="num"><b>{num(r.total, lang)}</b></td>
                  <td className="num">{r.pend ? <span className="badge b-pending">{num(r.pend, lang)}</span> : '·'}</td>
                  {lang === 'en' && <td className="num"><b style={{ color: settings.quota - r.total - r.pend < 5 ? '#b0123a' : '#0a7a55' }}>{settings.quota - r.total - r.pend}</b></td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
