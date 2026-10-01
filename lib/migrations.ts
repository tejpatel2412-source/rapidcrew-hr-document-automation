import { defaultCompany } from './defaults';
import type { CompanyData, DocumentData, HistoryData, TemplateData } from './types';

export function migrateCompanyRecord(company: CompanyData): CompanyData {
  return {
    ...defaultCompany,
    ...company,
    id: 'company',
    paperSize: company.paperSize || 'A4',
    stampDataUrl: company.stampDataUrl || undefined,
    stampEnabled: company.stampEnabled ?? true,
    stampWidth: company.stampWidth || defaultCompany.stampWidth,
    stampAlignment: company.stampAlignment || 'left',
    updatedAt: company.updatedAt || new Date().toISOString(),
  };
}


const legacyCompanyNames = new Set(['', 'Rapidcrew PVT LTD', 'Rapidcrew Pvt Ltd', 'Rapidcrew Pvt. Ltd.']);

export function migrateLetterheadCompanyRecord(company: CompanyData): CompanyData {
  const migrated = migrateCompanyRecord(company);
  const companyName = company.companyName?.trim() || '';
  const legalName = company.legalCompanyName?.trim() || '';
  return {
    ...migrated,
    companyName: legacyCompanyNames.has(companyName) ? defaultCompany.companyName : company.companyName,
    legalCompanyName: legacyCompanyNames.has(legalName) ? defaultCompany.legalCompanyName : company.legalCompanyName,
    address: company.address?.trim() ? company.address : defaultCompany.address,
    phone: company.phone?.trim() ? company.phone : defaultCompany.phone,
    website: company.website?.trim() ? company.website : defaultCompany.website,
    updatedAt: new Date().toISOString(),
  };
}


export function migrateAuthorizationAlignmentRecord(company: CompanyData): CompanyData {
  const migrated = migrateLetterheadCompanyRecord(company);
  return {
    ...migrated,
    signatureAlignment: !company.signatureAlignment || company.signatureAlignment === 'right' ? 'left' : company.signatureAlignment,
    stampAlignment: !company.stampAlignment || company.stampAlignment === 'right' ? 'left' : company.stampAlignment,
    updatedAt: new Date().toISOString(),
  };
}

export function migrateTemplateRecord(template: TemplateData): TemplateData {
  return {
    ...template,
    includeStampByDefault: template.includeStampByDefault ?? true,
  };
}

export function migrateDocumentRecord(document: DocumentData): DocumentData {
  return {
    ...document,
    includeStamp: document.includeStamp ?? true,
  };
}

export function migrateHistoryRecord(history: HistoryData): HistoryData {
  return {
    ...history,
    document: migrateDocumentRecord(history.document),
  };
}
