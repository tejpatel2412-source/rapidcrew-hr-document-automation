import type { CompanyData, DocumentData, EmployeeData } from './types';
import { renderPlaceholders, placeholderMap, unresolvedPlaceholders, salaryTotals } from './utils';
import type { TemplateData } from './types';

export function validateForExport(company: CompanyData | undefined, employee: EmployeeData | undefined, doc: DocumentData, template: TemplateData | undefined) {
  const errors:string[]=[];
  if(!company?.companyName) errors.push('Company Name is missing.');
  if(!employee?.fullName) errors.push('Employee Name is missing.');
  if(!doc.documentDate) errors.push('Required document date is missing.');
  if(doc.type !== 'salary-slip' && !employee?.designation) errors.push('Designation is missing.');
  if(doc.type !== 'salary-slip' && !company?.signatureDataUrl) errors.push('Authorized signature is missing.');
  if(doc.type !== 'salary-slip' && !company?.stampDataUrl) errors.push('Official company stamp is missing.');
  if(doc.type==='salary-slip') {
    const t = salaryTotals(doc.salary); if(t.gross < 0n || t.deductions < 0n || t.net < 0n) errors.push('Salary totals are invalid.');
    if(!doc.salaryMonth || !doc.salaryYear) errors.push('Salary month and year are required.');
  }
  if(employee?.joiningDate && employee?.lastWorkingDate && employee.joiningDate > employee.lastWorkingDate) errors.push('Last Working Date cannot be before Date of Joining.');
  if(template){ const rendered = renderPlaceholders(doc.customBodyHtml || template.bodyHtml, placeholderMap(company, employee, doc)); const unresolved = unresolvedPlaceholders(rendered); if(unresolved.length) errors.push(`Unresolved variables: ${unresolved.join(', ')}`); }
  return errors;
}
