'use client';
import { useEffect, useState } from 'react';

export function BrandSplash({
  visible = true,
  mode = 'loading',
}: {
  visible?: boolean;
  mode?: 'loading' | 'success';
}) {
  if (!visible) return null;

  const success = mode === 'success';
  return <div className="rapidcrew-splash no-print" role="status" aria-live="polite" aria-label={success ? 'Access granted to Rapidcrew PVT LTD HR CRM' : 'Rapidcrew PVT LTD HR CRM loading'}>
    <div className={`rapidcrew-splash-inner ${success ? 'rapidcrew-splash-success' : ''}`}>
      <div className="rapidcrew-splash-glow" />
      <div className="rapidcrew-splash-logo" role="img" aria-label="Rapidcrew" />
      <div className="rapidcrew-splash-title">RAPIDCREW PVT LTD</div>
      <div className="rapidcrew-splash-subtitle">{success ? 'ACCESS GRANTED' : 'HR CRM'}</div>
      <div className="rapidcrew-splash-line"><span /></div>
    </div>
  </div>;
}

export function InitialBrandSplash() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = window.setTimeout(() => setVisible(false), reducedMotion ? 350 : 1250);
    return () => window.clearTimeout(timer);
  }, []);

  return <BrandSplash visible={visible} />;
}
