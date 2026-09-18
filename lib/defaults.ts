import type { CompanyData, DocumentType, TemplateData } from './types';

export const emptyCompany: CompanyData = {
  id: 'company', companyName: '', legalCompanyName: '', logoPosition: 'left', logoWidth: 140, address: '', city: '', state: '', country: 'India', pin: '', phone: '', email: '', website: '', cin: '', gstin: '', pan: '', hrEmail: '', hrPhone: '', signatoryName: '', signatoryDesignation: '', signatureWidth: 130, signatureAlignment: 'right', stampWidth: 110, stampAlignment: 'right', footerText: '', currency: 'INR', dateFormat: 'DD MMM YYYY', fontFamily: 'Arial', updatedAt: new Date().toISOString()
};

const bodies: Record<DocumentType, string> = {
  'experience-letter': `<p><strong>Date:</strong> {{document_date}}</p><h2 style="text-align:center">EXPERIENCE LETTER</h2><p class="justify">This is to certify that <strong>{{employee_name}}</strong> was employed with <strong>{{company_name}}</strong> from {{joining_date}} to {{last_working_date}} as <strong>{{designation}}</strong> in the {{department}} department.</p><p class="justify">During this period, {{employee_name}} carried out assigned responsibilities professionally and contributed to the organization. We wish {{employee_name}} success in future endeavors.</p>`,
  'relieving-letter': `<p><strong>Date:</strong> {{document_date}}</p><h2 style="text-align:center">RELIEVING LETTER</h2><p>Dear {{employee_name}},</p><p class="justify">This is to confirm that you have been relieved from your duties as <strong>{{designation}}</strong> at <strong>{{company_name}}</strong> effective {{last_working_date}}.</p><p class="justify">We acknowledge your contribution during your association with the organization and wish you success in your future endeavors.</p>`,
  'offer-letter': `<p style="text-align:right">{{document_date}}</p><h2 style="text-align:center">OFFER LETTER</h2><p>Dear {{employee_name}},</p><p class="justify">We are pleased to offer you the position of <strong>{{designation}}</strong> in the {{department}} department at <strong>{{company_name}}</strong>, based at {{work_location}}. Your proposed joining date is {{joining_date}}.</p><p class="justify">Your annual CTC will be {{ctc}}. The offer is subject to the terms, policies, and verification requirements of the company.</p>`,
  'appointment-letter': `<p style="text-align:right">{{document_date}}</p><h2 style="text-align:center">APPOINTMENT LETTER</h2><p>Dear {{employee_name}},</p><p class="justify">We are pleased to appoint you as <strong>{{designation}}</strong> in the {{department}} department of <strong>{{company_name}}</strong> with effect from {{joining_date}}.</p><p class="justify">Your work location will be {{work_location}} and your annual CTC will be {{ctc}}. Your employment will be governed by company policies and the terms stated in this letter.</p>`,
  'salary-slip': `<h2 style="text-align:center">SALARY SLIP</h2><p style="text-align:center">{{salary_month}} {{salary_year}}</p>`
};

export function defaultTemplates(): TemplateData[] {
  const now = new Date().toISOString();
  return (Object.keys(bodies) as DocumentType[]).map((type) => ({ id: `default-${type}`, type, name: 'Classic Corporate', bodyHtml: bodies[type], isDefault: true, createdAt: now, updatedAt: now }));
}
