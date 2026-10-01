import { describe, expect, it } from 'vitest';
import { defaultCompany } from '../lib/defaults';
import { migrateAuthorizationAlignmentRecord, migrateCompanyRecord, migrateDocumentRecord, migrateLetterheadCompanyRecord, migrateTemplateRecord } from '../lib/migrations';
import type { CompanyData, DocumentData, TemplateData } from '../lib/types';

describe('browser data migration', () => {
  it('preserves an existing custom company instead of replacing it with Rapidcrew defaults', () => {
    const existing = { ...defaultCompany, companyName: 'Existing Company', legalCompanyName: 'Existing Company Legal', email: 'hr@example.com', stampDataUrl: 'data:image/png;base64,AA==' } satisfies CompanyData;
    const migrated = migrateCompanyRecord(existing);
    expect(migrated.companyName).toBe('Existing Company');
    expect(migrated.email).toBe('hr@example.com');
    expect(migrated.stampDataUrl).toBe(existing.stampDataUrl);
  });

  it('upgrades the old Rapidcrew first-run record to the official letterhead details without touching custom data', () => {
    const legacy = { ...defaultCompany, companyName: 'Rapidcrew PVT LTD', legalCompanyName: '', address: '', phone: '', website: '', email: 'keep@rapidcrew.test' } satisfies CompanyData;
    const migrated = migrateLetterheadCompanyRecord(legacy);
    expect(migrated.companyName).toBe('RapidCrew Solutions Private Limited');
    expect(migrated.legalCompanyName).toBe('RapidCrew Solutions Private Limited');
    expect(migrated.website).toBe('www.rapidcrewsolutions.com');
    expect(migrated.phone).toBe('+91 (972) 525-7676');
    expect(migrated.address).toContain('Zion Z One Building');
    expect(migrated.email).toBe('keep@rapidcrew.test');
  });

  it('keeps a custom company identity while only filling missing letterhead contact fields', () => {
    const existing = { ...defaultCompany, companyName: 'Existing Company', legalCompanyName: 'Existing Legal', address: '', phone: '', website: '' } satisfies CompanyData;
    const migrated = migrateLetterheadCompanyRecord(existing);
    expect(migrated.companyName).toBe('Existing Company');
    expect(migrated.legalCompanyName).toBe('Existing Legal');
    expect(migrated.website).toBe(defaultCompany.website);
  });


  it('moves the previous right-side authorization default to the new left-side default', () => {
    const legacy = { ...defaultCompany, signatureAlignment: 'right', stampAlignment: 'right' } satisfies CompanyData;
    const migrated = migrateAuthorizationAlignmentRecord(legacy);
    expect(migrated.signatureAlignment).toBe('left');
    expect(migrated.stampAlignment).toBe('left');
  });

  it('preserves an existing non-default center authorization choice', () => {
    const existing = { ...defaultCompany, signatureAlignment: 'center', stampAlignment: 'center' } satisfies CompanyData;
    const migrated = migrateAuthorizationAlignmentRecord(existing);
    expect(migrated.signatureAlignment).toBe('center');
    expect(migrated.stampAlignment).toBe('center');
  });

  it('adds new document defaults without deleting old template content', () => {
    const template = { id: 'old', type: 'experience-letter', name: 'Existing', bodyHtml: '<p>Keep me</p>', isDefault: true, createdAt: '', updatedAt: '' } as TemplateData;
    const migrated = migrateTemplateRecord(template);
    expect(migrated.bodyHtml).toBe('<p>Keep me</p>');
    expect(migrated.includeStampByDefault).toBe(true);
  });

  it('turns stamp on for old saved documents only when the field was missing', () => {
    const oldDoc = { id: 'd', type: 'relieving-letter', employeeId: 'e', templateId: 't', documentDate: '2026-09-18', createdAt: '', updatedAt: '' } as DocumentData;
    expect(migrateDocumentRecord(oldDoc).includeStamp).toBe(true);
    expect(migrateDocumentRecord({ ...oldDoc, includeStamp: false }).includeStamp).toBe(false);
  });
});
