import type { CompanyData, DocumentType, TemplateData } from './types';

export const defaultCompany: CompanyData = {
  id: 'company',
  companyName: 'RapidCrew Solutions Private Limited',
  legalCompanyName: 'RapidCrew Solutions Private Limited',
  logoPosition: 'left',
  logoWidth: 140,
  address: 'Office No,1222-1223, Zion Z One Building, Sindhu Bhavan Marg, Near Avalon Hotel - 380054',
  city: '',
  state: '',
  country: '',
  pin: '',
  phone: '+91 (972) 525-7676',
  email: '',
  website: 'www.rapidcrewsolutions.com',
  cin: '',
  gstin: '',
  pan: '',
  hrEmail: '',
  hrPhone: '',
  signatoryName: 'Sumeet Singh',
  signatoryDesignation: 'HR Executive',
  signatureWidth: 130,
  signatureAlignment: 'left',
  stampEnabled: true,
  stampWidth: 110,
  stampAlignment: 'left',
  footerText: '',
  currency: 'INR',
  dateFormat: 'DD/MM/YYYY',
  fontFamily: 'Arial',
  paperSize: 'A4',
  updatedAt: new Date().toISOString(),
};

// Kept as an alias so existing imports continue working without rewriting unrelated code.
export const emptyCompany = defaultCompany;

const bodies: Record<DocumentType, string> = {
  'experience-letter': `<p style="text-align:right"><strong>Date:</strong> {{document_date}}</p><h2 style="text-align:center">EXPERIENCE LETTER</h2><p class="justify">This is to certify that <strong>{{employee_name}}</strong> was employed with <strong>{{company_name}}</strong> from {{joining_date}} to {{last_working_date}} as <strong>{{designation}}</strong> in the {{department}} department.</p><p class="justify">During this period, {{employee_name}} carried out assigned responsibilities professionally and contributed to the organization. We wish {{employee_name}} success in future endeavors.</p><p class="justify">{{custom_remarks}}</p>`,
  'relieving-letter': `<p style="text-align:right"><strong>Date:</strong> {{relieving_date}}</p><p><strong>{{reference_line}}</strong></p><h2 style="text-align:center">RELIEVING LETTER</h2><p>Dear {{employee_name}},</p><p class="justify">This is to confirm that you have been relieved from your duties as <strong>{{designation}}</strong> at <strong>{{company_name}}</strong> effective {{last_working_date}}.</p><p class="justify">{{resignation_line}}</p><p class="justify">We acknowledge your contribution during your association with the organization and wish you success in your future endeavors.</p>`,
  'offer-letter': `<p style="text-align:right"><strong>Date:</strong> {{document_date}}</p><h2 style="text-align:center">OFFER LETTER</h2><p>Dear {{employee_name}},</p><p class="justify">We are pleased to offer you the position of <strong>{{designation}}</strong> in the {{department}} department at <strong>{{company_name}}</strong>, based at {{work_location}}. Your proposed joining date is {{joining_date}}.</p><p class="justify">Your annual CTC will be {{ctc}}. The offer is subject to the terms, policies, and verification requirements of the company.</p><p>{{employment_type_line}}</p><p>{{probation_line}}</p><p>{{offer_validity_line}}</p>`,
  'appointment-letter': `<p style="text-align:right"><strong>Date:</strong> {{appointment_date}}</p><h2 style="text-align:center">APPOINTMENT LETTER</h2><p>Dear {{employee_name}},</p><p class="justify">We are pleased to appoint you as <strong>{{designation}}</strong> in the {{department}} department of <strong>{{company_name}}</strong> with effect from {{joining_date}}.</p><p class="justify">Your work location will be {{work_location}} and your annual CTC will be {{ctc}}. Your employment will be governed by company policies and the terms stated in this letter.</p><p>{{employment_type_line}}</p><p>{{probation_line}}</p><p>{{reporting_manager_line}}</p><p>{{notice_line}}</p>`,
  'salary-slip': `<h2 style="text-align:center">SALARY SLIP</h2><p style="text-align:center">{{salary_month}} {{salary_year}}</p>`,
};

const templateNames: Record<DocumentType, string> = {
  'salary-slip': 'Rapidcrew Salary Slip',
  'offer-letter': 'Rapidcrew Offer Letter',
  'appointment-letter': 'Rapidcrew Appointment Letter',
  'experience-letter': 'Rapidcrew Experience Letter',
  'relieving-letter': 'Rapidcrew Relieving Letter',
};

export function defaultTemplates(): TemplateData[] {
  const now = new Date().toISOString();
  return (Object.keys(bodies) as DocumentType[]).map((type) => ({
    id: `default-${type}`,
    type,
    name: templateNames[type],
    bodyHtml: bodies[type],
    isDefault: true,
    includeStampByDefault: true,
    createdAt: now,
    updatedAt: now,
  }));
}
