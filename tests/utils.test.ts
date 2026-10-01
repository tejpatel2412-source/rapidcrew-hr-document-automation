import { describe, expect, it } from 'vitest';
import { amountInWords, formatDate, parseMoneyMinor, placeholderMap, renderPlaceholders, salaryTotals, unresolvedPlaceholders } from '../lib/utils';
import { defaultCompany } from '../lib/defaults';
import type { DocumentData, EmployeeData } from '../lib/types';

describe('money and salary calculations',()=>{
 it('uses integer minor units for decimals',()=>expect(parseMoneyMinor('68000.25')).toBe(6800025n));
 it('calculates gross, deductions and net',()=>{const t=salaryTotals({basic:'50000',hra:'15000',conveyance:'1000',medical:'0',specialAllowance:'2000',bonus:'0',incentive:'0',otherEarnings:'0',pf:'1800',professionalTax:'200',tds:'3000',esi:'0',loan:'0',lop:'0',otherDeduction:'0'});expect(t.gross).toBe(6800000n);expect(t.deductions).toBe(500000n);expect(t.net).toBe(6300000n)});
 it('converts INR amount to words',()=>expect(amountInWords(6800000n,'INR')).toBe('Rupees Sixty Eight Thousand Only'));
});

describe('template placeholders',()=>{
 it('replaces known placeholders',()=>expect(renderPlaceholders('Hello {{employee_name}}',{employee_name:'Poojan Patel'})).toBe('Hello Poojan Patel'));
 it('leaves unknown placeholders visible for validation',()=>expect(unresolvedPlaceholders(renderPlaceholders('{{missing}}',{}))).toEqual(['missing']));
});


describe('document-specific placeholder values',()=>{
 const employee:EmployeeData={id:'e',employeeId:'RC1',fullName:'Test Person',personalEmail:'',officialEmail:'',phone:'',address:'',department:'Operations',designation:'Analyst',joiningDate:'2026-01-15',lastWorkingDate:'',employmentType:'Full-time',workLocation:'Ahmedabad',reportingManager:'Manager Name',ctc:'700000',basicSalary:'40000',hra:'10000',allowances:'5000',deductions:'0',pan:'',uan:'',pfNumber:'',esicNumber:'',bankAccountNumber:'',status:'Active',createdAt:'',updatedAt:''};
 const base:DocumentData={id:'d',type:'offer-letter',employeeId:'e',templateId:'t',documentDate:'2026-09-18',probationPeriod:'3 months',offerValidUntil:'2026-09-30',createdAt:'',updatedAt:''};
 it('honors the editable company date format',()=>{
   expect(formatDate('2026-09-18','DD/MM/YYYY')).toBe('18/09/2026');
   expect(formatDate('2026-09-18','MM/DD/YYYY')).toBe('09/18/2026');
 });
 it('turns optional form values into complete template lines instead of broken empty sentences',()=>{
   const values=placeholderMap(defaultCompany,employee,base);
   expect(values.probation_line).toContain('3 months');
   expect(values.offer_validity_line).toContain('30/09/2026');
   expect(values.employment_type_line).toContain('Full-time');
   expect(values.reporting_manager_line).toContain('Manager Name');
   const blank=placeholderMap(defaultCompany,employee,{...base,probationPeriod:'',offerValidUntil:''});
   expect(blank.probation_line).toBe('');
   expect(blank.offer_validity_line).toBe('');
 });
});
