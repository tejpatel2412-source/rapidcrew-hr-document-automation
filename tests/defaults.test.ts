import { describe, expect, it } from 'vitest';
import { defaultCompany, defaultTemplates } from '../lib/defaults';


describe('Rapidcrew defaults', () => {
  it('uses the official RapidCrew Solutions letterhead company details on first run', () => {
    expect(defaultCompany.companyName).toBe('RapidCrew Solutions Private Limited');
    expect(defaultCompany.legalCompanyName).toBe('RapidCrew Solutions Private Limited');
    expect(defaultCompany.website).toBe('www.rapidcrewsolutions.com');
    expect(defaultCompany.phone).toBe('+91 (972) 525-7676');
    expect(defaultCompany.address).toContain('Zion Z One Building');
    expect(defaultCompany.currency).toBe('INR');
    expect(defaultCompany.dateFormat).toBe('DD/MM/YYYY');
    expect(defaultCompany.fontFamily).toBe('Arial');
    expect(defaultCompany.paperSize).toBe('A4');
    expect(defaultCompany.stampEnabled).toBe(true);
    expect(defaultCompany.signatureAlignment).toBe('left');
    expect(defaultCompany.stampAlignment).toBe('left');
    expect(defaultCompany.stampWidth).toBeGreaterThanOrEqual(90);
    expect(defaultCompany.signatoryName).toBe('Sumeet Singh');
    expect(defaultCompany.signatoryDesignation).toBe('HR Executive');
  });

  it('creates Rapidcrew-named defaults with company stamp enabled for every document type', () => {
    const templates = defaultTemplates();
    expect(templates).toHaveLength(6);
    for (const template of templates) expect(template.name).toMatch(/^Rapidcrew /);
    for (const template of templates) expect(template.includeStampByDefault).toBe(true);
  });

  it('wires document-specific optional fields into default letter wording', () => {
    const templates = defaultTemplates();
    expect(templates.find(t=>t.type==='offer-letter')?.bodyHtml).toContain('{{offer_validity_line}}');
    expect(templates.find(t=>t.type==='offer-letter')?.bodyHtml).toContain('{{probation_line}}');
    expect(templates.find(t=>t.type==='internship-offer-letter')?.name).toBe('Rapidcrew Internship Offer Letter');
    expect(templates.find(t=>t.type==='internship-offer-letter')?.bodyHtml).toContain('{{internship_start_date}}');
    expect(templates.find(t=>t.type==='internship-offer-letter')?.bodyHtml).toContain('{{stipend_line}}');
    expect(templates.find(t=>t.type==='appointment-letter')?.bodyHtml).toContain('{{notice_line}}');
    expect(templates.find(t=>t.type==='relieving-letter')?.bodyHtml).toContain('{{reference_line}}');
  });
});
