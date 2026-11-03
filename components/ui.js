'use client';
import { createContext, useContext, useEffect } from 'react';

// Shared app state (language, staff, shifts ...) available to every screen
export const AppCtx = createContext(null);
export const useApp = () => useContext(AppCtx);

export function Modal({ title, onClose, children, wide }) {
  useEffect(() => {
    const h = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={'modal' + (wide ? ' wide' : '')} role="dialog" aria-modal="true">
        <div className="modal-h">
          <h3>{title}</h3>
          <button onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="modal-b">{children}</div>
      </div>
    </div>
  );
}

export function Toast({ toast }) {
  if (!toast) return null;
  return <div className={'toast ' + (toast.kind || '')}>{toast.msg}</div>;
}

const COLORS = ['#6d4aff', '#0ea5e9', '#14b8a6', '#ef476f', '#ff7a3d', '#f59e0b', '#10b981', '#8f6bff'];
export function colorFor(str = '') {
  let h = 0;
  for (const c of str) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return COLORS[h % COLORS.length];
}
export const initials = (name = '') =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');

export function StatusBadge({ status }) {
  const { t } = useApp();
  return <span className={'badge b-' + status}>{t(status)}</span>;
}
