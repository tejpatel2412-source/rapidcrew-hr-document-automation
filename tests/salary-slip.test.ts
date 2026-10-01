import { describe, expect, it } from 'vitest';
import { buildSalarySlipView } from '../lib/salary-slip';
import type { CompanyData, DocumentData, EmployeeData } from '../lib/types';

const company = {
  id: 'company', companyName: 'Rapidcrew Solutions Private Limited', legalCompanyName: '', logoPosition: 'left', logoWidth: 140,
  address: '', city: '', state: '', country: 'India', pin: '', phone: '', email: '', website: '', cin: '', gstin: '', pan: '', hrEmail: '', hrPhone: '',
  signatoryName: '', signatoryDesignation: '', signatureWidth: 130, signatureAlignment: 'right', stampWidth: 110, stampAlignment: 'right',
  footerText: '', currency: 'INR', dateFormat: 'DD MMM YYYY', fontFamily: 'Arial', updatedAt: '2026-09-16T00:00:00.000Z'
} satisfies CompanyData;

const employee = {
  id: 'emp-1', employeeId: '43', fullName: 'Swarn Sharma', personalEmail: '', officialEmail: '', phone: '', address: '', department: 'Operations',
  designation: 'Team Leader', joiningDate: '2024-03-20', lastWorkingDate: '', employmentType: '', workLocation: '', reportingManager: '', ctc: '',
  basicSalary: '', hra: '', allowances: '', deductions: '', pan: 'ABCDE1234F', uan: '100200300400', pfNumber: 'PF-77', esicNumber: 'ESI-88',
  status: 'Active', createdAt: '2026-09-16T00:00:00.000Z', updatedAt: '2026-09-16T00:00:00.000Z'
} satisfies EmployeeData;

const documentData = {
  id: 'doc-1', type: 'salary-slip', employeeId: employee.id, templateId: 'default-salary-slip', documentDate: '2026-09-16',
  salaryMonth: 'October', salaryYear: '2025', workingDays: '31', paidDays: '31', lopDays: '0', bankAccountNumber: '1234567890',
  salary: {
    basic: '35000', hra: '17500', other: '15500', conveyance: '2000', medical: '0', specialAllowance: '0', bonus: '0', incentive: '0', otherEarnings: '0',
    pf: '0', professionalTax: '0', tds: '0', esi: '0', loan: '0', lop: '0', otherDeduction: '0'
  },
  createdAt: '2026-09-16T00:00:00.000Z', updatedAt: '2026-09-16T00:00:00.000Z'
} satisfies DocumentData;

describe('salary slip view model', () => {
  it('builds the requested employee information rows without fallback text', () => {
    const view = buildSalarySlipView(company, employee, documentData);
    expect(view.title).toBe('Pay Slip for the Month October 2025');
    expect(view.employeeRows).toEqual([
      ['Emp Code', '43', 'Emp Name', 'Swarn Sharma'],
      ['Designation', 'Team Leader', 'DOJ', '20/03/2024'],
      ['PAN', 'ABCDE1234F', 'UAN', '100200300400'],
      ['ESI A/c No', 'ESI-88', 'PF No', 'PF-77'],
      ['Working Days', '31', 'Bank A/c No', '1234567890'],
      ['Days Present', '31', 'LOP Days', '0'],
    ]);
  });

  it('calculates the example salary and includes the exact system footer', () => {
    const view = buildSalarySlipView(company, employee, documentData);
    expect(view.totals.gross).toBe(7000000n);
    expect(view.totals.deductions).toBe(0n);
    expect(view.totals.net).toBe(7000000n);
    expect(view.amountInWords).toBe('Rupees Seventy Thousand Only');
    expect(view.systemFooter).toBe('This is a system-generated payslip.');
  });

  it('keeps required earning rows and omits zero optional deductions', () => {
    const view = buildSalarySlipView(company, employee, documentData);
    expect(view.earnings.slice(0, 4).map(row => row.label)).toEqual(['BASIC', 'HRA', 'Other', 'Conveyance Allowance']);
    expect(view.deductions).toEqual([]);
  });
});
