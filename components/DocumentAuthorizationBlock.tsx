'use client';
import Link from 'next/link';
import type { CompanyData, DocumentData } from '@/lib/types';
import { buildAuthorizationView } from '@/lib/authorization';

function cssAlign(value: CompanyData['stampAlignment']) {
  return value === 'center' ? 'center' : value === 'left' ? 'left' : 'right';
}

export function DocumentAuthorizationBlock({ company, doc, compact = false }: { company?: CompanyData; doc: DocumentData; compact?: boolean }) {
  if (!company) return null;
  const view = buildAuthorizationView(company, doc);
  const blockAlign = cssAlign(view.stampAlignment);
  const signatureAlign = cssAlign(view.signatureAlignment);

  return <div className={`keep-together authorization-block ${compact ? 'authorization-block-compact' : ''}`} style={{ textAlign: blockAlign }}>
    <div className="authorization-for">For {view.companyName}</div>
    {view.showSignature && <div style={{ textAlign: signatureAlign }}><img src={view.signatureDataUrl} alt="Authorized signature" className="authorization-signature" style={{ width: view.signatureWidth }} /></div>}
    {compact && !view.showSignature && view.showStamp && <img src={view.stampDataUrl} alt="Official company stamp" className="authorization-stamp" style={{ width: view.stampWidth }} />}
    <div className="authorization-name">{view.signatoryName}</div>
    {view.signatoryDesignation && <div className="authorization-designation">{view.signatoryDesignation}</div>}
    {(!compact || view.showSignature) && view.showStamp && <img src={view.stampDataUrl} alt="Official company stamp" className="authorization-stamp" style={{ width: view.stampWidth }} />}
  </div>;
}

export function StampConfigurationNotice({ company, includeStamp }: { company?: CompanyData; includeStamp: boolean }) {
  if (!includeStamp || company?.stampDataUrl) return null;
  return <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
    <span>Company stamp not configured. The document can still be previewed and exported.</span>
    <Link href="/company" className="font-bold text-[#8B0000] underline">Upload Stamp</Link>
  </div>;
}
