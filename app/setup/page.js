'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/client';
import { makeT } from '@/lib/i18n';

export default function SetupPage() {
  const router = useRouter();
  const [lang, setLang] = useState('en');
  const [f, setF] = useState({ name: '', username: '', designation: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const t = makeT(lang);

  useEffect(() => {
    setLang(localStorage.getItem('aar_lang') === 'ar' ? 'ar' : 'en');
    api('auth/me').then((d) => {
      if (d.user) router.replace('/');
      else if (!d.needsSetup) router.replace('/login');
    }).catch((e) => setError(e.message));
  }, [router]);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  const toggle = () => {
    const l = lang === 'en' ? 'ar' : 'en';
    setLang(l);
    localStorage.setItem('aar_lang', l);
  };
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (f.password !== f.confirm) return setError(t('passwordsDiffer'));
    setBusy(true);
    try {
      await api('auth/setup', { method: 'POST', body: { name: f.name, username: f.username, designation: f.designation, password: f.password } });
      router.replace('/');
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="auth">
      <div className="auth-art">
        <div className="logo" style={{ width: 64, height: 64, fontSize: 34 }}>🏥</div>
        <h1>{t('appName')}</h1>
        <p>{t('tagline')}</p>
      </div>
      <div className="auth-form">
        <form className="auth-card" onSubmit={submit}>
          <div className="auth-top"><button type="button" className="langbtn" onClick={toggle}>{t('switchLang')}</button></div>
          <h2>{t('setupTitle')}</h2>
          <p className="muted" style={{ marginTop: 0 }}>{t('setupSub')}</p>
          {error && <div className="err">{error}</div>}
          <label className="f">{t('fullName')}<input value={f.name} onChange={set('name')} required autoFocus /></label>
          <label className="f">{t('username')}<input value={f.username} onChange={set('username')} required autoComplete="username" /></label>
          <label className="f">{t('designation')}<input value={f.designation} onChange={set('designation')} required placeholder="Hospital Administrator" /></label>
          <label className="f">{t('password')}<input type="password" value={f.password} onChange={set('password')} required minLength={8} autoComplete="new-password" /></label>
          <label className="f">{t('confirmPassword')}<input type="password" value={f.confirm} onChange={set('confirm')} required minLength={8} autoComplete="new-password" /></label>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={busy}>{busy ? '…' : t('createAccount')}</button>
        </form>
      </div>
    </div>
  );
}
