import { describe, expect, it } from 'vitest';
import { amountInWords, parseMoneyMinor, renderPlaceholders, salaryTotals, unresolvedPlaceholders } from '../lib/utils';

describe('money and salary calculations',()=>{
 it('uses integer minor units for decimals',()=>expect(parseMoneyMinor('68000.25')).toBe(6800025n));
 it('calculates gross, deductions and net',()=>{const t=salaryTotals({basic:'50000',hra:'15000',conveyance:'1000',medical:'0',specialAllowance:'2000',bonus:'0',incentive:'0',otherEarnings:'0',pf:'1800',professionalTax:'200',tds:'3000',esi:'0',loan:'0',lop:'0',otherDeduction:'0'});expect(t.gross).toBe(6800000n);expect(t.deductions).toBe(500000n);expect(t.net).toBe(6300000n)});
 it('converts INR amount to words',()=>expect(amountInWords(6800000n,'INR')).toBe('Rupees Sixty Eight Thousand Only'));
});

describe('template placeholders',()=>{
 it('replaces known placeholders',()=>expect(renderPlaceholders('Hello {{employee_name}}',{employee_name:'Poojan Patel'})).toBe('Hello Poojan Patel'));
 it('leaves unknown placeholders visible for validation',()=>expect(unresolvedPlaceholders(renderPlaceholders('{{missing}}',{}))).toEqual(['missing']));
});
