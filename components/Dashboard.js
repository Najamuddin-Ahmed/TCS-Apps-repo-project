'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/client';
import { makeT } from '@/lib/i18n';
import { todayISO } from '@/lib/dates';
import { AppCtx, Toast } from './ui';
import Overview from './Overview';
import CalendarTab from './CalendarTab';
import LeavesTab from './LeavesTab';
import StaffTab from './StaffTab';
import ShiftsTab from './ShiftsTab';
import SheetTab from './SheetTab';
import AdminsTab from './AdminsTab';

const TABS = [
  ['overview', 'nav_overview', '🏠'],
  ['calendar', 'nav_calendar', '📅'],
  ['leaves', 'nav_leaves', '🌴'],
  ['staff', 'nav_staff', '🧑‍⚕️'],
  ['shifts', 'nav_shifts', '⏰'],
  ['sheet', 'nav_sheet', '📋'],
  ['admins', 'nav_admins', '🛡️'],
];

export default function Dashboard() {
  const router = useRouter();
  const [boot, setBoot] = useState(null);
  const [lang, setLang] = useState('en');
  const [tab, setTab] = useState('overview');
  const [anchor, setAnchor] = useState(todayISO());
  const [view, setView] = useState('month');
  const [rev, setRev] = useState(0);
  const [toast, setToast] = useState(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const first = useRef(true);
  const t = useMemo(() => makeT(lang), [lang]);

  const notify = useCallback((msg, kind = 'good') => {
    setToast({ msg, kind });
    clearTimeout(notify._t);
    notify._t = setTimeout(() => setToast(null), kind === 'bad' ? 6000 : 3200);
  }, []);

  const loadBoot = useCallback(async () => {
    const d = await api('bootstrap');
    setBoot(d);
    return d;
  }, []);

  const reload = useCallback(async () => {
    try {
      await loadBoot();
      setRev((r) => r + 1);
    } catch (e) {
      notify(e.message, 'bad');
    }
  }, [loadBoot, notify]);

  // First load: who am I? then restore where the admin left off
  useEffect(() => {
    (async () => {
      try {
        const me = await api('auth/me');
        if (!me.user) return router.replace(me.needsSetup ? '/setup' : '/login');
        const d = await loadBoot();
        const lv = d.user.lastView || {};
        const l = lv.lang || (localStorage.getItem('aar_lang') === 'ar' ? 'ar' : 'en');
        setLang(l);
        if (lv.tab && TABS.some((x) => x[0] === lv.tab)) setTab(lv.tab);
        if (/^\d{4}-\d{2}-\d{2}$/.test(lv.anchor || '')) setAnchor(lv.anchor);
        if (lv.view === 'year' || lv.view === 'month') setView(lv.view);
        setReady(true);
      } catch (e) {
        if (e.status === 401) router.replace('/login');
        else setError(e.message);
      }
    })();
  }, [router, loadBoot]);

  // Language / direction
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    try { localStorage.setItem('aar_lang', lang); } catch {}
  }, [lang]);

  // Save "where I left off" to the database (so it follows the admin to any device)
  useEffect(() => {
    if (!ready) return;
    if (first.current) { first.current = false; return; }
    const id = setTimeout(() => {
      api('auth/me', { method: 'PATCH', body: { lastView: { tab, anchor, view, lang } } }).catch(() => {});
    }, 700);
    return () => clearTimeout(id);
  }, [ready, tab, anchor, view, lang]);

  async function logout() {
    await api('auth/logout', { method: 'POST' }).catch(() => {});
    router.replace('/login');
  }

  if (error) {
    return (
      <div className="wrap">
        <div className="card">
          <h2>Something went wrong</h2>
          <div className="err">{error}</div>
          <p className="muted">Check your MONGODB_URI and JWT_SECRET settings, then refresh the page.</p>
        </div>
      </div>
    );
  }
  if (!ready || !boot) {
    return <div className="wrap"><p className="muted">Loading…</p></div>;
  }

  const user = boot.user;
  const ctx = {
    t, lang, user, isMain: user.role === 'main',
    staff: boot.staff, shifts: boot.shifts, admins: boot.admins, settings: boot.settings,
    reload, rev, notify, anchor, setAnchor, view, setView, setTab,
  };

  return (
    <AppCtx.Provider value={ctx}>
      <header className="topbar no-print">
        <div className="topbar-in">
          <div className="brand">
            <div className="logo">🏥</div>
            <div>
              <h1>{t('appName')}</h1>
              <small>{t('tagline')}</small>
            </div>
          </div>
          <div className="spacer" />
          <div className="top-actions">
            <button className="langbtn" onClick={() => setLang(lang === 'en' ? 'ar' : 'en')} title="English / العربية">
              🌐 {t('switchLang')}
            </button>
            <div className="userchip">
              <b>{user.name}</b>
              <span className="rolechip">{t(user.role === 'main' ? 'role_main' : 'role_admin')}</span>
            </div>
            <button className="langbtn" onClick={logout}>{t('signOut')}</button>
          </div>
        </div>
        <nav className="nav">
          {TABS.map(([id, key, icon]) => (
            <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>
              {icon} {t(key)}
            </button>
          ))}
        </nav>
      </header>

      <main className="wrap">
        {tab === 'overview' && <Overview />}
        {tab === 'calendar' && <CalendarTab />}
        {tab === 'leaves' && <LeavesTab />}
        {tab === 'staff' && <StaffTab />}
        {tab === 'shifts' && <ShiftsTab />}
        {tab === 'sheet' && <SheetTab />}
        {tab === 'admins' && <AdminsTab />}
      </main>
      <Toast toast={toast} />
    </AppCtx.Provider>
  );
}
