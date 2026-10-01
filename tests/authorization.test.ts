import { describe, expect, it } from 'vitest';
import { buildAuthorizationView } from '../lib/authorization';
import { defaultCompany } from '../lib/defaults';
import type { DocumentData } from '../lib/types';

const doc: DocumentData = {
  id: 'd', type: 'offer-letter', employeeId: 'e', templateId: 't', documentDate: '2026-09-18', includeStamp: true, createdAt: '', updatedAt: ''
};

describe('shared document authorization', () => {
  it('uses the one company stamp across documents by default', () => {
    const company = { ...defaultCompany, stampDataUrl: 'data:image/png;base64,STAMP', signatureDataUrl: 'data:image/png;base64,SIGN', signatoryName: 'HR Manager', signatoryDesignation: 'Authorized Signatory' };
    const view = buildAuthorizationView(company, doc);
    expect(view.companyName).toBe('RapidCrew Solutions Private Limited');
    expect(view.showStamp).toBe(true);
    expect(view.stampDataUrl).toBe(company.stampDataUrl);
    expect(view.showSignature).toBe(true);
    expect(view.signatureAlignment).toBe('left');
    expect(view.stampAlignment).toBe('left');
  });

  it('can disable the stamp for one document without changing the company asset', () => {
    const company = { ...defaultCompany, stampDataUrl: 'data:image/png;base64,STAMP' };
    const view = buildAuthorizationView(company, { ...doc, includeStamp: false });
    expect(view.showStamp).toBe(false);
    expect(company.stampDataUrl).toContain('STAMP');
  });

  it('honors the company-level stamp switch for every document', () => {
    const company = { ...defaultCompany, stampDataUrl: 'data:image/png;base64,STAMP', stampEnabled: false };
    const view = buildAuthorizationView(company, doc);
    expect(view.showStamp).toBe(false);
  });

});
