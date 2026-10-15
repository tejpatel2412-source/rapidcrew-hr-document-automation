'use client';
import { useEffect, useState } from 'react';

export function BrandSplash({ visible = true }: { visible?: boolean }) {
  if (!visible) return null;
  return <div className="rapidcrew-splash" role="status" aria-label="Rapidcrew PVT LTD HR CRM loading">
    <div className="rapidcrew-splash-inner">
      <div className="rapidcrew-splash-glow" />
      <img src="/brand/rapidcrew-letterhead-wordmark.png" alt="Rapidcrew" className="rapidcrew-splash-logo" />
      <div className="rapidcrew-splash-title">PVT LTD HR CRM</div>
      <div className="rapidcrew-splash-line"><span /></div>
    </div>
  </div>;
}

export function InitialBrandSplash() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(false), 1150);
    return () => window.clearTimeout(timer);
  }, []);

  return <BrandSplash visible={visible} />;
}
