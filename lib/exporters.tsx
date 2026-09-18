'use client';
import React from 'react';
import { Document, Page, Text, View, Image, StyleSheet, pdf } from '@react-pdf/renderer';
import { AlignmentType, BorderStyle, Document as DocxDocument, ImageRun, Packer, Paragraph, TextRun, Table, TableCell, TableRow, WidthType } from 'docx';
import type { CompanyData, DocumentData, EmployeeData, TemplateData } from './types';
import { placeholderMap, renderPlaceholders, safeFilename } from './utils';
import { buildSalarySlipView, type SalarySlipPairRow } from './salary-slip';

function stripHtml(html:string){ return html.replace(/<br\s*\/?\s*>/gi,'\n').replace(/<\/p>/gi,'\n').replace(/<[^>]*>/g,'').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/\n{3,}/g,'\n\n').trim(); }
function dataUrlBytes(dataUrl?:string){ if(!dataUrl) return undefined; const base64=dataUrl.split(',')[1]; if(!base64) return undefined; return Uint8Array.from(atob(base64), c=>c.charCodeAt(0)); }
function loadBrowserImage(dataUrl:string){ return new Promise<HTMLImageElement>((resolve,reject)=>{const image=new window.Image();image.onload=()=>resolve(image);image.onerror=()=>reject(new Error('Invalid image'));image.src=dataUrl;}); }
async function normalizeExportImage(dataUrl?:string){
  if(!dataUrl) return undefined;
  const match=dataUrl.match(/^data:image\/(png|jpe?g|webp);base64,/i); if(!match) return undefined;
  const image=await loadBrowserImage(dataUrl); let normalized=dataUrl; let type:'png'|'jpg'=match[1].toLowerCase()==='png'?'png':'jpg';
  if(match[1].toLowerCase()==='webp'){const canvas=document.createElement('canvas');canvas.width=image.naturalWidth||image.width;canvas.height=image.naturalHeight||image.height;const ctx=canvas.getContext('2d');if(!ctx) throw new Error('Unable to prepare image for Word export.');ctx.drawImage(image,0,0);normalized=canvas.toDataURL('image/png');type='png';}
  return {dataUrl:normalized,data:dataUrlBytes(normalized)!,type,width:image.naturalWidth||image.width||1,height:image.naturalHeight||image.height||1};
}
async function makeDocxImageRun(dataUrl:string|undefined,maxWidth:number,maxHeight:number){const image=await normalizeExportImage(dataUrl);if(!image)return undefined;const scale=Math.min(maxWidth/image.width,maxHeight/image.height);return new ImageRun({data:image.data,type:image.type,transformation:{width:Math.max(1,Math.round(image.width*scale)),height:Math.max(1,Math.round(image.height*scale))}});}

