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


const legacyCompanyNames = new Set(['','rapidcrew','rapidcrew pvt ltd','rapidcrew pvt. ltd.','rapidcrew solutions','rapidcrew solutions pvt ltd','rapidcrew solutions pvt. ltd.','rapidcrew solutions private limited']);
function isLegacyRapidcrewName(value?:string){return legacyCompanyNames.has((value||'').trim().toLowerCase())}

export function migrateLetterheadCompanyRecord(company: CompanyData): CompanyData {
  const migrated = migrateCompanyRecord(company);
  const companyName = company.companyName?.trim() || '';
  const legalName = company.legalCompanyName?.trim() || '';
  return {
    ...migrated,
    companyName: isLegacyRapidcrewName(companyName) ? defaultCompany.companyName : company.companyName,
    legalCompanyName: isLegacyRapidcrewName(legalName) ? defaultCompany.legalCompanyName : company.legalCompanyName,
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
    includeStampByDefault: template.type === 'salary-slip' ? true : (template.includeStampByDefault ?? true),
  };
}

export function migrateDocumentRecord(document: DocumentData): DocumentData {
  return {
    ...document,
    includeStamp: document.type === 'salary-slip' ? true : (document.includeStamp ?? true),
  };
}

export function migrateHistoryRecord(history: HistoryData): HistoryData {
  return {
    ...history,
    document: migrateDocumentRecord(history.document),
  };
}

export function migrateRapidcrewDefaultsV5(company: CompanyData): CompanyData {
  const migrated=migrateAuthorizationAlignmentRecord(company);
  const companyName=(company.companyName||'').trim();
  const legalName=(company.legalCompanyName||'').trim();
  const rapidcrewIdentity=(!companyName&&!legalName)||(Boolean(companyName)&&isLegacyRapidcrewName(companyName))||(Boolean(legalName)&&isLegacyRapidcrewName(legalName));
  if(!rapidcrewIdentity)return migrated;
  return {
    ...migrated,
    companyName: defaultCompany.companyName,
    legalCompanyName: defaultCompany.legalCompanyName,
    address: company.address?.trim() ? company.address : defaultCompany.address,
    phone: company.phone?.trim() ? company.phone : defaultCompany.phone,
    website: company.website?.trim() ? company.website : defaultCompany.website,
    signatoryName: company.signatoryName?.trim() ? company.signatoryName : defaultCompany.signatoryName,
    signatoryDesignation: company.signatoryDesignation?.trim() ? company.signatoryDesignation : defaultCompany.signatoryDesignation,
    stampEnabled: company.stampEnabled ?? true,
    signatureAlignment: company.signatureAlignment==='center'?'center':'left',
    stampAlignment: company.stampAlignment==='center'?'center':'left',
    updatedAt: new Date().toISOString(),
  };
}
