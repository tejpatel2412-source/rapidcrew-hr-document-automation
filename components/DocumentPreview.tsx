'use client';
import type { CompanyData, DocumentData, EmployeeData, TemplateData } from '@/lib/types';
import { placeholderMap, renderPlaceholders } from '@/lib/utils';
import { sanitizeHtml } from '@/lib/sanitize';
import { buildSalarySlipView } from '@/lib/salary-slip';

export default function DocumentPreview({company,employee,doc,template}:{company?:CompanyData;employee?:EmployeeData;doc:DocumentData;template?:TemplateData}){
  const values=placeholderMap(company,employee,doc);
  const body=sanitizeHtml(renderPlaceholders(doc.customBodyHtml || template?.bodyHtml || '',values));
  if(doc.type==='salary-slip') {
    return <div className="a4-wrap"><article id="official-document" className="a4-page salary-slip-page" style={{fontFamily:company?.fontFamily || 'Arial'}}>
      <SalaryPreview company={company} employee={employee} doc={doc}/>
    </article></div>;
  }
  return <div className="a4-wrap"><article id="official-document" className="a4-page document-body" style={{fontFamily:company?.fontFamily || 'Arial'}}>
    <header className="mb-5 border-b border-gray-200 pb-4">
      <div style={{textAlign:company?.logoPosition === 'justify' ? 'left' : company?.logoPosition || 'left'}}>{company?.logoDataUrl&&<img src={company.logoDataUrl} alt="Company logo" style={{width:company.logoWidth,maxHeight:90,objectFit:'contain',display:'inline-block'}}/>}</div>
      <div className="mt-2 text-center"><div className="text-xl font-bold">{company?.companyName || 'Your Company Name'}</div><div className="mt-1 text-xs leading-5 text-gray-600">{values.company_address || 'Company address will appear here'}</div></div>
    </header>
    <div dangerouslySetInnerHTML={{__html:body}}/>
    <Closing company={company}/>
    <footer className="mt-8 border-t border-gray-200 pt-3 text-center text-[10px] text-gray-500">{company?.footerText}</footer>
  </article></div>;
}

function SalaryPreview({company,employee,doc}:{company?:CompanyData;employee?:EmployeeData;doc:DocumentData}){
  if(!company || !employee) {
    return <div className="salary-empty-state">Select a company and employee to preview the salary slip.</div>;
  }
  const view=buildSalarySlipView(company,employee,doc);
  const rowCount=Math.max(view.earnings.length,view.deductions.length,1);
  return <div className="salary-slip-document">
    <div className="salary-slip-head">
      <div className="salary-logo-box">{company.logoDataUrl?<img src={company.logoDataUrl} alt="Company logo"/>:null}</div>
      <div className="salary-head-center"><div className="salary-company-name">{view.companyName}</div><div className="salary-period-title">{view.title}</div></div>
      <div className="salary-head-spacer" aria-hidden="true"/>
    </div>

    <table className="salary-info-table" aria-label="Employee salary information"><tbody>
      {view.employeeRows.map((r,i)=><tr key={i}><th>{r[0]}</th><td>{r[1]}</td><th>{r[2]}</th><td>{r[3]}</td></tr>)}
    </tbody></table>

    <table className="salary-amount-table" aria-label="Earnings and deductions"><thead><tr><th>Earnings</th><th className="salary-number">Amount INR</th><th>Deductions</th><th className="salary-number">Amount INR</th></tr></thead><tbody>
      {Array.from({length:rowCount},(_,i)=>{
        const earning=view.earnings[i]; const deduction=view.deductions[i];
        return <tr key={i}><td>{earning?.label||''}</td><td className="salary-number">{earning?.amount||''}</td><td>{deduction?.label||''}</td><td className="salary-number">{deduction?.amount||''}</td></tr>;
      })}
      <tr className="salary-total-row"><th>Gross Earnings</th><td className="salary-number">{view.grossAmount}</td><th>Deductions</th><td className="salary-number">{view.deductionAmount}</td></tr>
    </tbody></table>

    <div className="salary-net-row"><strong>Net Pay Amount</strong><strong>{view.netAmount}</strong></div>
    <div className="salary-words-row"><strong>Net Pay Amount (in words)</strong><span>{view.amountInWords}</span></div>
    <div className="salary-system-footer">{view.systemFooter}</div>
  </div>;
}

function Closing({company}:{company?:CompanyData}){
  const align=(company?.signatureAlignment==='center'?'center':company?.signatureAlignment==='left'?'left':'right');
  return <div className="keep-together mt-10" style={{textAlign:align}}><div className="text-sm">For {company?.companyName || 'Company'}</div>{company?.signatureDataUrl&&<img src={company.signatureDataUrl} alt="Authorized signature" className="mt-2 inline-block object-contain" style={{width:company.signatureWidth,maxHeight:70}}/>}<div className="mt-1 text-sm font-bold">{company?.signatoryName}</div><div className="text-xs text-gray-600">{company?.signatoryDesignation}</div><div style={{textAlign:company?.stampAlignment==='center'?'center':company?.stampAlignment==='left'?'left':'right'}}>{company?.stampDataUrl&&<img src={company.stampDataUrl} alt="Official company stamp" className="mt-2 inline-block object-contain" style={{width:company.stampWidth,maxHeight:100}}/>}</div></div>;
}
