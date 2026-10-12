'use client';
import React from 'react';
import { Document, Page, Text, View, Image, StyleSheet, pdf } from '@react-pdf/renderer';
import {
  AlignmentType,
  BorderStyle,
  Document as DocxDocument,
  Footer,
  Header,
  HorizontalPositionAlign,
  HorizontalPositionRelativeFrom,
  ImageRun,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  UnderlineType,
  VerticalPositionAlign,
  VerticalPositionRelativeFrom,
  WidthType,
} from 'docx';
import type { CompanyData, DocumentData, EmployeeData, TemplateData } from './types';
import { placeholderMap, renderPlaceholders, safeFilename } from './utils';
import { buildSalarySlipView, type SalarySlipPairRow } from './salary-slip';
import { buildAuthorizationView } from './authorization';
import { LETTERHEAD, LETTERHEAD_MARK_DATA_URL, LETTERHEAD_WATERMARK_DATA_URL, LETTERHEAD_WORDMARK_DATA_URL } from './letterhead';
import { getLetterheadDetails } from './letterhead-details';

function stripHtml(html:string){ return html.replace(/<br\s*\/?\s*>/gi,'\n').replace(/<\/(?:p|h[1-6]|li|div)>/gi,'\n').replace(/<[^>]*>/g,'').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&#39;/g,"'").replace(/&quot;/g,'"').replace(/\n{3,}/g,'\n\n').trim(); }
type ExportBlock={text:string;kind:'heading'|'paragraph';align:'left'|'center'|'right'|'justify'};
function htmlBlocks(html:string):ExportBlock[]{
  const blocks:ExportBlock[]=[];
  const re=/<(h[1-6]|p|li)\b([^>]*)>([\s\S]*?)<\/\1>/gi;
  for(const match of html.matchAll(re)){
    const tag=match[1].toLowerCase(); const attrs=match[2]||''; const text=stripHtml(match[3]);
    if(!text)continue;
    const styleAlign=(attrs.match(/text-align\s*:\s*(left|center|right|justify)/i)?.[1]?.toLowerCase()||'') as ExportBlock['align']|'';
    blocks.push({text,kind:tag.startsWith('h')?'heading':'paragraph',align:styleAlign||(tag.startsWith('h')?'center':'justify')});
  }
  if(blocks.length)return blocks;
  return stripHtml(html).split(/\n+/).filter(Boolean).map(text=>({text,kind:'paragraph' as const,align:'justify' as const}));
}
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
async function makeDocxWatermarkRun(){
  const image=await normalizeExportImage(LETTERHEAD_WATERMARK_DATA_URL); if(!image)return undefined;
  const width=Math.round(794*(LETTERHEAD.watermarkWidthPercent/100));
  const height=Math.round(width*(image.height/image.width));
  return new ImageRun({
    data:image.data,
    type:image.type,
    transformation:{width,height},
    floating:{
      behindDocument:true,
      allowOverlap:true,
      horizontalPosition:{relative:HorizontalPositionRelativeFrom.PAGE,align:HorizontalPositionAlign.CENTER},
      verticalPosition:{relative:VerticalPositionRelativeFrom.PAGE,align:VerticalPositionAlign.CENTER},
    },
  });
}

const PDF_A4_WIDTH=595.28;
const PDF_A4_HEIGHT=841.89;
const PDF_WATERMARK_WIDTH=PDF_A4_WIDTH*(LETTERHEAD.watermarkWidthPercent/100);
const PDF_WATERMARK_HEIGHT=PDF_WATERMARK_WIDTH/LETTERHEAD.watermarkAspectRatio;

const styles=StyleSheet.create({
  page:{ paddingTop:100,paddingBottom:78,paddingHorizontal:48,fontSize:10.5,fontFamily:'Helvetica',lineHeight:1.55,color:'#111' },
  p:{ marginBottom:8,textAlign:'justify' },
  heading:{ marginBottom:10,textAlign:'center',fontSize:12,fontWeight:700 },
  letterheadLogo:{ position:'absolute',top:30,left:48,width:142,height:41,objectFit:'contain' },
  letterheadWatermark:{ position:'absolute',top:(PDF_A4_HEIGHT-PDF_WATERMARK_HEIGHT)/2,left:(PDF_A4_WIDTH-PDF_WATERMARK_WIDTH)/2,width:PDF_WATERMARK_WIDTH,height:PDF_WATERMARK_HEIGHT,objectFit:'contain',opacity:LETTERHEAD.watermarkOpacity },
  letterheadFooter:{ position:'absolute',bottom:18,left:28,right:28,fontSize:7.8,fontFamily:'Helvetica',color:'#30343a' },
  letterheadFooterRow:{ flexDirection:'row',alignItems:'flex-end' },
  footerLeft:{ width:'30%',textAlign:'left',color:'#8f3445',fontWeight:700,textDecoration:'underline' },
  footerCenter:{ width:'45%',textAlign:'center',fontWeight:700 },
  footerRight:{ width:'25%',textAlign:'right',fontWeight:700 },
  footerAddress:{ marginTop:5,textAlign:'center',fontSize:7.4,fontWeight:700 },
  salaryPage:{ paddingTop:100,paddingBottom:78,paddingHorizontal:48,fontSize:8.8,fontFamily:'Helvetica',color:'#111' },
  salaryHead:{ alignItems:'center',justifyContent:'center',marginBottom:10 },
  salaryCompany:{ fontSize:12.5,fontWeight:700,textAlign:'center' },
  salaryTitle:{ marginTop:3,fontSize:9.5,fontWeight:700,textAlign:'center' },
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
  salarySystemFooter:{ marginTop:10,textAlign:'center',fontSize:7.4,fontWeight:700 },
  authBlock:{ marginTop:18 },
  authRight:{ alignItems:'flex-end' }, authCenter:{ alignItems:'center' }, authLeft:{ alignItems:'flex-start' },
  authFor:{ fontSize:8.8,marginBottom:4 }, authName:{ fontSize:8.8,fontWeight:700,marginTop:3 }, authDesignation:{ fontSize:8,color:'#4b5563' },
  authSignature:{ maxWidth:90,maxHeight:42,objectFit:'contain' }, authStamp:{ maxWidth:78,maxHeight:78,objectFit:'contain',marginTop:5 },
});

function PdfLetterhead({company}:{company:CompanyData}){
  const details=getLetterheadDetails(company);
  const topLogo=company.logoDataUrl || LETTERHEAD_WORDMARK_DATA_URL;
  return <>
    <Image fixed src={topLogo} style={styles.letterheadLogo}/>
    <Image fixed src={LETTERHEAD_MARK_DATA_URL} style={styles.letterheadWatermark}/>
    <View fixed style={styles.letterheadFooter}>
      <View style={styles.letterheadFooterRow}>
        <Text style={styles.footerLeft}>{details.website}</Text>
        <Text style={styles.footerCenter}>{details.legalName}</Text>
        <Text style={styles.footerRight}>{details.phone}</Text>
      </View>
      <Text style={styles.footerAddress}>{details.address}</Text>
    </View>
  </>;
}

function pdfAuthAlignment(value:CompanyData['stampAlignment']){ return value==='left'?styles.authLeft:value==='center'?styles.authCenter:styles.authRight; }
function pdfSignatureAlignment(value:CompanyData['signatureAlignment']){ return value==='left'?styles.authLeft:value==='center'?styles.authCenter:styles.authRight; }

function PdfAuthorization({company,doc,compact=false}:{company:CompanyData;doc:DocumentData;compact?:boolean}){
  const view=buildAuthorizationView(company,doc);
  return <View wrap={false} style={[styles.authBlock,pdfAuthAlignment(view.stampAlignment),compact?{marginTop:12}:{}]}>
    <Text style={styles.authFor}>For {view.companyName}</Text>
    {view.showSignature&&view.signatureDataUrl?<View style={[{width:'100%'},pdfSignatureAlignment(view.signatureAlignment)]}><Image src={view.signatureDataUrl} style={[styles.authSignature,{width:Math.min(120,Math.max(50,view.signatureWidth*0.72))}]}/></View>:null}
    {compact&&!view.showSignature&&view.showStamp&&view.stampDataUrl?<Image src={view.stampDataUrl} style={[styles.authStamp,{width:Math.min(100,Math.max(45,view.stampWidth*0.72))}]}/>:null}
    <Text style={styles.authName}>{view.signatoryName}</Text>
    {view.signatoryDesignation?<Text style={styles.authDesignation}>{view.signatoryDesignation}</Text>:null}
    {(!compact||view.showSignature)&&view.showStamp&&view.stampDataUrl?<Image src={view.stampDataUrl} style={[styles.authStamp,{width:Math.min(100,Math.max(45,view.stampWidth*0.72))}]}/>:null}
  </View>;
}

function PdfSalary({company,employee,doc}:{company:CompanyData;employee:EmployeeData;doc:DocumentData}){
  const view=buildSalarySlipView(company,employee,doc); const rowCount=Math.max(view.earnings.length,view.deductions.length,1);
  return <Page size="A4" style={styles.salaryPage} wrap>
    <PdfLetterhead company={company}/>
    <View style={styles.salaryHead}><Text style={styles.salaryCompany}>{view.companyName}</Text><Text style={styles.salaryTitle}>{view.title}</Text></View>
    <View style={styles.salaryTable}>{view.employeeRows.map((r,i)=><View style={styles.salaryRow} key={i}><Text style={styles.salaryLabel}>{r[0]}</Text><Text style={styles.salaryValue}>{r[1]}</Text><Text style={styles.salaryLabel}>{r[2]}</Text><Text style={styles.salaryValue}>{r[3]}</Text></View>)}</View>
    <View style={[styles.salaryTable,{marginTop:8}]}>
      <View style={styles.salaryRow}><Text style={styles.salaryHeadCellLabel}>Earnings</Text><Text style={styles.salaryHeadCellAmount}>Amount INR</Text><Text style={styles.salaryHeadCellLabel}>Deductions</Text><Text style={styles.salaryHeadCellAmount}>Amount INR</Text></View>
      {Array.from({length:rowCount},(_,i)=>{const e=view.earnings[i];const d=view.deductions[i];return <View style={styles.salaryRow} key={i}><Text style={styles.salaryEarnLabel}>{e?.label||''}</Text><Text style={styles.salaryAmount}>{e?.amount||''}</Text><Text style={styles.salaryEarnLabel}>{d?.label||''}</Text><Text style={styles.salaryAmount}>{d?.amount||''}</Text></View>})}
      <View style={styles.salaryRow}><Text style={styles.salaryTotalLabel}>Gross Earnings</Text><Text style={styles.salaryTotalAmount}>{view.grossAmount}</Text><Text style={styles.salaryTotalLabel}>Total Deductions</Text><Text style={styles.salaryTotalAmount}>{view.deductionAmount}</Text></View>
    </View>
    <View style={styles.salaryNet}><Text>Net Pay Amount</Text><Text>{view.netAmount}</Text></View>
    <View style={styles.salaryWords}><Text style={styles.salaryWordsLabel}>Net Pay Amount (in words)</Text><Text style={styles.salaryWordsValue}>{view.amountInWords}</Text></View>
    {(()=>{const auth=buildAuthorizationView(company,doc);return auth.showStamp&&auth.stampDataUrl?<View wrap={false} style={[styles.authLeft,{marginTop:10}]}><Image src={auth.stampDataUrl} style={[styles.authStamp,{width:Math.min(100,Math.max(45,auth.stampWidth*0.72))}]}/></View>:null})()}
    <Text style={styles.salarySystemFooter}>{view.systemFooter}</Text>
  </Page>;
}

function PdfLetter({company,employee,doc,template}:{company:CompanyData;employee:EmployeeData;doc:DocumentData;template:TemplateData}){
  const values=placeholderMap(company,employee,doc); const blocks=htmlBlocks(renderPlaceholders(doc.customBodyHtml||template.bodyHtml,values));
  return <Page size="A4" style={styles.page} wrap>
    <PdfLetterhead company={company}/>
    {blocks.map((block,i)=><Text key={i} style={block.kind==='heading'?[styles.heading,{textAlign:block.align}]:[styles.p,{textAlign:block.align}]}>{block.text}</Text>)}
    <PdfAuthorization company={company} doc={doc}/>
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
function docxAlignment(value:CompanyData['stampAlignment']){ return value==='left'?AlignmentType.LEFT:value==='center'?AlignmentType.CENTER:AlignmentType.RIGHT; }

async function buildDocxLetterhead(company:CompanyData){
  const details=getLetterheadDetails(company);
  const logo=await makeDocxImageRun(company.logoDataUrl || LETTERHEAD_WORDMARK_DATA_URL,145,44);
  const watermark=await makeDocxWatermarkRun();
  const headerChildren:Paragraph[]=[new Paragraph({alignment:AlignmentType.LEFT,children:logo?[logo]:[]})];
  if(watermark) headerChildren.push(new Paragraph({children:[watermark]}));
  const header=new Header({children:headerChildren});
  const footer=new Footer({children:[
    new Table({width:{size:100,type:WidthType.PERCENTAGE},borders:noTableBorders,rows:[new TableRow({children:[
      new TableCell({width:{size:30,type:WidthType.PERCENTAGE},children:[new Paragraph({alignment:AlignmentType.LEFT,children:[new TextRun({text:details.website,bold:true,size:17,color:'8F3445',underline:{type:UnderlineType.SINGLE}})]})]}),
      new TableCell({width:{size:45,type:WidthType.PERCENTAGE},children:[new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:details.legalName,bold:true,size:17,color:'30343A'})]})]}),
      new TableCell({width:{size:25,type:WidthType.PERCENTAGE},children:[new Paragraph({alignment:AlignmentType.RIGHT,children:[new TextRun({text:details.phone,bold:true,size:17,color:'30343A'})]})]}),
    ]})]}),
    new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:70},children:[new TextRun({text:details.address,bold:true,size:17,color:'30343A'})]}),
  ]});
  return {header,footer};
}