const styles=StyleSheet.create({
  page:{ paddingTop:42,paddingBottom:46,paddingHorizontal:48,fontSize:10.5,fontFamily:'Helvetica',lineHeight:1.55 },
  logo:{ maxWidth:120,maxHeight:55,objectFit:'contain',marginBottom:8 },
  company:{ fontSize:16,fontWeight:700,textAlign:'center',marginBottom:2 },
  address:{ fontSize:8.5,textAlign:'center',color:'#4b5563',marginBottom:12 },
  p:{ marginBottom:8,textAlign:'justify' },
  sig:{ marginTop:24,alignItems:'flex-end' }, sigImage:{ width:90,height:40,objectFit:'contain' }, stamp:{ width:75,height:75,objectFit:'contain',marginTop:5 },
  footer:{ position:'absolute',bottom:22,left:48,right:48,fontSize:8,textAlign:'center',color:'#6b7280' },
  salaryPage:{ paddingTop:50,paddingBottom:44,paddingHorizontal:48,fontSize:8.8,fontFamily:'Helvetica',color:'#111' },
  salaryHead:{ flexDirection:'row',alignItems:'center',minHeight:48,marginBottom:8 },
  salaryLogoBox:{ width:'24%',height:42,justifyContent:'center',alignItems:'flex-start',borderWidth:0.7,borderColor:'#777',padding:2 },
  salaryLogo:{ maxWidth:86,maxHeight:38,objectFit:'contain' },
  salaryHeadCenter:{ width:'52%',alignItems:'center',justifyContent:'center' }, salaryHeadSide:{ width:'24%' },
  salaryCompany:{ fontSize:12.5,fontWeight:700,textAlign:'center' }, salaryTitle:{ marginTop:3,fontSize:9.5,fontWeight:700,textAlign:'center' },
  salaryTable:{ width:'100%',borderTopWidth:0.7,borderLeftWidth:0.7,borderColor:'#555' }, salaryRow:{ flexDirection:'row' },
  salaryLabel:{ width:'18%',paddingVertical:4,paddingHorizontal:4,borderRightWidth:0.7,borderBottomWidth:0.7,borderColor:'#555',fontWeight:700 },
  salaryValue:{ width:'32%',paddingVertical:4,paddingHorizontal:4,borderRightWidth:0.7,borderBottomWidth:0.7,borderColor:'#555' },
  salaryEarnLabel:{ width:'34%',paddingVertical:4,paddingHorizontal:4,borderRightWidth:0.7,borderBottomWidth:0.7,borderColor:'#555' },
  salaryAmount:{ width:'16%',paddingVertical:4,paddingHorizontal:4,borderRightWidth:0.7,borderBottomWidth:0.7,borderColor:'#555',textAlign:'right' },
  salaryHeadCellLabel:{ width:'34%',paddingVertical:4,paddingHorizontal:4,borderRightWidth:0.7,borderBottomWidth:0.7,borderColor:'#555',fontWeight:700,textAlign:'center',backgroundColor:'#f2f2f2' },
  salaryHeadCellAmount:{ width:'16%',paddingVertical:4,paddingHorizontal:4,borderRightWidth:0.7,borderBottomWidth:0.7,borderColor:'#555',fontWeight:700,textAlign:'center',backgroundColor:'#f2f2f2' },
  salaryTotalLabel:{ width:'34%',paddingVertical:4,paddingHorizontal:4,borderRightWidth:0.7,borderBottomWidth:0.7,borderColor:'#555',fontWeight:700,backgroundColor:'#fafafa' },
  salaryTotalAmount:{ width:'16%',paddingVertical:4,paddingHorizontal:4,borderRightWidth:0.7,borderBottomWidth:0.7,borderColor:'#555',fontWeight:700,textAlign:'right',backgroundColor:'#fafafa' },
  salaryNet:{ flexDirection:'row',justifyContent:'space-between',paddingVertical:5,paddingHorizontal:5,borderLeftWidth:0.7,borderRightWidth:0.7,borderBottomWidth:0.7,borderColor:'#555',fontSize:9.5,fontWeight:700 },
  salaryWords:{ flexDirection:'row',paddingVertical:5,paddingHorizontal:5,borderLeftWidth:0.7,borderRightWidth:0.7,borderBottomWidth:0.7,borderColor:'#555' },
  salaryWordsLabel:{ width:'34%',fontWeight:700 }, salaryWordsValue:{ width:'66%' },
  salarySystemFooter:{ marginTop:13,textAlign:'center',fontSize:7.4,fontWeight:700 },
});

function PdfSalary({company,employee,doc}:{company:CompanyData;employee:EmployeeData;doc:DocumentData}){
  const view=buildSalarySlipView(company,employee,doc); const rowCount=Math.max(view.earnings.length,view.deductions.length,1);
  return <Page size="A4" style={styles.salaryPage}>
    <View style={styles.salaryHead}>
      <View style={styles.salaryLogoBox}>{company.logoDataUrl?<Image src={company.logoDataUrl} style={styles.salaryLogo}/>:null}</View>
      <View style={styles.salaryHeadCenter}><Text style={styles.salaryCompany}>{view.companyName}</Text><Text style={styles.salaryTitle}>{view.title}</Text></View>
      <View style={styles.salaryHeadSide}/>
    </View>
    <View style={styles.salaryTable}>{view.employeeRows.map((r,i)=><View style={styles.salaryRow} key={i}><Text style={styles.salaryLabel}>{r[0]}</Text><Text style={styles.salaryValue}>{r[1]}</Text><Text style={styles.salaryLabel}>{r[2]}</Text><Text style={styles.salaryValue}>{r[3]}</Text></View>)}</View>
    <View style={[styles.salaryTable,{marginTop:8}]}>
      <View style={styles.salaryRow}><Text style={styles.salaryHeadCellLabel}>Earnings</Text><Text style={styles.salaryHeadCellAmount}>Amount INR</Text><Text style={styles.salaryHeadCellLabel}>Deductions</Text><Text style={styles.salaryHeadCellAmount}>Amount INR</Text></View>
      {Array.from({length:rowCount},(_,i)=>{const e=view.earnings[i];const d=view.deductions[i];return <View style={styles.salaryRow} key={i}><Text style={styles.salaryEarnLabel}>{e?.label||''}</Text><Text style={styles.salaryAmount}>{e?.amount||''}</Text><Text style={styles.salaryEarnLabel}>{d?.label||''}</Text><Text style={styles.salaryAmount}>{d?.amount||''}</Text></View>})}
      <View style={styles.salaryRow}><Text style={styles.salaryTotalLabel}>Gross Earnings</Text><Text style={styles.salaryTotalAmount}>{view.grossAmount}</Text><Text style={styles.salaryTotalLabel}>Deductions</Text><Text style={styles.salaryTotalAmount}>{view.deductionAmount}</Text></View>
    </View>
    <View style={styles.salaryNet}><Text>Net Pay Amount</Text><Text>{view.netAmount}</Text></View>
    <View style={styles.salaryWords}><Text style={styles.salaryWordsLabel}>Net Pay Amount (in words)</Text><Text style={styles.salaryWordsValue}>{view.amountInWords}</Text></View>
    <Text style={styles.salarySystemFooter}>{view.systemFooter}</Text>
  </Page>;
}

