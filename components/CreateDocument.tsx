'use client';
import { useEffect, useMemo, useState } from 'react';
import { Download, FileCheck2, Printer, Save, X } from 'lucide-react';
import { AppShell } from './AppShell';
import { Button, Card, Field, PageHeader, SelectField, TextAreaField, Toast } from './ui';
import DocumentPreview from './DocumentPreview';
import RichTextEditor from './RichTextEditor';
import { StampConfigurationNotice } from './DocumentAuthorizationBlock';
import { db, ensureDefaults } from '@/lib/db';
import type { CompanyData, DocumentData, DocumentType, EmployeeData, SalaryComponents, TemplateData } from '@/lib/types';
import { today, uid } from '@/lib/utils';
import { validateForExport } from '@/lib/validation';
import { downloadDocx, downloadPdf } from '@/lib/exporters';

const salaryBlank:SalaryComponents={basic:'0',hra:'0',other:'0',conveyance:'0',medical:'0',specialAllowance:'0',bonus:'0',incentive:'0',otherEarnings:'0',pf:'0',professionalTax:'0',tds:'0',esi:'0',loan:'0',lop:'0',otherDeduction:'0'};
const names:Record<DocumentType,string>={'salary-slip':'Salary Slip','offer-letter':'Offer Letter','appointment-letter':'Appointment Letter','experience-letter':'Experience Letter','relieving-letter':'Relieving Letter'};
const newDoc=(type:DocumentType):DocumentData=>({id:uid(),type,employeeId:'',templateId:'',documentDate:today(),includeStamp:true,salaryMonth:new Date().toLocaleString('en',{month:'long'}),salaryYear:String(new Date().getFullYear()),workingDays:'30',paidDays:'30',lopDays:'0',bankAccountNumber:'',salary:{...salaryBlank},createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()});
type PatchDocument = <K extends keyof DocumentData>(key:K,value:DocumentData[K])=>void;

