import type { CompanyData, DocumentData } from './types';

export interface AuthorizationView {
  companyName: string;
  signatureDataUrl?: string;
  stampDataUrl?: string;
  signatoryName: string;
  signatoryDesignation: string;
  showSignature: boolean;
  showStamp: boolean;
  signatureWidth: number;
  stampWidth: number;
  signatureAlignment: CompanyData['signatureAlignment'];
  stampAlignment: CompanyData['stampAlignment'];
}

export function buildAuthorizationView(company: CompanyData, doc: DocumentData): AuthorizationView {
  const showStamp = company.stampEnabled !== false && doc.includeStamp !== false && Boolean(company.stampDataUrl);
  return {
    companyName: company.companyName || 'RapidCrew Solutions Private Limited',
    signatureDataUrl: company.signatureDataUrl,
    stampDataUrl: company.stampDataUrl,
    signatoryName: company.signatoryName || 'Authorized Signatory',
    signatoryDesignation: company.signatoryDesignation || '',
    showSignature: Boolean(company.signatureDataUrl),
    showStamp,
    signatureWidth: company.signatureWidth || 130,
    stampWidth: company.stampWidth || 110,
    signatureAlignment: company.signatureAlignment || 'left',
    stampAlignment: company.stampAlignment || 'left',
  };
}
