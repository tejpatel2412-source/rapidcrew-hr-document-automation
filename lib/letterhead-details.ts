import type { CompanyData } from './types';
import { LETTERHEAD } from './letterhead';

export function getLetterheadDetails(company?: CompanyData) {
  const addressParts = [company?.address, company?.city, company?.state, company?.country, company?.pin]
    .map((value) => value?.trim())
    .filter(Boolean);

  return {
    website: company?.website?.trim() || LETTERHEAD.website,
    legalName: company?.legalCompanyName?.trim() || company?.companyName?.trim() || LETTERHEAD.legalName,
    phone: company?.phone?.trim() || LETTERHEAD.phone,
    address: addressParts.length ? addressParts.join(', ') : LETTERHEAD.address,
  };
}