async function appendDocxAuthorization(children:(Paragraph|Table)[],company:CompanyData,doc:DocumentData,compact=false){
  const view=buildAuthorizationView(company,doc);
  const align=docxAlignment(view.stampAlignment);
  const sigAlign=docxAlignment(view.signatureAlignment);
  const addStamp=async(keepNext:boolean)=>{if(view.showStamp){const image=await makeDocxImageRun(view.stampDataUrl,Math.min(140,Math.max(60,view.stampWidth)),Math.min(140,Math.max(60,view.stampWidth)));if(image)children.push(new Paragraph({alignment:align,keepNext,children:[image]}));}};
  children.push(new Paragraph({alignment:align,keepNext:true,children:[new TextRun({text:`For ${view.companyName}`,size:compact?18:20})],spacing:{before:compact?180:300}}));
  if(view.showSignature){const image=await makeDocxImageRun(view.signatureDataUrl,Math.min(150,Math.max(60,view.signatureWidth)),55);if(image)children.push(new Paragraph({alignment:sigAlign,keepNext:true,children:[image]}));}
  if(compact&&!view.showSignature)await addStamp(true);
  children.push(new Paragraph({alignment:align,keepNext:true,children:[new TextRun({text:view.signatoryName,bold:true,size:compact?18:20})]}));
  if(view.signatoryDesignation)children.push(new Paragraph({alignment:align,keepNext:true,children:[new TextRun({text:view.signatoryDesignation,size:compact?17:18})]}));
  if(!compact||view.showSignature)await addStamp(false);
}

