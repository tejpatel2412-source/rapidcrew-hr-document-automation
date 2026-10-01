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
  });

  it('creates Rapidcrew-named defaults with stamp enabled only for signature-based letters', () => {
    const templates = defaultTemplates();
    expect(templates).toHaveLength(5);
    for (const template of templates) expect(template.name).toMatch(/^Rapidcrew /);
    expect(templates.find(t=>t.type==='salary-slip')?.includeStampByDefault).toBe(false);
    for (const template of templates.filter(t=>t.type!=='salary-slip')) expect(template.includeStampByDefault).toBe(true);
  });

  it('wires document-specific optional fields into default letter wording', () => {
    const templates = defaultTemplates();
    expect(templates.find(t=>t.type==='offer-letter')?.bodyHtml).toContain('{{offer_validity_line}}');
    expect(templates.find(t=>t.type==='offer-letter')?.bodyHtml).toContain('{{probation_line}}');
    expect(templates.find(t=>t.type==='appointment-letter')?.bodyHtml).toContain('{{notice_line}}');
    expect(templates.find(t=>t.type==='relieving-letter')?.bodyHtml).toContain('{{reference_line}}');
  });
});
