import type { CompanyData, DocumentData, EmployeeData, SalaryComponents } from './types';
import { amountInWords, money, parseMoneyMinor, salaryTotals } from './utils';

export const SALARY_SYSTEM_FOOTER = 'This is a System Generated Pay Slip and does not require any Signature';

export type SalarySlipPairRow = [string, string, string, string];
export interface SalarySlipAmountRow { label: string; amount: string; minor: bigint; }

function ddmmyyyy(value?: string) {
  if (!value) return '';
  const [year, month, day] = value.split('-');
  return year && month && day ? `${day}/${month}/${year}` : value;
}

function amount(minor: bigint) {
  return new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(minor) / 100);
}

function salaryValue(salary: SalaryComponents | undefined, key: keyof SalaryComponents) {
  return salary?.[key] || '0';
}

function row(label: string, value: string): SalarySlipAmountRow {
  const minor = parseMoneyMinor(value);
  return { label, minor, amount: amount(minor) };
}

export function buildSalarySlipView(company: CompanyData, employee: EmployeeData, doc: DocumentData) {
  const salary = doc.salary;
  const requiredEarnings: SalarySlipAmountRow[] = [
    row('BASIC', salaryValue(salary, 'basic')),
    row('HRA', salaryValue(salary, 'hra')),
    row('Other', salaryValue(salary, 'other')),
    row('Conveyance Allowance', salaryValue(salary, 'conveyance')),
  ];
  const optionalEarnings = [
    row('Medical Allowance', salaryValue(salary, 'medical')),
    row('Special Allowance', salaryValue(salary, 'specialAllowance')),
    row('Bonus', salaryValue(salary, 'bonus')),
    row('Incentive', salaryValue(salary, 'incentive')),
    row('Other Earnings', salaryValue(salary, 'otherEarnings')),
  ].filter(item => item.minor !== 0n);
  const deductions = [
    row('PF', salaryValue(salary, 'pf')),
    row('Professional Tax', salaryValue(salary, 'professionalTax')),
    row('TDS', salaryValue(salary, 'tds')),
    row('ESI', salaryValue(salary, 'esi')),
    row('Loan', salaryValue(salary, 'loan')),
    row('LOP', salaryValue(salary, 'lop')),
    row('Other Deduction', salaryValue(salary, 'otherDeduction')),
  ].filter(item => item.minor !== 0n);
  const totals = salaryTotals(salary);
  return {
    companyName: company.companyName || '',
    title: `Pay Slip for the Month ${doc.salaryMonth || ''} ${doc.salaryYear || ''}`.trim(),
    employeeRows: [
      ['Emp Code', employee.employeeId || '', 'Emp Name', employee.fullName || ''],
      ['Designation', employee.designation || '', 'DOJ', ddmmyyyy(employee.joiningDate)],
      ['PAN', employee.pan || '', 'UAN', employee.uan || ''],
      ['ESI A/c No', employee.esicNumber || '', 'PF No', employee.pfNumber || ''],
      ['Working Days', doc.workingDays || '', 'Bank A/c No', doc.bankAccountNumber || ''],
      ['No of Days Present', doc.paidDays || '', 'LOP Days', doc.lopDays || ''],
    ] as SalarySlipPairRow[],
    earnings: [...requiredEarnings, ...optionalEarnings],
    deductions,
    totals,
    grossAmount: amount(totals.gross),
    deductionAmount: amount(totals.deductions),
    netAmount: money(totals.net, company.currency || 'INR'),
    amountInWords: amountInWords(totals.net, company.currency || 'INR'),
    systemFooter: SALARY_SYSTEM_FOOTER,
  };
}