export default function CreateDocument(){
 const [company,setCompany]=useState<CompanyData>();
 const [employees,setEmployees]=useState<EmployeeData[]>([]);
 const [templates,setTemplates]=useState<TemplateData[]>([]);
 const [doc,setDoc]=useState<DocumentData>(newDoc('experience-letter'));
 const [review,setReview]=useState(false);
 const [toast,setToast]=useState('');
 const [busy,setBusy]=useState(false);
 const [mobileTab,setMobileTab]=useState<'edit'|'preview'|'export'>('edit');
 const say=(m:string)=>{setToast(m);setTimeout(()=>setToast(''),2600)};

 async function refreshData(){
   const [c,e,t]=await Promise.all([db.company.get('company'),db.employees.toArray(),db.templates.toArray()]);
   setCompany(c);setEmployees(e);setTemplates(t);
 }

 useEffect(()=>{
   const refresh=()=>{void refreshData()};
   const visible=()=>{if(document.visibilityState==='visible')refresh()};
   window.addEventListener('focus',refresh);
   window.addEventListener('rapidcrew-data-changed',refresh as EventListener);
   document.addEventListener('visibilitychange',visible);
   (async()=>{
     await ensureDefaults();
     await refreshData();
     const saved=localStorage.getItem('rapidcrew_edit_doc');
     if(saved){try{const parsed=JSON.parse(saved) as DocumentData;setDoc({...parsed,includeStamp:parsed.includeStamp??true});localStorage.removeItem('rapidcrew_edit_doc');return}catch{}}
     const p=new URLSearchParams(window.location.search).get('type') as DocumentType|null;
     if(p&&names[p])setDoc(newDoc(p));
   })();
   return ()=>{
     window.removeEventListener('focus',refresh);
     window.removeEventListener('rapidcrew-data-changed',refresh as EventListener);
     document.removeEventListener('visibilitychange',visible);
   };
 },[]);

 const employee=employees.find(e=>e.id===doc.employeeId);
 const matching=templates.filter(t=>t.type===doc.type);
 const template=matching.find(t=>t.id===doc.templateId)||matching.find(t=>t.isDefault)||matching[0];

 useEffect(()=>{
   if(!employee) return;
   setDoc(d=>{
     const base={...d,lastWorkingDate:d.lastWorkingDate||employee.lastWorkingDate,updatedAt:new Date().toISOString()};
     if(d.type!=='salary-slip') return base;
     return {...base,bankAccountNumber:employee.bankAccountNumber||d.bankAccountNumber||'',salary:{...d.salary!,basic:employee.basicSalary||d.salary?.basic||'0',hra:employee.hra||d.salary?.hra||'0',other:employee.allowances||d.salary?.other||'0',otherDeduction:employee.deductions||d.salary?.otherDeduction||'0'}};
   });
 },[employee]);

 useEffect(()=>{
   if(template&&doc.templateId!==template.id)setDoc(d=>({...d,templateId:template.id,includeStamp:d.includeStamp??template.includeStampByDefault??true}));
 },[doc.templateId,template]);

 const errors=useMemo(()=>validateForExport(company,employee,doc,template),[company,employee,doc,template]);
 function changeType(type:DocumentType){setDoc(newDoc(type));setMobileTab('edit')}
 const patch:PatchDocument=(key,value)=>setDoc(d=>({...d,[key]:value,updatedAt:new Date().toISOString()}));
 function patchSalary(k:keyof SalaryComponents,v:string){setDoc(d=>({...d,salary:{...d.salary!,[k]:v},updatedAt:new Date().toISOString()}))}
 async function latestDocumentData(){
   const [freshCompany,freshEmployee,freshTemplates]=await Promise.all([
     db.company.get('company'),
     doc.employeeId?db.employees.get(doc.employeeId):Promise.resolve(undefined),
     db.templates.where('type').equals(doc.type).toArray(),
   ]);
   const freshTemplate=freshTemplates.find(t=>t.id===doc.templateId)||freshTemplates.find(t=>t.isDefault)||freshTemplates[0];
   if(freshCompany)setCompany(freshCompany);
   if(freshEmployee)setEmployees(list=>list.map(item=>item.id===freshEmployee.id?freshEmployee:item));
   if(freshTemplates.length)setTemplates(current=>[...current.filter(t=>t.type!==doc.type),...freshTemplates]);
   return {freshCompany,freshEmployee,freshTemplate};
 }
 async function storeHistory(historyEmployee=employee,historyTemplate=template){if(!historyEmployee||!historyTemplate)return;await db.history.put({id:doc.id,documentType:doc.type,employeeName:historyEmployee.fullName,createdAt:new Date().toISOString(),templateName:historyTemplate.name,document:{...doc,updatedAt:new Date().toISOString()}})}
 async function runExport(kind:'pdf'|'docx'){
   setBusy(true);
   try{
     const {freshCompany,freshEmployee,freshTemplate}=await latestDocumentData();
     const currentErrors=validateForExport(freshCompany,freshEmployee,doc,freshTemplate);
     if(currentErrors.length){say(currentErrors[0]);return}
     if(!freshCompany||!freshEmployee||!freshTemplate)return;
     await storeHistory(freshEmployee,freshTemplate);
     if(kind==='pdf')await downloadPdf(freshCompany,freshEmployee,doc,freshTemplate);
     else await downloadDocx(freshCompany,freshEmployee,doc,freshTemplate);
     say(kind==='pdf'?'PDF downloaded with latest data':'Word file generated with latest data');
   }catch(e){console.error(e);say(kind==='pdf'?'Unable to generate PDF.':'Unable to create Word document.')}finally{setBusy(false)}
 }
 async function print(){
   const {freshCompany,freshEmployee,freshTemplate}=await latestDocumentData();
   const currentErrors=validateForExport(freshCompany,freshEmployee,doc,freshTemplate);
   if(currentErrors.length){say(currentErrors[0]);return}
   await storeHistory(freshEmployee,freshTemplate);
   requestAnimationFrame(()=>window.print());
 }

 return <AppShell><div className="no-print"><PageHeader title="Create Document" description="Choose a document, select an employee, and enter only the details needed for that document."/></div>
 <div className="no-print mb-4 flex rounded-lg border bg-white p-1 lg:hidden"><button onClick={()=>setMobileTab('edit')} className={`flex-1 rounded-md py-2 text-sm font-semibold ${mobileTab==='edit'?'brand-soft':''}`}>EDIT</button><button onClick={()=>setMobileTab('preview')} className={`flex-1 rounded-md py-2 text-sm font-semibold ${mobileTab==='preview'?'brand-soft':''}`}>PREVIEW</button><button onClick={()=>setMobileTab('export')} className={`flex-1 rounded-md py-2 text-sm font-semibold ${mobileTab==='export'?'brand-soft':''}`}>EXPORT</button></div>
 <div className="grid gap-6 lg:grid-cols-[minmax(360px,40%)_minmax(0,60%)]">
  <div className={`no-print space-y-5 ${mobileTab==='preview'||mobileTab==='export'?'hidden lg:block':''}`}>
   <Card className="p-5"><div className="grid gap-4"><SelectField label="Document Type" value={doc.type} onChange={e=>changeType(e.target.value as DocumentType)}>{Object.entries(names).map(([v,n])=><option key={v} value={v}>{n}</option>)}</SelectField><SelectField label={doc.type==='offer-letter'?'Employee / Candidate *':'Employee *'} value={doc.employeeId} onChange={e=>patch('employeeId',e.target.value)}><option value="">Select saved employee</option>{employees.map(e=><option key={e.id} value={e.id}>{e.fullName} · {e.employeeId}</option>)}</SelectField></div></Card>
   {employee&&<Card className="p-5"><div className="mb-3 text-sm font-bold">Auto-filled Details</div><div className="grid grid-cols-2 gap-3 text-xs"><Info k="Name" v={employee.fullName}/><Info k="Designation" v={employee.designation}/><Info k="Department" v={employee.department}/><Info k="Joining Date" v={employee.joiningDate}/><Info k="Work Location" v={employee.workLocation}/><Info k="CTC" v={employee.ctc}/>{doc.type==='salary-slip'&&<><Info k="PAN" v={employee.pan}/><Info k="PF / UAN" v={[employee.pfNumber,employee.uan].filter(Boolean).join(' / ')}/></>}</div></Card>}
   <SpecificFields doc={doc} employee={employee} patch={patch} patchSalary={patchSalary}/>
   <AuthorizationOptions company={company} doc={doc} patch={patch}/>
   {doc.type!=='salary-slip'&&template&&<details className="rounded-xl border border-gray-200 bg-white"><summary className="cursor-pointer px-5 py-4 text-sm font-bold">Edit letter wording (optional)</summary><div className="border-t border-gray-100 p-5"><RichTextEditor value={doc.customBodyHtml ?? template.bodyHtml} onChange={html=>patch('customBodyHtml',html)}/></div></details>}
   <Button className="w-full py-3" onClick={()=>setReview(true)}><FileCheck2 size={18}/>Final Review</Button>
  </div>
  <div className={`${mobileTab==='edit'||mobileTab==='export'?'hidden lg:block':''}`}><div className="lg:sticky lg:top-6"><DocumentPreview company={company} employee={employee} doc={doc} template={template}/></div></div>
  {mobileTab==='export'&&<div className="no-print lg:hidden"><ExportPanel errors={errors} busy={busy} onPdf={()=>runExport('pdf')} onDocx={()=>runExport('docx')} onPrint={print}/></div>}
 </div>
 {review&&<ReviewModal company={company} employee={employee} template={template} doc={doc} errors={errors} busy={busy} close={()=>setReview(false)} onPdf={()=>runExport('pdf')} onDocx={()=>runExport('docx')} onPrint={print}/>}<Toast message={toast}/></AppShell>
}