function PdfLetter({company,employee,doc,template}:{company:CompanyData;employee:EmployeeData;doc:DocumentData;template:TemplateData}){
  const values=placeholderMap(company,employee,doc); const text=stripHtml(renderPlaceholders(doc.customBodyHtml||template.bodyHtml,values));
  return <Page size="A4" style={styles.page}>
    {company.logoDataUrl ? <Image src={company.logoDataUrl} style={styles.logo}/> : null}
    <Text style={styles.company}>{company.companyName}</Text><Text style={styles.address}>{values.company_address}</Text>
    {text.split(/\n+/).filter(Boolean).map((p,i)=><Text key={i} style={styles.p}>{p}</Text>)}
    <View style={styles.sig}><Text>For {company.companyName}</Text>{company.signatureDataUrl?<Image src={company.signatureDataUrl} style={styles.sigImage}/>:null}<Text>{company.signatoryName}</Text><Text>{company.signatoryDesignation}</Text>{company.stampDataUrl?<Image src={company.stampDataUrl} style={styles.stamp}/>:null}</View>
    <Text style={styles.footer}>{company.footerText}</Text>
  </Page>;
}

function PdfDoc(props:{company:CompanyData;employee:EmployeeData;doc:DocumentData;template:TemplateData}){
  return <Document>{props.doc.type==='salary-slip'?<PdfSalary company={props.company} employee={props.employee} doc={props.doc}/>:<PdfLetter {...props}/>}</Document>;
}

export async function downloadPdf(company:CompanyData,employee:EmployeeData,doc:DocumentData,template:TemplateData){
  const [logo,signature,stamp]=await Promise.all([normalizeExportImage(company.logoDataUrl),normalizeExportImage(company.signatureDataUrl),normalizeExportImage(company.stampDataUrl)]);
  const exportCompany={...company,logoDataUrl:logo?.dataUrl,signatureDataUrl:signature?.dataUrl,stampDataUrl:stamp?.dataUrl};
  const blob=await pdf(<PdfDoc company={exportCompany} employee={employee} doc={doc} template={template}/>).toBlob();
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob);
  a.download=`${safeFilename(employee.fullName)}_${safeFilename(doc.type.replaceAll('-','_'))}${doc.salaryMonth?`_${doc.salaryMonth}_${doc.salaryYear}`:''}.pdf`;
  a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}

const border={style:BorderStyle.SINGLE,size:4,color:'555555'} as const;
const tableBorders={top:border,bottom:border,left:border,right:border,insideHorizontal:border,insideVertical:border};
const noBorder={style:BorderStyle.NIL,size:0,color:'FFFFFF'} as const;
const noTableBorders={top:noBorder,bottom:noBorder,left:noBorder,right:noBorder,insideHorizontal:noBorder,insideVertical:noBorder};
function docxCell(text:string,{bold=false,align=AlignmentType.LEFT,width}:{bold?:boolean;align?:typeof AlignmentType[keyof typeof AlignmentType];width:number}){
  return new TableCell({width:{size:width,type:WidthType.PERCENTAGE},children:[new Paragraph({alignment:align,children:[new TextRun({text,bold,size:18})]})]});
}
function employeeDocxRow(row:SalarySlipPairRow){
  return new TableRow({children:[docxCell(row[0],{bold:true,width:18}),docxCell(row[1],{width:32}),docxCell(row[2],{bold:true,width:18}),docxCell(row[3],{width:32})]});
}

