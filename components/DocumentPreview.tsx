'use client';
import type { CompanyData, DocumentData, EmployeeData, TemplateData } from '@/lib/types';
import { placeholderMap, renderPlaceholders } from '@/lib/utils';
import { sanitizeHtml } from '@/lib/sanitize';
import { buildSalarySlipView } from '@/lib/salary-slip';
import { buildAuthorizationView } from '@/lib/authorization';
import { DocumentAuthorizationBlock } from './DocumentAuthorizationBlock';
import { DocumentLetterhead } from './DocumentLetterhead';

export default function DocumentPreview({company,employee,doc,template}:{company?:CompanyData;employee?:EmployeeData;doc:DocumentData;template?:TemplateData}){
  const values=placeholderMap(company,employee,doc);
  const body=sanitizeHtml(renderPlaceholders(doc.customBodyHtml || template?.bodyHtml || '',values));
  if(doc.type==='salary-slip') {
    return <div className="a4-wrap"><article id="official-document" className="a4-page letterhead-page salary-slip-page" style={{fontFamily:company?.fontFamily || 'Arial'}}>
      <DocumentLetterhead company={company}/>
      <div className="letterhead-content"><SalaryPreview company={company} employee={employee} doc={doc}/></div>
    </article></div>;
  }
  return <div className="a4-wrap"><article id="official-document" className="a4-page letterhead-page document-body" style={{fontFamily:company?.fontFamily || 'Arial'}}>
    <DocumentLetterhead company={company}/>
    <div className="letterhead-content">
      <div dangerouslySetInnerHTML={{__html:body}}/>
      <DocumentAuthorizationBlock company={company} doc={doc}/>
    </div>
  </article></div>;
}

function SalaryPreview({company,employee,doc}:{company?:CompanyData;employee?:EmployeeData;doc:DocumentData}){
  if(!company || !employee) return <div className="salary-empty-state">Select an employee to preview the salary slip.</div>;
  const view=buildSalarySlipView(company,employee,doc);
  const rowCount=Math.max(view.earnings.length,view.deductions.length,1);
  return <div className="salary-slip-document">
    <div className="salary-slip-head letterhead-salary-head">
      <div className="salary-head-center"><div className="salary-company-name">{view.companyName}</div><div className="salary-period-title">{view.title}</div></div>
    </div>

    <table className="salary-info-table" aria-label="Employee salary information"><tbody>
      {view.employeeRows.map((r,i)=><tr key={i}><th>{r[0]}</th><td>{r[1]}</td><th>{r[2]}</th><td>{r[3]}</td></tr>)}
    </tbody></table>

    <table className="salary-amount-table" aria-label="Earnings and deductions"><thead><tr><th>Earnings</th><th className="salary-number">{view.amountColumnTitle}</th><th>Deductions</th><th className="salary-number">{view.amountColumnTitle}</th></tr></thead><tbody>
      {Array.from({length:rowCount},(_,i)=>{
        const earning=view.earnings[i]; const deduction=view.deductions[i];
        return <tr key={i}><td>{earning?.label||''}</td><td className="salary-number">{earning?.amount||''}</td><td>{deduction?.label||''}</td><td className="salary-number">{deduction?.amount||''}</td></tr>;
      })}
      <tr className="salary-total-row"><th>Gross Earnings</th><td className="salary-number">{view.grossAmount}</td><th>Total Deductions</th><td className="salary-number">{view.deductionAmount}</td></tr>
    </tbody></table>

    <div className="salary-net-row"><strong>Net Pay Amount</strong><strong>{view.netAmount}</strong></div>
    <div className="salary-words-row"><strong>Net Pay Amount (in words)</strong><span>{view.amountInWords}</span></div>
    <SalaryStamp company={company} doc={doc}/>
    <div className="salary-system-footer">{view.systemFooter}</div>
  </div>;
}

function SalaryStamp({company,doc}:{company:CompanyData;doc:DocumentData}){
  const view=buildAuthorizationView(company,doc);
  if(!view.showStamp||!view.stampDataUrl)return null;
  return <div className="salary-stamp-block"><img src={view.stampDataUrl} alt="Official company stamp" className="salary-stamp-image" style={{width:view.stampWidth}}/></div>;
}
