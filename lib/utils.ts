import type { Alignment, CompanyData, DocumentData, EmployeeData, SalaryComponents } from './types';

export const uid = () => typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
export const today = () => new Date().toISOString().slice(0, 10);
export const safeFilename = (s: string) => s.replace(/[^a-z0-9._-]+/gi, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
export const formatDate = (v?: string, format='DD MMM YYYY') => {
  if (!v) return '';
  const date = new Date(`${v}T00:00:00`);
  if (Number.isNaN(date.getTime())) return v;
  const day=String(date.getDate()).padStart(2,'0');
  const month=String(date.getMonth()+1).padStart(2,'0');
  const year=String(date.getFullYear());
  if(format==='DD/MM/YYYY') return `${day}/${month}/${year}`;
  if(format==='MM/DD/YYYY') return `${month}/${day}/${year}`;
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
};
export const money = (minor: bigint, currency='INR') => new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 2 }).format(Number(minor) / 100);
export const parseMoneyMinor = (v?: string) => {
  const clean = (v || '0').replace(/[^0-9.-]/g, '');
  if (!clean || clean === '-' || Number.isNaN(Number(clean))) return 0n;
  const neg = clean.startsWith('-'); const abs = neg ? clean.slice(1) : clean;
  const [a='0', b=''] = abs.split('.'); const out = BigInt(a || '0') * 100n + BigInt((b + '00').slice(0,2));
  return neg ? -out : out;
};

export function salaryTotals(s?: SalaryComponents) {
  const x = s || { basic:'0', hra:'0', other:'0', conveyance:'0', medical:'0', specialAllowance:'0', bonus:'0', incentive:'0', otherEarnings:'0', pf:'0', professionalTax:'0', tds:'0', esi:'0', loan:'0', lop:'0', otherDeduction:'0' };
  const gross = ['basic','hra','other','conveyance','medical','specialAllowance','bonus','incentive','otherEarnings'].reduce((n,k)=>n+parseMoneyMinor(x[k as keyof SalaryComponents]),0n);
  const deductions = ['pf','professionalTax','tds','esi','loan','lop','otherDeduction'].reduce((n,k)=>n+parseMoneyMinor(x[k as keyof SalaryComponents]),0n);
  return { gross, deductions, net: gross - deductions };
}

const ones = ['', 'One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
const tens = ['', '', 'Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
function two(n:number){ if(n<20) return ones[n]; return `${tens[Math.floor(n/10)]}${n%10?' '+ones[n%10]:''}`; }
function three(n:number){ return n<100?two(n):`${ones[Math.floor(n/100)]} Hundred${n%100?' '+two(n%100):''}`; }
export function amountInWords(minor: bigint, currency='INR') {
  let n = Number(minor / 100n); if (!Number.isSafeInteger(n)) return 'Amount too large'; if(n===0) return currency==='INR'?'Rupees Zero Only':'Zero Only';
  const parts:string[]=[]; const crore=Math.floor(n/10000000); n%=10000000; const lakh=Math.floor(n/100000); n%=100000; const thousand=Math.floor(n/1000); n%=1000;
  if(crore) parts.push(`${three(crore)} Crore`); if(lakh) parts.push(`${three(lakh)} Lakh`); if(thousand) parts.push(`${three(thousand)} Thousand`); if(n) parts.push(three(n));
  return `${currency==='INR'?'Rupees ':''}${parts.join(' ')} Only`;
}

export function placeholderMap(company: CompanyData | undefined, employee: EmployeeData | undefined, doc: DocumentData) {
  const totals = salaryTotals(doc.salary);
  const dateFormat=company?.dateFormat || 'DD MMM YYYY';
  const fmt=(value?:string)=>formatDate(value,dateFormat);
  const probation=doc.probationPeriod?.trim() || '';
  const offerValidUntil=doc.offerValidUntil?.trim() || '';
  const notice=doc.noticePeriod?.trim() || '';
  const resignation=doc.resignationDate?.trim() || '';
  const reference=doc.referenceNumber?.trim() || '';
  const employmentType=employee?.employmentType?.trim() || '';
  const reportingManager=employee?.reportingManager?.trim() || '';
  return {
    employee_name: employee?.fullName || '',
    employee_id: employee?.employeeId || '',
    employee_address: employee?.address || '',
    designation: employee?.designation || '',
    department: employee?.department || '',
    company_name: company?.companyName || '',
    company_address: [company?.address, company?.city, company?.state, company?.country, company?.pin].filter(Boolean).join(', '),
    joining_date: fmt(employee?.joiningDate),
    last_working_date: fmt(doc.lastWorkingDate || employee?.lastWorkingDate),
    document_date: fmt(doc.documentDate),
    relieving_date: fmt(doc.relievingDate || doc.documentDate),
    resignation_date: fmt(doc.resignationDate),
    appointment_date: fmt(doc.appointmentDate || doc.documentDate),
    offer_valid_until: fmt(doc.offerValidUntil),
    reference_number: reference,
    custom_remarks: doc.customRemarks || '',
    salary: employee?.basicSalary || '',
    ctc: employee?.ctc || '',
    work_location: employee?.workLocation || '',
    employment_type: employmentType,
    reporting_manager: reportingManager,
    signatory_name: company?.signatoryName || '',
    salary_month: doc.salaryMonth || '',
    salary_year: doc.salaryYear || '',
    probation_period: probation,
    notice_period: notice,
    benefits: doc.benefits || '',
    special_conditions: doc.specialConditions || '',
    terms: doc.terms || '',
    probation_line: probation ? `Probation Period: ${probation}.` : '',
    offer_validity_line: offerValidUntil ? `This offer is valid until ${fmt(offerValidUntil)}.` : '',
    notice_line: notice ? `Notice Period: ${notice}.` : '',
    resignation_line: resignation ? `Resignation Date: ${fmt(resignation)}.` : '',
    reference_line: reference ? `Reference No: ${reference}` : '',
    employment_type_line: employmentType ? `Employment Type: ${employmentType}.` : '',
    reporting_manager_line: reportingManager ? `Reporting Manager: ${reportingManager}.` : '',
    gross_earnings: money(totals.gross, company?.currency),
    total_deductions: money(totals.deductions, company?.currency),
    net_pay: money(totals.net, company?.currency),
    amount_in_words: amountInWords(totals.net, company?.currency),
  } as Record<string,string>;
}
export function renderPlaceholders(html: string, values: Record<string,string>) { return html.replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (_, k) => values[k] ?? `{{${k}}}`); }
export function unresolvedPlaceholders(html: string){ return [...html.matchAll(/{{\s*([a-zA-Z0-9_]+)\s*}}/g)].map(m=>m[1]); }
export function alignmentStyle(a: Alignment){ return { textAlign: a } as const; }