export async function downloadDocx(company:CompanyData,employee:EmployeeData,doc:DocumentData,template:TemplateData){
  const values=placeholderMap(company,employee,doc); const body=stripHtml(renderPlaceholders(doc.customBodyHtml||template.bodyHtml,values)); const children:(Paragraph|Table)[]=[];
  if(doc.type==='salary-slip'){
    const view=buildSalarySlipView(company,employee,doc); const rowCount=Math.max(view.earnings.length,view.deductions.length,1);
    const logoRun=await makeDocxImageRun(company.logoDataUrl,105,42);
    children.push(new Table({width:{size:100,type:WidthType.PERCENTAGE},borders:noTableBorders,rows:[new TableRow({children:[
      new TableCell({width:{size:24,type:WidthType.PERCENTAGE},children:[new Paragraph({alignment:AlignmentType.LEFT,children:logoRun?[logoRun]:[]})]}),
      new TableCell({width:{size:52,type:WidthType.PERCENTAGE},children:[new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:view.companyName,bold:true,size:26})]}),new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:view.title,bold:true,size:20})]})]}),
      new TableCell({width:{size:24,type:WidthType.PERCENTAGE},children:[new Paragraph('')]}),
    ]})]}));
    children.push(new Paragraph({text:'',spacing:{after:90}}));
    children.push(new Table({width:{size:100,type:WidthType.PERCENTAGE},borders:tableBorders,rows:view.employeeRows.map(employeeDocxRow)}));
    const salaryRows=[new TableRow({children:[docxCell('Earnings',{bold:true,align:AlignmentType.CENTER,width:34}),docxCell('Amount INR',{bold:true,align:AlignmentType.CENTER,width:16}),docxCell('Deductions',{bold:true,align:AlignmentType.CENTER,width:34}),docxCell('Amount INR',{bold:true,align:AlignmentType.CENTER,width:16})]})];
    for(let i=0;i<rowCount;i++){const e=view.earnings[i];const d=view.deductions[i];salaryRows.push(new TableRow({children:[docxCell(e?.label||'',{width:34}),docxCell(e?.amount||'',{align:AlignmentType.RIGHT,width:16}),docxCell(d?.label||'',{width:34}),docxCell(d?.amount||'',{align:AlignmentType.RIGHT,width:16})]}));}
    salaryRows.push(new TableRow({children:[docxCell('Gross Earnings',{bold:true,width:34}),docxCell(view.grossAmount,{bold:true,align:AlignmentType.RIGHT,width:16}),docxCell('Deductions',{bold:true,width:34}),docxCell(view.deductionAmount,{bold:true,align:AlignmentType.RIGHT,width:16})]}));
    children.push(new Paragraph({text:'',spacing:{after:70}}));
    children.push(new Table({width:{size:100,type:WidthType.PERCENTAGE},borders:tableBorders,rows:salaryRows}));
    children.push(new Table({width:{size:100,type:WidthType.PERCENTAGE},borders:tableBorders,rows:[new TableRow({children:[docxCell('Net Pay Amount',{bold:true,width:70}),docxCell(view.netAmount,{bold:true,align:AlignmentType.RIGHT,width:30})]}),new TableRow({children:[docxCell('Net Pay Amount (in words)',{bold:true,width:34}),docxCell(view.amountInWords,{width:66})]})]}));
    children.push(new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:view.systemFooter,bold:true,size:16})],spacing:{before:220}}));
  } else {
    { const image=await makeDocxImageRun(company.logoDataUrl,120,50); if(image) children.push(new Paragraph({alignment:AlignmentType.CENTER,children:[image]})); }
    children.push(new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:company.companyName,bold:true,size:30})]}));
    children.push(new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:values.company_address,size:18,color:'666666'})]}));
    body.split(/\n+/).filter(Boolean).forEach((p,i)=>children.push(new Paragraph({alignment:i===0?AlignmentType.RIGHT:AlignmentType.JUSTIFIED,children:[new TextRun({text:p,size:22})],spacing:{after:180}})));
    children.push(new Paragraph({text:`For ${company.companyName}`,alignment:AlignmentType.RIGHT,spacing:{before:320}}));
    { const image=await makeDocxImageRun(company.signatureDataUrl,100,45); if(image) children.push(new Paragraph({alignment:AlignmentType.RIGHT,children:[image]})); }
    children.push(new Paragraph({alignment:AlignmentType.RIGHT,children:[new TextRun({text:company.signatoryName,bold:true}),new TextRun({text:`\n${company.signatoryDesignation}`})]}));
    { const image=await makeDocxImageRun(company.stampDataUrl,82,82); if(image) children.push(new Paragraph({alignment:AlignmentType.RIGHT,children:[image]})); }
  }
  const out=new DocxDocument({sections:[{properties:{page:{size:{width:11906,height:16838},margin:{top:1134,bottom:1134,left:1021,right:1021}}},children}]});
  const blob=await Packer.toBlob(out); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`${safeFilename(employee.fullName)}_${safeFilename(doc.type.replaceAll('-','_'))}.docx`; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
