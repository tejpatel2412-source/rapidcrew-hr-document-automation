'use client';

import type { CompanyData } from '@/lib/types';
import { LETTERHEAD, LETTERHEAD_WORDMARK_DATA_URL } from '@/lib/letterhead';
import { getLetterheadDetails } from '@/lib/letterhead-details';

export function DocumentLetterhead({ company }: { company?: CompanyData }) {
  const details = getLetterheadDetails(company);
  return <>
    <div className="letterhead-top" aria-hidden="true">
      <img src={LETTERHEAD_WORDMARK_DATA_URL} alt="" />
    </div>
    <div className="letterhead-watermarks" aria-hidden="true">
      {Array.from({ length: LETTERHEAD.watermarkPreviewPages }, (_, index) => (
        <img
          key={index}
          src={LETTERHEAD.markSrc}
          alt=""
          className="letterhead-watermark-page"
          style={{ top: `${148.5 + index * 297}mm`, width: `${LETTERHEAD.watermarkWidthPercent}%`, opacity: LETTERHEAD.watermarkOpacity }}
        />
      ))}
    </div>
    <footer className="letterhead-footer">
      <div className="letterhead-footer-row">
        <span className="letterhead-website">{details.website}</span>
        <strong>{details.legalName}</strong>
        <strong>{details.phone}</strong>
      </div>
      <div className="letterhead-address">{details.address}</div>
    </footer>
  </>;
}