function Info({k,v}:{k:string;v?:string}){return <div><div className="text-gray-500">{k}</div><div className="mt-0.5 font-semibold text-gray-900">{v||'—'}</div></div>}

function SpecificFields({doc,employee,patch,patchSalary}:{doc:DocumentData;employee?:EmployeeData;patch:PatchDocument;patchSalary:(k:keyof SalaryComponents,v:string)=>void}){
 if(doc.type==='salary-slip'){
   const s=doc.salary!;
   const defaultEarnings:[keyof SalaryComponents,string][]=[['basic','Basic'],['hra','HRA'],['conveyance','Conveyance Allowance'],['other','Other']];
   const moreEarnings:[keyof SalaryComponents,string][]=[['medical','Medical Allowance'],['specialAllowance','Special Allowance'],['bonus','Bonus'],['incentive','Incentive'],['otherEarnings','Other Earnings']];
   const defaultDeductions:[keyof SalaryComponents,string][]=[['pf','PF'],['professionalTax','Professional Tax'],['tds','TDS'],['esi','ESI'],['otherDeduction','Other Deduction']];
   const moreDeductions:[keyof SalaryComponents,string][]=[['loan','Loan'],['lop','LOP Deduction']];
   return <Card className="p-5"><div className="mb-4 font-bold">Salary Slip Details</div><div className="grid gap-3 sm:grid-cols-2"><Field label="Salary Month" value={doc.salaryMonth||''} onChange={e=>patch('salaryMonth',e.target.value)}/><Field label="Salary Year" value={doc.salaryYear||''} onChange={e=>patch('salaryYear',e.target.value)}/><Field label="Working Days" value={doc.workingDays||''} onChange={e=>patch('workingDays',e.target.value)}/><Field label="Days Present" value={doc.paidDays||''} onChange={e=>patch('paidDays',e.target.value)}/><Field label="LOP Days" value={doc.lopDays||''} onChange={e=>patch('lopDays',e.target.value)}/></div><div className="mt-5 text-xs font-bold uppercase tracking-wide text-gray-500">Earnings</div><div className="mt-2 grid gap-3 sm:grid-cols-2">{defaultEarnings.map(([k,l])=><Field key={k} label={l} inputMode="decimal" value={s[k]||''} onChange={e=>patchSalary(k,e.target.value)}/>)}</div><details className="mt-3 rounded-lg border border-gray-200"><summary className="cursor-pointer px-3 py-2 text-xs font-semibold">Additional earnings</summary><div className="grid gap-3 border-t p-3 sm:grid-cols-2">{moreEarnings.map(([k,l])=><Field key={k} label={l} inputMode="decimal" value={s[k]||''} onChange={e=>patchSalary(k,e.target.value)}/>)}</div></details><div className="mt-5 text-xs font-bold uppercase tracking-wide text-gray-500">Deductions</div><div className="mt-2 grid gap-3 sm:grid-cols-2">{defaultDeductions.map(([k,l])=><Field key={k} label={l} inputMode="decimal" value={s[k]||''} onChange={e=>patchSalary(k,e.target.value)}/>)}</div><details className="mt-3 rounded-lg border border-gray-200"><summary className="cursor-pointer px-3 py-2 text-xs font-semibold">Additional deductions</summary><div className="grid gap-3 border-t p-3 sm:grid-cols-2">{moreDeductions.map(([k,l])=><Field key={k} label={l} inputMode="decimal" value={s[k]||''} onChange={e=>patchSalary(k,e.target.value)}/>)}</div></details></Card>;
 }
 if(doc.type==='experience-letter')return <Card className="p-5"><div className="mb-4 font-bold">Experience Letter Details</div><div className="grid gap-3 sm:grid-cols-2"><Field label="Experience Letter Date" type="date" value={doc.documentDate} onChange={e=>patch('documentDate',e.target.value)}/><Field label="Last Working Date" type="date" value={doc.lastWorkingDate||employee?.lastWorkingDate||''} onChange={e=>patch('lastWorkingDate',e.target.value)}/><TextAreaField label="Custom Remarks (optional)" value={doc.customRemarks||''} onChange={e=>patch('customRemarks',e.target.value)} className="sm:col-span-2"/></div></Card>;
 if(doc.type==='relieving-letter')return <Card className="p-5"><div className="mb-4 font-bold">Relieving Letter Details</div><div className="grid gap-3 sm:grid-cols-2"><Field label="Relieving Date" type="date" value={doc.relievingDate||doc.documentDate} onChange={e=>{patch('relievingDate',e.target.value);patch('documentDate',e.target.value)}}/><Field label="Last Working Date" type="date" value={doc.lastWorkingDate||employee?.lastWorkingDate||''} onChange={e=>patch('lastWorkingDate',e.target.value)}/><Field label="Resignation Date (optional)" type="date" value={doc.resignationDate||''} onChange={e=>patch('resignationDate',e.target.value)}/><Field label="Reference Number (optional)" value={doc.referenceNumber||''} onChange={e=>patch('referenceNumber',e.target.value)}/></div></Card>;
 if(doc.type==='offer-letter')return <Card className="p-5"><div className="mb-4 font-bold">Offer Letter Details</div><div className="grid gap-3 sm:grid-cols-2"><Field label="Offer Date" type="date" value={doc.documentDate} onChange={e=>patch('documentDate',e.target.value)}/><Field label="Offer Valid Until (optional)" type="date" value={doc.offerValidUntil||''} onChange={e=>patch('offerValidUntil',e.target.value)}/><Field label="Probation Period" value={doc.probationPeriod||''} onChange={e=>patch('probationPeriod',e.target.value)}/></div><p className="mt-3 text-xs text-gray-500">Candidate name, designation, department, joining date, work location, CTC and employment type are auto-filled from the selected employee/candidate.</p></Card>;
 return <Card className="p-5"><div className="mb-4 font-bold">Appointment Letter Details</div><div className="grid gap-3 sm:grid-cols-2"><Field label="Appointment Date" type="date" value={doc.appointmentDate||doc.documentDate} onChange={e=>{patch('appointmentDate',e.target.value);patch('documentDate',e.target.value)}}/><Field label="Probation Period" value={doc.probationPeriod||''} onChange={e=>patch('probationPeriod',e.target.value)}/><Field label="Notice Period" value={doc.noticePeriod||''} onChange={e=>patch('noticePeriod',e.target.value)}/></div><p className="mt-3 text-xs text-gray-500">Designation, department, joining date, salary/CTC, work location and reporting manager are auto-filled from the selected employee.</p></Card>;
}

