import { describe, expect, it } from 'vitest';
import { LETTERHEAD, LETTERHEAD_MARK_DATA_URL, LETTERHEAD_WATERMARK_DATA_URL, LETTERHEAD_WORDMARK_DATA_URL } from '../lib/letterhead';
import { getLetterheadDetails } from '../lib/letterhead-details';
import { defaultCompany } from '../lib/defaults';

describe('official letterhead', () => {
  it('contains the owner-approved footer details and embedded export assets', () => {
    expect(LETTERHEAD.website).toBe('www.rapidcrewsolutions.com');
    expect(LETTERHEAD.legalName).toBe('RapidCrew Solutions Private Limited');
    expect(LETTERHEAD.phone).toBe('+91 (972) 525-7676');
    expect(LETTERHEAD.address).toContain('Office No,1222-1223');
    expect(LETTERHEAD_WORDMARK_DATA_URL.startsWith('data:image/png;base64,')).toBe(true);
    expect(LETTERHEAD_MARK_DATA_URL.startsWith('data:image/png;base64,')).toBe(true);
    expect(LETTERHEAD_WATERMARK_DATA_URL.startsWith('data:image/png;base64,')).toBe(true);
    expect(LETTERHEAD.watermarkOpacity).toBe(0.05);
    expect(LETTERHEAD.watermarkWidthPercent).toBe(40);
  });

  it('uses editable company details when present and official values as fallback', () => {
    expect(getLetterheadDetails(defaultCompany).legalName).toBe('RapidCrew Solutions Private Limited');
    const custom = { ...defaultCompany, website: '', phone: '', legalCompanyName: '', companyName: '', address: '', city: '', state: '', country: '', pin: '' };
    expect(getLetterheadDetails(custom).website).toBe(LETTERHEAD.website);
    expect(getLetterheadDetails(custom).address).toBe(LETTERHEAD.address);
  });
});
