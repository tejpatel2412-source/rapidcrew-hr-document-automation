import { describe, expect, it } from 'vitest';
import { validateForExport } from '../lib/validation';
import { emptyCompany } from '../lib/defaults';
import type { DocumentData, EmployeeData, TemplateData } from '../lib/types';

const employee:EmployeeData={id:'e1',employeeId:'RC001',fullName:'Poojan Patel',personalEmail:'',officialEmail:'',phone:'',address:'',department:'Engineering',designation:'Technical Trainer',joiningDate:'2026-01-01',lastWorkingDate:'2026-09-01',employmentType:'Full-time',workLocation:'Ahmedabad',reportingManager:'',ctc:'680000',basicSalary:'50000',hra:'15000',allowances:'3000',deductions:'2000',pan:'',uan:'',pfNumber:'',esicNumber:'',status:'Exited',createdAt:'',updatedAt:''};
const template:TemplateData={id:'t',type:'experience-letter',name:'Classic',bodyHtml:'<p>{{employee_name}} - {{designation}}</p>',isDefault:true,createdAt:'',updatedAt:''};
const doc:DocumentData={id:'d',type:'experience-letter',employeeId:'e1',templateId:'t',documentDate:'2026-09-16',createdAt:'',updatedAt:''};

describe('export validation',()=>{
 it('passes when required data and assets exist',()=>{const c={...emptyCompany,companyName:'Rapidcrew',signatoryName:'HR',signatureDataUrl:'data:image/png;base64,AA==',stampDataUrl:'data:image/png;base64,AA=='};expect(validateForExport(c,employee,doc,template)).toEqual([])});
 it('blocks missing company/signature/stamp',()=>{const errors=validateForExport(emptyCompany,employee,doc,template);expect(errors.join(' ')).toContain('Company Name');expect(errors.join(' ')).toContain('signature');expect(errors.join(' ')).toContain('stamp')});
 it('blocks unresolved placeholders',()=>{const c={...emptyCompany,companyName:'Rapidcrew',signatureDataUrl:'x',stampDataUrl:'y'};const bad={...template,bodyHtml:'{{unknown_value}}'};expect(validateForExport(c,employee,doc,bad).join(' ')).toContain('Unresolved variables')});
});

it('does not require signature or stamp for the system-generated salary slip',()=>{
 const c={...emptyCompany,companyName:'Rapidcrew'};
 const salaryDoc:DocumentData={id:'s',type:'salary-slip',employeeId:'e1',templateId:'default-salary-slip',documentDate:'2026-09-16',salaryMonth:'September',salaryYear:'2026',salary:{basic:'10000',hra:'0',other:'0',conveyance:'0',medical:'0',specialAllowance:'0',bonus:'0',incentive:'0',otherEarnings:'0',pf:'0',professionalTax:'0',tds:'0',esi:'0',loan:'0',lop:'0',otherDeduction:'0'},createdAt:'',updatedAt:''};
 const salaryTemplate:TemplateData={...template,id:'default-salary-slip',type:'salary-slip',bodyHtml:'<p>{{employee_name}}</p>'};
 const errors=validateForExport(c,employee,salaryDoc,salaryTemplate);
 expect(errors.join(' ')).not.toContain('signature');
 expect(errors.join(' ')).not.toContain('stamp');
});