function AuthorizationOptions({company,doc,patch}:{company?:CompanyData;doc:DocumentData;patch:PatchDocument}){
 const includeStamp=doc.includeStamp!==false;
 return <Card className="p-5"><div className="font-bold">Document Authorization</div><label className="mt-3 flex items-center gap-3 text-sm font-semibold"><input type="checkbox" checked={includeStamp} onChange={e=>patch('includeStamp',e.target.checked)} disabled={company?.stampEnabled===false}/>Include Company Stamp</label>{company?.stampEnabled===false?<div className="mt-2 text-xs text-amber-800">Company stamp is disabled in Company Setup.</div>:<StampConfigurationNotice company={company} includeStamp={includeStamp}/>}</Card>;
}

function ExportPanel({errors,busy,onPdf,onDocx,onPrint}:{errors:string[];busy:boolean;onPdf:()=>void;onDocx:()=>void;onPrint:()=>void}){return <Card className="p-5"><div className="font-bold">Export</div>{errors.length>0&&<div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"><b>Resolve before export:</b><ul className="mt-1 list-disc pl-5">{errors.map(e=><li key={e}>{e}</li>)}</ul></div>}<div className="mt-4 grid gap-2"><Button disabled={busy||!!errors.length} onClick={onPdf}><Download size={17}/>Download PDF</Button><Button variant="secondary" disabled={busy||!!errors.length} onClick={onDocx}><Save size={17}/>Download Word</Button><Button variant="secondary" disabled={busy||!!errors.length} onClick={onPrint}><Printer size={17}/>Print</Button></div></Card>}

function ReviewModal({company,employee,template,doc,errors,busy,close,onPdf,onDocx,onPrint}:{company?:CompanyData;employee?:EmployeeData;template?:TemplateData;doc:DocumentData;errors:string[];busy:boolean;close:()=>void;onPdf:()=>void;onDocx:()=>void;onPrint:()=>void}){
 const stampReady=doc.includeStamp===false||company?.stampEnabled===false||!!company?.stampDataUrl;
 const checks:[string,boolean][]=[['Employee Details Complete',!!employee?.fullName],['Company Details Complete',!!company?.companyName],['Required Dates Complete',doc.type==='salary-slip'||!!doc.documentDate],['No Unresolved Variables',!errors.some(e=>e.startsWith('Unresolved'))]];
 if(doc.type!=='salary-slip')checks.push(['Company Stamp Ready / Disabled',stampReady]);
 return <div className="no-print fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"><div role="dialog" aria-modal="true" className="max-h-[92vh] w-full max-w-5xl overflow-auto rounded-xl bg-white shadow-2xl"><div className="flex items-center justify-between border-b px-5 py-4"><div><h2 className="text-lg font-bold">FINAL REVIEW</h2><p className="text-xs text-gray-500">Confirm the document before export.</p></div><button onClick={close} aria-label="Close final review" className="rounded p-2 hover:bg-gray-100"><X/></button></div><div className="grid gap-5 p-5 lg:grid-cols-[320px_1fr]"><div><Card className="p-4"><Info k="Document Type" v={names[doc.type]}/><div className="mt-3"><Info k="Employee" v={employee?.fullName}/></div><div className="mt-3"><Info k="Company" v={company?.companyName}/></div><div className="mt-3"><Info k="Template" v={template?.name}/></div></Card><Card className="mt-4 p-4"><div className="font-bold">Validation Checklist</div><div className="mt-3 space-y-2 text-sm">{checks.map(([label,ok])=><div key={label} className={ok?'text-green-700':'text-amber-700'}>{ok?'✓':'!'} {label}</div>)}</div></Card><div className="mt-4"><ExportPanel errors={errors} busy={busy} onPdf={onPdf} onDocx={onDocx} onPrint={onPrint}/></div></div><div className="overflow-auto rounded-lg bg-gray-100 p-3"><div style={{transform:'scale(.74)',transformOrigin:'top left',width:'135%'}}><DocumentPreview company={company} employee={employee} doc={doc} template={template}/></div></div></div><div className="border-t px-5 py-4"><Button variant="secondary" onClick={close}>Back to Edit</Button></div></div></div>;
}
