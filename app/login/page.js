'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/client';
import { makeT } from '@/lib/i18n';

export default function LoginPage() {
  const router = useRouter();
  const [lang, setLang] = useState('en');
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const t = makeT(lang);

  useEffect(() => {
    const l = localStorage.getItem('aar_lang') === 'ar' ? 'ar' : 'en';
    setLang(l);
    api('auth/me').then((d) => {
      if (d.user) router.replace('/');
      else if (d.needsSetup) router.replace('/setup');
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

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await api('auth/login', { method: 'POST', body: form });
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
        <ul>
          <li>{lang === 'ar' ? 'تقويم سنوي ميلادي وهجري' : 'Full-year English & Hijri calendar'}</li>
          <li>{lang === 'ar' ? 'جدول دوام على مدار ٢٤ ساعة' : '24-hour duty roster per day'}</li>
          <li>{lang === 'ar' ? 'حد أقصى ٣ موظفين في إجازة معًا' : 'Max 3 staff on leave at once'}</li>
        </ul>
      </div>
      <div className="auth-form">
        <form className="auth-card" onSubmit={submit}>
          <div className="auth-top"><button type="button" className="langbtn" onClick={toggle}>{t('switchLang')}</button></div>
          <h2>{t('login')}</h2>
          <p className="muted" style={{ marginTop: 0 }}>{t('loginSub')}</p>
          {error && <div className="err">{error}</div>}
          <label className="f">{t('username')}
            <input value={form.username} autoComplete="username" required autoFocus onChange={(e) => setForm({ ...form, username: e.target.value })} />
          </label>
          <label className="f">{t('password')}
            <input type="password" value={form.password} autoComplete="current-password" required onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </label>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={busy}>{busy ? '…' : t('login')}</button>
        </form>
      </div>
    </div>
  );
}
