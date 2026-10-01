export type Alignment = 'left' | 'center' | 'right' | 'justify';
export type DocumentType = 'salary-slip' | 'offer-letter' | 'appointment-letter' | 'experience-letter' | 'relieving-letter';

export interface CompanyData {
  id: 'company';
  companyName: string;
  legalCompanyName: string;
  logoDataUrl?: string;
  logoPosition: Alignment;
  logoWidth: number;
  address: string;
  city: string;
  state: string;
  country: string;
  pin: string;
  phone: string;
  email: string;
  website: string;
  cin: string;
  gstin: string;
  pan: string;
  hrEmail: string;
  hrPhone: string;
  signatoryName: string;
  signatoryDesignation: string;
  signatureDataUrl?: string;
  signatureWidth: number;
  signatureAlignment: Alignment;
  stampDataUrl?: string;
  stampEnabled?: boolean;
  stampWidth: number;
  stampAlignment: Alignment;
  footerText: string;
  currency: string;
  dateFormat: string;
  fontFamily: string;
  paperSize?: 'A4';
  updatedAt: string;
}

export interface EmployeeData {
  id: string;
  employeeId: string;
  fullName: string;
  personalEmail: string;
  officialEmail: string;
  phone: string;
  address: string;
  department: string;
  designation: string;
  joiningDate: string;
  lastWorkingDate: string;
  employmentType: string;
  workLocation: string;
  reportingManager: string;
  ctc: string;
  basicSalary: string;
  hra: string;
  allowances: string;
  deductions: string;
  pan: string;
  uan: string;
  pfNumber: string;
  esicNumber: string;
  bankAccountNumber?: string;
  status: 'Active' | 'Exited';
  createdAt: string;
  updatedAt: string;
}

export interface TemplateData {
  id: string;
  type: DocumentType;
  name: string;
  bodyHtml: string;
  isDefault: boolean;
  includeStampByDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SalaryComponents {
  basic: string;
  hra: string;
  other?: string;
  conveyance: string;
  medical: string;
  specialAllowance: string;
  bonus: string;
  incentive: string;
  otherEarnings: string;
  pf: string;
  professionalTax: string;
  tds: string;
  esi: string;
  loan: string;
  lop: string;
  otherDeduction: string;
}

export interface DocumentData {
  id: string;
  type: DocumentType;
  employeeId: string;
  templateId: string;
  documentDate: string;
  includeStamp?: boolean;
  salaryMonth?: string;
  salaryYear?: string;
  workingDays?: string;
  paidDays?: string;
  lopDays?: string;
  bankAccountNumber?: string;
  resignationDate?: string;
  relievingDate?: string;
  lastWorkingDate?: string;
  offerValidUntil?: string;
  appointmentDate?: string;
  probationPeriod?: string;
  workingHours?: string;
  noticePeriod?: string;
  benefits?: string;
  specialConditions?: string;
  referenceNumber?: string;
  terms?: string;
  customRemarks?: string;
  salary?: SalaryComponents;
  customBodyHtml?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HistoryData {
  id: string;
  documentType: DocumentType;
  employeeName: string;
  createdAt: string;
  templateName: string;
  document: DocumentData;
}

export interface BackupData {
  version: 1;
  exportedAt: string;
  company?: CompanyData;
  employees: EmployeeData[];
  templates: TemplateData[];
  history: HistoryData[];
}