export async function downloadDocx(company:CompanyData,employee:EmployeeData,doc:DocumentData,template:TemplateData){
  const values=placeholderMap(company,employee,doc); const blocks=htmlBlocks(renderPlaceholders(doc.customBodyHtml||template.bodyHtml,values)); const children:(Paragraph|Table)[]=[];
  if(doc.type==='salary-slip'){
    const view=buildSalarySlipView(company,employee,doc); const rowCount=Math.max(view.earnings.length,view.deductions.length,1);
    children.push(new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:view.companyName,bold:true,size:26})]}));
    children.push(new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:view.title,bold:true,size:20})],spacing:{after:110}}));
    children.push(new Table({width:{size:100,type:WidthType.PERCENTAGE},borders:tableBorders,rows:view.employeeRows.map(employeeDocxRow)}));
    const salaryRows=[new TableRow({children:[docxCell('Earnings',{bold:true,align:AlignmentType.CENTER,width:34}),docxCell('Amount INR',{bold:true,align:AlignmentType.CENTER,width:16}),docxCell('Deductions',{bold:true,align:AlignmentType.CENTER,width:34}),docxCell('Amount INR',{bold:true,align:AlignmentType.CENTER,width:16})]})];
    for(let i=0;i<rowCount;i++){const e=view.earnings[i];const d=view.deductions[i];salaryRows.push(new TableRow({children:[docxCell(e?.label||'',{width:34}),docxCell(e?.amount||'',{align:AlignmentType.RIGHT,width:16}),docxCell(d?.label||'',{width:34}),docxCell(d?.amount||'',{align:AlignmentType.RIGHT,width:16})]}));}
    salaryRows.push(new TableRow({children:[docxCell('Gross Earnings',{bold:true,width:34}),docxCell(view.grossAmount,{bold:true,align:AlignmentType.RIGHT,width:16}),docxCell('Total Deductions',{bold:true,width:34}),docxCell(view.deductionAmount,{bold:true,align:AlignmentType.RIGHT,width:16})]}));
    children.push(new Paragraph({text:'',spacing:{after:70}}));
    children.push(new Table({width:{size:100,type:WidthType.PERCENTAGE},borders:tableBorders,rows:salaryRows}));
    children.push(new Table({width:{size:100,type:WidthType.PERCENTAGE},borders:tableBorders,rows:[new TableRow({children:[docxCell('Net Pay Amount',{bold:true,width:70}),docxCell(view.netAmount,{bold:true,align:AlignmentType.RIGHT,width:30})]}),new TableRow({children:[docxCell('Net Pay Amount (in words)',{bold:true,width:34}),docxCell(view.amountInWords,{width:66})]})]}));
    const salaryAuth=buildAuthorizationView(company,doc);
    if(salaryAuth.showStamp&&salaryAuth.stampDataUrl){const stamp=await makeDocxImageRun(salaryAuth.stampDataUrl,Math.min(140,Math.max(60,salaryAuth.stampWidth)),Math.min(140,Math.max(60,salaryAuth.stampWidth)));if(stamp)children.push(new Paragraph({alignment:AlignmentType.LEFT,children:[stamp],spacing:{before:140}}));}
    children.push(new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:view.systemFooter,bold:true,size:16})],spacing:{before:100}}));
  } else {
    blocks.forEach(block=>children.push(new Paragraph({
      alignment:block.align==='center'?AlignmentType.CENTER:block.align==='right'?AlignmentType.RIGHT:block.align==='left'?AlignmentType.LEFT:AlignmentType.JUSTIFIED,
      children:[new TextRun({text:block.text,size:block.kind==='heading'?24:22,bold:block.kind==='heading'})],
      spacing:{after:block.kind==='heading'?200:180},
    })));
    await appendDocxAuthorization(children,company,doc);
  }
  const {header,footer}=await buildDocxLetterhead(company);
  const out=new DocxDocument({sections:[{
    properties:{page:{size:{width:11906,height:16838},margin:{top:1360,bottom:1240,left:1021,right:1021,header:360,footer:360}}},
    headers:{default:header},
    footers:{default:footer},
    children,
  }]});
  const blob=await Packer.toBlob(out); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`${safeFilename(employee.fullName)}_${safeFilename(doc.type.replaceAll('-','_'))}.docx`; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
