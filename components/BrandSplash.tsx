'use client';
import { useEffect, useState } from 'react';
import { LETTERHEAD_WORDMARK_DATA_URL } from '@/lib/letterhead';

type SplashWindow = Window & { __rapidcrewInitialSplashShown?: boolean };

export function markInitialBrandSplashShown() {
  if (typeof window !== 'undefined') (window as SplashWindow).__rapidcrewInitialSplashShown = true;
}

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
      <img src={LETTERHEAD_WORDMARK_DATA_URL} alt="Rapidcrew" className="rapidcrew-splash-logo" />
      <div className="rapidcrew-splash-title">RAPIDCREW PVT LTD</div>
      <div className="rapidcrew-splash-subtitle">{success ? 'ACCESS GRANTED' : 'HR CRM'}</div>
      <div className="rapidcrew-splash-line"><span /></div>
    </div>
  </div>;
}

export function InitialBrandSplash() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const state = window as SplashWindow;
    if (state.__rapidcrewInitialSplashShown) return;
    state.__rapidcrewInitialSplashShown = true;
    setVisible(true);
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = window.setTimeout(() => setVisible(false), reducedMotion ? 350 : 1250);
    return () => window.clearTimeout(timer);
  }, []);

  return <BrandSplash visible={visible} />;
}
